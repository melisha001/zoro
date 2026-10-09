package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Batch;
import com.zoroacademy.service.BatchService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping
    public ApiResponse<List<Batch>> getBatches(@RequestParam(required = false) String courseId,
                                              @RequestParam(required = false) String trainerId) {
        if (courseId != null && !courseId.isBlank()) {
            return ApiResponse.ok(batchService.getBatchesByCourse(courseId));
        }
        if (trainerId != null && !trainerId.isBlank()) {
            return ApiResponse.ok(batchService.getBatchesByTrainer(trainerId));
        }
        return ApiResponse.ok(batchService.getAllBatches());
    }

    @GetMapping("/course/{courseId}")
    public ApiResponse<List<Batch>> getBatchesByCourseId(@PathVariable String courseId) {
        return ApiResponse.ok(batchService.getBatchesByCourse(courseId));
    }

    @GetMapping("/trainer/{trainerId}")
    public ApiResponse<List<Batch>> getBatchesByTrainerId(@PathVariable String trainerId) {
        return ApiResponse.ok(batchService.getBatchesByTrainer(trainerId));
    }

    @GetMapping("/{id}")
    public ApiResponse<Batch> getBatchById(@PathVariable String id) {
        return ApiResponse.ok(batchService.getBatchById(id));
    }

    @GetMapping("/{id}/students")
    public ApiResponse<List<com.zoroacademy.dto.UserDto>> getStudentsInBatch(@PathVariable String id) {
        return ApiResponse.ok(batchService.getStudentsInBatch(id));
    }

    @PostMapping
    public ApiResponse<Batch> createBatch(@RequestBody Batch batch) {
        return ApiResponse.ok(batchService.createBatch(batch), "Batch created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<Batch> updateBatch(@PathVariable String id, @RequestBody Batch batch) {
        return ApiResponse.ok(batchService.updateBatch(id, batch), "Batch updated successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteBatch(@PathVariable String id) {
        batchService.deleteBatch(id);
        return ApiResponse.ok(true, "Batch deleted successfully");
    }
}
