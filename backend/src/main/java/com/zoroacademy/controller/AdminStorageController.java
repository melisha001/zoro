package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.CleanupResultDto;
import com.zoroacademy.dto.StorageMetricsDto;
import com.zoroacademy.service.StorageCleanupService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/storage")
public class AdminStorageController {

    private final StorageCleanupService storageCleanupService;

    public AdminStorageController(StorageCleanupService storageCleanupService) {
        this.storageCleanupService = storageCleanupService;
    }

    @GetMapping("/metrics")
    public ApiResponse<StorageMetricsDto> getMetrics() {
        return ApiResponse.ok(storageCleanupService.getMetrics());
    }

    @PostMapping("/cleanup")
    public ApiResponse<CleanupResultDto> triggerCleanup(
            @RequestParam(defaultValue = "false") boolean dryRun,
            @RequestParam(required = false) Integer cutoffHours
    ) {
        int cutoff = cutoffHours != null ? Math.max(0, cutoffHours) : 24;
        CleanupResultDto result = storageCleanupService.runCleanup(dryRun, cutoff);
        return ApiResponse.ok(result);
    }

    @PutMapping("/settings")
    public ApiResponse<StorageMetricsDto> updateSettings(@RequestBody Map<String, Object> body) {
        if (body != null && body.containsKey("submissionRetentionMonths")) {
            try {
                int months = Integer.parseInt(body.get("submissionRetentionMonths").toString().trim());
                storageCleanupService.setSubmissionRetentionMonths(months);
            } catch (Exception ignored) {}
        }
        return ApiResponse.ok(storageCleanupService.getMetrics());
    }
}
