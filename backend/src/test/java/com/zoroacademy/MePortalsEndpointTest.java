package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.controller.MeController;
import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.entity.User;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class MePortalsEndpointTest {

    @Autowired
    private MeController meController;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private CompetitionRegistrationRepository competitionRegistrationRepository;

    private User testUser;
    private Enrollment testEnrollment;
    private Competition testCompetition;
    private CompetitionRegistration testRegistration;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("usr_portals_" + UUID.randomUUID());
        testUser.setName("Portals Test Student");
        testUser.setEmail("portals_" + UUID.randomUUID() + "@test.com");
        testUser.setRole("STUDENT");
        testUser.setPassword("pass123");
        userRepository.save(testUser);

        // Authenticate as testUser
        UserPrincipal principal = UserPrincipal.create(testUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (testRegistration != null) competitionRegistrationRepository.delete(testRegistration);
        if (testCompetition != null) competitionRepository.delete(testCompetition);
        if (testEnrollment != null) enrollmentRepository.delete(testEnrollment);
        if (testUser != null) userRepository.delete(testUser);
    }

    @Test
    @DisplayName("Learning-only student: active enrollment, no competition registrations")
    void testLearningOnlyPortalAccess() {
        testUser.setOrigin("LEARNING");
        userRepository.save(testUser);

        testEnrollment = new Enrollment();
        testEnrollment.setId("enr_" + UUID.randomUUID());
        testEnrollment.setStudentId(testUser.getId());
        testEnrollment.setStudentEmail(testUser.getEmail());
        testEnrollment.setCourseId("course_1");
        testEnrollment.setStatus("Active");
        enrollmentRepository.save(testEnrollment);

        ApiResponse<Map<String, Object>> res = meController.getMyPortals();
        assertNotNull(res);
        Map<String, Object> data = res.getData();
        assertNotNull(data);

        assertEquals(true, data.get("learning"));
        assertEquals(false, data.get("competition"));
        assertEquals("learning", data.get("defaultPortal"));
    }

    @Test
    @DisplayName("Competition-only student: origin COMPETITION, no enrollment, 1 PAID registration")
    void testCompetitionOnlyPortalAccess() {
        testUser.setOrigin("COMPETITION");
        userRepository.save(testUser);

        testCompetition = new Competition();
        testCompetition.setId("comp_" + UUID.randomUUID());
        testCompetition.setTitle("Test Competition");
        competitionRepository.save(testCompetition);

        testRegistration = new CompetitionRegistration();
        testRegistration.setId("reg_" + UUID.randomUUID());
        testRegistration.setCompetition(testCompetition);
        testRegistration.setStudentId(testUser.getId());
        testRegistration.setStudentEmail(testUser.getEmail());
        testRegistration.setStudentName(testUser.getName());
        testRegistration.setPaymentStatus("PAID");
        competitionRegistrationRepository.save(testRegistration);

        ApiResponse<Map<String, Object>> res = meController.getMyPortals();
        assertNotNull(res);
        Map<String, Object> data = res.getData();
        assertNotNull(data);

        assertEquals(false, data.get("learning"));
        assertEquals(true, data.get("competition"));
        assertEquals("competition", data.get("defaultPortal"));
    }

    @Test
    @DisplayName("Dual-portal student: origin COMPETITION with active enrollment AND PAID competition registration")
    void testDualPortalAccess() {
        testUser.setOrigin("COMPETITION");
        userRepository.save(testUser);

        testEnrollment = new Enrollment();
        testEnrollment.setId("enr_" + UUID.randomUUID());
        testEnrollment.setStudentId(testUser.getId());
        testEnrollment.setStudentEmail(testUser.getEmail());
        testEnrollment.setCourseId("course_1");
        testEnrollment.setStatus("Active");
        enrollmentRepository.save(testEnrollment);

        testCompetition = new Competition();
        testCompetition.setId("comp_" + UUID.randomUUID());
        testCompetition.setTitle("Test Dual Competition");
        competitionRepository.save(testCompetition);

        testRegistration = new CompetitionRegistration();
        testRegistration.setId("reg_" + UUID.randomUUID());
        testRegistration.setCompetition(testCompetition);
        testRegistration.setStudentId(testUser.getId());
        testRegistration.setStudentEmail(testUser.getEmail());
        testRegistration.setStudentName(testUser.getName());
        testRegistration.setPaymentStatus("PAID");
        competitionRegistrationRepository.save(testRegistration);

        ApiResponse<Map<String, Object>> res = meController.getMyPortals();
        assertNotNull(res);
        Map<String, Object> data = res.getData();
        assertNotNull(data);

        assertEquals(true, data.get("learning"));
        assertEquals(true, data.get("competition"));
        assertNull(data.get("defaultPortal"), "Dual portal students must have null defaultPortal to show portal selector");
    }
}
