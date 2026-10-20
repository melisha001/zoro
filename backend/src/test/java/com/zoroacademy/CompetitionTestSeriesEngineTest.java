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
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class CompetitionTestSeriesEngineTest {

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

    private Competition testComp;
    private User testStudent;
    private User testAdmin;
    private CompetitionRegistration testReg;
    private CompetitionAssessment ts1;
    private CompetitionAssessment ts31;
    private AssessmentQuestion q1;
    private QuestionOption optA;
    private QuestionOption optB;

    @BeforeEach
    void setUp() {
        String uid = UUID.randomUUID().toString().substring(0, 8);

        testComp = new Competition();
        testComp.setId("comp_ts_" + uid);
        testComp.setTitle("Olympiad Test Series " + uid);
        competitionRepository.save(testComp);

        testStudent = new User();
        testStudent.setId("usr_stu_" + uid);
        testStudent.setName("Test Student " + uid);
        testStudent.setEmail("student_ts_" + uid + "@example.com");
        testStudent.setPassword("password123!");
        testStudent.setRole("STUDENT");
        userRepository.save(testStudent);

        testAdmin = new User();
        testAdmin.setId("usr_adm_" + uid);
        testAdmin.setName("Test Admin " + uid);
        testAdmin.setEmail("admin_ts_" + uid + "@example.com");
        testAdmin.setPassword("password123!");
        testAdmin.setRole("ADMIN");
        userRepository.save(testAdmin);


        testReg = new CompetitionRegistration();
        testReg.setId("reg_ts_" + uid);
        testReg.setCompetition(testComp);
        testReg.setStudentId(testStudent.getId());
        testReg.setStudentEmail(testStudent.getEmail());
        testReg.setStudentName(testStudent.getName());
        testReg.setPaymentStatus("PAID");
        registrationRepository.save(testReg);


        // Create 35 Test Series slots
        for (int i = 1; i <= 35; i++) {
            CompetitionAssessment a = new CompetitionAssessment();
            a.setId("asmt_" + testComp.getId() + "_ts_" + i);
            a.setCompetitionId(testComp.getId());
            a.setType("TEST_SERIES");
            a.setSequenceNo(i);
            a.setTitle("Test Series " + i);
            a.setStatus(i == 1 || i == 31 ? "PUBLISHED" : "DRAFT");
            a.setDurationMinutes(20);
            a.setTotalMarks(20);
            assessmentRepository.save(a);
            if (i == 1) ts1 = a;
            if (i == 31) ts31 = a;
        }

        // Add 1 MCQ Question to Test Series 1
        q1 = new AssessmentQuestion();
        q1.setId("aq_" + UUID.randomUUID());
        q1.setAssessmentId(ts1.getId());
        q1.setQuestionFormat("MCQ");
        q1.setAnswerFormat("MCQ_OPTIONS");
        q1.setQuestionText("What is 10 + 10?");
        q1.setMarks(5);
        q1.setSortOrder(0);
        q1.setExplanation("Basic arithmetic: 10 + 10 = 20.");
        questionRepository.save(q1);

        optA = new QuestionOption();
        optA.setId(UUID.randomUUID());
        optA.setQuestionId(q1.getId());
        optA.setText("20");
        optA.setIsCorrect(true);
        optA.setSortOrder(0);
        optA = questionOptionRepository.save(optA);

        optB = new QuestionOption();
        optB.setId(UUID.randomUUID());
        optB.setQuestionId(q1.getId());
        optB.setText("30");
        optB.setIsCorrect(false);
        optB.setSortOrder(1);
        optB = questionOptionRepository.save(optB);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (ts1 != null) {
            List<AssessmentAttempt> atts = attemptRepository.findByAssessmentId(ts1.getId());
            for (AssessmentAttempt att : atts) {
                List<AttemptAnswer> answers = answerRepository.findByAttemptId(att.getId());
                answerRepository.deleteAll(answers);
                attemptRepository.delete(att);
            }
        }
        if (ts31 != null) {
            List<AssessmentAttempt> atts = attemptRepository.findByAssessmentId(ts31.getId());
            for (AssessmentAttempt att : atts) {
                List<AttemptAnswer> answers = answerRepository.findByAttemptId(att.getId());
                answerRepository.deleteAll(answers);
                attemptRepository.delete(att);
            }
        }
        if (q1 != null) {
            List<QuestionOption> opts = questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q1.getId());
            questionOptionRepository.deleteAll(opts);
            questionRepository.delete(q1);
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
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Student can view all 35 test slots, draft shows UNPUBLISHED, published shows NOT_STARTED")
    void testGetStudentTestSeries() {
        authenticateAs(testStudent);
        Map<String, Object> res = competitionController.getTestSeries(testComp.getId()).getData();
        assertNotNull(res);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> tests = (List<Map<String, Object>>) res.get("testSeries");
        assertEquals(35, tests.size());

        Map<String, Object> first = tests.get(0);
        assertEquals(1, first.get("sequenceNo"));
        assertEquals("NOT_STARTED", first.get("attemptStatus"));

        Map<String, Object> second = tests.get(1);
        assertEquals(2, second.get("sequenceNo"));
        assertEquals("UNPUBLISHED", second.get("attemptStatus")); // DRAFT shows UNPUBLISHED
    }

    @Test
    @DisplayName("Starting test creates attempt and strictly strips isCorrect and explanation")
    void testStartTestAttemptNoAnswerLeakage() {
        authenticateAs(testStudent);
        Map<String, Object> res = competitionController.startTestSeries(ts1.getId()).getData();
        assertNotNull(res);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) res.get("questions");
        assertEquals(1, questions.size());

        Map<String, Object> q = questions.get(0);
        assertEquals("What is 10 + 10?", q.get("questionText"));
        assertNull(q.get("explanation"), "Explanation must NOT be leaked during in-progress attempt");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> options = (List<Map<String, Object>>) q.get("options");
        assertEquals(2, options.size());
        for (Map<String, Object> opt : options) {
            assertNull(opt.get("isCorrect"), "Option isCorrect must NOT be leaked to candidate");
        }
    }

    @Test
    @DisplayName("Autosave and instant submission for Tests 1-30 MCQ auto-evaluates correctly")
    void testSubmitMcqTestInstantAutoEvaluation() {
        authenticateAs(testStudent);
        competitionController.startTestSeries(ts1.getId());

        // Autosave correct answer
        Map<String, Object> ansPayload = new HashMap<>();
        ansPayload.put("questionId", q1.getId());
        ansPayload.put("selectedOptionId", optA.getId().toString());
        Map<String, Object> saveRes = competitionController.saveAnswer(ts1.getId(), ansPayload).getData();
        assertTrue((Boolean) saveRes.get("success"));

        // Submit
        Map<String, Object> submitRes = competitionController.submitTestSeries(ts1.getId()).getData();
        assertEquals("COMPLETED", submitRes.get("status"));
        assertEquals(0, new BigDecimal("5").compareTo(new BigDecimal(submitRes.get("mcqMarks").toString())));
        assertEquals(0, new BigDecimal("5").compareTo(new BigDecimal(submitRes.get("totalMarks").toString())));

        // Check review results now reveal isCorrect and explanations
        Map<String, Object> reviewRes = competitionController.getTestResults(ts1.getId()).getData();
        assertNotNull(reviewRes);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> revQuestions = (List<Map<String, Object>>) reviewRes.get("questions");
        Map<String, Object> revQ = revQuestions.get(0);
        assertEquals("Basic arithmetic: 10 + 10 = 20.", revQ.get("explanation"));

        @SuppressWarnings("unchecked")
        Map<String, Object> studentAns = (Map<String, Object>) revQ.get("studentAnswer");
        assertTrue((Boolean) studentAns.get("isCorrect"));
        assertEquals(0, new BigDecimal("5").compareTo(new BigDecimal(studentAns.get("marksAwarded").toString())));
    }

    @Test
    @DisplayName("Admin can reset student attempt, allowing re-take")
    void testAdminResetAttempt() {
        authenticateAs(testStudent);
        competitionController.startTestSeries(ts1.getId());
        Map<String, Object> submitRes = competitionController.submitTestSeries(ts1.getId()).getData();
        String attemptId = (String) submitRes.get("attemptId");

        // Attempting to start again throws BadRequest
        assertThrows(BadRequestException.class, () -> competitionController.startTestSeries(ts1.getId()));

        // Admin resets attempt
        authenticateAs(testAdmin);
        Boolean resetRes = competitionController.resetAttempt(ts1.getId(), attemptId).getData();
        assertTrue(resetRes);

        // Student can now start fresh attempt
        authenticateAs(testStudent);
        Map<String, Object> freshRes = competitionController.startTestSeries(ts1.getId()).getData();
        assertNotNull(freshRes.get("attempt"));
    }
}
