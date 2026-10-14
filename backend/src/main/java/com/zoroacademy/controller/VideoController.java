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
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER', 'STUDENT')")
    public ApiResponse<VideoUploadResponse> createUploadSession(@RequestBody VideoUploadRequest request) {
        VideoUploadResponse response = bunnyStreamService.createUploadSession(request);
        return ApiResponse.ok(response, "Upload session created successfully");
    }

    /**
     * Get video details and status.
     */
    @GetMapping("/{id}")
    public ApiResponse<com.zoroacademy.entity.Video> getVideoDetails(@PathVariable String id) {
        com.zoroacademy.entity.Video video = bunnyStreamService.getVideoDetails(id);
        if (video != null) {
            return ApiResponse.ok(video, "Video retrieved successfully");
        } else {
            return ApiResponse.error("Video not found");
        }
    }

    /**
     * Delete video from Bunny CDN and database.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER')")
    public ApiResponse<Void> deleteVideo(@PathVariable String id) {
        bunnyStreamService.deleteVideo(id);
        return ApiResponse.ok(null, "Video deleted successfully");
    }

    /**
     * Secure video playback authorization endpoint for students, trainers, and admins.
     * User identity is strictly resolved from the authenticated JWT principal.
     */
    @GetMapping("/{id}/playback")
    public org.springframework.http.ResponseEntity<ApiResponse<VideoPlaybackResponse>> getPlaybackAuthorization(
            @PathVariable String id,
            @RequestParam(required = false) String courseId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        if (principal == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required to access video playback"));
        }

        String effectiveUser = principal.getId();
        String userEmail = principal.getEmail();
        String effectiveRole = principal.getRole();
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp != null && !clientIp.isBlank()) {
            clientIp = clientIp.split(",")[0].trim();
        } else {
            clientIp = request.getRemoteAddr();
        }

        VideoPlaybackResponse response = bunnyStreamService.getPlaybackAuthorization(id, courseId, effectiveUser, userEmail, effectiveRole, clientIp);
        if (response.isAuthorized()) {
            return org.springframework.http.ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
        } else {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(response.getMessage()));
        }
    }
}
