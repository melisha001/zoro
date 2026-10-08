package com.zoroacademy.service;

import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionModule;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.repository.CompetitionModuleRepository;
import com.zoroacademy.repository.CompetitionRegistrationRepository;
import com.zoroacademy.repository.CompetitionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionModuleRepository moduleRepository;
    private final CompetitionRegistrationRepository registrationRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;

    public CompetitionService(CompetitionRepository competitionRepository,
                              CompetitionModuleRepository moduleRepository,
                              CompetitionRegistrationRepository registrationRepository,
                              com.zoroacademy.repository.UserRepository userRepository) {
        this.competitionRepository = competitionRepository;
        this.moduleRepository = moduleRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Competition> getAllCompetitions() {
        return competitionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Competition getCompetitionById(String id) {
        return competitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Competition not found: " + id));
    }

    @Transactional
    public Competition createCompetition(Competition competition) {
        if (competition.getId() == null || competition.getId().isBlank()) {
            competition.setId("comp_" + java.util.UUID.randomUUID());
        }
        return competitionRepository.save(competition);
    }

    @Transactional
    public CompetitionModule addModule(String compId, CompetitionModule module) {
        Competition comp = getCompetitionById(compId);
        if (module.getId() == null || module.getId().isBlank()) {
            module.setId("comp_mod_" + java.util.UUID.randomUUID());
        }
        module.setCompetition(comp);
        return moduleRepository.save(module);
    }

    @Transactional(readOnly = true)
    public List<CompetitionRegistration> getAllRegistrations() {
        return registrationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CompetitionModule> getModules(String compId) {
        return moduleRepository.findByCompetitionIdOrderByRoundNumberAsc(compId);
    }

    @Transactional(readOnly = true)
    public List<CompetitionRegistration> getRegistrations(String compId) {
        return registrationRepository.findByCompetitionId(compId);
    }

    @Transactional
    public CompetitionRegistration registerStudent(String compId, CompetitionRegistration reg) {
        Competition comp = getCompetitionById(compId);
        if (reg.getId() == null || reg.getId().isBlank()) {
            reg.setId("reg_" + java.util.UUID.randomUUID());
        }
        if (reg.getStudentPhone() != null && !reg.getStudentPhone().isBlank()) {
            reg.setStudentPhone(com.zoroacademy.util.PhoneValidator.sanitize(reg.getStudentPhone()));
        }
        if (reg.getPaymentStatus() == null || reg.getPaymentStatus().isBlank()) {
            reg.setPaymentStatus("Pending");
        }

        // Relational student resolution
        if (reg.getStudentId() != null && reg.getStudentId().contains("@")) {
            userRepository.findByEmailIgnoreCase(reg.getStudentId()).ifPresent(u -> {
                reg.setStudentId(u.getId());
                if (reg.getStudentEmail() == null) reg.setStudentEmail(u.getEmail());
                if (reg.getStudentName() == null) reg.setStudentName(u.getName());
            });
        } else if (reg.getStudentEmail() != null && !reg.getStudentEmail().isBlank()) {
            userRepository.findByEmailIgnoreCase(reg.getStudentEmail()).ifPresent(u -> {
                if (reg.getStudentId() == null || reg.getStudentId().isBlank()) reg.setStudentId(u.getId());
                if (reg.getStudentName() == null) reg.setStudentName(u.getName());
            });
        }

        // Idempotency check: 409 Conflict if already registered
        if (reg.getStudentEmail() != null && !reg.getStudentEmail().isBlank()) {
            if (registrationRepository.findByCompetitionIdAndStudentEmailIgnoreCase(compId, reg.getStudentEmail()).isPresent()) {
                throw new com.zoroacademy.exception.ConflictException("Student with email " + reg.getStudentEmail() + " is already registered for this competition");
            }
        }
        if (reg.getStudentId() != null && !reg.getStudentId().isBlank()) {
            if (registrationRepository.findByCompetitionIdAndStudentId(compId, reg.getStudentId()).isPresent()) {
                throw new com.zoroacademy.exception.ConflictException("Student is already registered for this competition");
            }
        }

        reg.setCompetition(comp);
        return registrationRepository.save(reg);
    }

    @Transactional
    public Competition updateCompetition(String id, Competition updated) {
        Competition comp = getCompetitionById(id);
        if (updated.getTitle() != null) comp.setTitle(updated.getTitle());
        if (updated.getCategory() != null) comp.setCategory(updated.getCategory());
        if (updated.getStartDate() != null) comp.setStartDate(updated.getStartDate());
        if (updated.getEndDate() != null) comp.setEndDate(updated.getEndDate());
        if (updated.getRegistrationFee() != null) comp.setRegistrationFee(updated.getRegistrationFee());
        if (updated.getDescription() != null) comp.setDescription(updated.getDescription());
        if (updated.getRules() != null) comp.setRules(updated.getRules());
        if (updated.getStatus() != null) comp.setStatus(updated.getStatus());
        return competitionRepository.save(comp);
    }

    @Transactional
    public void deleteCompetition(String id) {
        competitionRepository.deleteById(id);
    }

    @Transactional
    public CompetitionModule updateModule(String moduleId, CompetitionModule updated) {
        CompetitionModule mod = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleId));
        if (updated.getTitle() != null) mod.setTitle(updated.getTitle());
        if (updated.getDescription() != null) mod.setDescription(updated.getDescription());
        if (updated.getRoundNumber() != null) mod.setRoundNumber(updated.getRoundNumber());
        if (updated.getAssessmentData() != null) mod.setAssessmentData(updated.getAssessmentData());
        return moduleRepository.save(mod);
    }

    @Transactional
    public void deleteModule(String moduleId) {
        moduleRepository.deleteById(moduleId);
    }

    @Transactional
    public CompetitionRegistration updateRegistration(String regId, CompetitionRegistration updated) {
        CompetitionRegistration reg = registrationRepository.findById(regId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found: " + regId));
        if (updated.getPaymentStatus() != null) reg.setPaymentStatus(updated.getPaymentStatus());
        if (updated.getScore() != null) reg.setScore(updated.getScore());
        if (updated.getRank() != null) reg.setRank(updated.getRank());
        if (updated.getCertificateUrl() != null) reg.setCertificateUrl(updated.getCertificateUrl());
        return registrationRepository.save(reg);
    }

    @Transactional
    public void deleteRegistration(String regId) {
        registrationRepository.deleteById(regId);
    }
}
