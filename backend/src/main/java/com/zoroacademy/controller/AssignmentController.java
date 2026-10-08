package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Assignment;
import com.zoroacademy.entity.AssignmentSubmission;
import com.zoroacademy.service.AssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class AssignmentController {

    private final AssignmentService assignmentService;
    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }


    // --- ASSIGNMENTS ---

    @GetMapping("/api/assignments")
    public ApiResponse<List<Assignment>> getAssignments() {
        return ApiResponse.ok(assignmentService.getAllAssignments());
    }

    @PostMapping("/api/assignments")
    public ApiResponse<Assignment> createAssignment(@RequestBody Assignment assignment) {
        return ApiResponse.ok(assignmentService.createAssignment(assignment), "Assignment created");
    }

    // --- SUBMISSIONS ---

    @GetMapping("/api/submissions")
    public ApiResponse<List<AssignmentSubmission>> getSubmissions(@RequestParam(required = false) String studentId,
                                                                 @RequestParam(required = false) String studentEmail,
                                                                 @RequestParam(required = false) String trainerId,
                                                                 @RequestParam(required = false) String trainer) {
        String effectiveStudent = (studentId != null && !studentId.isBlank()) ? studentId : studentEmail;
        if (effectiveStudent != null && !effectiveStudent.isBlank()) {
            return ApiResponse.ok(assignmentService.getSubmissionsByStudent(effectiveStudent));
        }
        String effectiveTrainer = (trainerId != null && !trainerId.isBlank()) ? trainerId : trainer;
        if (effectiveTrainer != null && !effectiveTrainer.isBlank()) {
            return ApiResponse.ok(assignmentService.getSubmissionsByTrainer(effectiveTrainer));
        }
        return ApiResponse.ok(assignmentService.getAllSubmissions());
    }

    @PostMapping("/api/submissions")
    public ApiResponse<AssignmentSubmission> createSubmission(@RequestBody AssignmentSubmission submission) {
        return ApiResponse.ok(assignmentService.createSubmission(submission), "Submission uploaded successfully");
    }

    @PutMapping("/api/submissions/{id}/review")
    public ApiResponse<AssignmentSubmission> reviewSubmission(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String score = (String) body.get("score");
        String remarks = (String) body.get("remarks");
        String correctedBy = (String) body.get("correctedBy");
        String correctionAttachment = body.get("correctionAttachment") != null ? body.get("correctionAttachment").toString() : null;

        AssignmentSubmission reviewed = assignmentService.reviewSubmission(id, score, remarks, correctedBy, correctionAttachment);
        return ApiResponse.ok(reviewed, "Submission reviewed successfully");
    }

    @DeleteMapping("/api/assignments/{id}")
    public ApiResponse<Boolean> deleteAssignment(@PathVariable String id) {
        assignmentService.deleteAssignment(id);
        return ApiResponse.ok(true, "Assignment deleted successfully");
    }

    @DeleteMapping("/api/submissions/{id}")
    public ApiResponse<Boolean> deleteSubmission(@PathVariable String id) {
        assignmentService.deleteSubmission(id);
        return ApiResponse.ok(true, "Submission deleted successfully");
    }
}
