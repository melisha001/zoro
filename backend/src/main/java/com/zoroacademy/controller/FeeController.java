package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.StudentFee;
import com.zoroacademy.service.FeeService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    private final FeeService feeService;
    public FeeController(FeeService feeService) {
        this.feeService = feeService;
    }


    @GetMapping
    public ApiResponse<List<StudentFee>> getFeeRecords() {
        return ApiResponse.ok(feeService.getAllFeeRecords());
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getFeeStats() {
        return ApiResponse.ok(feeService.getFeeStats());
    }

    @GetMapping("/{id}")
    public ApiResponse<StudentFee> getFeeById(@PathVariable String id) {
        return ApiResponse.ok(feeService.getFeeById(id));
    }

    @PostMapping
    public ApiResponse<StudentFee> createFeeRecord(@RequestBody StudentFee fee) {
        return ApiResponse.ok(feeService.createFeeRecord(fee), "Fee record created");
    }

    @PostMapping("/{id}/payments")
    public ApiResponse<StudentFee> recordPayment(@PathVariable String id, @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String method = (String) body.get("paymentMethod");
        String ref = (String) body.get("transactionRef");
        String notes = (String) body.get("notes");

        StudentFee updated = feeService.recordPayment(id, amount, method, ref, notes);
        return ApiResponse.ok(updated, "Payment recorded successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteFeeRecord(@PathVariable String id) {
        feeService.deleteFeeRecord(id);
        return ApiResponse.ok(true, "Fee record deleted successfully");
    }

    @DeleteMapping("/payments/{paymentId}")
    public ApiResponse<StudentFee> deletePayment(@PathVariable String paymentId) {
        StudentFee updated = feeService.deletePayment(paymentId);
        return ApiResponse.ok(updated, "Payment deleted successfully");
    }
}
