package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Doubt;
import com.zoroacademy.service.DoubtService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doubts")
public class DoubtController {

    private final DoubtService doubtService;
    public DoubtController(DoubtService doubtService) {
        this.doubtService = doubtService;
    }


    @GetMapping
    public ApiResponse<List<Doubt>> getDoubts() {
        return ApiResponse.ok(doubtService.getAllDoubts());
    }

    @GetMapping("/trainer/{trainer}")
    public ApiResponse<List<Doubt>> getDoubtsByTrainer(@PathVariable String trainer) {
        return ApiResponse.ok(doubtService.getDoubtsByTrainer(trainer));
    }

    @PostMapping
    public ApiResponse<Doubt> createDoubt(@RequestBody Doubt doubt) {
        return ApiResponse.ok(doubtService.createDoubt(doubt), "Doubt submitted successfully");
    }

    @PutMapping("/{id}/reply")
    public ApiResponse<Doubt> replyToDoubt(@PathVariable String id, @RequestBody Map<String, String> body) {
        String reply = body.get("reply");
        String trainerName = body.get("trainerName");
        return ApiResponse.ok(doubtService.replyToDoubt(id, reply, trainerName), "Reply submitted");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteDoubt(@PathVariable String id) {
        doubtService.deleteDoubt(id);
        return ApiResponse.ok(true, "Doubt deleted successfully");
    }
}
