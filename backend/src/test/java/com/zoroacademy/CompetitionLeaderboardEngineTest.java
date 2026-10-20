package com.zoroacademy;

import com.zoroacademy.entity.*;
import com.zoroacademy.exception.ForbiddenException;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.CompetitionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
public class CompetitionLeaderboardEngineTest {

    @Autowired
    private CompetitionService competitionService;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private CompetitionRegistrationRepository registrationRepository;

    @Autowired
    private CompetitionSetRepository setRepository;

    @Autowired
    private CompetitionSetMemberRepository setMemberRepository;

    @Autowired
    private CompetitionAssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private CompetitionLeaderboardCacheRepository leaderboardCacheRepository;

    @Autowired
    private LeaderboardEntryRepository leaderboardEntryRepository;

    private String competitionId;
    private User adminUser;
    private User student1User;
    private User student2User;
    private User student3User;

    private CompetitionRegistration reg1;
    private CompetitionRegistration reg2;
    private CompetitionRegistration reg3;

    @BeforeEach
    void setUp() {
        competitionId = "comp_lb_test_" + UUID.randomUUID().toString().substring(0, 8);

        Competition comp = new Competition();
        comp.setId(competitionId);
        comp.setTitle("National English Championship Test");
        comp.setStartDate("2026-10-20");
        comp.setEndDate("2026-10-25");
        comp.setLeaderboardStatus("NOT_PUBLISHED");
        comp.setAnswerReviewEnabled(false);
        competitionRepository.save(comp);

        // Sets
        CompetitionSet setA = new CompetitionSet("set_" + competitionId + "_A", competitionId, "A");
        CompetitionSet setB = new CompetitionSet("set_" + competitionId + "_B", competitionId, "B");
        setRepository.saveAll(Arrays.asList(setA, setB));

        // Users
        adminUser = new User();
        adminUser.setId("usr_admin_" + UUID.randomUUID());
        adminUser.setEmail("admin_lb@zoro.com");
        adminUser.setRole("ADMIN");

        student1User = new User();
        student1User.setId("usr_s1_" + UUID.randomUUID());
        student1User.setEmail("student1_lb@example.com");
        student1User.setRole("STUDENT");

        student2User = new User();
        student2User.setId("usr_s2_" + UUID.randomUUID());
        student2User.setEmail("student2_lb@example.com");
        student2User.setRole("STUDENT");

        student3User = new User();
        student3User.setId("usr_s3_" + UUID.randomUUID());
        student3User.setEmail("student3_lb@example.com");
        student3User.setRole("STUDENT");

        // Registrations
        reg1 = new CompetitionRegistration();
        reg1.setId("reg_lb_1");
        reg1.setCompetition(comp);
        reg1.setStudentId(student1User.getId());
        reg1.setStudentEmail(student1User.getEmail());
        reg1.setStudentName("Alice Champion");
        registrationRepository.save(reg1);

        reg2 = new CompetitionRegistration();
        reg2.setId("reg_lb_2");
        reg2.setCompetition(comp);
        reg2.setStudentId(student2User.getId());
        reg2.setStudentEmail(student2User.getEmail());
        reg2.setStudentName("Bob Runnerup");
        registrationRepository.save(reg2);

        reg3 = new CompetitionRegistration();
        reg3.setId("reg_lb_3");
        reg3.setCompetition(comp);
        reg3.setStudentId(student3User.getId());
        reg3.setStudentEmail(student3User.getEmail());
        reg3.setStudentName("Charlie Third");
        registrationRepository.save(reg3);

        // Set Members: Alice -> Set A, Bob -> Set A, Charlie -> Set B
        setMemberRepository.save(new CompetitionSetMember("csm_1", competitionId, reg1.getId(), setA.getId()));
        setMemberRepository.save(new CompetitionSetMember("csm_2", competitionId, reg2.getId(), setA.getId()));
        setMemberRepository.save(new CompetitionSetMember("csm_3", competitionId, reg3.getId(), setB.getId()));

        // Final Assessment
        CompetitionAssessment finalAsmt = new CompetitionAssessment();
        finalAsmt.setId("asmt_" + competitionId + "_final");
        finalAsmt.setCompetitionId(competitionId);
        finalAsmt.setType("FINAL");
        finalAsmt.setSequenceNo(1);
        finalAsmt.setTitle("Final Championship Exam");
        finalAsmt.setStatus("PUBLISHED");
        finalAsmt.setTotalMarks(100);
        assessmentRepository.save(finalAsmt);

        // Attempts
        ZoneId ist = ZoneId.of("Asia/Kolkata");
        OffsetDateTime now = OffsetDateTime.now(ist);

        // Alice: 95.5 marks
        AssessmentAttempt att1 = new AssessmentAttempt();
        att1.setId("att_lb_1");
        att1.setAssessmentId(finalAsmt.getId());
        att1.setRegistrationId(reg1.getId());
        att1.setStatus("COMPLETED");
        att1.setTotalMarks(new BigDecimal("95.50"));
        att1.setSubmittedAt(now.minusHours(2));
        attemptRepository.save(att1);

        // Bob: 88.0 marks
        AssessmentAttempt att2 = new AssessmentAttempt();
        att2.setId("att_lb_2");
        att2.setAssessmentId(finalAsmt.getId());
        att2.setRegistrationId(reg2.getId());
        att2.setStatus("COMPLETED");
        att2.setTotalMarks(new BigDecimal("88.00"));
        att2.setSubmittedAt(now.minusHours(3));
        attemptRepository.save(att2);

        // Charlie: 72.0 marks
        AssessmentAttempt att3 = new AssessmentAttempt();
        att3.setId("att_lb_3");
        att3.setAssessmentId(finalAsmt.getId());
        att3.setRegistrationId(reg3.getId());
        att3.setStatus("COMPLETED");
        att3.setTotalMarks(new BigDecimal("72.00"));
        att3.setSubmittedAt(now.minusHours(1));
        attemptRepository.save(att3);
    }

    @Test
    void testRecalculateLeaderboardRanksAndPercentiles() {
        Map<String, Object> lb = competitionService.recalculateLeaderboard(competitionId, adminUser);
        assertNotNull(lb);
        assertEquals(3, lb.get("totalParticipants"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = (List<Map<String, Object>>) lb.get("entries");
        assertEquals(3, entries.size());

        // Check Rank 1: Alice (95.50)
        Map<String, Object> r1 = entries.get(0);
        assertEquals("Alice Champion", r1.get("studentName"));
        assertEquals(1, r1.get("rank"));
        assertEquals(new BigDecimal("95.50"), r1.get("totalMarks"));
        assertEquals(new BigDecimal("100.00"), r1.get("percentile"));

        // Check Rank 2: Bob (88.00)
        Map<String, Object> r2 = entries.get(1);
        assertEquals("Bob Runnerup", r2.get("studentName"));
        assertEquals(2, r2.get("rank"));
        assertEquals(new BigDecimal("88.00"), r2.get("totalMarks"));
        assertEquals(new BigDecimal("50.00"), r2.get("percentile"));

        // Check Rank 3: Charlie (72.00)
        Map<String, Object> r3 = entries.get(2);
        assertEquals("Charlie Third", r3.get("studentName"));
        assertEquals(3, r3.get("rank"));
        assertEquals(new BigDecimal("72.00"), r3.get("totalMarks"));
        assertEquals(new BigDecimal("0.00"), r3.get("percentile"));

        // Verify Database Persistence in CompetitionLeaderboardCache
        List<CompetitionLeaderboardCache> cached = leaderboardCacheRepository.findByCompetitionIdOrderByRankAsc(competitionId);
        assertEquals(3, cached.size());
        assertEquals("Alice Champion", cached.get(0).getStudentName());
        assertEquals(1, cached.get(0).getRank());

        // Verify LeaderboardEntry persistence
        List<LeaderboardEntry> dbEntries = leaderboardEntryRepository.findByCompetitionIdOrderByRankAsc(competitionId);
        assertEquals(3, dbEntries.size());
    }

    @Test
    void testSetBreakdownAndMyRank() {
        competitionService.recalculateLeaderboard(competitionId, adminUser);

        // Fetch as Student 2 (Bob: Set A, Rank 2 overall, Rank 2 in Set A)
        Map<String, Object> student2Lb = competitionService.getLeaderboard(competitionId, student2User);
        // Note: Initially competition is NOT_PUBLISHED, so student2 gets empty entries but can be published
        competitionService.publishLeaderboard(competitionId, adminUser);

        Map<String, Object> publishedLb = competitionService.getLeaderboard(competitionId, student2User);
        assertTrue((Boolean) publishedLb.get("isPublished"));
        assertEquals("PUBLISHED", publishedLb.get("status"));

        @SuppressWarnings("unchecked")
        Map<String, Object> myRank = (Map<String, Object>) publishedLb.get("myRank");
        assertNotNull(myRank);
        assertEquals("Bob Runnerup", myRank.get("studentName"));
        assertEquals(2, myRank.get("rank"));
        assertEquals("A", myRank.get("setCode"));
        assertEquals(2, myRank.get("setRank")); // Alice is 1 in Set A, Bob is 2

        // Fetch as Student 3 (Charlie: Set B, Rank 3 overall, but Rank 1 in Set B!)
        Map<String, Object> student3Lb = competitionService.getLeaderboard(competitionId, student3User);
        @SuppressWarnings("unchecked")
        Map<String, Object> charlieRank = (Map<String, Object>) student3Lb.get("myRank");
        assertNotNull(charlieRank);
        assertEquals("Charlie Third", charlieRank.get("studentName"));
        assertEquals(3, charlieRank.get("rank")); // Overall rank 3
        assertEquals("B", charlieRank.get("setCode"));
        assertEquals(1, charlieRank.get("setRank")); // Set B rank 1!

        // Verify Podium has top 3
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> podium = (List<Map<String, Object>>) publishedLb.get("podium");
        assertEquals(3, podium.size());
        assertEquals("Alice Champion", podium.get(0).get("studentName"));
        assertEquals("Bob Runnerup", podium.get(1).get("studentName"));
        assertEquals("Charlie Third", podium.get(2).get("studentName"));
    }

    @Test
    void testPublishUnpublishAndSecurityGates() {
        competitionService.recalculateLeaderboard(competitionId, adminUser);

        // When NOT_PUBLISHED, student cannot see list entries
        Map<String, Object> studentViewBeforePublish = competitionService.getLeaderboard(competitionId, student1User);
        assertFalse((Boolean) studentViewBeforePublish.get("isPublished"));
        @SuppressWarnings("unchecked")
        List<?> hiddenEntries = (List<?>) studentViewBeforePublish.get("entries");
        assertTrue(hiddenEntries.isEmpty());

        // Admin can see preview entries even when NOT_PUBLISHED
        Map<String, Object> adminViewBeforePublish = competitionService.getLeaderboard(competitionId, adminUser);
        @SuppressWarnings("unchecked")
        List<?> adminEntries = (List<?>) adminViewBeforePublish.get("entries");
        assertEquals(3, adminEntries.size());

        // Student attempting to publish should throw ForbiddenException
        assertThrows(ForbiddenException.class, () -> competitionService.publishLeaderboard(competitionId, student1User));

        // Admin publishes
        competitionService.publishLeaderboard(competitionId, adminUser);
        Map<String, Object> studentViewAfterPublish = competitionService.getLeaderboard(competitionId, student1User);
        assertTrue((Boolean) studentViewAfterPublish.get("isPublished"));
        @SuppressWarnings("unchecked")
        List<?> visibleEntries = (List<?>) studentViewAfterPublish.get("entries");
        assertEquals(3, visibleEntries.size());

        // Admin unpublishes
        competitionService.unpublishLeaderboard(competitionId, adminUser);
        Map<String, Object> studentViewAfterUnpublish = competitionService.getLeaderboard(competitionId, student1User);
        assertFalse((Boolean) studentViewAfterUnpublish.get("isPublished"));

        // Admin toggles answer review
        Map<String, Object> toggleRes = competitionService.toggleAnswerReview(competitionId, adminUser);
        assertTrue((Boolean) toggleRes.get("answerReviewEnabled"));

        // Student toggling answer review throws ForbiddenException
        assertThrows(ForbiddenException.class, () -> competitionService.toggleAnswerReview(competitionId, student1User));
    }
}
