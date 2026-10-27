package com.zoroacademy;

import com.zoroacademy.entity.*;
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

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class CompetitionTasksXTest {

    @Autowired
    private CompetitionService competitionService;

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

    private Competition comp;
    private User studentUser;
    private User adminUser;
    private User trainerUser;
    private CompetitionRegistration reg;
    private CompetitionSet setA;
    private CompetitionAssessment slot5;

    @BeforeEach
    void setUp() {
        // Create test admin
        adminUser = new User();
        adminUser.setId("usr_admin_test_x");
        adminUser.setEmail("admin_test_x@example.com");
        adminUser.setName("Admin X");
        adminUser.setRole("ADMIN");
        adminUser.setPassword("password");
        userRepository.save(adminUser);

        // Create test trainer
        trainerUser = new User();
        trainerUser.setId("usr_trainer_test_x");
        trainerUser.setEmail("trainer_test_x@example.com");
        trainerUser.setName("Trainer X");
        trainerUser.setRole("TRAINER");
        trainerUser.setPassword("password");
        userRepository.save(trainerUser);

        // Create test student
        studentUser = new User();
        studentUser.setId("usr_student_test_x");
        studentUser.setEmail("student_test_x@example.com");
        studentUser.setName("Student X");
        studentUser.setRole("STUDENT");
        studentUser.setPassword("password");
        userRepository.save(studentUser);

        // Create competition
        comp = new Competition();
        comp.setId("comp_test_x");
        comp.setTitle("Championship X");
        comp.setStatus("ACTIVE");
        comp.setRegistrationFee(BigDecimal.valueOf(100));
        competitionRepository.save(comp);

        // Create set A assigned to trainer X
        setA = new CompetitionSet();
        setA.setId("set_test_x_a");
        setA.setCompetitionId(comp.getId());
        setA.setCode("A");
        setA.setTrainerId(trainerUser.getId());
        setRepository.save(setA);

        // Register student to competition
        reg = new CompetitionRegistration();
        reg.setId("reg_test_x");
        reg.setCompetition(comp);
        reg.setStudentId(studentUser.getId());
        reg.setStudentName("Student X");
        reg.setStudentEmail(studentUser.getEmail());
        reg.setStudentPhone("9876543210");
        reg.setPaymentStatus("PAID");
        registrationRepository.save(reg);

        // Map student to set A
        CompetitionSetMember mem = new CompetitionSetMember();
        mem.setId("mem_test_x");
        mem.setCompetitionId(comp.getId());
        mem.setSetId(setA.getId());
        mem.setRegistrationId(reg.getId());
        setMemberRepository.save(mem);

        // Slot 5 Test Series (SequenceNo = 5)
        slot5 = new CompetitionAssessment();
        slot5.setId("asmt_test_x_slot5");
        slot5.setCompetitionId(comp.getId());
        slot5.setType("TEST_SERIES");
        slot5.setSequenceNo(5);
        slot5.setTitle("Test Series Slot 5");
        slot5.setStatus("DRAFT");
        slot5.setDurationMinutes(20);
        slot5.setTotalMarks(10);
        assessmentRepository.save(slot5);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (answerRepository != null && slot5 != null) {
            List<AssessmentAttempt> atts = attemptRepository.findByAssessmentId(slot5.getId());
            for (AssessmentAttempt a : atts) {
                answerRepository.deleteAll(answerRepository.findByAttemptId(a.getId()));
            }
            attemptRepository.deleteAll(atts);
        }
        if (questionRepository != null && slot5 != null) {
            List<AssessmentQuestion> qs = questionRepository.findByAssessmentIdOrderBySortOrderAsc(slot5.getId());
            for (AssessmentQuestion q : qs) {
                questionOptionRepository.deleteAll(questionOptionRepository.findByQuestionIdOrderBySortOrderAsc(q.getId()));
            }
            questionRepository.deleteAll(qs);
        }
        if (slot5 != null) assessmentRepository.deleteById(slot5.getId());
        if (setMemberRepository != null) {
            setMemberRepository.findByRegistrationId("reg_test_x").ifPresent(m -> setMemberRepository.delete(m));
        }
        if (setRepository != null) setRepository.deleteById("set_test_x_a");
        if (registrationRepository != null) registrationRepository.deleteById("reg_test_x");
        if (competitionRepository != null) competitionRepository.deleteById("comp_test_x");
        if (userRepository != null) {
            userRepository.deleteById("usr_student_test_x");
            userRepository.deleteById("usr_trainer_test_x");
            userRepository.deleteById("usr_admin_test_x");
        }
    }

    private void authAs(User u) {
        UserPrincipal principal = new UserPrincipal(
                u.getId(),
                u.getEmail(),
                u.getName(),
                u.getRole(),
                "test",
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + u.getRole()))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @Test
    @DisplayName("Task X5: Admin can author multi-format (IMAGE, TEXT, VOICE) questions in Slot 5")
    void testSlot5MultiFormatQuestionAuthoring() {
        authAs(adminUser);

        // 1. Create IMAGE prompt + TEXT answer question in Slot 5
        Map<String, Object> q1 = new HashMap<>();
        q1.put("questionFormat", "IMAGE");
        q1.put("answerFormat", "TEXT");
        q1.put("questionText", "Describe the diagram shown in the image");
        q1.put("mediaRef", "img_uuid_123");
        q1.put("marks", 5);
        q1.put("sortOrder", 1);

        Map<String, Object> res1 = competitionService.saveQuestion(slot5.getId(), q1);
        assertNotNull(res1);
        assertEquals("IMAGE", res1.get("questionFormat"));
        assertEquals("TEXT", res1.get("answerFormat"));

        // 2. Create AUDIO prompt + VOICE answer question in Slot 5
        Map<String, Object> q2 = new HashMap<>();
        q2.put("questionFormat", "AUDIO");
        q2.put("answerFormat", "VOICE");
        q2.put("questionText", "Listen to audio and record response");
        q2.put("mediaRef", "aud_uuid_456");
        q2.put("marks", 5);
        q2.put("sortOrder", 2);

        Map<String, Object> res2 = competitionService.saveQuestion(slot5.getId(), q2);
        assertNotNull(res2);
        assertEquals("AUDIO", res2.get("questionFormat"));
        assertEquals("VOICE", res2.get("answerFormat"));
    }

    @Test
    @DisplayName("Task X6: Student answers TEXT question; result is classified as MANUAL_PENDING")
    void testTextAnswerSavingAndEvaluationClassification() {
        authAs(adminUser);

        // Add 1 TEXT answer question
        Map<String, Object> qPayload = new HashMap<>();
        qPayload.put("questionFormat", "TEXT");
        qPayload.put("answerFormat", "TEXT");
        qPayload.put("questionText", "Write an essay about English phonics in 100 words.");
        qPayload.put("marks", 10);
        qPayload.put("sortOrder", 1);
        Map<String, Object> savedQ = competitionService.saveQuestion(slot5.getId(), qPayload);
        String qId = (String) savedQ.get("id");

        slot5.setStatus("PUBLISHED");
        assessmentRepository.save(slot5);

        // Student starts attempt
        authAs(studentUser);
        Map<String, Object> attemptData = competitionService.startOrResumeTestAttempt(slot5.getId(), studentUser);
        assertNotNull(attemptData);
        // Task X3: assignedSet is NOT returned to student
        assertNull(attemptData.get("assignedSet"), "assignedSet must be hidden from candidates");

        // Student saves text answer
        Map<String, Object> ansPayload = new HashMap<>();
        ansPayload.put("questionId", qId);
        ansPayload.put("textAnswer", "Phonics is a method of teaching reading and pronunciation by correlating sounds with letters.");
        Map<String, Object> saveRes = competitionService.saveAttemptAnswer(slot5.getId(), ansPayload, studentUser);
        assertTrue((Boolean) saveRes.get("success"));

        // Submit attempt
        Map<String, Object> submitRes = competitionService.submitTestAttempt(slot5.getId(), studentUser);
        assertNotNull(submitRes);

        // Check evaluation mode: because 1 text answer was submitted, mode MUST be MANUAL_PENDING
        AssessmentAttempt attempt = attemptRepository.findTopByAssessmentIdAndRegistrationIdOrderByPublishVersionDesc(slot5.getId(), reg.getId()).orElseThrow();
        assertEquals("MANUAL_PENDING", attempt.getEvaluationMode());
        assertEquals("EVALUATION_PENDING", attempt.getStatus());

        // Check candidate results API: Task X4 - trainer details are NOT returned
        Map<String, Object> results = competitionService.getAttemptResults(slot5.getId(), studentUser);
        assertNotNull(results);
        assertNull(results.get("trainerName"));
        assertNull(results.get("evaluatorName"));
    }

    @Test
    @DisplayName("Task X3 & X4: getStudentPortalContext does not return set or trainer to student")
    void testStudentPortalHidesSetAndTrainer() {
        authAs(studentUser);
        Map<String, Object> details = competitionService.getStudentPortalContext(comp.getId(), studentUser);
        assertNotNull(details);
        assertNull(details.get("set"), "Candidate portal context must not contain set or trainer info");
    }
}
