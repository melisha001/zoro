package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionModule;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.service.CompetitionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/competitions")
public class CompetitionController {

    private final CompetitionService competitionService;
    public CompetitionController(CompetitionService competitionService) {
        this.competitionService = competitionService;
    }


    @GetMapping
    public ApiResponse<List<Competition>> getCompetitions() {
        return ApiResponse.ok(competitionService.getAllCompetitions());
    }

    @GetMapping("/registrations")
    public ApiResponse<List<CompetitionRegistration>> getAllRegistrations() {
        return ApiResponse.ok(competitionService.getAllRegistrations());
    }

    @GetMapping("/{id}")
    public ApiResponse<Competition> getCompetitionById(@PathVariable String id) {
        return ApiResponse.ok(competitionService.getCompetitionById(id));
    }

    @PostMapping
    public ApiResponse<Competition> createCompetition(@RequestBody Competition competition) {
        return ApiResponse.ok(competitionService.createCompetition(competition), "Competition created");
    }

    @GetMapping("/{id}/modules")
    public ApiResponse<List<CompetitionModule>> getModules(@PathVariable String id) {
        return ApiResponse.ok(competitionService.getModules(id));
    }

    @PostMapping("/{id}/modules")
    public ApiResponse<CompetitionModule> addModule(@PathVariable String id, @RequestBody CompetitionModule module) {
        return ApiResponse.ok(competitionService.addModule(id, module), "Module added");
    }

    @GetMapping("/{id}/registrations")
    public ApiResponse<List<CompetitionRegistration>> getRegistrations(@PathVariable String id) {
        return ApiResponse.ok(competitionService.getRegistrations(id));
    }

    @PostMapping("/{id}/registrations")
    public ApiResponse<CompetitionRegistration> registerStudent(@PathVariable String id, @RequestBody CompetitionRegistration reg) {
        return ApiResponse.ok(competitionService.registerStudent(id, reg), "Student registered for competition");
    }

    @PutMapping("/{id}")
    public ApiResponse<Competition> updateCompetition(@PathVariable String id, @RequestBody Competition competition) {
        return ApiResponse.ok(competitionService.updateCompetition(id, competition), "Competition updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteCompetition(@PathVariable String id) {
        competitionService.deleteCompetition(id);
        return ApiResponse.ok(true, "Competition deleted");
    }

    @PutMapping("/modules/{moduleId}")
    public ApiResponse<CompetitionModule> updateModule(@PathVariable String moduleId, @RequestBody CompetitionModule module) {
        return ApiResponse.ok(competitionService.updateModule(moduleId, module), "Module updated");
    }

    @DeleteMapping("/modules/{moduleId}")
    public ApiResponse<Boolean> deleteModule(@PathVariable String moduleId) {
        competitionService.deleteModule(moduleId);
        return ApiResponse.ok(true, "Module deleted");
    }

    @PutMapping("/registrations/{regId}")
    public ApiResponse<CompetitionRegistration> updateRegistration(@PathVariable String regId, @RequestBody CompetitionRegistration reg) {
        return ApiResponse.ok(competitionService.updateRegistration(regId, reg), "Registration updated");
    }

    @DeleteMapping("/registrations/{regId}")
    public ApiResponse<Boolean> deleteRegistration(@PathVariable String regId) {
        competitionService.deleteRegistration(regId);
        return ApiResponse.ok(true, "Registration deleted");
    }
}
