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
public class CompetitionFinalAssessmentEngineTest {

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
    private AssessmentSetQuestionRepository setQuestionRepository;

    @Autowired
    private AssessmentSetOptionRepository setOptionRepository;

    @Autowired
    private CompetitionSetRepository setRepository;

    @Autowired
    private CompetitionSetMemberRepository setMemberRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private AttemptAnswerRepository answerRepository;

    @Autowired
    private StoredFileRepository storedFileRepository;

    @Autowired
    private UserRepository userRepository;

    private Competition testComp;
    private User testStudentA;
    private User testStudentB;
    private User testAdmin;
    private CompetitionRegistration testRegA;
    private CompetitionRegistration testRegB;
    private CompetitionSet setA;
    private CompetitionSet setB;
    private CompetitionAssessment finalAsmt;
    private AssessmentQuestion q1;
    private AssessmentQuestion q2;
    private QuestionOption opt1A;
    private QuestionOption opt1B;
    private QuestionOption opt2A;
    private QuestionOption opt2B;
    private StoredFile sampleAudio;

    @BeforeEach
    void setUp() {
        String uid = UUID.randomUUID().toString().substring(0, 8);
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        testComp = new Competition();
        testComp.setId("comp_final_" + uid);
        testComp.setTitle("National English Championship Final " + uid);
        competitionRepository.save(testComp);

        testStudentA = new User();
        testStudentA.setId("usr_stu_a_" + uid);
        testStudentA.setName("Finalist Student A " + uid);
        testStudentA.setEmail("student_fa_" + uid + "@example.com");
        testStudentA.setPassword("password123!");
        testStudentA.setRole("STUDENT");
        userRepository.save(testStudentA);

        testStudentB = new User();
        testStudentB.setId("usr_stu_b_" + uid);
        testStudentB.setName("Finalist Student B " + uid);
        testStudentB.setEmail("student_fb_" + uid + "@example.com");
        testStudentB.setPassword("password123!");
        testStudentB.setRole("STUDENT");
        userRepository.save(testStudentB);

        testAdmin = new User();
        testAdmin.setId("usr_adm_" + uid);
        testAdmin.setName("Admin Final " + uid);
        testAdmin.setEmail("admin_final_" + uid + "@example.com");
        testAdmin.setPassword("password123!");
        testAdmin.setRole("ADMIN");
        userRepository.save(testAdmin);

        testRegA = new CompetitionRegistration();
        testRegA.setId("reg_fa_" + uid);
        testRegA.setCompetition(testComp);
        testRegA.setStudentId(testStudentA.getId());
        testRegA.setStudentEmail(testStudentA.getEmail());
        testRegA.setStudentName(testStudentA.getName());
        testRegA.setPaymentStatus("PAID");
        registrationRepository.save(testRegA);

        testRegB = new CompetitionRegistration();
        testRegB.setId("reg_fb_" + uid);
        testRegB.setCompetition(testComp);
        testRegB.setStudentId(testStudentB.getId());
        testRegB.setStudentEmail(testStudentB.getEmail());
        testRegB.setStudentName(testStudentB.getName());
        testRegB.setPaymentStatus("PAID");
        registrationRepository.save(testRegB);

        // Sets A and B
        setA = new CompetitionSet();
        setA.setId("set_a_" + uid);
        setA.setCompetitionId(testComp.getId());
        setA.setCode("A");
        setRepository.save(setA);

        setB = new CompetitionSet();
        setB.setId("set_b_" + uid);
        setB.setCompetitionId(testComp.getId());
        setB.setCode("B");
        setRepository.save(setB);

        CompetitionSetMember memA = new CompetitionSetMember();
        memA.setId("csm_a_" + uid);
        memA.setCompetitionId(testComp.getId());
        memA.setSetId(setA.getId());
        memA.setRegistrationId(testRegA.getId());
        setMemberRepository.save(memA);

        CompetitionSetMember memB = new CompetitionSetMember();
        memB.setId("csm_b_" + uid);
        memB.setCompetitionId(testComp.getId());
        memB.setSetId(setB.getId());
        memB.setRegistrationId(testRegB.getId());
        setMemberRepository.save(memB);

        // Final Assessment (LIVE: window open now)
        finalAsmt = new CompetitionAssessment();
        finalAsmt.setId("asmt_" + testComp.getId() + "_final");
        finalAsmt.setCompetitionId(testComp.getId());
        finalAsmt.setType("FINAL");
        finalAsmt.setSequenceNo(1);
        finalAsmt.setTitle("Grand Finale Championship Paper");
        finalAsmt.setStatus("PUBLISHED");
        finalAsmt.setDurationMinutes(90);
        finalAsmt.setTotalMarks(100);
        finalAsmt.setStartAt(now.minusMinutes(10));
        finalAsmt.setEndAt(now.plusMinutes(80));
        assessmentRepository.save(finalAsmt);

        // Seed 2 Questions
        q1 = new AssessmentQuestion();
        q1.setId("aq_f1_" + uid);
        q1.setAssessmentId(finalAsmt.getId());
        q1.setQuestionFormat("MCQ");
        q1.setAnswerFormat("MCQ_OPTIONS");
        q1.setQuestionText("Identify the sentence with an elliptical clause:");
        q1.setMarks(10);
        q1.setSortOrder(0);
        q1.setExplanation("An elliptical clause leaves out words that are understood from context.");
        questionRepository.save(q1);

        opt1A = new QuestionOption();
        opt1A.setId(UUID.randomUUID());
        opt1A.setQuestionId(q1.getId());
        opt1A.setText("Though tired, she kept running.");
        opt1A.setIsCorrect(true);
        opt1A.setSortOrder(0);
        opt1A = questionOptionRepository.save(opt1A);

        opt1B = new QuestionOption();
        opt1B.setId(UUID.randomUUID());
        opt1B.setQuestionId(q1.getId());
        opt1B.setText("She was tired so she stopped.");
        opt1B.setIsCorrect(false);
        opt1B.setSortOrder(1);
        opt1B = questionOptionRepository.save(opt1B);

        q2 = new AssessmentQuestion();
        q2.setId("aq_f2_" + uid);
        q2.setAssessmentId(finalAsmt.getId());
        q2.setQuestionFormat("MCQ");
        q2.setAnswerFormat("MCQ_OPTIONS");
        q2.setQuestionText("Select the antonym for 'Loquacious':");
        q2.setMarks(10);
        q2.setSortOrder(1);
        q2.setExplanation("'Loquacious' means talkative; antonym is 'Taciturn'.");
        questionRepository.save(q2);

        opt2A = new QuestionOption();
        opt2A.setId(UUID.randomUUID());
        opt2A.setQuestionId(q2.getId());
        opt2A.setText("Taciturn");
        opt2A.setIsCorrect(true);
        opt2A.setSortOrder(0);
        opt2A = questionOptionRepository.save(opt2A);

        opt2B = new QuestionOption();
        opt2B.setId(UUID.randomUUID());
        opt2B.setQuestionId(q2.getId());
        opt2B.setText("Garrulous");
        opt2B.setIsCorrect(false);
        opt2B.setSortOrder(1);
        opt2B = questionOptionRepository.save(opt2B);

        sampleAudio = new StoredFile(
                "sf_fa_aud_" + uid,
                "final_speech.webm",
                "audio/webm",
                12345L,
                "voice-answer",
                testStudentA.getId(),
                "final_speech.webm",
                false
        );
        storedFileRepository.save(sampleAudio);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (finalAsmt != null) {
            List<AssessmentAttempt> atts = attemptRepository.findByAssessmentId(finalAsmt.getId());
            for (AssessmentAttempt att : atts) {
                List<AttemptAnswer> answers = answerRepository.findByAttemptId(att.getId());
                answerRepository.deleteAll(answers);
                attemptRepository.delete(att);
            }
            if (setQuestionRepository != null) {
                setQuestionRepository.deleteByAssessmentId(finalAsmt.getId());
            }
            if (setOptionRepository != null) {
                setOptionRepository.deleteByAssessmentId(finalAsmt.getId());
            }
        }
        if (q1 != null) {
            questionOptionRepository.deleteAll(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q1.getId()));
            questionRepository.delete(q1);
        }
        if (q2 != null) {
            questionOptionRepository.deleteAll(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q2.getId()));
            questionRepository.delete(q2);
        }
        if (sampleAudio != null) {
            storedFileRepository.delete(sampleAudio);
        }
        if (finalAsmt != null) {
            assessmentRepository.delete(finalAsmt);
        }
        if (testRegA != null) {
            setMemberRepository.findByRegistrationId(testRegA.getId()).ifPresent(setMemberRepository::delete);
            registrationRepository.delete(testRegA);
        }
        if (testRegB != null) {
            setMemberRepository.findByRegistrationId(testRegB.getId()).ifPresent(setMemberRepository::delete);
            registrationRepository.delete(testRegB);
        }
        if (setA != null) setRepository.delete(setA);
        if (setB != null) setRepository.delete(setB);
        if (testComp != null) competitionRepository.delete(testComp);
        if (testStudentA != null) userRepository.delete(testStudentA);
        if (testStudentB != null) userRepository.delete(testStudentB);
        if (testAdmin != null) userRepository.delete(testAdmin);
    }

    private void authenticateAs(User u) {
        UserPrincipal principal = new UserPrincipal(u.getId(), u.getEmail(), u.getName(), u.getRole(), "N/A", List.of());
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Final Assessment View returns assigned Set (Set A) and live window timing")
    void testGetStudentFinalAssessmentWithAssignedSet() {
        authenticateAs(testStudentA);

        var resp = competitionController.getFinalAssessment(testComp.getId());
        assertNotNull(resp);
        assertTrue(resp.isSuccess());

        @SuppressWarnings("unchecked")
        Map<String, Object> assignedSet = (Map<String, Object>) resp.getData().get("assignedSet");
        assertNotNull(assignedSet);
        assertEquals("A", assignedSet.get("code"));

        @SuppressWarnings("unchecked")
        Map<String, Object> asmt = (Map<String, Object>) resp.getData().get("finalAssessment");
        assertNotNull(asmt);
        assertEquals("FINAL", asmt.get("type"));
        assertEquals("LIVE", asmt.get("windowStatus"));
        assertEquals("NOT_STARTED", asmt.get("attemptStatus"));
        assertEquals(90, asmt.get("durationMinutes"));
    }

    @Test
    @DisplayName("Set-specific Paper Generation: Admin generates Sets A and B, delivering permuted questions")
    void testGenerateSetPapersAndSetSpecificExecution() {
        authenticateAs(testAdmin);

        // 1. Admin generates set papers
        var genResp = competitionController.generateSets(finalAsmt.getId());
        assertTrue(genResp.isSuccess());
        assertEquals(2, genResp.getData().get("setsCount"));
        assertEquals(2, genResp.getData().get("totalQuestionsPerSet"));

        // 2. Student A starts test (assigned to Set A)
        authenticateAs(testStudentA);
        var startRespA = competitionController.startFinalAssessment(finalAsmt.getId());
        assertTrue(startRespA.isSuccess());

        @SuppressWarnings("unchecked")
        Map<String, Object> setInfoA = (Map<String, Object>) startRespA.getData().get("assignedSet");
        assertNotNull(setInfoA);
        assertEquals("A", setInfoA.get("code"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questionsA = (List<Map<String, Object>>) startRespA.getData().get("questions");
        assertEquals(2, questionsA.size());

        // Anti-leakage: no explanation, no isCorrect
        for (Map<String, Object> q : questionsA) {
            assertNull(q.get("explanation"));
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> opts = (List<Map<String, Object>>) q.get("options");
            for (Map<String, Object> opt : opts) {
                assertNull(opt.get("isCorrect"));
            }
        }
    }

    @Test
    @DisplayName("Strict Single Attempt Policy: Completed attempt prevents restarting without admin reset")
    void testStrictSingleAttemptPolicy() {
        authenticateAs(testStudentA);

        // 1. Start Final Assessment
        var startResp = competitionController.startFinalAssessment(finalAsmt.getId());
        assertTrue(startResp.isSuccess());

        // 2. Save Q1 answer
        Map<String, Object> ansPayload = new HashMap<>();
        ansPayload.put("questionId", q1.getId());
        ansPayload.put("selectedOptionId", opt1A.getId().toString());
        competitionController.saveFinalAssessmentAnswer(finalAsmt.getId(), ansPayload);

        // 3. Submit Final Assessment
        var submitResp = competitionController.submitFinalAssessment(finalAsmt.getId());
        assertTrue(submitResp.isSuccess());
        assertEquals("COMPLETED", submitResp.getData().get("status"));
        assertEquals(10, ((Number) submitResp.getData().get("mcqMarks")).intValue());

        // 4. Attempting to start again throws BadRequestException
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                competitionController.startFinalAssessment(finalAsmt.getId())
        );
        assertTrue(ex.getMessage().toLowerCase().contains("already submitted"));

        // 5. Admin resets attempt
        authenticateAs(testAdmin);
        String attemptId = (String) submitResp.getData().get("attemptId");
        var resetResp = competitionController.resetAttempt(finalAsmt.getId(), attemptId);
        assertTrue(resetResp.isSuccess());

        // 6. Student can now re-take after admin reset
        authenticateAs(testStudentA);
        var restartResp = competitionController.startFinalAssessment(finalAsmt.getId());
        assertTrue(restartResp.isSuccess());
        assertEquals("IN_PROGRESS", ((AssessmentAttempt) restartResp.getData().get("attempt")).getStatus());
    }
}
