package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.TrainerCourseRequest;
import com.zoroacademy.service.TrainerCourseRequestService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trainer-course-requests")
public class TrainerCourseRequestController {

    private final TrainerCourseRequestService requestService;

    public TrainerCourseRequestController(TrainerCourseRequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping
    public ApiResponse<List<TrainerCourseRequest>> getRequests(@RequestParam(required = false) String trainerId) {
        if (trainerId != null && !trainerId.isBlank()) {
            return ApiResponse.ok(requestService.getRequestsByTrainer(trainerId));
        }
        return ApiResponse.ok(requestService.getAllRequests());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TRAINER', 'ADMIN')")
    public ApiResponse<TrainerCourseRequest> createRequest(@RequestBody TrainerCourseRequest request) {
        return ApiResponse.ok(requestService.createRequest(request), "Course access requested successfully");
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TrainerCourseRequest> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        return ApiResponse.ok(requestService.updateStatus(id, status), "Request status updated successfully");
    }
}
