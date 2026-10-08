package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.AttendanceRecord;
import com.zoroacademy.service.AttendanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping
    public ApiResponse<AttendanceRecord> recordAttendance(@RequestBody AttendanceRecord record) {
        return ApiResponse.ok(attendanceService.recordAttendance(record), "Attendance recorded");
    }

    @PostMapping("/batch")
    public ApiResponse<List<AttendanceRecord>> recordBatchAttendance(@RequestBody List<AttendanceRecord> records) {
        return ApiResponse.ok(attendanceService.recordBatchAttendance(records), "Batch attendance recorded");
    }
}
