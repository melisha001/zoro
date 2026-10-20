package com.zoroacademy;

import com.zoroacademy.controller.CompetitionController;
import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.ForbiddenException;
import com.zoroacademy.repository.CompetitionRegistrationRepository;
import com.zoroacademy.repository.CompetitionRepository;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class CompetitionContentSecurityTest {

    @Autowired
    private CompetitionController competitionController;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private CompetitionRegistrationRepository registrationRepository;

    @Autowired
    private UserRepository userRepository;

    private Competition compA;
    private Competition compB;
    private User studentA;
    private User studentB;
    private User unregisteredStudent;
    private CompetitionRegistration regA;
    private CompetitionRegistration regB;

    @BeforeEach
    void setUp() {
        compA = new Competition();
        compA.setId("comp_sec_a_" + UUID.randomUUID());
        compA.setTitle("Competition A");
        competitionRepository.save(compA);

        compB = new Competition();
        compB.setId("comp_sec_b_" + UUID.randomUUID());
        compB.setTitle("Competition B");
        competitionRepository.save(compB);

        studentA = new User();
        studentA.setId("usr_sec_a_" + UUID.randomUUID());
        studentA.setName("Student A");
        studentA.setEmail("student_a_" + UUID.randomUUID() + "@test.com");
        studentA.setRole("STUDENT");
        studentA.setPassword("pass123");
        userRepository.save(studentA);

        studentB = new User();
        studentB.setId("usr_sec_b_" + UUID.randomUUID());
        studentB.setName("Student B");
        studentB.setEmail("student_b_" + UUID.randomUUID() + "@test.com");
        studentB.setRole("STUDENT");
        studentB.setPassword("pass123");
        userRepository.save(studentB);

        unregisteredStudent = new User();
        unregisteredStudent.setId("usr_sec_unreg_" + UUID.randomUUID());
        unregisteredStudent.setName("Unregistered Student");
        unregisteredStudent.setEmail("unreg_" + UUID.randomUUID() + "@test.com");
        unregisteredStudent.setRole("STUDENT");
        unregisteredStudent.setPassword("pass123");
        userRepository.save(unregisteredStudent);

        // Student A has PAID registration in Competition A
        regA = new CompetitionRegistration();
        regA.setId("reg_sec_a_" + UUID.randomUUID());
        regA.setCompetition(compA);
        regA.setStudentId(studentA.getId());
        regA.setStudentEmail(studentA.getEmail());
        regA.setPaymentStatus("PAID");
        registrationRepository.save(regA);

        // Student B has PAID registration in Competition B
        regB = new CompetitionRegistration();
        regB.setId("reg_sec_b_" + UUID.randomUUID());
        regB.setCompetition(compB);
        regB.setStudentId(studentB.getId());
        regB.setStudentEmail(studentB.getEmail());
        regB.setPaymentStatus("PAID");
        registrationRepository.save(regB);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (regA != null) registrationRepository.delete(regA);
        if (regB != null) registrationRepository.delete(regB);
        if (studentA != null) userRepository.delete(studentA);
        if (studentB != null) userRepository.delete(studentB);
        if (unregisteredStudent != null) userRepository.delete(unregisteredStudent);
        if (compA != null) competitionRepository.delete(compA);
        if (compB != null) competitionRepository.delete(compB);
    }

    private void authenticate(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("PAID registrant of Competition A can view syllabus of Competition A")
    void testPaidStudentCanAccessOwnCompetitionContent() {
        authenticate(studentA);
        assertDoesNotThrow(() -> competitionController.getSyllabus(compA.getId()));
        assertDoesNotThrow(() -> competitionController.getStudyMaterials(compA.getId()));
        assertDoesNotThrow(() -> competitionController.getGuidanceVideos(compA.getId()));
    }

    @Test
    @DisplayName("Student of Competition B is blocked with 403 Forbidden on Competition A content")
    void testOtherCompetitionStudentBlocked() {
        authenticate(studentB);
        assertThrows(ForbiddenException.class, () -> competitionController.getSyllabus(compA.getId()));
        assertThrows(ForbiddenException.class, () -> competitionController.getStudyMaterials(compA.getId()));
        assertThrows(ForbiddenException.class, () -> competitionController.getGuidanceVideos(compA.getId()));
    }

    @Test
    @DisplayName("Unregistered student is blocked with 403 Forbidden on Competition A content")
    void testUnregisteredStudentBlocked() {
        authenticate(unregisteredStudent);
        assertThrows(ForbiddenException.class, () -> competitionController.getSyllabus(compA.getId()));
        assertThrows(ForbiddenException.class, () -> competitionController.getStudyMaterials(compA.getId()));
        assertThrows(ForbiddenException.class, () -> competitionController.getGuidanceVideos(compA.getId()));
    }
}
