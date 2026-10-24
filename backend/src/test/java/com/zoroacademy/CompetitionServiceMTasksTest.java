package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.controller.CompetitionController;
import com.zoroacademy.entity.*;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.*;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.CompetitionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CompetitionServiceMTasksTest {

    @Autowired
    private CompetitionService competitionService;

    @Autowired
    private CompetitionController competitionController;

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
    private RepublishAuditRepository republishAuditRepository;

    private Competition testComp;
    private User testStudent;
    private User testTrainer;
    private User testAdmin;
    private CompetitionRegistration testReg;
    private CompetitionAssessment mixedAssessment;
    private AssessmentQuestion mcqQ1;
    private AssessmentQuestion voiceQ2;
    private QuestionOption optA;
    private QuestionOption optB;
    private String uid;

    @BeforeEach
    void setUp() {
        uid = UUID.randomUUID().toString().substring(0, 8);

        testAdmin = new User();
        testAdmin.setId("usr_adm_" + uid);
        testAdmin.setName("Admin M " + uid);
        testAdmin.setEmail("admin_m_" + uid + "@example.com");
        testAdmin.setPassword("password123!");
        testAdmin.setRole("ADMIN");
        userRepository.saveAndFlush(testAdmin);

        testStudent = new User();
        testStudent.setId("usr_stu_" + uid);
        testStudent.setName("Student M " + uid);
        testStudent.setEmail("student_m_" + uid + "@example.com");
        testStudent.setPassword("password123!");
        testStudent.setRole("STUDENT");
        userRepository.saveAndFlush(testStudent);

        testTrainer = new User();
        testTrainer.setId("usr_trn_" + uid);
        testTrainer.setName("Trainer M " + uid);
        testTrainer.setEmail("trainer_m_" + uid + "@example.com");
        testTrainer.setPassword("password123!");
        testTrainer.setRole("TRAINER");
        userRepository.saveAndFlush(testTrainer);

        testComp = new Competition();
        testComp.setId("comp_m_" + uid);
        testComp.setTitle("M Tasks Championship " + uid);
        testComp.setStatus("PUBLISHED");
        competitionRepository.saveAndFlush(testComp);

        testReg = new CompetitionRegistration();
        testReg.setId("reg_m_" + uid);
        testReg.setCompetition(testComp);
        testReg.setStudentId(testStudent.getId());
        testReg.setStudentName(testStudent.getName());
        testReg.setStudentEmail(testStudent.getEmail());
        testReg.setPaymentStatus("PAID");
        registrationRepository.saveAndFlush(testReg);

        mixedAssessment = new CompetitionAssessment();
        mixedAssessment.setId("asmt_m_" + uid);
        mixedAssessment.setCompetitionId(testComp.getId());
        mixedAssessment.setType("TEST_SERIES");
        mixedAssessment.setSequenceNo(32);
        mixedAssessment.setTitle("Test Series Slot 32");
        mixedAssessment.setStatus("PUBLISHED");
        mixedAssessment.setPublishVersion(1);
        mixedAssessment.setTotalMarks(10);
        assessmentRepository.saveAndFlush(mixedAssessment);

        // MCQ Q1
        mcqQ1 = new AssessmentQuestion();
        mcqQ1.setId("q_mcq_" + uid);
        mcqQ1.setAssessmentId(mixedAssessment.getId());
        mcqQ1.setQuestionFormat("MCQ");
        mcqQ1.setAnswerFormat("MCQ_OPTIONS");
        mcqQ1.setQuestionText("What is 2+2?");
        mcqQ1.setMarks(5);
        mcqQ1.setSortOrder(1);
        questionRepository.saveAndFlush(mcqQ1);

        optA = new QuestionOption();
        optA.setQuestionId(mcqQ1.getId());
        optA.setText("4");
        optA.setIsCorrect(true);
        optA.setSortOrder(1);
        optA = questionOptionRepository.saveAndFlush(optA);

        optB = new QuestionOption();
        optB.setQuestionId(mcqQ1.getId());
        optB.setText("5");
        optB.setIsCorrect(false);
        optB.setSortOrder(2);
        optB = questionOptionRepository.saveAndFlush(optB);

        // Voice Q2
        voiceQ2 = new AssessmentQuestion();
        voiceQ2.setId("q_voice_" + uid);
        voiceQ2.setAssessmentId(mixedAssessment.getId());
        voiceQ2.setQuestionFormat("VOICE");
        voiceQ2.setAnswerFormat("VOICE");
        voiceQ2.setQuestionText("Explain photosynthesis in 30 seconds.");
        voiceQ2.setMarks(5);
        voiceQ2.setSortOrder(2);
        questionRepository.saveAndFlush(voiceQ2);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateUser(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("M1 Case 1: Answered MCQ + Voice -> MANUAL_PENDING, score hidden in API")
    void testCase1McqAndVoiceAnswered() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_case1_" + uid);
        attempt.setAssessmentId(mixedAssessment.getId());
        attempt.setRegistrationId(testReg.getId());
        attempt.setStatus("IN_PROGRESS");
        attempt.setStartedAt(now.minusMinutes(10));
        attempt.setPublishVersion(1);
        attemptRepository.saveAndFlush(attempt);

        AttemptAnswer mcqAns = new AttemptAnswer();
        mcqAns.setId("ans_mcq_c1_" + uid);
        mcqAns.setAttemptId(attempt.getId());
        mcqAns.setQuestionId(mcqQ1.getId());
        mcqAns.setSelectedOptionId(optA.getId());
        mcqAns.setSavedAt(now);
        answerRepository.saveAndFlush(mcqAns);

        AttemptAnswer voiceAns = new AttemptAnswer();
        voiceAns.setId("ans_v_c1_" + uid);
        voiceAns.setAttemptId(attempt.getId());
        voiceAns.setQuestionId(voiceQ2.getId());
        voiceAns.setVoiceFileId("file-uuid-voice-1234");
        voiceAns.setVoiceDurationSec(25);
        voiceAns.setSavedAt(now);
        answerRepository.saveAndFlush(voiceAns);

        competitionService.evaluateAndFinalizeAttempt(attempt);

        AssessmentAttempt updated = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertEquals("EVALUATION_PENDING", updated.getStatus());
        assertEquals("MANUAL_PENDING", updated.getEvaluationMode());

        // Result API must hide scores, accuracy, and questions while pending for student
        Map<String, Object> results = competitionService.getAttemptResults(mixedAssessment.getId(), testStudent);
        assertTrue(Boolean.TRUE.equals(results.get("isPendingEvaluation")));
        assertEquals(0, ((List<?>) results.get("questions")).size(), "Questions must be empty while pending evaluation");
        Map<?, ?> attemptDto = (Map<?, ?>) results.get("attempt");
        assertNull(attemptDto.get("totalMarks"), "Score must be hidden while pending");
    }

    @Test
    @DisplayName("M1 Case 2: Answered MCQ only (Voice skipped) -> AUTO_EVALUATED, instant result, skipped voice marked 0")
    void testCase2McqOnlyAnswered() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_case2_" + uid);
        attempt.setAssessmentId(mixedAssessment.getId());
        attempt.setRegistrationId(testReg.getId());
        attempt.setStatus("IN_PROGRESS");
        attempt.setStartedAt(now.minusMinutes(10));
        attempt.setPublishVersion(1);
        attemptRepository.saveAndFlush(attempt);

        AttemptAnswer mcqAns = new AttemptAnswer();
        mcqAns.setId("ans_mcq_c2_" + uid);
        mcqAns.setAttemptId(attempt.getId());
        mcqAns.setQuestionId(mcqQ1.getId());
        mcqAns.setSelectedOptionId(optA.getId());
        mcqAns.setSavedAt(now);
        answerRepository.saveAndFlush(mcqAns);

        competitionService.evaluateAndFinalizeAttempt(attempt);

        AssessmentAttempt updated = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertEquals("COMPLETED", updated.getStatus());
        assertEquals("AUTO_EVALUATED", updated.getEvaluationMode());
        assertEquals(5, updated.getTotalMarks().intValue());

        // Skipped voice question must be explicitly recorded as SKIPPED with 0 marks
        List<AttemptAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        AttemptAnswer skippedVoice = answers.stream()
                .filter(a -> a.getQuestionId().equals(voiceQ2.getId()))
                .findFirst().orElseThrow();
        assertEquals("SKIPPED", skippedVoice.getEvaluationStatus());
        assertEquals(BigDecimal.ZERO, skippedVoice.getMarksAwarded());

        // Candidate can view full results immediately
        Map<String, Object> results = competitionService.getAttemptResults(mixedAssessment.getId(), testStudent);
        assertFalse(Boolean.TRUE.equals(results.get("isPendingEvaluation")));
        assertNotNull(results.get("questions"));
        Map<?, ?> attemptDto = (Map<?, ?>) results.get("attempt");
        assertEquals(5, ((Number) attemptDto.get("totalMarks")).intValue());
    }

    @Test
    @DisplayName("M1 Case 2 zero answers: Nothing answered -> AUTO_EVALUATED, score 0")
    void testCase2ZeroAnswers() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_zero_" + uid);
        attempt.setAssessmentId(mixedAssessment.getId());
        attempt.setRegistrationId(testReg.getId());
        attempt.setStatus("IN_PROGRESS");
        attempt.setStartedAt(now.minusMinutes(10));
        attempt.setPublishVersion(1);
        attemptRepository.saveAndFlush(attempt);

        competitionService.evaluateAndFinalizeAttempt(attempt);

        AssessmentAttempt updated = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertEquals("COMPLETED", updated.getStatus());
        assertEquals("AUTO_EVALUATED", updated.getEvaluationMode());
        assertEquals(0, updated.getTotalMarks().intValue());
    }

    @Test
    @DisplayName("M1 Case 3: Answered Voice only (No MCQ) -> MANUAL_PENDING, score hidden")
    void testCase3VoiceOnlyAnswered() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_case3_" + uid);
        attempt.setAssessmentId(mixedAssessment.getId());
        attempt.setRegistrationId(testReg.getId());
        attempt.setStatus("IN_PROGRESS");
        attempt.setStartedAt(now.minusMinutes(10));
        attempt.setPublishVersion(1);
        attemptRepository.saveAndFlush(attempt);

        AttemptAnswer voiceAns = new AttemptAnswer();
        voiceAns.setId("ans_v_c3_" + uid);
        voiceAns.setAttemptId(attempt.getId());
        voiceAns.setQuestionId(voiceQ2.getId());
        voiceAns.setVoiceFileId("file-uuid-voice-only-9999");
        voiceAns.setVoiceDurationSec(30);
        voiceAns.setSavedAt(now);
        answerRepository.saveAndFlush(voiceAns);

        competitionService.evaluateAndFinalizeAttempt(attempt);

        AssessmentAttempt updated = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertEquals("EVALUATION_PENDING", updated.getStatus());
        assertEquals("MANUAL_PENDING", updated.getEvaluationMode());

        Map<String, Object> results = competitionService.getAttemptResults(mixedAssessment.getId(), testStudent);
        assertTrue(Boolean.TRUE.equals(results.get("isPendingEvaluation")));
        assertEquals(0, ((List<?>) results.get("questions")).size());
    }

    @Test
    @DisplayName("M2: Trainer cannot evaluate an AUTO_EVALUATED Case 2 attempt -> HTTP 409 Conflict")
    void testTrainerCannotEvaluateAutoEvaluatedAttempt() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_auto_" + uid);
        attempt.setAssessmentId(mixedAssessment.getId());
        attempt.setRegistrationId(testReg.getId());
        attempt.setStatus("COMPLETED");
        attempt.setEvaluationMode("AUTO_EVALUATED");
        attempt.setStartedAt(now.minusMinutes(20));
        attempt.setSubmittedAt(now.minusMinutes(5));
        attempt.setPublishVersion(1);
        attempt.setTotalMarks(BigDecimal.valueOf(5));
        attemptRepository.saveAndFlush(attempt);

        AttemptAnswer voiceAns = new AttemptAnswer();
        voiceAns.setId("ans_voice_auto_" + uid);
        voiceAns.setAttemptId(attempt.getId());
        voiceAns.setQuestionId(voiceQ2.getId());
        voiceAns.setEvaluationStatus("SKIPPED");
        voiceAns.setMarksAwarded(BigDecimal.ZERO);
        voiceAns.setSavedAt(now);
        answerRepository.saveAndFlush(voiceAns);

        authenticateUser(testTrainer);

        Map<String, Object> evalPayload = Map.of(
                "marksAwarded", 3.0,
                "feedback", "Attempting manual grade"
        );

        assertThrows(ConflictException.class, () -> {
            competitionController.evaluateVoiceAnswer(attempt.getId(), voiceAns.getId(), evalPayload);
        });
    }

    @Test
    @DisplayName("M5: Republish resets attempts, increments publish_version, logs RepublishAudit row")
    void testRepublishResetsAttemptsAndLogsAudit() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_repub_" + uid);
        attempt.setAssessmentId(mixedAssessment.getId());
        attempt.setRegistrationId(testReg.getId());
        attempt.setStatus("COMPLETED");
        attempt.setPublishVersion(1);
        attempt.setStartedAt(now.minusMinutes(30));
        attempt.setSubmittedAt(now.minusMinutes(10));
        attemptRepository.saveAndFlush(attempt);

        assertEquals(1, attemptRepository.count());

        authenticateUser(testAdmin);
        ApiResponse<CompetitionAssessment> republishRes = competitionController.republishAssessment(mixedAssessment.getId());
        assertNotNull(republishRes);
        assertTrue(republishRes.isSuccess());
        assertEquals(2, republishRes.getData().getPublishVersion());

        // All attempts deleted
        assertEquals(0, attemptRepository.count());

        // Audit row logged with previous_version 1 and new_version 2
        List<RepublishAudit> audits = republishAuditRepository.findAll();
        assertFalse(audits.isEmpty());
        RepublishAudit audit = audits.get(audits.size() - 1);
        assertEquals(1, audit.getPreviousVersion());
        assertEquals(2, audit.getNewVersion());
        assertEquals(1, audit.getDeletedAttemptsCount());
    }

    @Test
    @DisplayName("M5: Late submission on republished assessment returns HTTP 409 Conflict")
    void testLateSubmitOnRepublishedAssessmentThrowsConflict() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setId("att_late_" + uid);
        attempt.setAssessmentId(mixedAssessment.getId());
        attempt.setRegistrationId(testReg.getId());
        attempt.setStatus("IN_PROGRESS");
        attempt.setPublishVersion(1);
        attempt.setStartedAt(now.minusMinutes(15));
        attemptRepository.saveAndFlush(attempt);

        // Admin republishes while candidate is on test page
        mixedAssessment.setPublishVersion(2);
        assessmentRepository.saveAndFlush(mixedAssessment);

        // Candidate tries to submit using assessment id
        assertThrows(ConflictException.class, () -> {
            competitionService.submitTestAttempt(mixedAssessment.getId(), testStudent);
        });
    }
}
