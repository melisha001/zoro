package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.service.UserService;
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
    public ApiResponse<List<UserDto>> getStudents() {
        return ApiResponse.ok(userService.getStudents());
    }

    @PostMapping("/students")
    public ApiResponse<UserDto> createStudent(@RequestBody UserDto student) {
        return ApiResponse.ok(userService.saveStudent(student), "Student created successfully");
    }

    @PutMapping("/students/{id}")
    public ApiResponse<UserDto> updateStudent(@PathVariable String id, @RequestBody UserDto student) {
        student.setId(id);
        return ApiResponse.ok(userService.saveStudent(student), "Student updated successfully");
    }

    @GetMapping("/trainers")
    public ApiResponse<List<UserDto>> getTrainers() {
        return ApiResponse.ok(userService.getTrainers());
    }

    @PostMapping("/trainers")
    public ApiResponse<UserDto> createTrainer(@RequestBody UserDto trainer) {
        return ApiResponse.ok(userService.saveTrainer(trainer), "Trainer created successfully");
    }

    @PutMapping("/trainers/{id}")
    public ApiResponse<UserDto> updateTrainer(@PathVariable String id, @RequestBody UserDto trainer) {
        trainer.setId(id);
        return ApiResponse.ok(userService.saveTrainer(trainer), "Trainer updated successfully");
    }

    @PostMapping("/password")
    public ApiResponse<Boolean> updatePassword(@RequestBody Map<String, String> body) {
        String id = body.get("id");
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        boolean success = userService.updatePassword(id, currentPassword, newPassword);
        if (success) {
            return ApiResponse.ok(true, "Password updated successfully");
        } else {
            return ApiResponse.error("Incorrect current password");
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<UserDto> getUserById(@PathVariable String id) {
        return ApiResponse.ok(userService.getUserById(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ApiResponse.ok(true, "User deleted successfully");
    }
}
