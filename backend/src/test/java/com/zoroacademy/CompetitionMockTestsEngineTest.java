package com.zoroacademy;

import com.zoroacademy.controller.CompetitionController;
import com.zoroacademy.entity.*;
import com.zoroacademy.exception.BadRequestException;
import com.zoroacademy.exception.ForbiddenException;
import com.zoroacademy.repository.*;
import com.zoroacademy.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class CompetitionMockTestsEngineTest {

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
    private StoredFileRepository storedFileRepository;

    @Autowired
    private UserRepository userRepository;

    private Competition testComp;
    private User testStudent;
    private User testAdmin;
    private CompetitionRegistration testReg;
    private CompetitionAssessment mock1; // Live
    private CompetitionAssessment mock2; // Upcoming
    private CompetitionAssessment mock3; // Expired
    private CompetitionAssessment mock4; // Draft
    private AssessmentQuestion qMcq;
    private AssessmentQuestion qVoice;
    private QuestionOption optA;
    private QuestionOption optB;
    private StoredFile sampleAudio;

    @BeforeEach
    void setUp() {
        String uid = UUID.randomUUID().toString().substring(0, 8);
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        testComp = new Competition();
        testComp.setId("comp_mock_" + uid);
        testComp.setTitle("Olympiad Mock Tests " + uid);
        competitionRepository.save(testComp);

        testStudent = new User();
        testStudent.setId("usr_stu_" + uid);
        testStudent.setName("Mock Student " + uid);
        testStudent.setEmail("student_mock_" + uid + "@example.com");
        testStudent.setPassword("password123!");
        testStudent.setRole("STUDENT");
        userRepository.save(testStudent);

        testAdmin = new User();
        testAdmin.setId("usr_adm_" + uid);
        testAdmin.setName("Mock Admin " + uid);
        testAdmin.setEmail("admin_mock_" + uid + "@example.com");
        testAdmin.setPassword("password123!");
        testAdmin.setRole("ADMIN");
        userRepository.save(testAdmin);

        testReg = new CompetitionRegistration();
        testReg.setId("reg_mock_" + uid);
        testReg.setCompetition(testComp);
        testReg.setStudentId(testStudent.getId());
        testReg.setStudentEmail(testStudent.getEmail());
        testReg.setStudentName(testStudent.getName());
        testReg.setPaymentStatus("PAID");
        registrationRepository.save(testReg);

        // Mock 1: LIVE Window (opened 10 mins ago, closes in 35 mins)
        mock1 = new CompetitionAssessment();
        mock1.setId("asmt_" + testComp.getId() + "_mock_1");
        mock1.setCompetitionId(testComp.getId());
        mock1.setType("MOCK");
        mock1.setSequenceNo(1);
        mock1.setTitle("Mock Test 1 (Live)");
        mock1.setStatus("PUBLISHED");
        mock1.setDurationMinutes(45);
        mock1.setTotalMarks(50);
        mock1.setStartAt(now.minusMinutes(10));
        mock1.setEndAt(now.plusMinutes(35));
        assessmentRepository.save(mock1);

        // Mock 2: UPCOMING Window (opens in 2 hours, closes in 3 hours)
        mock2 = new CompetitionAssessment();
        mock2.setId("asmt_" + testComp.getId() + "_mock_2");
        mock2.setCompetitionId(testComp.getId());
        mock2.setType("MOCK");
        mock2.setSequenceNo(2);
        mock2.setTitle("Mock Test 2 (Upcoming)");
        mock2.setStatus("PUBLISHED");
        mock2.setDurationMinutes(45);
        mock2.setTotalMarks(50);
        mock2.setStartAt(now.plusHours(2));
        mock2.setEndAt(now.plusHours(3));
        assessmentRepository.save(mock2);

        // Mock 3: EXPIRED Window (opened 3 hours ago, closed 2 hours ago)
        mock3 = new CompetitionAssessment();
        mock3.setId("asmt_" + testComp.getId() + "_mock_3");
        mock3.setCompetitionId(testComp.getId());
        mock3.setType("MOCK");
        mock3.setSequenceNo(3);
        mock3.setTitle("Mock Test 3 (Expired)");
        mock3.setStatus("PUBLISHED");
        mock3.setDurationMinutes(45);
        mock3.setTotalMarks(50);
        mock3.setStartAt(now.minusHours(3));
        mock3.setEndAt(now.minusHours(2));
        assessmentRepository.save(mock3);

        // Mock 4: DRAFT (Unpublished)
        mock4 = new CompetitionAssessment();
        mock4.setId("asmt_" + testComp.getId() + "_mock_4");
        mock4.setCompetitionId(testComp.getId());
        mock4.setType("MOCK");
        mock4.setSequenceNo(4);
        mock4.setTitle("Mock Test 4 (Draft)");
        mock4.setStatus("DRAFT");
        mock4.setDurationMinutes(45);
        mock4.setTotalMarks(50);
        assessmentRepository.save(mock4);

        // Add 1 MCQ Question to Mock 1
        qMcq = new AssessmentQuestion();
        qMcq.setId("aq_mock_mcq_" + uid);
        qMcq.setAssessmentId(mock1.getId());
        qMcq.setQuestionFormat("MCQ");
        qMcq.setAnswerFormat("MCQ_OPTIONS");
        qMcq.setQuestionText("Identify the synonym of 'Ephemeral':");
        qMcq.setMarks(5);
        qMcq.setSortOrder(0);
        qMcq.setExplanation("'Ephemeral' means lasting for a very short time; synonym is 'Transient'.");
        questionRepository.save(qMcq);

        optA = new QuestionOption();
        optA.setId(UUID.randomUUID());
        optA.setQuestionId(qMcq.getId());
        optA.setText("Transient");
        optA.setIsCorrect(true);
        optA.setSortOrder(0);
        optA = questionOptionRepository.save(optA);

        optB = new QuestionOption();
        optB.setId(UUID.randomUUID());
        optB.setQuestionId(qMcq.getId());
        optB.setText("Permanent");
        optB.setIsCorrect(false);
        optB.setSortOrder(1);
        optB = questionOptionRepository.save(optB);

        // Add 1 Voice Question to Mock 1
        qVoice = new AssessmentQuestion();
        qVoice.setId("aq_mock_v_" + uid);
        qVoice.setAssessmentId(mock1.getId());
        qVoice.setQuestionFormat("VOICE");
        qVoice.setAnswerFormat("VOICE");
        qVoice.setQuestionText("Speak for 60 seconds on the importance of global communication.");
        qVoice.setMarks(10);
        qVoice.setSortOrder(1);
        qVoice.setMaxDurationSeconds(120);
        qVoice.setGuidanceText("Speak clearly into your microphone.");
        questionRepository.save(qVoice);

        // Seed sample audio stored file for foreign key constraint
        sampleAudio = new StoredFile(
                "sf_mock_aud_" + uid,
                "test_speech.webm",
                "audio/webm",
                12345L,
                "voice-answer",
                testStudent.getId(),
                "mock_speech.webm",
                false
        );
        storedFileRepository.save(sampleAudio);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        for (CompetitionAssessment asmt : Arrays.asList(mock1, mock2, mock3, mock4)) {
            if (asmt != null) {
                List<AssessmentAttempt> atts = attemptRepository.findByAssessmentId(asmt.getId());
                for (AssessmentAttempt att : atts) {
                    List<AttemptAnswer> answers = answerRepository.findByAttemptId(att.getId());
                    answerRepository.deleteAll(answers);
                    attemptRepository.delete(att);
                }
            }
        }
        if (qMcq != null) {
            List<QuestionOption> opts = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(qMcq.getId());
            questionOptionRepository.deleteAll(opts);
            questionRepository.delete(qMcq);
        }
        if (qVoice != null) {
            questionRepository.delete(qVoice);
        }
        if (sampleAudio != null) {
            storedFileRepository.delete(sampleAudio);
        }
        if (testComp != null) {
            List<CompetitionAssessment> asmts = assessmentRepository.findByCompetitionIdOrderBySequenceNoAsc(testComp.getId());
            assessmentRepository.deleteAll(asmts);
        }
        if (testReg != null) {
            registrationRepository.delete(testReg);
        }
        if (testComp != null) {
            competitionRepository.delete(testComp);
        }
        if (testStudent != null) {
            userRepository.delete(testStudent);
        }
        if (testAdmin != null) {
            userRepository.delete(testAdmin);
        }
    }

    private void authenticateAs(User u) {
        UserPrincipal principal = new UserPrincipal(u.getId(), u.getEmail(), u.getName(), u.getRole(), "N/A", List.of());
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Mock Tests List returns 4 mock tests with correct window statuses (LIVE, UPCOMING, EXPIRED, UNPUBLISHED)")
    void testGetStudentMockTestsWindowStatuses() {
        authenticateAs(testStudent);

        var resp = competitionController.getMockTests(testComp.getId());
        assertNotNull(resp);
        assertTrue(resp.isSuccess());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mockList = (List<Map<String, Object>>) resp.getData().get("mockTests");
        assertNotNull(mockList);
        assertEquals(4, mockList.size());

        Map<String, Object> m1 = mockList.get(0);
        assertEquals(1, m1.get("sequenceNo"));
        assertEquals("LIVE", m1.get("windowStatus"));
        assertEquals("NOT_STARTED", m1.get("attemptStatus"));
        assertTrue((Long) m1.get("secondsToEnd") > 0);

        Map<String, Object> m2 = mockList.get(1);
        assertEquals(2, m2.get("sequenceNo"));
        assertEquals("UPCOMING", m2.get("windowStatus"));
        assertEquals("UPCOMING_LOCKED", m2.get("attemptStatus"));
        assertTrue((Long) m2.get("secondsToStart") > 0);

        Map<String, Object> m3 = mockList.get(2);
        assertEquals(3, m3.get("sequenceNo"));
        assertEquals("EXPIRED", m3.get("windowStatus"));
        assertEquals("MISSED", m3.get("attemptStatus"));

        Map<String, Object> m4 = mockList.get(3);
        assertEquals(4, m4.get("sequenceNo"));
        assertEquals("UNPUBLISHED", m4.get("attemptStatus"));
    }

    @Test
    @DisplayName("Strict Window Enforcement: Starting an UPCOMING or EXPIRED test throws BadRequestException")
    void testScheduledWindowEnforcement() {
        authenticateAs(testStudent);

        // Attempting to start Mock 2 (Upcoming) should throw BadRequestException
        BadRequestException upcomingEx = assertThrows(BadRequestException.class, () ->
                competitionController.startMockTest(mock2.getId())
        );
        assertTrue(upcomingEx.getMessage().toLowerCase().contains("not open yet"));

        // Attempting to start Mock 3 (Expired) should throw BadRequestException
        BadRequestException expiredEx = assertThrows(BadRequestException.class, () ->
                competitionController.startMockTest(mock3.getId())
        );
        assertTrue(expiredEx.getMessage().toLowerCase().contains("closed"));
    }

    @Test
    @DisplayName("Live Mock Test Execution: Starts live test, sanitizes answers, autosaves, and auto-evaluates MCQ")
    void testLiveMockTestExecutionAndSanitization() {
        authenticateAs(testStudent);

        // 1. Start Mock 1 (LIVE)
        var startResp = competitionController.startMockTest(mock1.getId());
        assertTrue(startResp.isSuccess());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) startResp.getData().get("questions");
        assertEquals(2, questions.size());

        // Anti-leakage verification: neither question nor options should contain isCorrect or explanation
        for (Map<String, Object> q : questions) {
            assertNull(q.get("explanation"), "Explanation must NOT be leaked during live test!");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> options = (List<Map<String, Object>>) q.get("options");
            if (options != null) {
                for (Map<String, Object> opt : options) {
                    assertNull(opt.get("isCorrect"), "isCorrect must NOT be leaked before submission!");
                }
            }
        }

        // Remaining seconds check: window ends in ~35 mins, duration is 45 mins -> remaining seconds <= 35*60
        long remaining = (Long) startResp.getData().get("remainingSeconds");
        assertTrue(remaining > 0 && remaining <= 35 * 60 + 5);

        // 2. Autosave MCQ Answer (Correct option A)
        Map<String, Object> ansPayload = new HashMap<>();
        ansPayload.put("questionId", qMcq.getId());
        ansPayload.put("selectedOptionId", optA.getId().toString());

        var saveResp = competitionController.saveMockAnswer(mock1.getId(), ansPayload);
        assertTrue(saveResp.isSuccess());

        // 3. Submit Attempt (without voice answer -> skipped voice, auto-evaluated MCQ)
        var submitResp = competitionController.submitMockTest(mock1.getId());
        assertTrue(submitResp.isSuccess());
        assertEquals("COMPLETED", submitResp.getData().get("status"));
        assertEquals(5, ((Number) submitResp.getData().get("mcqMarks")).intValue());

        // 4. View Results: Now explanation is revealed and answers show isCorrect
        var resultsResp = competitionController.getMockResults(mock1.getId());
        assertTrue(resultsResp.isSuccess());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> reviewQs = (List<Map<String, Object>>) resultsResp.getData().get("questions");
        Map<String, Object> mcqReview = reviewQs.get(0);
        assertNotNull(mcqReview.get("explanation"));
        assertEquals("'Ephemeral' means lasting for a very short time; synonym is 'Transient'.", mcqReview.get("explanation"));
    }

    @Test
    @DisplayName("Voice Question in Mock Test: Submitting with uploaded voice answer sets EVALUATION_PENDING")
    void testVoiceAnswerEvaluationPendingInMockTest() {
        authenticateAs(testStudent);

        // 1. Start Mock 1
        competitionController.startMockTest(mock1.getId());

        // 2. Autosave MCQ Answer
        Map<String, Object> mcqPayload = new HashMap<>();
        mcqPayload.put("questionId", qMcq.getId());
        mcqPayload.put("selectedOptionId", optA.getId().toString());
        competitionController.saveMockAnswer(mock1.getId(), mcqPayload);

        // 3. Autosave Voice Answer
        Map<String, Object> voicePayload = new HashMap<>();
        voicePayload.put("questionId", qVoice.getId());
        voicePayload.put("voiceFileId", sampleAudio.getId());
        voicePayload.put("voiceDurationSec", 45);
        var voiceResp = competitionController.saveMockAnswer(mock1.getId(), voicePayload);
        assertTrue(voiceResp.isSuccess());

        // 4. Submit Mock Test
        var submitResp = competitionController.submitMockTest(mock1.getId());
        assertTrue(submitResp.isSuccess());
        assertEquals("EVALUATION_PENDING", submitResp.getData().get("status"));
        assertTrue((Boolean) submitResp.getData().get("hasVoiceQuestions"));

        // 5. Results view shows voice question is Pending Trainer evaluation
        var resultsResp = competitionController.getMockResults(mock1.getId());
        assertTrue(resultsResp.isSuccess());
        @SuppressWarnings("unchecked")
        Map<String, Object> attemptSummary = (Map<String, Object>) resultsResp.getData().get("attempt");
        assertNotNull(attemptSummary);
        assertEquals("EVALUATION_PENDING", attemptSummary.get("status"));
        assertEquals(1, attemptSummary.get("voiceCount"));
        assertEquals(0, attemptSummary.get("voiceEvaluatedCount"));
    }
}
