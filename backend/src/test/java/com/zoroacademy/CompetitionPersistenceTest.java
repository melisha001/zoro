package com.zoroacademy;

import com.zoroacademy.entity.Competition;
import com.zoroacademy.repository.CompetitionModuleRepository;
import com.zoroacademy.repository.CompetitionRegistrationRepository;
import com.zoroacademy.repository.CompetitionRepository;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.service.CompetitionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CompetitionPersistenceTest {

    private CompetitionRepository competitionRepository;
    private CompetitionModuleRepository moduleRepository;
    private CompetitionRegistrationRepository registrationRepository;
    private UserRepository userRepository;
    private CompetitionService competitionService;

    @BeforeEach
    void setUp() {
        competitionRepository = mock(CompetitionRepository.class);
        moduleRepository = mock(CompetitionModuleRepository.class);
        registrationRepository = mock(CompetitionRegistrationRepository.class);
        userRepository = mock(UserRepository.class);

        competitionService = new CompetitionService(
                competitionRepository,
                moduleRepository,
                registrationRepository,
                userRepository
        );
    }

    @Test
    @DisplayName("Create competition saves and persists all fields")
    void testCreateCompetitionPersistsAllFields() {
        Competition comp = Competition.builder()
                .title("National Championship 2026")
                .category("Olympiad")
                .startDate("2026-11-10")
                .endDate("2026-11-15")
                .regStartDate("2026-10-01")
                .regEndDate("2026-11-05")
                .startTime("10:00 AM")
                .endTime("02:00 PM")
                .venue("Zoro Academy Auditorium")
                .bannerUrl("https://storage.bunnycdn.com/banners/comp_banner.jpg")
                .rulesPdfUrl("https://storage.bunnycdn.com/docs/rules.pdf")
                .registrationFormUrl("https://storage.bunnycdn.com/docs/form.pdf")
                .instructions("Carry your school ID and admit card.")
                .rules("Standard national Olympiad regulations apply.")
                .contactDetails("+91 98765 43210 | info@zoroacademy.com")
                .registrationFee(new BigDecimal("750.00"))
                .description("Annual national scholastic competition.")
                .status("Active")
                .build();

        when(competitionRepository.save(any(Competition.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Competition created = competitionService.createCompetition(comp);

        assertNotNull(created.getId());
        assertTrue(created.getId().startsWith("comp_"));
        assertEquals("National Championship 2026", created.getTitle());
        assertEquals("Olympiad", created.getCategory());
        assertEquals("2026-11-10", created.getStartDate());
        assertEquals("2026-11-15", created.getEndDate());
        assertEquals("2026-10-01", created.getRegStartDate());
        assertEquals("2026-11-05", created.getRegEndDate());
        assertEquals("10:00 AM", created.getStartTime());
        assertEquals("02:00 PM", created.getEndTime());
        assertEquals("Zoro Academy Auditorium", created.getVenue());
        assertEquals("https://storage.bunnycdn.com/banners/comp_banner.jpg", created.getBannerUrl());
        assertEquals("https://storage.bunnycdn.com/docs/rules.pdf", created.getRulesPdfUrl());
        assertEquals("https://storage.bunnycdn.com/docs/form.pdf", created.getRegistrationFormUrl());
        assertEquals("Carry your school ID and admit card.", created.getInstructions());
        assertEquals("Standard national Olympiad regulations apply.", created.getRules());
        assertEquals("+91 98765 43210 | info@zoroacademy.com", created.getContactDetails());
        assertEquals(new BigDecimal("750.00"), created.getRegistrationFee());
        assertEquals("Annual national scholastic competition.", created.getDescription());
        assertEquals("Active", created.getStatus());

        ArgumentCaptor<Competition> captor = ArgumentCaptor.forClass(Competition.class);
        verify(competitionRepository).save(captor.capture());
        Competition saved = captor.getValue();
        assertEquals("National Championship 2026", saved.getTitle());
        assertEquals("https://storage.bunnycdn.com/banners/comp_banner.jpg", saved.getBannerUrl());
        assertEquals("https://storage.bunnycdn.com/docs/rules.pdf", saved.getRulesPdfUrl());
        assertEquals("https://storage.bunnycdn.com/docs/form.pdf", saved.getRegistrationFormUrl());
    }

    @Test
    @DisplayName("Update competition correctly updates all fields")
    void testUpdateCompetitionUpdatesAllFields() {
        String compId = "comp_test_123";
        Competition existing = Competition.builder()
                .id(compId)
                .title("Old Title")
                .category("Old Category")
                .startDate("2026-10-01")
                .endDate("2026-10-02")
                .regStartDate("2026-09-01")
                .regEndDate("2026-09-25")
                .startTime("09:00 AM")
                .endTime("12:00 PM")
                .venue("Old Venue")
                .bannerUrl("old_banner.jpg")
                .rulesPdfUrl("old_rules.pdf")
                .registrationFormUrl("old_form.pdf")
                .instructions("Old instructions")
                .rules("Old rules")
                .contactDetails("old contact")
                .registrationFee(new BigDecimal("500.00"))
                .description("Old description")
                .status("Active")
                .build();

        when(competitionRepository.findById(compId)).thenReturn(Optional.of(existing));
        when(competitionRepository.save(any(Competition.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Competition updatedInput = Competition.builder()
                .title("Updated Title")
                .category("Advanced Abacus")
                .startDate("2026-12-01")
                .endDate("2026-12-05")
                .regStartDate("2026-11-01")
                .regEndDate("2026-11-25")
                .startTime("11:00 AM")
                .endTime("03:00 PM")
                .venue("New Venue Center")
                .bannerUrl("https://storage.bunnycdn.com/banners/new_banner.png")
                .rulesPdfUrl("https://storage.bunnycdn.com/docs/new_rules.pdf")
                .registrationFormUrl("https://storage.bunnycdn.com/docs/new_form.pdf")
                .instructions("Updated instructions for finalists")
                .rules("Updated rules document")
                .contactDetails("+91 99999 88888")
                .registrationFee(new BigDecimal("1200.00"))
                .description("Updated championship description")
                .status("Closed")
                .build();

        Competition result = competitionService.updateCompetition(compId, updatedInput);

        assertEquals("Updated Title", result.getTitle());
        assertEquals("Advanced Abacus", result.getCategory());
        assertEquals("2026-12-01", result.getStartDate());
        assertEquals("2026-12-05", result.getEndDate());
        assertEquals("2026-11-01", result.getRegStartDate());
        assertEquals("2026-11-25", result.getRegEndDate());
        assertEquals("11:00 AM", result.getStartTime());
        assertEquals("03:00 PM", result.getEndTime());
        assertEquals("New Venue Center", result.getVenue());
        assertEquals("https://storage.bunnycdn.com/banners/new_banner.png", result.getBannerUrl());
        assertEquals("https://storage.bunnycdn.com/docs/new_rules.pdf", result.getRulesPdfUrl());
        assertEquals("https://storage.bunnycdn.com/docs/new_form.pdf", result.getRegistrationFormUrl());
        assertEquals("Updated instructions for finalists", result.getInstructions());
        assertEquals("Updated rules document", result.getRules());
        assertEquals("+91 99999 88888", result.getContactDetails());
        assertEquals(new BigDecimal("1200.00"), result.getRegistrationFee());
        assertEquals("Updated championship description", result.getDescription());
        assertEquals("Closed", result.getStatus());

        verify(competitionRepository).save(existing);
    }
}
