package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.StoredFile;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.FileAccessResult;
import com.zoroacademy.service.FileAccessService;
import com.zoroacademy.service.FileStorageService;
import com.zoroacademy.repository.CompetitionRepository;
import com.zoroacademy.entity.Competition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final FileAccessService fileAccessService;
    private final CompetitionRepository competitionRepository;

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    public FileController(FileStorageService fileStorageService,
                          FileAccessService fileAccessService,
                          CompetitionRepository competitionRepository) {
        this.fileStorageService = fileStorageService;
        this.fileAccessService = fileAccessService;
        this.competitionRepository = competitionRepository;
    }

    public static String resolveMimeType(String originalName, String defaultType) {
        if (originalName == null) {
            return (defaultType != null && !defaultType.isBlank()) ? defaultType : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        String lower = originalName.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
        if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".ogg")) return "audio/ogg";
        if (lower.endsWith(".txt")) return "text/plain";
        if (lower.endsWith(".csv")) return "text/csv";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".zip")) return "application/zip";

        if (defaultType != null && !defaultType.isBlank() && !defaultType.equals(MediaType.APPLICATION_OCTET_STREAM_VALUE)) {
            return defaultType;
        }

        return org.springframework.http.MediaTypeFactory
                .getMediaType(originalName)
                .map(MediaType::toString)
                .orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);
    }

    private UserPrincipal resolvePrincipal(Object principal) {
        if (principal instanceof UserPrincipal up) {
            return up;
        }
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails ud) {
            String role = ud.getAuthorities().stream()
                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                    .map(a -> a.replace("ROLE_", ""))
                    .findFirst().orElse("STUDENT");
            return new UserPrincipal(ud.getUsername(), ud.getUsername(), ud.getUsername(), role, "N/A", ud.getAuthorities());
        }
        return null;
    }

    @PostMapping(value = {"", "/upload"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false, defaultValue = "document") String category,
            @AuthenticationPrincipal Object principal
    ) {
        UserPrincipal currentUser = resolvePrincipal(principal);
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
            @AuthenticationPrincipal Object principal
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);
        return ApiResponse.ok(storedFile);
    }

    @GetMapping("/{id}/link")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFileLink(
            @PathVariable String id,
            @RequestParam(value = "download", required = false, defaultValue = "false") boolean download,
            @AuthenticationPrincipal Object principal
    ) {
        UserPrincipal currentUser = resolvePrincipal(principal);
        StoredFile storedFile = fileStorageService.getFileMetadata(id);
        if (storedFile == null) {
            Map<String, Object> errData = new HashMap<>();
            errData.put("code", "NOT_FOUND");
            errData.put("message", "File not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("NOT_FOUND", "File not found", errData));
        }

        FileAccessResult accessResult = fileAccessService.checkAccess(storedFile, currentUser);
        if (!accessResult.isAllowed()) {
            Map<String, Object> errData = new HashMap<>();
            errData.put("code", accessResult.getCode());
            errData.put("message", accessResult.getMessage());
            if (accessResult.getUnlockAt() != null) {
                errData.put("unlockAt", accessResult.getUnlockAt());
            }
            HttpStatus status = "NOT_FOUND".equals(accessResult.getCode()) ? HttpStatus.NOT_FOUND
                    : "AUTH_REQUIRED".equals(accessResult.getCode()) ? HttpStatus.UNAUTHORIZED
                    : HttpStatus.FORBIDDEN;
            return ResponseEntity.status(status).body(ApiResponse.error(accessResult.getCode(), accessResult.getMessage(), errData));
        }

        Map<String, Object> linkData = fileStorageService.generateFileLink(storedFile, 7200);
        if (download && linkData != null && linkData.containsKey("url")) {
            String url = (String) linkData.get("url");
            if (url != null && !url.contains("download=")) {
                String sep = url.contains("?") ? "&" : "?";
                linkData.put("url", url + sep + "download=true");
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(linkData));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFile(
            @PathVariable String id,
            @RequestParam(value = "token", required = false) String token,
            @RequestParam(value = "expires", required = false) Long expires,
            @RequestParam(value = "download", required = false, defaultValue = "false") boolean download,
            @RequestHeader HttpHeaders headers,
            @AuthenticationPrincipal Object principal
    ) {
        UserPrincipal currentUser = resolvePrincipal(principal);
        StoredFile storedFile = fileStorageService.getFileMetadata(id);
        if (storedFile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .header("X-Error-Code", "NOT_FOUND")
                    .body(ApiResponse.error("NOT_FOUND", "File not found"));
        }

        if (download) {
            String cat = storedFile.getCategory() != null ? storedFile.getCategory().toLowerCase() : "";
            if (cat.contains("notes") || cat.contains("worksheet") || cat.contains("assignment") || cat.contains("schedule")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .header("X-Error-Code", "DOWNLOAD_FORBIDDEN")
                        .body(ApiResponse.error("DOWNLOAD_FORBIDDEN", "Download is disabled for view-only resources"));
            }
        }

        // Security check for non-public files
        if (!Boolean.TRUE.equals(storedFile.getIsPublic())) {
            boolean hasValidToken = token != null && expires != null && fileStorageService.validateInternalToken(id, token, expires);

            if (!hasValidToken) {
                FileAccessResult accessResult = fileAccessService.checkAccess(storedFile, currentUser);
                if (!accessResult.isAllowed()) {
                    HttpStatus status = "NOT_FOUND".equals(accessResult.getCode()) ? HttpStatus.NOT_FOUND
                            : "AUTH_REQUIRED".equals(accessResult.getCode()) ? HttpStatus.UNAUTHORIZED
                            : HttpStatus.FORBIDDEN;
                    return ResponseEntity.status(status)
                            .header("X-Error-Code", accessResult.getCode())
                            .header("X-Error-Message", accessResult.getMessage())
                            .body(ApiResponse.error(accessResult.getCode(), accessResult.getMessage()));
                }
            }
        }

        Resource resource = fileStorageService.loadFileAsResource(storedFile);
        String mediaType = resolveMimeType(storedFile.getOriginalName(), storedFile.getContentType());

        ContentDisposition contentDisposition = ContentDisposition.builder(download ? "attachment" : "inline")
                .filename(storedFile.getOriginalName(), StandardCharsets.UTF_8)
                .build();

        String allowedOriginsCsp = String.join(" ", allowedOrigins != null ? allowedOrigins.split(",") : new String[]{"http://localhost:5173"});

        // Check for Range header for streaming (especially video and audio)
        List<org.springframework.http.HttpRange> ranges = headers.getRange();
        if (!ranges.isEmpty() && !download) {
            try {
                long contentLength = resource.contentLength();
                org.springframework.http.HttpRange range = ranges.get(0);
                long start = range.getRangeStart(contentLength);
                long end = range.getRangeEnd(contentLength);
                long rangeLength = Math.min(1024 * 1024 * 2, end - start + 1);
                org.springframework.core.io.support.ResourceRegion region = new org.springframework.core.io.support.ResourceRegion(resource, start, rangeLength);
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .header(HttpHeaders.CONTENT_TYPE, mediaType)
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                        .header("Content-Security-Policy", "frame-ancestors 'self' " + allowedOriginsCsp)
                        .body(region);
            } catch (Exception e) {
                // Fallback to full resource if range parsing fails
            }
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .header("Content-Security-Policy", "frame-ancestors 'self' " + allowedOriginsCsp)
                .body(resource);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadPublicFile(
            @PathVariable String id,
            @RequestParam(value = "title", required = false) String titleParam
    ) {
        StoredFile storedFile = fileStorageService.getFileMetadata(id);
        if (storedFile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        if (!Boolean.TRUE.equals(storedFile.getIsPublic())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        String cat = storedFile.getCategory() != null ? storedFile.getCategory().toLowerCase() : "";
        if (cat.contains("notes") || cat.contains("worksheet") || cat.contains("assignment") || cat.contains("schedule")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
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

        ContentDisposition disposition = ContentDisposition.builder("attachment")
                .filename(downloadFilename, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
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
