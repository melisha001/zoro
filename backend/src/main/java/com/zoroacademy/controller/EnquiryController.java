package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Enquiry;
import com.zoroacademy.service.EnquiryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enquiries")
public class EnquiryController {

    private final EnquiryService enquiryService;
    public EnquiryController(EnquiryService enquiryService) {
        this.enquiryService = enquiryService;
    }


    @GetMapping
    public ApiResponse<List<Enquiry>> getEnquiries() {
        return ApiResponse.ok(enquiryService.getAllEnquiries());
    }

    @PostMapping
    public ApiResponse<Enquiry> createEnquiry(@RequestBody Enquiry enquiry) {
        return ApiResponse.ok(enquiryService.createEnquiry(enquiry), "Enquiry submitted successfully");
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Enquiry> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ApiResponse.ok(enquiryService.updateEnquiryStatus(id, status), "Status updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteEnquiry(@PathVariable String id) {
        enquiryService.deleteEnquiry(id);
        return ApiResponse.ok(true, "Enquiry deleted successfully");
    }
}
