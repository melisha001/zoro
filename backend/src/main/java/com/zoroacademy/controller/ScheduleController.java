package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Schedule;
import com.zoroacademy.service.ScheduleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;
    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }


    @GetMapping
    public ApiResponse<List<Schedule>> getSchedules() {
        return ApiResponse.ok(scheduleService.getAllSchedules());
    }

    @GetMapping("/trainer/{trainer}")
    public ApiResponse<List<Schedule>> getTrainerSchedules(@PathVariable String trainer) {
        return ApiResponse.ok(scheduleService.getTrainerSchedules(trainer));
    }

    @PostMapping
    public ApiResponse<Schedule> createSchedule(@RequestBody Schedule schedule) {
        return ApiResponse.ok(scheduleService.createSchedule(schedule), "Schedule created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<Schedule> updateSchedule(@PathVariable String id, @RequestBody Schedule schedule) {
        return ApiResponse.ok(scheduleService.updateSchedule(id, schedule), "Schedule updated successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteSchedule(@PathVariable String id) {
        scheduleService.deleteSchedule(id);
        return ApiResponse.ok(true, "Schedule deleted successfully");
    }
}
