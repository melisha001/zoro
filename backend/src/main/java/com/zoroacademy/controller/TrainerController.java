package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    private final UserService userService;

    public TrainerController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<List<UserDto>> getTrainers() {
        return ApiResponse.ok(userService.getTrainers());
    }

    @GetMapping("/{id}")
    public ApiResponse<UserDto> getTrainerById(@PathVariable String id) {
        return ApiResponse.ok(userService.getUserById(id));
    }

    @PostMapping
    public ApiResponse<UserDto> createTrainer(@RequestBody UserDto trainer) {
        return ApiResponse.ok(userService.saveTrainer(trainer), "Trainer created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<UserDto> updateTrainer(@PathVariable String id, @RequestBody UserDto trainer) {
        trainer.setId(id);
        return ApiResponse.ok(userService.saveTrainer(trainer), "Trainer updated successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteTrainer(
            @PathVariable String id,
            @RequestParam(name = "replacementTrainerId", required = false) String replacementTrainerId,
            @RequestParam(name = "force", defaultValue = "false") boolean force) {
        if (replacementTrainerId != null && !replacementTrainerId.isBlank()) {
            userService.replaceTrainer(id, new com.zoroacademy.dto.TrainerReplacementRequest(replacementTrainerId, "DELETE"));
        } else {
            userService.deleteUser(id, force);
        }
        return ApiResponse.ok(true, "Trainer deleted successfully");
    }

    @GetMapping("/{id}/deletion-impact")
    public ApiResponse<com.zoroacademy.dto.DeletionImpactDto> getTrainerDeletionImpact(@PathVariable String id) {
        return ApiResponse.ok(userService.getTrainerDeletionImpact(id));
    }

    @GetMapping("/{id}/dependencies")
    public ApiResponse<com.zoroacademy.dto.TrainerDependencyDto> getTrainerDependencies(@PathVariable String id) {
        return ApiResponse.ok(userService.getTrainerDependencies(id));
    }

    @PostMapping("/{id}/replace")
    public ApiResponse<Boolean> replaceTrainer(@PathVariable String id, @RequestBody com.zoroacademy.dto.TrainerReplacementRequest request) {
        boolean ok = userService.replaceTrainer(id, request);
        return ApiResponse.ok(ok, "Trainer replaced and reallocated successfully");
    }
}
