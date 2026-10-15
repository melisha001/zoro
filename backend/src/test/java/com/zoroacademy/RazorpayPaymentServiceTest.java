package com.zoroacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoroacademy.dto.CompetitionOrderRequest;
import com.zoroacademy.dto.RazorpayOrderResponse;
import com.zoroacademy.dto.RazorpayVerifyRequest;
import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.exception.BadRequestException;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.CompetitionRegistrationRepository;
import com.zoroacademy.repository.CompetitionRepository;
import com.zoroacademy.service.RazorpayPaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RazorpayPaymentServiceTest {

    private CompetitionRepository competitionRepository;
    private CompetitionRegistrationRepository registrationRepository;
    private RestTemplate restTemplate;
    private ObjectMapper objectMapper;
    private RazorpayPaymentService paymentService;

    private static final String TEST_KEY_ID = "rzp_test_mock123";
    private static final String TEST_KEY_SECRET = "mockSecretKey456789";
    private static final String TEST_WEBHOOK_SECRET = "mockWebhookSecret123";

    @BeforeEach
    void setUp() {
        competitionRepository = mock(CompetitionRepository.class);
        registrationRepository = mock(CompetitionRegistrationRepository.class);
        restTemplate = mock(RestTemplate.class);
        objectMapper = new ObjectMapper();

        paymentService = new RazorpayPaymentService(
                competitionRepository,
                registrationRepository,
                restTemplate,
                objectMapper
        );

        paymentService.setKeyId(TEST_KEY_ID);
        paymentService.setKeySecret(TEST_KEY_SECRET);
        paymentService.setWebhookSecret(TEST_WEBHOOK_SECRET);
        paymentService.setRazorpayBaseUrl("http://localhost:9999/v1");
    }

    private String calculateHmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    @Test
    void testOrderCreationUsesServerSideFeeAndIgnoresTamperedAmount() {
        Competition comp = new Competition();
        comp.setId("comp-1");
        comp.setTitle("Spelling Bee 2026");
        comp.setStatus("Active");
        comp.setRegistrationFee(new BigDecimal("250.00")); // 25000 paise

        when(competitionRepository.findById("comp-1")).thenReturn(Optional.of(comp));
        when(registrationRepository.findByCompetitionIdAndStudentPhone(anyString(), anyString())).thenReturn(Optional.empty());
        when(registrationRepository.findByCompetitionIdAndStudentEmailIgnoreCase(anyString(), anyString())).thenReturn(Optional.empty());
        when(registrationRepository.save(any(CompetitionRegistration.class))).thenAnswer(inv -> inv.getArgument(0));

        // Mock Razorpay Orders API response
        String rzpResponseJson = "{\"id\":\"order_mock_999\",\"amount\":25000,\"currency\":\"INR\"}";
        when(restTemplate.postForEntity(contains("/orders"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(rzpResponseJson, HttpStatus.OK));

        CompetitionOrderRequest request = new CompetitionOrderRequest();
        request.setCompetitionId("comp-1");
        request.setStudentName("Rohan Sharma");
        request.setStudentEmail("rohan@example.com");
        request.setStudentPhone("9876543210");
        request.setAmount("5.00"); // Tampered client amount! Must be ignored!

        RazorpayOrderResponse response = paymentService.createCompetitionOrder(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("order_mock_999", response.getOrderId());
        assertEquals(25000L, response.getAmount(), "Order amount in paise must match server fee (25000), ignoring client tampering");
        assertEquals("INR", response.getCurrency());
        assertEquals(TEST_KEY_ID, response.getKeyId());
        assertFalse(response.isFree());
        verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testOrderCreationFreeCompetition() {
        Competition comp = new Competition();
        comp.setId("comp-free");
        comp.setTitle("Free Debate Contest");
        comp.setStatus("Active");
        comp.setRegistrationFee(BigDecimal.ZERO);

        when(competitionRepository.findById("comp-free")).thenReturn(Optional.of(comp));
        when(registrationRepository.save(any(CompetitionRegistration.class))).thenAnswer(inv -> inv.getArgument(0));

        CompetitionOrderRequest request = new CompetitionOrderRequest();
        request.setCompetitionId("comp-free");
        request.setStudentName("Anita Roy");
        request.setStudentEmail("anita@example.com");
        request.setStudentPhone("9123456789");

        RazorpayOrderResponse response = paymentService.createCompetitionOrder(request, "127.0.0.1");

        assertNotNull(response);
        assertTrue(response.isFree());
        assertNull(response.getOrderId());
        assertEquals(0L, response.getAmount());
        assertNull(response.getKeyId());
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    void testOrderCreationMissingKeysThrowsError() {
        paymentService.setKeyId("");
        paymentService.setKeySecret("");

        Competition comp = new Competition();
        comp.setId("comp-1");
        comp.setStatus("Active");
        comp.setRegistrationFee(new BigDecimal("100.00"));

        when(competitionRepository.findById("comp-1")).thenReturn(Optional.of(comp));

        CompetitionOrderRequest request = new CompetitionOrderRequest();
        request.setCompetitionId("comp-1");
        request.setStudentName("Test User");
        request.setStudentEmail("test@example.com");
        request.setStudentPhone("9876543210");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                paymentService.createCompetitionOrder(request, "127.0.0.1")
        );
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Online payments are not configured"));
    }

    @Test
    void testOrderCreationDuplicatePaidRegistrationRejected() {
        Competition comp = new Competition();
        comp.setId("comp-1");
        comp.setStatus("Active");
        comp.setRegistrationFee(new BigDecimal("100.00"));

        CompetitionRegistration existing = new CompetitionRegistration();
        existing.setId("reg-existing");
        existing.setPaymentStatus("PAID");
        existing.setStudentPhone("9876543210");
        existing.setStudentEmail("rohan@example.com");

        when(competitionRepository.findById("comp-1")).thenReturn(Optional.of(comp));
        when(registrationRepository.findByCompetitionIdAndStudentPhone(eq("comp-1"), eq("9876543210")))
                .thenReturn(Optional.of(existing));

        CompetitionOrderRequest request = new CompetitionOrderRequest();
        request.setCompetitionId("comp-1");
        request.setStudentName("Rohan Sharma");
        request.setStudentEmail("rohan@example.com");
        request.setStudentPhone("9876543210");

        assertThrows(ConflictException.class, () ->
                paymentService.createCompetitionOrder(request, "127.0.0.1")
        );
    }

    @Test
    void testValidSignatureVerificationMarksPaid() throws Exception {
        String orderId = "order_mock_123";
        String paymentId = "pay_mock_789";
        String validSig = calculateHmac(orderId + "|" + paymentId, TEST_KEY_SECRET);

        CompetitionRegistration reg = new CompetitionRegistration();
        reg.setId("reg-1");
        reg.setRazorpayOrderId(orderId);
        reg.setPaymentStatus("PENDING_PAYMENT");

        when(registrationRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(reg));
        when(registrationRepository.save(any(CompetitionRegistration.class))).thenAnswer(inv -> inv.getArgument(0));

        RazorpayVerifyRequest verifyReq = new RazorpayVerifyRequest(orderId, paymentId, validSig);
        CompetitionRegistration result = paymentService.verifyPayment(verifyReq);

        assertNotNull(result);
        assertEquals("PAID", result.getPaymentStatus());
        assertEquals(paymentId, result.getRazorpayPaymentId());
        assertEquals(validSig, result.getRazorpaySignature());
        assertNotNull(result.getPaidAt());
    }

    @Test
    void testInvalidSignatureVerificationRejected() {
        String orderId = "order_mock_123";
        String paymentId = "pay_mock_789";
        String forgedSig = "forged_invalid_signature_hex_value_12345";

        CompetitionRegistration reg = new CompetitionRegistration();
        reg.setId("reg-1");
        reg.setRazorpayOrderId(orderId);
        reg.setPaymentStatus("PENDING_PAYMENT");

        when(registrationRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(reg));

        RazorpayVerifyRequest verifyReq = new RazorpayVerifyRequest(orderId, paymentId, forgedSig);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                paymentService.verifyPayment(verifyReq)
        );
        assertTrue(ex.getMessage().contains("Invalid payment signature"));
        assertEquals("PENDING_PAYMENT", reg.getPaymentStatus(), "Registration must remain unpaid when signature is invalid");
    }

    @Test
    void testVerifyPaymentIsIdempotent() {
        String orderId = "order_mock_already_paid";
        String paymentId = "pay_mock_paid_already";

        CompetitionRegistration reg = new CompetitionRegistration();
        reg.setId("reg-paid");
        reg.setRazorpayOrderId(orderId);
        reg.setPaymentStatus("PAID");
        reg.setRazorpayPaymentId(paymentId);

        when(registrationRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(reg));

        RazorpayVerifyRequest verifyReq = new RazorpayVerifyRequest(orderId, paymentId, "any_sig");
        CompetitionRegistration result = paymentService.verifyPayment(verifyReq);

        assertNotNull(result);
        assertEquals("PAID", result.getPaymentStatus());
        assertEquals(paymentId, result.getRazorpayPaymentId());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testWebhookPaymentCapturedMarksPaid() throws Exception {
        String orderId = "order_wh_123";
        String paymentId = "pay_wh_456";

        String webhookJson = "{"
                + "\"event\":\"payment.captured\","
                + "\"payload\":{"
                + "  \"payment\":{"
                + "    \"entity\":{"
                + "      \"id\":\"" + paymentId + "\","
                + "      \"order_id\":\"" + orderId + "\""
                + "    }"
                + "  }"
                + "}}";

        String signature = calculateHmac(webhookJson, TEST_WEBHOOK_SECRET);

        CompetitionRegistration reg = new CompetitionRegistration();
        reg.setId("reg-wh");
        reg.setRazorpayOrderId(orderId);
        reg.setPaymentStatus("PENDING_PAYMENT");

        when(registrationRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(reg));
        when(registrationRepository.save(any(CompetitionRegistration.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean handled = paymentService.handleWebhook(webhookJson, signature);

        assertTrue(handled);
        assertEquals("PAID", reg.getPaymentStatus());
        assertEquals(paymentId, reg.getRazorpayPaymentId());
        assertNotNull(reg.getPaidAt());
    }
}
