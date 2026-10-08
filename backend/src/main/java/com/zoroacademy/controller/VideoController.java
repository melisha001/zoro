package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.VideoPlaybackResponse;
import com.zoroacademy.dto.VideoUploadRequest;
import com.zoroacademy.dto.VideoUploadResponse;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.BunnyStreamService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final BunnyStreamService bunnyStreamService;
    public VideoController(BunnyStreamService bunnyStreamService) {
        this.bunnyStreamService = bunnyStreamService;
    }

    /**
     * Admin/Trainer endpoint to initiate video upload session on Bunny Stream.
     */
    @PostMapping("/upload-session")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER')")
    public ApiResponse<VideoUploadResponse> createUploadSession(@RequestBody VideoUploadRequest request) {
        VideoUploadResponse response = bunnyStreamService.createUploadSession(request);
        return ApiResponse.ok(response, "Upload session created successfully");
    }

    /**
     * Secure video playback authorization endpoint for students, trainers, and admins.
     * User identity is strictly resolved from the authenticated JWT principal.
     */
    @GetMapping("/{id}/playback")
    public ApiResponse<VideoPlaybackResponse> getPlaybackAuthorization(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        if (principal == null) {
            return ApiResponse.error("Authentication required to access video playback");
        }

        String effectiveUser = principal.getId();
        String effectiveRole = principal.getRole();
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp != null && !clientIp.isBlank()) {
            clientIp = clientIp.split(",")[0].trim();
        } else {
            clientIp = request.getRemoteAddr();
        }

        VideoPlaybackResponse response = bunnyStreamService.getPlaybackAuthorization(id, effectiveUser, effectiveRole, clientIp);
        if (response.isAuthorized()) {
            return ApiResponse.ok(response, response.getMessage());
        } else {
            return ApiResponse.error(response.getMessage());
        }
    }
}
