package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.CompetitionOrderRequest;
import com.zoroacademy.dto.RazorpayOrderResponse;
import com.zoroacademy.dto.RazorpayVerifyRequest;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.service.RazorpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/razorpay")
public class PaymentController {

    private final RazorpayPaymentService paymentService;

    public PaymentController(RazorpayPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/order")
    public ApiResponse<RazorpayOrderResponse> createOrder(
            @Valid @RequestBody CompetitionOrderRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        RazorpayOrderResponse response = paymentService.createCompetitionOrder(request, clientIp);
        return ApiResponse.ok(response, response.isFree() ? "Registration confirmed directly (Free competition)" : "Razorpay order created successfully");
    }

    @PostMapping("/verify")
    public ApiResponse<CompetitionRegistration> verifyPayment(
            @Valid @RequestBody RazorpayVerifyRequest request
    ) {
        CompetitionRegistration registration = paymentService.verifyPayment(request);
        return ApiResponse.ok(registration, "Payment verified and registration confirmed");
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader
    ) {
        boolean handled = paymentService.handleWebhook(payload, signatureHeader);
        return handled ? ResponseEntity.ok("Webhook processed") : ResponseEntity.badRequest().body("Webhook processing failed");
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }
}
