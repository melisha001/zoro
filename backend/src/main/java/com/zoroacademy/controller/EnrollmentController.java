package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.entity.EnrollmentRequest;
import com.zoroacademy.service.EnrollmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }


    // --- ENROLLMENTS ---

    @GetMapping("/api/enrollments")
    public ApiResponse<List<Enrollment>> getEnrollments() {
        return ApiResponse.ok(enrollmentService.getAllEnrollments());
    }

    @GetMapping("/api/enrollments/student/{studentId}")
    public ApiResponse<List<Enrollment>> getStudentEnrollments(@PathVariable String studentId) {
        return ApiResponse.ok(enrollmentService.getStudentEnrollments(studentId));
    }

    @PostMapping("/api/enrollments")
    public ApiResponse<Enrollment> enrollStudent(@RequestBody Map<String, String> body) {
        String studentId = body.get("studentId");
        String studentEmail = body.get("studentEmail");
        String courseId = body.get("courseId");
        String batchName = body.get("batchName");
        Enrollment enrollment = enrollmentService.enrollStudent(studentId, studentEmail, courseId, batchName);
        return ApiResponse.ok(enrollment, "Enrolled successfully");
    }

    // --- ENROLLMENT REQUESTS ---

    @GetMapping("/api/enrollment-requests")
    public ApiResponse<List<EnrollmentRequest>> getEnrollmentRequests() {
        return ApiResponse.ok(enrollmentService.getAllEnrollmentRequests());
    }

    @GetMapping("/api/enrollment-requests/student/{studentId}")
    public ApiResponse<List<EnrollmentRequest>> getStudentEnrollmentRequests(@PathVariable String studentId) {
        return ApiResponse.ok(enrollmentService.getStudentEnrollmentRequests(studentId));
    }

    @PostMapping("/api/enrollment-requests")
    public ApiResponse<EnrollmentRequest> createEnrollmentRequest(@RequestBody EnrollmentRequest request) {
        return ApiResponse.ok(enrollmentService.createEnrollmentRequest(request), "Enrollment requested successfully");
    }

    @PutMapping("/api/enrollment-requests/{id}/status")
    public ApiResponse<EnrollmentRequest> updateRequestStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String remarks = body.get("remarks");
        return ApiResponse.ok(enrollmentService.updateEnrollmentRequestStatus(id, status, remarks), "Request status updated");
    }
}
