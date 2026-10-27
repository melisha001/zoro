package com.zoroacademy;

import com.zoroacademy.dto.CompetitionOrderRequest;
import com.zoroacademy.dto.RazorpayOrderResponse;
import com.zoroacademy.entity.*;
import com.zoroacademy.exception.BadRequestException;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.CompetitionService;
import com.zoroacademy.service.RazorpayPaymentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class CompetitionTasksYTest {

    @Autowired
    private CompetitionService competitionService;

    @Autowired
    private RazorpayPaymentService razorpayPaymentService;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private CompetitionRegistrationRepository registrationRepository;

    @Autowired
    private CompetitionAssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentQuestionRepository questionRepository;

    @Autowired
    private QuestionOptionRepository questionOptionRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private AttemptAnswerRepository answerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompetitionSetRepository setRepository;

    @Autowired
    private CompetitionSetMemberRepository setMemberRepository;

    @MockBean
    private RestTemplate restTemplate;

    private static final String TEST_KEY_ID = "rzp_test_public_key_y";
    private static final String TEST_KEY_SECRET = "testSecretY123456789";

    private Competition comp;
    private User trainerUser;
    private User studentUser;
    private CompetitionRegistration reg;
    private CompetitionAssessment asmt;

    @BeforeEach
    void setUp() {
        razorpayPaymentService.setKeyId(TEST_KEY_ID);
        razorpayPaymentService.setKeySecret(TEST_KEY_SECRET);

        trainerUser = new User();
        trainerUser.setId("usr_trainer_y_" + UUID.randomUUID());
        trainerUser.setEmail("trainer_y_" + UUID.randomUUID() + "@example.com");
        trainerUser.setName("Trainer Y");
        trainerUser.setRole("TRAINER");
        trainerUser.setPassword("password");
        userRepository.save(trainerUser);

        studentUser = new User();
        studentUser.setId("usr_student_y_" + UUID.randomUUID());
        studentUser.setEmail("student_y_" + UUID.randomUUID() + "@example.com");
        studentUser.setName("Student Y");
        studentUser.setRole("STUDENT");
        studentUser.setPassword("password");
        userRepository.save(studentUser);

        comp = new Competition();
        comp.setId("comp_y_" + UUID.randomUUID());
        comp.setTitle("Championship Y");
        comp.setStatus("Active");
        comp.setRegistrationFee(BigDecimal.valueOf(150));
        competitionRepository.save(comp);

        reg = new CompetitionRegistration();
        reg.setId("reg_y_" + UUID.randomUUID());
        reg.setCompetition(comp);
        reg.setStudentId(studentUser.getId());
        reg.setStudentName("Student Y");
        reg.setStudentEmail(studentUser.getEmail());
        reg.setStudentPhone("9876543210");
        reg.setPaymentStatus("PAID");
        registrationRepository.save(reg);

        asmt = new CompetitionAssessment();
        asmt.setId("asmt_y_" + UUID.randomUUID());
        asmt.setCompetitionId(comp.getId());
        asmt.setType("FINAL");
        asmt.setSequenceNo(40);
        asmt.setTitle("Final Exam Y");
        asmt.setStatus("PUBLISHED");
        asmt.setDurationMinutes(30);
        asmt.setTotalMarks(20);
        assessmentRepository.save(asmt);
    }

    @AfterEach
    void tearDown() {
        if (asmt != null) {
            List<AssessmentAttempt> atts = attemptRepository.findByAssessmentId(asmt.getId());
            for (AssessmentAttempt a : atts) {
                answerRepository.deleteAll(answerRepository.findByAttemptId(a.getId()));
            }
            attemptRepository.deleteAll(atts);

            List<AssessmentQuestion> qs = questionRepository.findByAssessmentIdOrderBySortOrderAsc(asmt.getId());
            for (AssessmentQuestion q : qs) {
                questionOptionRepository.deleteAll(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId()));
            }
            questionRepository.deleteAll(qs);
            assessmentRepository.delete(asmt);
        }
        if (reg != null) registrationRepository.delete(reg);
        if (comp != null) competitionRepository.delete(comp);
        if (studentUser != null) userRepository.delete(studentUser);
        if (trainerUser != null) userRepository.delete(trainerUser);
    }

    // ==================== Y1: RAZORPAY CONFIGURATION & FAIL-CLOSED ====================

    @Test
    @DisplayName("Y1: Razorpay order response includes keyId; blank keys fail closed with 503")
    void testY1RazorpayConfigAndFailClosed() {
        String rzpJson = "{\"id\":\"order_rzp_y1\",\"amount\":15000,\"currency\":\"INR\"}";
        when(restTemplate.postForEntity(contains("/orders"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(rzpJson, HttpStatus.OK));

        CompetitionOrderRequest req = new CompetitionOrderRequest();
        req.setCompetitionId(comp.getId());
        req.setStudentName("Test Participant");
        req.setStudentEmail("test.part.new@example.com");
        req.setStudentPhone("9111111111");

        RazorpayOrderResponse resp = razorpayPaymentService.createCompetitionOrder(req, "127.0.0.1");
        assertNotNull(resp);
        assertEquals(TEST_KEY_ID, resp.getKeyId());
        assertEquals("order_rzp_y1", resp.getOrderId());
        assertEquals(15000L, resp.getAmount());

        // Blank keyId fails closed with 503
        razorpayPaymentService.setKeyId("");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                razorpayPaymentService.createCompetitionOrder(req, "127.0.0.1")
        );
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
        assertEquals("Payments are not configured", ex.getReason());

        // Restore keyId
        razorpayPaymentService.setKeyId(TEST_KEY_ID);
    }

    // ==================== Y2: REGISTRATION WINDOW EVALUATION ====================

    @Test
    @DisplayName("Y2: isRegistrationOpen respects IST date boundaries; registerStudent rejects closed competitions")
    void testY2RegistrationWindowBoundaries() {
        ZonedDateTime nowIst = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));
        LocalDate today = nowIst.toLocalDate();
        DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE;

        // 1. Unset window -> open
        Competition compNoDates = new Competition();
        assertTrue(CompetitionService.isRegistrationOpen(compNoDates));

        // 2. Future window -> closed
        Competition compFuture = new Competition();
        compFuture.setRegStartDate(today.plusDays(2).format(dtf));
        compFuture.setRegEndDate(today.plusDays(10).format(dtf));
        assertFalse(CompetitionService.isRegistrationOpen(compFuture));

        // 3. Past window -> closed
        Competition compPast = new Competition();
        compPast.setRegStartDate(today.minusDays(10).format(dtf));
        compPast.setRegEndDate(today.minusDays(1).format(dtf));
        assertFalse(CompetitionService.isRegistrationOpen(compPast));

        // 4. Current active window -> open
        Competition compActive = new Competition();
        compActive.setRegStartDate(today.minusDays(1).format(dtf));
        compActive.setRegEndDate(today.plusDays(1).format(dtf));
        assertTrue(CompetitionService.isRegistrationOpen(compActive));

        // 5. Registering for closed competition throws ConflictException (409)
        comp.setRegStartDate(today.minusDays(10).format(dtf));
        comp.setRegEndDate(today.minusDays(1).format(dtf));
        competitionRepository.save(comp);

        CompetitionRegistration newReg = new CompetitionRegistration();
        newReg.setStudentEmail("late@example.com");
        newReg.setStudentPhone("9123456789");
        newReg.setStudentName("Late Candidate");

        ConflictException conflict = assertThrows(ConflictException.class, () ->
                competitionService.registerStudent(comp.getId(), newReg)
        );
        assertEquals("Registration for this competition is closed.", conflict.getMessage());
    }

    // ==================== Y3: TRAINER EVALUATION OF MANUAL VS MCQ ====================

    @Test
    @DisplayName("Y3: MCQ manual grading rejected with 400; Text evaluation updates totals and attempt status")
    void testY3TrainerManualEvaluationRules() {
        // Setup Q1: MCQ (10 marks)
        AssessmentQuestion qMcq = new AssessmentQuestion();
        qMcq.setId("q_mcq_" + UUID.randomUUID());
        qMcq.setAssessmentId(asmt.getId());
        qMcq.setQuestionFormat("TEXT");
        qMcq.setAnswerFormat("MCQ");
        qMcq.setMarks(10);
        qMcq.setSortOrder(1);
        qMcq.setQuestionText("What is the synonym of vast?");
        questionRepository.save(qMcq);

        // Setup Q2: TEXT (10 marks)
        AssessmentQuestion qText = new AssessmentQuestion();
        qText.setId("q_text_" + UUID.randomUUID());
        qText.setAssessmentId(asmt.getId());
        qText.setQuestionFormat("TEXT");
        qText.setAnswerFormat("TEXT");
        qText.setMarks(10);
        qText.setSortOrder(2);
        qText.setQuestionText("Explain the importance of clear communication.");
        questionRepository.save(qText);

        // Create assigned set
        CompetitionSet setY = new CompetitionSet();
        setY.setId("set_y_" + UUID.randomUUID());
        setY.setCompetitionId(comp.getId());
        setY.setCode("A");
        setY.setTrainerId(trainerUser.getId());
        setRepository.save(setY);

        // Create attempt
        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_y_" + UUID.randomUUID());
        attempt.setAssessmentId(asmt.getId());
        attempt.setRegistrationId(reg.getId());
        attempt.setSetId(setY.getId());
        attempt.setMcqMarks(BigDecimal.valueOf(10));
        attempt.setVoiceMarks(BigDecimal.ZERO);
        attempt.setTotalMarks(BigDecimal.valueOf(10));
        attempt.setStatus("EVALUATION_PENDING");
        attempt.setEvaluationMode("MANUAL_PENDING");
        attemptRepository.save(attempt);

        // MCQ Answer
        AttemptAnswer ansMcq = new AttemptAnswer();
        ansMcq.setId("ans_mcq_" + UUID.randomUUID());
        ansMcq.setAttemptId(attempt.getId());
        ansMcq.setQuestionId(qMcq.getId());
        ansMcq.setSelectedOptionId(UUID.randomUUID());
        ansMcq.setMarksAwarded(BigDecimal.valueOf(10));
        ansMcq.setEvaluationStatus("AUTO_EVALUATED");
        ansMcq.setSavedAt(java.time.OffsetDateTime.now());
        answerRepository.save(ansMcq);

        // Text Answer
        AttemptAnswer ansText = new AttemptAnswer();
        ansText.setId("ans_text_" + UUID.randomUUID());
        ansText.setAttemptId(attempt.getId());
        ansText.setQuestionId(qText.getId());
        ansText.setTextAnswer("Clear communication prevents errors and builds strong rapport.");
        ansText.setMarksAwarded(BigDecimal.ZERO);
        ansText.setEvaluationStatus("PENDING");
        ansText.setSavedAt(java.time.OffsetDateTime.now());
        answerRepository.save(ansText);

        // 1. Manually grading MCQ throws BadRequestException
        Map<String, Object> evalPayload = new HashMap<>();
        evalPayload.put("marksAwarded", 8.0);

        BadRequestException mcqEx = assertThrows(BadRequestException.class, () ->
                competitionService.evaluateVoiceAnswer(attempt.getId(), ansMcq.getId(), evalPayload, trainerUser)
        );
        assertEquals("MCQ questions are automatically evaluated by the system and cannot be manually scored.", mcqEx.getMessage());

        // 2. Grading TEXT answer succeeds, updates marks, and transitions status to COMPLETED
        evalPayload.put("marksAwarded", 8.5);
        evalPayload.put("feedback", "Excellent explanation and vocabulary.");

        Map<String, Object> res = competitionService.evaluateVoiceAnswer(attempt.getId(), ansText.getId(), evalPayload, trainerUser);
        assertNotNull(res);

        AttemptAnswer updatedTextAns = answerRepository.findById(ansText.getId()).orElseThrow();
        assertEquals(new BigDecimal("8.50"), updatedTextAns.getMarksAwarded());
        assertEquals("EVALUATED", updatedTextAns.getEvaluationStatus());
        assertEquals("Excellent explanation and vocabulary.", updatedTextAns.getTrainerFeedback());

        AssessmentAttempt updatedAttempt = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertEquals(new BigDecimal("18.50"), updatedAttempt.getTotalMarks());
        assertEquals("COMPLETED", updatedAttempt.getStatus());
        assertEquals("EVALUATED", updatedAttempt.getEvaluationMode());
    }

    // ==================== Y4 & Y6: IMAGE QUESTION VALIDATION ====================

    @Test
    @DisplayName("Y4/Y6: Image questions require uploaded mediaRef in saveQuestion")
    void testY4Y6ImageQuestionRequiresMediaRef() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("questionFormat", "IMAGE");
        payload.put("answerFormat", "TEXT");
        payload.put("questionText", "Describe what you see in the photo.");
        payload.put("mediaRef", ""); // Blank mediaRef!

        BadRequestException imgEx = assertThrows(BadRequestException.class, () ->
                competitionService.saveQuestion(asmt.getId(), payload)
        );
        assertEquals("Image question requires an uploaded image", imgEx.getMessage());
    }
}
