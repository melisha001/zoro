package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.StudentProgress;
import com.zoroacademy.service.ProgressService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;
    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }


    @GetMapping("/{studentId}/{courseId}")
    public ApiResponse<List<StudentProgress>> getStudentProgress(@PathVariable String studentId,
                                                                 @PathVariable String courseId) {
        return ApiResponse.ok(progressService.getStudentProgress(studentId, courseId));
    }

    @PostMapping
    public ApiResponse<StudentProgress> updateProgress(@RequestBody Map<String, Object> body) {
        String studentId = (String) body.get("studentId");
        String courseId = (String) body.get("courseId");
        String moduleId = (String) body.get("moduleId");
        Integer lastPosition = body.get("lastPosition") != null ? Integer.parseInt(body.get("lastPosition").toString()) : null;
        Integer completionPercentage = body.get("completionPercentage") != null ? Integer.parseInt(body.get("completionPercentage").toString()) : null;
        String status = (String) body.get("status");

        StudentProgress updated = progressService.updateModuleProgress(studentId, courseId, moduleId, lastPosition, completionPercentage, status);
        return ApiResponse.ok(updated, "Progress saved successfully");
    }

    @PostMapping("/heartbeat")
    public ApiResponse<com.zoroacademy.dto.HeartbeatResponseDto> recordHeartbeat(
            @RequestBody com.zoroacademy.dto.HeartbeatRequestDto request,
            org.springframework.security.core.Authentication authentication) {
        String effectiveStudentId = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            effectiveStudentId = authentication.getName();
        }
        if (effectiveStudentId == null || effectiveStudentId.isBlank()) {
            effectiveStudentId = request.getStudentId();
        }
        com.zoroacademy.dto.HeartbeatResponseDto resp = progressService.recordVideoHeartbeat(effectiveStudentId, request);
        return ApiResponse.ok(resp, resp.getMessage());
    }

    @GetMapping("/modules/{studentId}")
    public ApiResponse<List<com.zoroacademy.entity.StudentModuleProgress>> getModuleProgress(
            @PathVariable String studentId,
            @RequestParam(required = false) String courseId) {
        return ApiResponse.ok(progressService.getModuleProgressForStudent(studentId, courseId));
    }
}
