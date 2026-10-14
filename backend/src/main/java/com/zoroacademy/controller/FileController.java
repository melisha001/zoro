package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.StoredFile;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.FileStorageService;
import com.zoroacademy.service.CourseService;
import com.zoroacademy.service.ScheduleService;
import com.zoroacademy.repository.CompetitionRepository;
import com.zoroacademy.entity.Competition;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final CompetitionRepository competitionRepository;
    private final com.zoroacademy.repository.CourseModuleRepository courseModuleRepository;
    private final CourseService courseService;
    private final com.zoroacademy.repository.ScheduleRepository scheduleRepository;
    private final ScheduleService scheduleService;

    public FileController(FileStorageService fileStorageService,
                          CompetitionRepository competitionRepository,
                          @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.CourseModuleRepository courseModuleRepository,
                          @org.springframework.beans.factory.annotation.Autowired(required = false) CourseService courseService,
                          @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.ScheduleRepository scheduleRepository,
                          @org.springframework.beans.factory.annotation.Autowired(required = false) ScheduleService scheduleService) {
        this.fileStorageService = fileStorageService;
        this.competitionRepository = competitionRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.courseService = courseService;
        this.scheduleRepository = scheduleRepository;
        this.scheduleService = scheduleService;
    }

    @PostMapping(value = {"", "/upload"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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
        result.put("url", fileStorageService.getFileUrl(storedFile));
        result.put("name", storedFile.getOriginalName());
        result.put("size", storedFile.getSizeBytes());
        result.put("contentType", storedFile.getContentType());
        result.put("category", storedFile.getCategory());
        result.put("isPublic", storedFile.getIsPublic());
        result.put("storagePath", storedFile.getStoragePath());
        result.put("refCount", storedFile.getRefCount());

        return ApiResponse.ok(result, "File uploaded successfully");
    }

    @GetMapping("/{id}/meta")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoredFile> getFileMetadata(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);
        return ApiResponse.ok(storedFile);
    }

    @GetMapping("/{id}/link")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFileLink(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);

        if (!Boolean.TRUE.equals(storedFile.getIsPublic())) {
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Authentication required to access private file"));
            }

            String userId = currentUser.getId();
            String userEmail = currentUser.getEmail();
            String roleUpper = currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "";

            boolean isAdmin = roleUpper.equals("ADMIN") || roleUpper.equals("SUPER_ADMIN");
            boolean isOwner = userId != null && userId.equals(storedFile.getOwnerId());

            if (!isAdmin && !isOwner) {
                boolean isTrainer = roleUpper.equals("TRAINER");
                boolean isStudent = roleUpper.equals("STUDENT");

                if (isStudent) {
                    if (courseModuleRepository != null && courseService != null) {
                        java.util.List<com.zoroacademy.entity.CourseModule> modules = courseModuleRepository.findByAnyFileUrlContaining(id);
                        for (com.zoroacademy.entity.CourseModule mod : modules) {
                            if (mod.getCourse() != null && courseService.isModuleLockedForStudent(mod.getCourse().getId(), mod.getId(), userId, userEmail)) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Module is locked"));
                            }
                        }
                    }

                    if (scheduleRepository != null && scheduleService != null) {
                        java.util.List<com.zoroacademy.entity.Schedule> schedules = scheduleRepository.findByAnyFileUrlContaining(id);
                        for (com.zoroacademy.entity.Schedule s : schedules) {
                            if (scheduleService.isScheduleLockedForStudent(s, userId, userEmail)) {
                                String unlockLabel = com.zoroacademy.util.ScheduleTimeUtil.formatUnlockTime(s.getDate(), s.getTime(), scheduleService.getResourcesUnlockMinutes());
                                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Schedule resources are locked. " + unlockLabel));
                            }
                        }
                    }
                }

                String cat = (storedFile.getCategory() != null ? storedFile.getCategory().toLowerCase() : "");

                if (cat.contains("submission") || cat.contains("doubt")) {
                    if (!isTrainer) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: You do not have permission to access this file link"));
                    }
                } else if (cat.contains("notes") || cat.contains("worksheet") || cat.contains("assignment") || cat.contains("assessment") || cat.contains("resource") || cat.contains("attachment") || cat.contains("module")) {
                    if (!isStudent && !isTrainer) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: You do not have permission to access this file link"));
                    }
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: You do not have permission to access this file link"));
                }
            }
        }

        Map<String, Object> linkData = fileStorageService.generateFileLink(storedFile, 7200);
        return ResponseEntity.ok(ApiResponse.ok(linkData));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getFile(
            @PathVariable String id,
            @RequestParam(value = "token", required = false) String token,
            @RequestParam(value = "expires", required = false) Long expires,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);

        // Security check for non-public files
        if (!Boolean.TRUE.equals(storedFile.getIsPublic())) {
            boolean hasValidToken = token != null && expires != null && fileStorageService.validateInternalToken(id, token, expires);

            if (!hasValidToken) {
                if (currentUser == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }

                String userId = currentUser.getId();
                String userEmail = currentUser.getEmail();
                String roleUpper = currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "";

                boolean isAdmin = roleUpper.equals("ADMIN") || roleUpper.equals("SUPER_ADMIN");
                boolean isOwner = userId != null && userId.equals(storedFile.getOwnerId());

                if (!isAdmin && !isOwner) {
                    boolean isTrainer = roleUpper.equals("TRAINER");
                    boolean isStudent = roleUpper.equals("STUDENT");

                    if (isStudent) {
                        if (courseModuleRepository != null && courseService != null) {
                            java.util.List<com.zoroacademy.entity.CourseModule> modules = courseModuleRepository.findByAnyFileUrlContaining(id);
                            for (com.zoroacademy.entity.CourseModule mod : modules) {
                                if (mod.getCourse() != null && courseService.isModuleLockedForStudent(mod.getCourse().getId(), mod.getId(), userId, userEmail)) {
                                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                                }
                            }
                        }

                        if (scheduleRepository != null && scheduleService != null) {
                            java.util.List<com.zoroacademy.entity.Schedule> schedules = scheduleRepository.findByAnyFileUrlContaining(id);
                            for (com.zoroacademy.entity.Schedule s : schedules) {
                                if (scheduleService.isScheduleLockedForStudent(s, userId, userEmail)) {
                                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                                }
                            }
                        }
                    }

                    String cat = (storedFile.getCategory() != null ? storedFile.getCategory().toLowerCase() : "");

                    if (cat.contains("submission") || cat.contains("doubt")) {
                        if (!isTrainer) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                        }
                    } else if (cat.contains("notes") || cat.contains("worksheet") || cat.contains("assignment") || cat.contains("assessment") || cat.contains("resource") || cat.contains("attachment") || cat.contains("module")) {
                        if (!isStudent && !isTrainer) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                        }
                    } else {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
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

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadPublicFile(
            @PathVariable String id,
            @RequestParam(value = "title", required = false) String titleParam
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);
        if (!Boolean.TRUE.equals(storedFile.getIsPublic())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = fileStorageService.loadFileAsResource(storedFile);
        if (resource == null || !resource.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String competitionTitle = null;
        if (titleParam != null && !titleParam.isBlank()) {
            competitionTitle = titleParam.trim();
        } else {
            List<Competition> comps = competitionRepository.findByRulesPdfUrlContaining(id);
            if (!comps.isEmpty()) {
                competitionTitle = comps.get(0).getTitle();
            }
        }
        if (competitionTitle == null || competitionTitle.isBlank()) {
            competitionTitle = "competition";
        }

        String sanitizedTitle = competitionTitle.replaceAll("[^a-zA-Z0-9.-]", "_");
        String downloadFilename = sanitizedTitle + "-rules.pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFilename + "\"")
                .header("X-Content-Type-Options", "nosniff")
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
