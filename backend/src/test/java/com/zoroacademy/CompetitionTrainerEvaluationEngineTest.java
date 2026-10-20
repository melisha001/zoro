package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
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
public class CompetitionTrainerEvaluationEngineTest {

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
    private User trainerA;
    private User trainerB;
    private User testStudentA;
    private User testStudentB;
    private CompetitionRegistration testRegA;
    private CompetitionRegistration testRegB;
    private CompetitionSet setA;
    private CompetitionSet setB;
    private CompetitionAssessment finalAsmt;
    private AssessmentQuestion qMcq;
    private AssessmentQuestion qVoice1;
    private AssessmentQuestion qVoice2;
    private QuestionOption optCorrect;
    private QuestionOption optWrong;
    private StoredFile audioFileA;
    private StoredFile audioFileB;

    @BeforeEach
    void setUp() {
        String uid = UUID.randomUUID().toString().substring(0, 8);
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        testComp = new Competition();
        testComp.setId("comp_eval_" + uid);
        testComp.setTitle("National English Championship Eval " + uid);
        competitionRepository.save(testComp);

        trainerA = new User();
        trainerA.setId("usr_trn_a_" + uid);
        trainerA.setName("Trainer Alice");
        trainerA.setEmail("trainer.alice." + uid + "@example.com");
        trainerA.setPassword("password123!");
        trainerA.setRole("TRAINER");
        userRepository.save(trainerA);

        trainerB = new User();
        trainerB.setId("usr_trn_b_" + uid);
        trainerB.setName("Trainer Bob");
        trainerB.setEmail("trainer.bob." + uid + "@example.com");
        trainerB.setPassword("password123!");
        trainerB.setRole("TRAINER");
        userRepository.save(trainerB);

        testStudentA = new User();
        testStudentA.setId("usr_stu_a_" + uid);
        testStudentA.setName("Student Alice Team");
        testStudentA.setEmail("student.a." + uid + "@example.com");
        testStudentA.setPassword("password123!");
        testStudentA.setRole("STUDENT");
        userRepository.save(testStudentA);

        testStudentB = new User();
        testStudentB.setId("usr_stu_b_" + uid);
        testStudentB.setName("Student Bob Team");
        testStudentB.setEmail("student.b." + uid + "@example.com");
        testStudentB.setPassword("password123!");
        testStudentB.setRole("STUDENT");
        userRepository.save(testStudentB);

        testRegA = new CompetitionRegistration();
        testRegA.setId("reg_a_" + uid);
        testRegA.setCompetition(testComp);
        testRegA.setStudentId(testStudentA.getId());
        testRegA.setStudentName("Student Alice Team");
        testRegA.setStudentEmail(testStudentA.getEmail());
        testRegA.setPaymentStatus("Paid");
        testRegA.setScore(BigDecimal.ZERO);
        registrationRepository.save(testRegA);

        testRegB = new CompetitionRegistration();
        testRegB.setId("reg_b_" + uid);
        testRegB.setCompetition(testComp);
        testRegB.setStudentId(testStudentB.getId());
        testRegB.setStudentName("Student Bob Team");
        testRegB.setStudentEmail(testStudentB.getEmail());
        testRegB.setPaymentStatus("Paid");
        testRegB.setScore(BigDecimal.ZERO);
        registrationRepository.save(testRegB);

        setA = new CompetitionSet("set_a_" + uid, testComp.getId(), "A");
        setA.setTrainerId(trainerA.getId());
        setRepository.save(setA);

        setB = new CompetitionSet("set_b_" + uid, testComp.getId(), "B");
        setB.setTrainerId(trainerB.getId());
        setRepository.save(setB);

        setMemberRepository.save(new CompetitionSetMember("mem_a_" + uid, testComp.getId(), testRegA.getId(), setA.getId()));
        setMemberRepository.save(new CompetitionSetMember("mem_b_" + uid, testComp.getId(), testRegB.getId(), setB.getId()));

        finalAsmt = new CompetitionAssessment();
        finalAsmt.setId("asmt_final_" + uid);
        finalAsmt.setCompetitionId(testComp.getId());
        finalAsmt.setType("FINAL");
        finalAsmt.setTitle("Final Championship Examination");
        finalAsmt.setSequenceNo(40);
        finalAsmt.setStatus("LIVE");
        finalAsmt.setDurationMinutes(60);
        finalAsmt.setTotalMarks(30);
        finalAsmt.setStartAt(now.minusHours(1));
        finalAsmt.setEndAt(now.plusHours(2));
        assessmentRepository.save(finalAsmt);

        qMcq = new AssessmentQuestion();
        qMcq.setId("q_mcq_" + uid);
        qMcq.setAssessmentId(finalAsmt.getId());
        qMcq.setSortOrder(1);
        qMcq.setQuestionFormat("MCQ_TEXT");
        qMcq.setQuestionText("Identify the correct synonym for Eloquent.");
        qMcq.setAnswerFormat("MCQ_OPTIONS");
        qMcq.setMarks(10);
        qMcq.setExplanation("Articulate expresses ideas clearly.");
        questionRepository.save(qMcq);

        optCorrect = new QuestionOption();
        optCorrect.setId(UUID.randomUUID());
        optCorrect.setQuestionId(qMcq.getId());
        optCorrect.setText("Articulate");
        optCorrect.setIsCorrect(true);
        optCorrect.setSortOrder(1);
        questionOptionRepository.save(optCorrect);

        optWrong = new QuestionOption();
        optWrong.setId(UUID.randomUUID());
        optWrong.setQuestionId(qMcq.getId());
        optWrong.setText("Hesitant");
        optWrong.setIsCorrect(false);
        optWrong.setSortOrder(2);
        questionOptionRepository.save(optWrong);

        qVoice1 = new AssessmentQuestion();
        qVoice1.setId("q_voice1_" + uid);
        qVoice1.setAssessmentId(finalAsmt.getId());
        qVoice1.setSortOrder(2);
        qVoice1.setQuestionFormat("VOICE");
        qVoice1.setQuestionText("Read the speech aloud with proper cadence.");
        qVoice1.setAnswerFormat("VOICE");
        qVoice1.setMarks(10);
        qVoice1.setGuidanceText("Maintain clear pronunciation and steady rhythm.");
        questionRepository.save(qVoice1);

        qVoice2 = new AssessmentQuestion();
        qVoice2.setId("q_voice2_" + uid);
        qVoice2.setAssessmentId(finalAsmt.getId());
        qVoice2.setSortOrder(3);
        qVoice2.setQuestionFormat("VOICE");
        qVoice2.setQuestionText("Deliver an impromptu summary of the passage.");
        qVoice2.setAnswerFormat("VOICE");
        qVoice2.setMarks(10);
        qVoice2.setGuidanceText("Structure your summary logically within 60 seconds.");
        questionRepository.save(qVoice2);

        audioFileA = new StoredFile(
                "file_audio_a_" + uid,
                "alice_speech.wav",
                "audio/wav",
                102400L,
                "voice-response",
                testStudentA.getId(),
                "competitions/audio/alice_" + uid + ".wav",
                false,
                "sha256_mock_a",
                1
        );
        storedFileRepository.save(audioFileA);

        audioFileB = new StoredFile(
                "file_audio_b_" + uid,
                "bob_speech.wav",
                "audio/wav",
                102400L,
                "voice-response",
                testStudentB.getId(),
                "competitions/audio/bob_" + uid + ".wav",
                false,
                "sha256_mock_b",
                1
        );
        storedFileRepository.save(audioFileB);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        try {
            if (answerRepository != null) answerRepository.deleteAll();
            if (attemptRepository != null) attemptRepository.deleteAll();
            if (setQuestionRepository != null) setQuestionRepository.deleteAll();
            if (setOptionRepository != null) setOptionRepository.deleteAll();
            if (setMemberRepository != null) setMemberRepository.deleteAll();
            if (setRepository != null) setRepository.deleteAll();
            if (questionOptionRepository != null) questionOptionRepository.deleteAll();
            if (questionRepository != null) questionRepository.deleteAll();
            if (assessmentRepository != null) assessmentRepository.deleteAll();
            if (registrationRepository != null) registrationRepository.deleteAll();
            if (storedFileRepository != null) storedFileRepository.deleteAll();
            if (testComp != null && competitionRepository != null) competitionRepository.delete(testComp);
            if (userRepository != null) {
                if (testStudentA != null) userRepository.delete(testStudentA);
                if (testStudentB != null) userRepository.delete(testStudentB);
                if (trainerA != null) userRepository.delete(trainerA);
                if (trainerB != null) userRepository.delete(trainerB);
            }
        } catch (Exception ignored) {}
    }

    private void authenticateUser(User user) {
        UserPrincipal principal = new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                "active",
                Collections.emptyList()
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Trainer set isolation: Trainer A sees only Set A submissions and is forbidden from Set B attempts")
    void testTrainerSetIsolation() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        // Setup Attempt A for Student A (Set A)
        AssessmentAttempt attA = new AssessmentAttempt();
        attA.setId("att_a_" + UUID.randomUUID());
        attA.setAssessmentId(finalAsmt.getId());
        attA.setRegistrationId(testRegA.getId());
        attA.setSetId(setA.getId());
        attA.setStatus("EVALUATION_PENDING");
        attA.setStartedAt(now.minusMinutes(30));
        attA.setSubmittedAt(now.minusMinutes(5));
        attA.setMcqMarks(BigDecimal.valueOf(10));
        attA.setVoiceMarks(BigDecimal.ZERO);
        attA.setTotalMarks(BigDecimal.valueOf(10));
        attemptRepository.save(attA);

        AttemptAnswer ansA1 = new AttemptAnswer();
        ansA1.setId("ans_a1_" + UUID.randomUUID());
        ansA1.setAttemptId(attA.getId());
        ansA1.setQuestionId(qVoice1.getId());
        ansA1.setVoiceFileId(audioFileA.getId());
        ansA1.setVoiceDurationSec(45);
        ansA1.setEvaluationStatus("PENDING_TRAINER");
        ansA1.setSavedAt(now.minusMinutes(10));
        answerRepository.save(ansA1);

        // Setup Attempt B for Student B (Set B)
        AssessmentAttempt attB = new AssessmentAttempt();
        attB.setId("att_b_" + UUID.randomUUID());
        attB.setAssessmentId(finalAsmt.getId());
        attB.setRegistrationId(testRegB.getId());
        attB.setSetId(setB.getId());
        attB.setStatus("EVALUATION_PENDING");
        attB.setStartedAt(now.minusMinutes(30));
        attB.setSubmittedAt(now.minusMinutes(5));
        attB.setMcqMarks(BigDecimal.valueOf(10));
        attB.setVoiceMarks(BigDecimal.ZERO);
        attB.setTotalMarks(BigDecimal.valueOf(10));
        attemptRepository.save(attB);

        AttemptAnswer ansB1 = new AttemptAnswer();
        ansB1.setId("ans_b1_" + UUID.randomUUID());
        ansB1.setAttemptId(attB.getId());
        ansB1.setQuestionId(qVoice1.getId());
        ansB1.setVoiceFileId(audioFileB.getId());
        ansB1.setVoiceDurationSec(50);
        ansB1.setEvaluationStatus("PENDING_TRAINER");
        ansB1.setSavedAt(now.minusMinutes(10));
        answerRepository.save(ansB1);

        // Authenticate as Trainer A
        authenticateUser(trainerA);

        // 1. Trainer A gets evaluation list
        ApiResponse<List<Map<String, Object>>> evalRes = competitionController.getTrainerEvaluations(testComp.getId());
        assertNotNull(evalRes);
        assertTrue(evalRes.isSuccess());
        List<Map<String, Object>> submissions = evalRes.getData();
        assertEquals(1, submissions.size(), "Trainer A must see exactly 1 submission (from Set A)");
        assertEquals(attA.getId(), submissions.get(0).get("attemptId"));
        assertEquals("A", submissions.get(0).get("setCode"));
        assertEquals("Student Alice Team", submissions.get(0).get("studentName"));
        assertEquals("EVALUATION_PENDING", submissions.get(0).get("status"));

        // 2. Trainer A accesses Set A attempt detail -> SUCCESS
        ApiResponse<Map<String, Object>> detailRes = competitionController.getTrainerAttemptDetail(attA.getId());
        assertTrue(detailRes.isSuccess());
        assertNotNull(detailRes.getData());
        assertEquals(attA.getId(), ((Map<?, ?>) detailRes.getData().get("attempt")).get("id"));

        // 3. Trainer A attempts to access Set B attempt detail -> FORBIDDEN
        assertThrows(ForbiddenException.class, () -> {
            competitionController.getTrainerAttemptDetail(attB.getId());
        }, "Trainer A must be forbidden from viewing Set B student attempt");

        // 4. Trainer A attempts to evaluate Set B answer -> FORBIDDEN
        assertThrows(ForbiddenException.class, () -> {
            competitionController.evaluateVoiceAnswer(attB.getId(), ansB1.getId(), Map.of("marksAwarded", 8, "feedback", "Hacked"));
        }, "Trainer A must be forbidden from evaluating Set B student answer");
    }

    @Test
    @DisplayName("Evaluate voice answer: marks awarded, audio playback link verified, and score recalculated")
    void testEvaluateVoiceAnswerAndAudioPlayback() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        // Setup Attempt A with 1 MCQ (10 marks) and 1 Voice question (pending)
        AssessmentAttempt att = new AssessmentAttempt();
        att.setId("att_voice_eval_" + UUID.randomUUID());
        att.setAssessmentId(finalAsmt.getId());
        att.setRegistrationId(testRegA.getId());
        att.setSetId(setA.getId());
        att.setStatus("EVALUATION_PENDING");
        att.setStartedAt(now.minusMinutes(25));
        att.setSubmittedAt(now.minusMinutes(5));
        att.setMcqMarks(BigDecimal.valueOf(10));
        att.setVoiceMarks(BigDecimal.ZERO);
        att.setTotalMarks(BigDecimal.valueOf(10));
        attemptRepository.save(att);

        AttemptAnswer voiceAns = new AttemptAnswer();
        voiceAns.setId("ans_voice_single_" + UUID.randomUUID());
        voiceAns.setAttemptId(att.getId());
        voiceAns.setQuestionId(qVoice1.getId());
        voiceAns.setVoiceFileId(audioFileA.getId());
        voiceAns.setVoiceDurationSec(42);
        voiceAns.setEvaluationStatus("PENDING_TRAINER");
        voiceAns.setSavedAt(now.minusMinutes(10));
        answerRepository.save(voiceAns);

        // Authenticate as Trainer A
        authenticateUser(trainerA);

        // 1. Verify Attempt Detail includes audio link
        ApiResponse<Map<String, Object>> detailRes = competitionController.getTrainerAttemptDetail(att.getId());
        assertTrue(detailRes.isSuccess());
        List<?> questions = (List<?>) detailRes.getData().get("questions");
        assertNotNull(questions);

        Map<?, ?> voiceQ = (Map<?, ?>) questions.stream()
                .filter(q -> qVoice1.getId().equals(((Map<?, ?>) q).get("id")))
                .findFirst()
                .orElse(null);
        assertNotNull(voiceQ);
        Map<?, ?> studentAnswer = (Map<?, ?>) voiceQ.get("studentAnswer");
        assertNotNull(studentAnswer);
        assertNotNull(studentAnswer.get("audioUrl"), "audioUrl must be resolved for trainer playback");
        assertEquals("PENDING_TRAINER", studentAnswer.get("evaluationStatus"));

        // 2. Reject out-of-range marks (e.g. 15 when max marks is 10)
        assertThrows(BadRequestException.class, () -> {
            competitionController.evaluateVoiceAnswer(att.getId(), voiceAns.getId(), Map.of(
                    "marksAwarded", 15,
                    "feedback", "Too high"
            ));
        });

        // 3. Reject negative marks
        assertThrows(BadRequestException.class, () -> {
            competitionController.evaluateVoiceAnswer(att.getId(), voiceAns.getId(), Map.of(
                    "marksAwarded", -2,
                    "feedback", "Negative marks"
            ));
        });

        // 4. Award valid score (8.5 marks out of 10) with rich feedback
        Map<String, Object> evalPayload = new HashMap<>();
        evalPayload.put("marksAwarded", 8.5);
        evalPayload.put("feedback", "Excellent intonation and articulate diction.");

        ApiResponse<Map<String, Object>> evalResp = competitionController.evaluateVoiceAnswer(att.getId(), voiceAns.getId(), evalPayload);
        assertTrue(evalResp.isSuccess());
        Map<String, Object> evalData = evalResp.getData();

        assertEquals(8.5, ((Number) evalData.get("marksAwarded")).doubleValue(), 0.01);
        assertEquals(8.5, ((Number) evalData.get("voiceMarks")).doubleValue(), 0.01);
        // Total marks: 10 MCQ + 8.5 Voice = 18.5
        assertEquals(18.5, ((Number) evalData.get("totalMarks")).doubleValue(), 0.01);

        // Verify DB update
        AttemptAnswer updatedAns = answerRepository.findById(voiceAns.getId()).orElseThrow();
        assertEquals("EVALUATED", updatedAns.getEvaluationStatus());
        assertEquals(trainerA.getId(), updatedAns.getEvaluatedBy());
        assertEquals("Excellent intonation and articulate diction.", updatedAns.getFeedback());
        assertNotNull(updatedAns.getEvaluatedAt());
    }

    @Test
    @DisplayName("Status transition: EVALUATION_PENDING -> COMPLETED when all voice questions graded")
    void testStatusTransitionToCompletedWhenAllVoiceGraded() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        // Setup Attempt A with 2 voice questions submitted
        AssessmentAttempt att = new AssessmentAttempt();
        att.setId("att_multi_voice_" + UUID.randomUUID());
        att.setAssessmentId(finalAsmt.getId());
        att.setRegistrationId(testRegA.getId());
        att.setSetId(setA.getId());
        att.setStatus("EVALUATION_PENDING");
        att.setStartedAt(now.minusMinutes(35));
        att.setSubmittedAt(now.minusMinutes(5));
        att.setMcqMarks(BigDecimal.valueOf(10));
        att.setVoiceMarks(BigDecimal.ZERO);
        att.setTotalMarks(BigDecimal.valueOf(10));
        attemptRepository.save(att);

        AttemptAnswer vAns1 = new AttemptAnswer();
        vAns1.setId("ans_mv1_" + UUID.randomUUID());
        vAns1.setAttemptId(att.getId());
        vAns1.setQuestionId(qVoice1.getId());
        vAns1.setVoiceFileId(audioFileA.getId());
        vAns1.setVoiceDurationSec(35);
        vAns1.setEvaluationStatus("PENDING_TRAINER");
        vAns1.setSavedAt(now.minusMinutes(12));
        answerRepository.save(vAns1);

        AttemptAnswer vAns2 = new AttemptAnswer();
        vAns2.setId("ans_mv2_" + UUID.randomUUID());
        vAns2.setAttemptId(att.getId());
        vAns2.setQuestionId(qVoice2.getId());
        vAns2.setVoiceFileId(audioFileA.getId());
        vAns2.setVoiceDurationSec(45);
        vAns2.setEvaluationStatus("PENDING_TRAINER");
        vAns2.setSavedAt(now.minusMinutes(10));
        answerRepository.save(vAns2);

        authenticateUser(trainerA);

        // Grade Q1: 7 marks
        ApiResponse<Map<String, Object>> res1 = competitionController.evaluateVoiceAnswer(att.getId(), vAns1.getId(), Map.of(
                "marksAwarded", 7,
                "feedback", "Good pace and volume."
        ));
        assertTrue(res1.isSuccess());
        // Status must STILL be EVALUATION_PENDING because Q2 is not evaluated yet
        assertEquals("EVALUATION_PENDING", res1.getData().get("status"), "Attempt must remain EVALUATION_PENDING while Q2 is ungraded");
        assertEquals(7.0, ((Number) res1.getData().get("voiceMarks")).doubleValue(), 0.01);
        assertEquals(17.0, ((Number) res1.getData().get("totalMarks")).doubleValue(), 0.01);

        // Grade Q2: 9 marks
        ApiResponse<Map<String, Object>> res2 = competitionController.evaluateVoiceAnswer(att.getId(), vAns2.getId(), Map.of(
                "marksAwarded", 9,
                "feedback", "Outstanding impromptu speech summary."
        ));
        assertTrue(res2.isSuccess());
        // Status must now transition to COMPLETED
        assertEquals("COMPLETED", res2.getData().get("status"), "Attempt must transition to COMPLETED after all voice questions graded");
        assertEquals(16.0, ((Number) res2.getData().get("voiceMarks")).doubleValue(), 0.01);
        assertEquals(26.0, ((Number) res2.getData().get("totalMarks")).doubleValue(), 0.01);

        // Verify in DB
        AssessmentAttempt finalAttempt = attemptRepository.findById(att.getId()).orElseThrow();
        assertEquals("COMPLETED", finalAttempt.getStatus());
        assertEquals(new BigDecimal("16.00").stripTrailingZeros(), finalAttempt.getVoiceMarks().stripTrailingZeros());
        assertEquals(new BigDecimal("26.00").stripTrailingZeros(), finalAttempt.getTotalMarks().stripTrailingZeros());
    }
}
