package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.AttendanceRecord;
import com.zoroacademy.entity.TrainerAttendanceRecord;
import com.zoroacademy.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ApiResponse<List<AttendanceRecord>> getAllAttendance() {
        return ApiResponse.ok(attendanceService.getAllAttendance());
    }

    @GetMapping("/schedule/{scheduleId}")
    public ApiResponse<List<AttendanceRecord>> getBySchedule(@PathVariable String scheduleId) {
        return ApiResponse.ok(attendanceService.getBySchedule(scheduleId));
    }

    @GetMapping("/student/{studentId}")
    public ApiResponse<List<AttendanceRecord>> getByStudent(@PathVariable String studentId) {
        return ApiResponse.ok(attendanceService.getByStudent(studentId));
    }

    @GetMapping("/trainer")
    public ApiResponse<List<TrainerAttendanceRecord>> getAllTrainerAttendance() {
        return ApiResponse.ok(attendanceService.getAllTrainerAttendance());
    }

    @GetMapping("/trainer/schedule/{scheduleId}")
    public ApiResponse<List<TrainerAttendanceRecord>> getTrainerAttendanceBySchedule(@PathVariable String scheduleId) {
        return ApiResponse.ok(attendanceService.getTrainerAttendanceBySchedule(scheduleId));
    }

    @GetMapping("/trainer/{trainerId}")
    public ApiResponse<List<TrainerAttendanceRecord>> getTrainerAttendanceByTrainer(@PathVariable String trainerId) {
        return ApiResponse.ok(attendanceService.getTrainerAttendanceByTrainer(trainerId));
    }

    @PutMapping("/remark")
    public ApiResponse<AttendanceRecord> updateStudentRemark(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal com.zoroacademy.security.UserPrincipal principal) {
        String scheduleId = (String) body.get("scheduleId");
        String studentId = (String) body.get("studentId");
        String remark = (String) body.get("remark");
        if (remark == null) {
            remark = (String) body.get("remarks");
        }
        String author = principal != null && principal.getName() != null ? principal.getName() : "Admin";
        AttendanceRecord updated = attendanceService.updateStudentRemark(scheduleId, studentId, remark, author);
        return ApiResponse.ok(updated, "Student remark updated successfully");
    }

    @PutMapping("/{id}/remark")
    public ApiResponse<AttendanceRecord> updateStudentRemarkById(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal com.zoroacademy.security.UserPrincipal principal) {
        String scheduleId = (String) body.get("scheduleId");
        String studentId = (String) body.get("studentId");
        String remark = (String) body.get("remark");
        if (remark == null) {
            remark = (String) body.get("remarks");
        }
        String author = principal != null && principal.getName() != null ? principal.getName() : "Admin";
        AttendanceRecord updated = attendanceService.updateStudentRemark(scheduleId, studentId, remark, author);
        return ApiResponse.ok(updated, "Student remark updated successfully");
    }

    @PutMapping("/trainer/remark")
    public ApiResponse<TrainerAttendanceRecord> updateTrainerRemark(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal com.zoroacademy.security.UserPrincipal principal) {
        String scheduleId = (String) body.get("scheduleId");
        String trainerId = (String) body.get("trainerId");
        String remark = (String) body.get("remark");
        if (remark == null) {
            remark = (String) body.get("remarks");
        }
        String author = principal != null && principal.getName() != null ? principal.getName() : "Admin";
        TrainerAttendanceRecord updated = attendanceService.updateTrainerRemark(scheduleId, trainerId, remark, author);
        return ApiResponse.ok(updated, "Trainer remark updated successfully");
    }

    @PutMapping("/trainer/{id}/remark")
    public ApiResponse<TrainerAttendanceRecord> updateTrainerRemarkById(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal com.zoroacademy.security.UserPrincipal principal) {
        String scheduleId = (String) body.get("scheduleId");
        String trainerId = (String) body.get("trainerId");
        String remark = (String) body.get("remark");
        if (remark == null) {
            remark = (String) body.get("remarks");
        }
        String author = principal != null && principal.getName() != null ? principal.getName() : "Admin";
        TrainerAttendanceRecord updated = attendanceService.updateTrainerRemark(scheduleId, trainerId, remark, author);
        return ApiResponse.ok(updated, "Trainer remark updated successfully");
    }

    @PutMapping("/correction")
    public ApiResponse<AttendanceRecord> correctStudentAttendance(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal com.zoroacademy.security.UserPrincipal principal) {
        String scheduleId = (String) body.get("scheduleId");
        String studentId = (String) body.get("studentId");
        String status = (String) body.get("status");
        String remark = (String) body.get("remark");
        if (remark == null) {
            remark = (String) body.get("remarks");
        }
        String author = principal != null && principal.getName() != null ? principal.getName() : "Trainer";
        AttendanceRecord updated = attendanceService.correctStudentAttendance(scheduleId, studentId, status, remark, author);
        return ApiResponse.ok(updated, "Attendance corrected successfully");
    }

    @PostMapping
    public ApiResponse<AttendanceRecord> recordAttendance(@RequestBody Object record) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Manual attendance marking is disabled. Attendance is recorded automatically upon session join/start or when session ends."
        );
    }

    @PostMapping("/batch")
    public ApiResponse<List<AttendanceRecord>> recordBatchAttendance(@RequestBody Object records) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Manual attendance marking is disabled. Attendance is recorded automatically upon session join/start or when session ends."
        );
    }
}
