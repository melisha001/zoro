package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.StoredFile;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false, defaultValue = "document") String category,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        String ownerId = (currentUser != null ? currentUser.getId() : null);
        StoredFile storedFile = fileStorageService.storeFile(file, category, ownerId);

        Map<String, Object> result = new HashMap<>();
        result.put("id", storedFile.getId());
        result.put("url", "/api/files/" + storedFile.getId());
        result.put("name", storedFile.getOriginalName());
        result.put("size", storedFile.getSizeBytes());
        result.put("contentType", storedFile.getContentType());
        result.put("category", storedFile.getCategory());
        result.put("isPublic", storedFile.getIsPublic());

        return ApiResponse.ok(result, "File uploaded successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getFile(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);

        // Security check for non-public files
        if (!Boolean.TRUE.equals(storedFile.getIsPublic())) {
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String userId = currentUser.getId();
            String roleUpper = currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "";

            boolean isAdmin = roleUpper.equals("ADMIN") || roleUpper.equals("SUPER_ADMIN");
            boolean isOwner = userId != null && userId.equals(storedFile.getOwnerId());

            if (!isAdmin && !isOwner) {
                // Check if user is trainer or student and file is educational content/submission
                boolean isTrainer = roleUpper.equals("TRAINER");
                boolean isStudent = roleUpper.equals("STUDENT");
                String cat = (storedFile.getCategory() != null ? storedFile.getCategory().toLowerCase() : "");

                if (cat.contains("submission") || cat.contains("doubt")) {
                    if (!isTrainer) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
                } else if (cat.contains("notes") || cat.contains("worksheet") || cat.contains("assignment") || cat.contains("resource") || cat.contains("attachment") || cat.contains("module")) {
                    if (!isStudent && !isTrainer) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }
        }

        Resource resource = fileStorageService.loadFileAsResource(storedFile);
        String mediaType = storedFile.getContentType() != null ? storedFile.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + storedFile.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteFile(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);
        String roleUpper = (currentUser != null && currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "");
        boolean isAdmin = roleUpper.equals("ADMIN") || roleUpper.equals("SUPER_ADMIN");
        boolean isOwner = currentUser != null && currentUser.getId() != null && currentUser.getId().equals(storedFile.getOwnerId());

        if (!isAdmin && !isOwner) {
            return ApiResponse.error("You do not have permission to delete this file");
        }

        fileStorageService.deleteFile(id);
        return ApiResponse.ok(null, "File deleted successfully");
    }
}
