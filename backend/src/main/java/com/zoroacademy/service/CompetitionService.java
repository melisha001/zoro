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
    public CompetitionService(CompetitionRepository competitionRepository, CompetitionModuleRepository moduleRepository, CompetitionRegistrationRepository registrationRepository) {
        this.competitionRepository = competitionRepository;
        this.moduleRepository = moduleRepository;
        this.registrationRepository = registrationRepository;
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
            competition.setId("comp_" + System.currentTimeMillis());
        }
        return competitionRepository.save(competition);
    }

    @Transactional
    public CompetitionModule addModule(String compId, CompetitionModule module) {
        Competition comp = getCompetitionById(compId);
        if (module.getId() == null || module.getId().isBlank()) {
            module.setId("comp_mod_" + System.currentTimeMillis());
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
            reg.setId("reg_" + System.currentTimeMillis());
        }
        if (reg.getStudentPhone() != null && !reg.getStudentPhone().isBlank()) {
            reg.setStudentPhone(com.zoroacademy.util.PhoneValidator.sanitize(reg.getStudentPhone()));
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
