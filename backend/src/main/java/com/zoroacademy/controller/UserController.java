package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<UserDto>> getStudents() {
        return ApiResponse.ok(userService.getStudents());
    }

    @PostMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDto> createStudent(@RequestBody UserDto student) {
        return ApiResponse.ok(userService.saveStudent(student), "Student created successfully");
    }

    @PutMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDto> updateStudent(@PathVariable String id, @RequestBody UserDto student) {
        student.setId(id);
        return ApiResponse.ok(userService.saveStudent(student), "Student updated successfully");
    }

    @GetMapping("/trainers")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<UserDto>> getTrainers() {
        return ApiResponse.ok(userService.getTrainers());
    }

    @PostMapping("/trainers")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDto> createTrainer(@RequestBody UserDto trainer) {
        return ApiResponse.ok(userService.saveTrainer(trainer), "Trainer created successfully");
    }

    @PutMapping("/trainers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDto> updateTrainer(@PathVariable String id, @RequestBody UserDto trainer) {
        trainer.setId(id);
        return ApiResponse.ok(userService.saveTrainer(trainer), "Trainer updated successfully");
    }

    @PostMapping("/password")
    public ApiResponse<Boolean> updatePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        if (principal == null) {
            return ApiResponse.error("Authentication required to update password");
        }
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || newPassword == null) {
            return ApiResponse.error("Current and new passwords are required");
        }

        boolean success = userService.updatePassword(principal.getId(), currentPassword, newPassword);
        if (success) {
            return ApiResponse.ok(true, "Password updated successfully");
        } else {
            return ApiResponse.error("Incorrect current password");
        }
    }

    @GetMapping("/{id}/admin-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, String>> getAdminPassword(@PathVariable String id) {
        String decrypted = userService.getAdminVisiblePassword(id);
        if (decrypted == null || decrypted.isBlank()) {
            throw new com.zoroacademy.exception.ResourceNotFoundException("No admin-visible password set for this user");
        }
        return ApiResponse.ok(Map.of("password", decrypted));
    }

    @PutMapping("/{id}/admin-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Boolean> setAdminPassword(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }
        userService.setAdminPassword(id, newPassword);
        return ApiResponse.ok(true, "Password updated successfully");
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public ApiResponse<UserDto> getUserById(@PathVariable String id) {
        return ApiResponse.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDto> updateUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        UserDto updated = userService.updateUserStatus(id, status);
        return ApiResponse.ok(updated, "User status updated successfully");
    }

    @GetMapping("/trainers/{id}/deletion-impact")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<com.zoroacademy.dto.DeletionImpactDto> getTrainerDeletionImpact(@PathVariable String id) {
        return ApiResponse.ok(userService.getTrainerDeletionImpact(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Boolean> deleteUser(
            @PathVariable String id,
            @RequestParam(value = "force", defaultValue = "false") boolean force,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null && (principal.getId().equals(id) || principal.getEmail().equalsIgnoreCase(id))) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }
        userService.deleteUser(id, force);
        return ApiResponse.ok(true, "User deleted successfully");
    }
}
