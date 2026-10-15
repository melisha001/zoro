package com.zoroacademy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.dto.BunnyWebhookPayload;
import com.zoroacademy.dto.VideoPlaybackResponse;
import com.zoroacademy.dto.VideoUploadRequest;
import com.zoroacademy.dto.VideoUploadResponse;
import com.zoroacademy.entity.CourseModule;
import com.zoroacademy.entity.Video;
import com.zoroacademy.repository.CourseModuleRepository;
import com.zoroacademy.repository.EnrollmentRepository;
import com.zoroacademy.repository.VideoRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class BunnyStreamService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BunnyStreamService.class);

    private final BunnyStreamProperties properties;
    private final BunnyTokenService tokenService;
    private final VideoRepository videoRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final com.zoroacademy.repository.AssignmentSubmissionRepository submissionRepository;
    private final com.zoroacademy.repository.StudentModuleProgressRepository studentModuleProgressRepository;
    private final com.zoroacademy.repository.StudentProgressRepository studentProgressRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public BunnyStreamService(BunnyStreamProperties properties,
                              BunnyTokenService tokenService,
                              VideoRepository videoRepository,
                              EnrollmentRepository enrollmentRepository,
                              CourseModuleRepository courseModuleRepository,
                              @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.AssignmentSubmissionRepository submissionRepository,
                              @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.StudentModuleProgressRepository studentModuleProgressRepository,
                              @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.StudentProgressRepository studentProgressRepository) {
        this.properties = properties;
        this.tokenService = tokenService;
        this.videoRepository = videoRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.submissionRepository = submissionRepository;
        this.studentModuleProgressRepository = studentModuleProgressRepository;
        this.studentProgressRepository = studentProgressRepository;
    }

    public BunnyStreamService(BunnyStreamProperties properties,
                              BunnyTokenService tokenService,
                              VideoRepository videoRepository,
                              EnrollmentRepository enrollmentRepository,
                              CourseModuleRepository courseModuleRepository) {
        this(properties, tokenService, videoRepository, enrollmentRepository, courseModuleRepository, null, null, null);
    }

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    private String sha256Hex(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 calculation failed", e);
        }
    }

    /**
     * Creates an upload session with Bunny Stream API.
     */
    @Transactional
    public VideoUploadResponse createUploadSession(VideoUploadRequest request) {
        String videoTitle = (request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle()
                : "Lesson Video " + System.currentTimeMillis();

        int libraryId = (properties.getLibraryId() != null && !properties.getLibraryId().isBlank()) ? Integer.parseInt(properties.getLibraryId()) : 0;
        String videoId;
        try {
            String url = String.format("https://video.bunnycdn.com/library/%d/videos", libraryId);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("AccessKey", properties.getApiKey());
            headers.set("Accept", "application/json");

            Map<String, String> body = new HashMap<>();
            body.put("title", videoTitle);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response);
            videoId = root.path("guid").asText();
            if (videoId == null || videoId.isBlank()) {
                videoId = UUID.randomUUID().toString();
            }
        } catch (Exception e) {
            log.warn("Could not connect to external Bunny API, creating local video entity: {}", e.getMessage());
            videoId = UUID.randomUUID().toString();
        }

        String streamUrl = String.format("https://%s/%s/playlist.m3u8", properties.getCdnHost(), videoId);
        String tusEndpoint = "https://video.bunnycdn.com/tusupload";

        long expirationTime = (System.currentTimeMillis() / 1000) + 86400;
        String authSignature = sha256Hex(libraryId + properties.getApiKey() + expirationTime + videoId);

        Video video = Video.builder()
                .id(videoId)
                .bunnyVideoId(videoId)
                .libraryId(libraryId)
                .title(videoTitle)
                .courseId(request.getCourseId())
                .moduleId(request.getModuleId())
                .durationSeconds(0)
                .status(0)
                .statusLabel("Created")
                .storageKey("bunny_" + videoId)
                .directStreamUrl(streamUrl)
                .hlsPlaylistUrl(streamUrl)
                .thumbnailUrl(String.format("https://%s/%s/thumbnail.jpg", properties.getCdnHost(), videoId))
                .build();

        videoRepository.save(video);

        return VideoUploadResponse.builder()
                .videoId(videoId)
                .libraryId(libraryId)
                .uploadUrl(tusEndpoint)
                .authorizationSignature(authSignature)
                .authorizationExpire(expirationTime)
                .tusEndpoint(tusEndpoint)
                .directStreamUrl(streamUrl)
                .title(videoTitle)
                .status("Created")
                .build();
    }

    @Transactional
    public Video getVideoDetails(String videoId) {
        if (videoId == null || videoId.isBlank()) return null;

        Optional<Video> videoOpt = videoRepository.findById(videoId)
                .or(() -> videoRepository.findByBunnyVideoId(videoId));

        if (videoOpt.isEmpty()) {
            return null;
        }

        Video video = videoOpt.get();
        if (video.getStatus() == null || video.getStatus() != 3) {
            try {
                String url = String.format("https://video.bunnycdn.com/library/%d/videos/%s",
                        video.getLibraryId(), video.getBunnyVideoId());
                HttpHeaders headers = new HttpHeaders();
                headers.set("AccessKey", properties.getApiKey());
                headers.set("Accept", "application/json");

                HttpEntity<Void> entity = new HttpEntity<>(headers);
                String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
                if (response != null) {
                    JsonNode root = objectMapper.readTree(response);
                    int statusInt = root.path("status").asInt(video.getStatus() != null ? video.getStatus() : 0);
                    int lengthSec = root.path("length").asInt(video.getDurationSeconds() != null ? video.getDurationSeconds() : 0);

                    video.setStatus(statusInt);
                    video.setStatusLabel(mapBunnyStatus(statusInt));
                    if (lengthSec > 0) {
                        video.setDurationSeconds(lengthSec);
                    }
                    video.setUpdatedAt(LocalDateTime.now());
                    videoRepository.save(video);

                    if (video.getModuleId() != null && statusInt == 3 && lengthSec > 0) {
                        courseModuleRepository.findById(video.getModuleId()).ifPresent(mod -> {
                            if (mod.getDuration() == null || mod.getDuration().isBlank() || "Lesson Video".equalsIgnoreCase(mod.getDuration())) {
                                int mins = lengthSec / 60;
                                int secs = lengthSec % 60;
                                mod.setDuration(String.format("%d:%02d", mins, secs));
                                courseModuleRepository.save(mod);
                            }
                        });
                    }
                }
            } catch (Exception e) {
                log.debug("Could not sync video status from Bunny CDN: {}", e.getMessage());
            }
        }
        return video;
    }

    @Transactional
    public void deleteVideo(String videoId) {
        if (videoId == null || videoId.isBlank()) return;
        Optional<Video> videoOpt = videoRepository.findById(videoId)
                .or(() -> videoRepository.findByBunnyVideoId(videoId));
        if (videoOpt.isPresent()) {
            Video v = videoOpt.get();
            try {
                String url = String.format("https://video.bunnycdn.com/library/%d/videos/%s", v.getLibraryId(), v.getBunnyVideoId());
                HttpHeaders headers = new HttpHeaders();
                headers.set("AccessKey", properties.getApiKey());
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                restTemplate.exchange(url, org.springframework.http.HttpMethod.DELETE, entity, Void.class);
            } catch (Exception e) {
                log.warn("Failed to delete video {} from Bunny Stream: {}", videoId, e.getMessage());
            }
            videoRepository.delete(v);
        } else {
            try {
                String url = String.format("https://video.bunnycdn.com/library/%s/videos/%s", properties.getLibraryId(), videoId);
                HttpHeaders headers = new HttpHeaders();
                headers.set("AccessKey", properties.getApiKey());
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                restTemplate.exchange(url, org.springframework.http.HttpMethod.DELETE, entity, Void.class);
            } catch (Exception ignored) {}
        }
    }

    /**
     * Authorizes video playback for student/trainer/admin and returns signed Bunny token & URL.
     * Enforces course enrollment and denies access if video has no course.
     */
    @Transactional(readOnly = true)
    public VideoPlaybackResponse getPlaybackAuthorization(String videoOrModuleId, String courseIdParam, String authenticatedUserId, String userEmail, String userRole, String clientIp) {
        // Resolve video by ID, bunnyVideoId, or moduleId in videos table
        Optional<Video> videoOpt = videoRepository.findById(videoOrModuleId)
                .or(() -> videoRepository.findByBunnyVideoId(videoOrModuleId))
                .or(() -> {
                    List<Video> byMod = videoRepository.findByModuleId(videoOrModuleId);
                    return byMod.isEmpty() ? Optional.empty() : Optional.of(byMod.get(0));
                });

        // Also resolve through course_modules table to unify source of truth
        Optional<CourseModule> moduleOpt = courseModuleRepository.findById(videoOrModuleId);
        if (moduleOpt.isEmpty() && videoOpt.isPresent() && videoOpt.get().getModuleId() != null) {
            moduleOpt = courseModuleRepository.findById(videoOpt.get().getModuleId());
        }

        String effectiveVideoId = videoOpt.map(Video::getBunnyVideoId).orElse(null);
        String courseId = videoOpt.map(Video::getCourseId).orElse(null);
        String moduleId = videoOpt.map(Video::getModuleId).orElse(null);

        if (moduleOpt.isPresent()) {
            CourseModule mod = moduleOpt.get();
            if (moduleId == null) {
                moduleId = mod.getId();
            }
            if (courseId == null && mod.getCourse() != null) {
                courseId = mod.getCourse().getId();
            }
            if (effectiveVideoId == null && mod.getVideoStorageRef() != null) {
                try {
                    JsonNode node = objectMapper.readTree(mod.getVideoStorageRef());
                    if (node.has("videoId")) {
                        effectiveVideoId = node.get("videoId").asText();
                    } else if (node.has("storageKey")) {
                        effectiveVideoId = node.get("storageKey").asText().replace("bunny_", "");
                    }
                } catch (Exception ignored) {}
            }
        }

        if (courseId == null && courseIdParam != null && !courseIdParam.isBlank()) {
            courseId = courseIdParam;
        }

        if (effectiveVideoId == null) {
            effectiveVideoId = videoOrModuleId;
        }

        // Strict Requirement: If the video has no course, DENY access
        if (courseId == null || courseId.isBlank()) {
            return VideoPlaybackResponse.builder()
                    .authorized(false)
                    .videoId(effectiveVideoId)
                    .message("Access Denied: Video is not associated with any active course.")
                    .build();
        }

        // Verification: Admin and Trainer are authorized; Student must have active enrollment
        boolean isAuthorized = false;
        String authMessage = "Authorized";

        if ("ADMIN".equalsIgnoreCase(userRole) || "TRAINER".equalsIgnoreCase(userRole)) {
            isAuthorized = true;
        } else if (authenticatedUserId != null && !authenticatedUserId.isBlank()) {
            boolean enrolled = enrollmentRepository.existsByStudentIdAndCourseId(authenticatedUserId, courseId)
                    || (userEmail != null && enrollmentRepository.existsByStudentEmailIgnoreCaseAndCourseId(userEmail, courseId))
                    || enrollmentRepository.existsByStudentEmailIgnoreCaseAndCourseId(authenticatedUserId, courseId);
            if (enrolled) {
                if (moduleId != null && isModuleLocked(courseId, moduleId, authenticatedUserId, userEmail)) {
                    isAuthorized = false;
                    authMessage = "Access Denied: Complete previous module assignment to unlock.";
                } else {
                    isAuthorized = true;
                }
            } else {
                isAuthorized = false;
                authMessage = "Access Denied: You are not enrolled in this course.";
            }
        } else {
            isAuthorized = false;
            authMessage = "Access Denied: Authentication required to stream course videos.";
        }

        if (!isAuthorized) {
            return VideoPlaybackResponse.builder()
                    .authorized(false)
                    .videoId(effectiveVideoId)
                    .courseId(courseId)
                    .message(authMessage)
                    .build();
        }

        long expiresAt = (System.currentTimeMillis() / 1000) + properties.getTokenExpirationSeconds();
        // Drop IP binding to ensure reliable playback across dynamic networks/proxies
        String streamToken = tokenService.generateToken(effectiveVideoId, expiresAt, null);
        String embedToken = tokenService.generateEmbedToken(effectiveVideoId, expiresAt);

        String signedStreamUrl = String.format("https://%s/%s/playlist.m3u8?token=%s&expires=%d",
                properties.getCdnHost(), effectiveVideoId, streamToken, expiresAt);
        String signedEmbedUrl = String.format("https://iframe.mediadelivery.net/embed/%s/%s?token=%s&expires=%d",
                properties.getLibraryId(), effectiveVideoId, embedToken, expiresAt);

        return VideoPlaybackResponse.builder()
                .authorized(true)
                .videoId(effectiveVideoId)
                .courseId(courseId)
                .moduleId(moduleId)
                .token(embedToken)
                .expiresAt(expiresAt)
                .streamUrl(signedStreamUrl)
                .embedUrl(signedEmbedUrl)
                .fallbackUrl(null)
                .message("Playback authorized successfully")
                .build();
    }

    @Transactional(readOnly = true)
    public VideoPlaybackResponse getPlaybackAuthorization(String videoOrModuleId, String authenticatedUserId, String userRole, String clientIp) {
        return getPlaybackAuthorization(videoOrModuleId, null, authenticatedUserId, null, userRole, clientIp);
    }

    /**
     * Webhook receiver for Bunny Stream event notifications.
     */
    @Transactional
    public void processWebhook(BunnyWebhookPayload payload) {
        if (payload == null || payload.getVideoGuid() == null) return;

        Optional<Video> videoOpt = videoRepository.findByBunnyVideoId(payload.getVideoGuid());
        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();
            if (payload.getStatus() != null) {
                video.setStatus(payload.getStatus());
                video.setStatusLabel(mapBunnyStatus(payload.getStatus()));
            }
            if (payload.getLength() != null && payload.getLength() > 0) {
                video.setDurationSeconds(payload.getLength());
            }
            video.setUpdatedAt(LocalDateTime.now());
            videoRepository.save(video);
            log.info("Updated video {} status to {}", video.getBunnyVideoId(), video.getStatusLabel());

            if (video.getModuleId() != null && video.getStatus() != null && video.getStatus() == 3 && video.getDurationSeconds() != null && video.getDurationSeconds() > 0) {
                courseModuleRepository.findById(video.getModuleId()).ifPresent(mod -> {
                    if (mod.getDuration() == null || mod.getDuration().isBlank() || "Lesson Video".equalsIgnoreCase(mod.getDuration())) {
                        int mins = video.getDurationSeconds() / 60;
                        int secs = video.getDurationSeconds() % 60;
                        mod.setDuration(String.format("%d:%02d", mins, secs));
                        courseModuleRepository.save(mod);
                    }
                });
            }
        } else {
            log.warn("Received webhook for unknown video guid: {}", payload.getVideoGuid());
        }
    }

    private String mapBunnyStatus(int status) {
        return switch (status) {
            case 0 -> "Created";
            case 1 -> "Uploaded";
            case 2 -> "Processing";
            case 3 -> "Ready";
            case 4 -> "Failed";
            default -> "Status-" + status;
        };
    }

    private boolean isModuleLocked(String courseId, String moduleId, String studentId, String studentEmail) {
        if (moduleId == null || courseId == null) return false;
        List<CourseModule> modules = courseModuleRepository.findByCourseIdOrderByModuleOrderAsc(courseId);
        if (modules == null || modules.isEmpty()) return false;

        // Module 1 is always unlocked
        if (modules.get(0).getId().equals(moduleId)) {
            return false;
        }

        boolean prevCompleted = true;
        for (int i = 0; i < modules.size(); i++) {
            CourseModule m = modules.get(i);
            if (m.getId().equals(moduleId)) {
                return !prevCompleted;
            }

            boolean hasAssignment = (m.getAssignmentFileUrl() != null && !m.getAssignmentFileUrl().isBlank())
                    || (m.getAssignmentFileName() != null && !m.getAssignmentFileName().isBlank());

            if (hasAssignment) {
                boolean submitted = false;
                if (submissionRepository != null) {
                    if (studentId != null && !submissionRepository.findBySourceTypeAndSourceIdAndStudentId("module", m.getId(), studentId).isEmpty()) {
                        submitted = true;
                    }
                    if (!submitted && studentEmail != null && !submissionRepository.findBySourceTypeAndSourceIdAndStudentEmailIgnoreCase("module", m.getId(), studentEmail).isEmpty()) {
                        submitted = true;
                    }
                }
                if (!submitted) {
                    prevCompleted = false;
                }
            } else {
                boolean videoDone = false;
                if (studentId != null && studentModuleProgressRepository != null) {
                    videoDone = studentModuleProgressRepository.findByStudentIdAndModuleId(studentId, m.getId())
                            .map(smp -> Boolean.TRUE.equals(smp.getCompleted())).orElse(false);
                }
                if (!videoDone && studentId != null && studentProgressRepository != null) {
                    videoDone = studentProgressRepository.findByStudentIdIgnoreCaseAndCourseIdAndModuleId(studentId, courseId, m.getId())
                            .map(sp -> "Completed".equalsIgnoreCase(sp.getStatus())).orElse(false);
                }
                if (!videoDone && studentEmail != null && studentProgressRepository != null) {
                    videoDone = studentProgressRepository.findByStudentIdIgnoreCaseAndCourseIdAndModuleId(studentEmail, courseId, m.getId())
                            .map(sp -> "Completed".equalsIgnoreCase(sp.getStatus())).orElse(false);
                }
                if (!videoDone) {
                    prevCompleted = false;
                }
            }

            if (!prevCompleted) {
                return true;
            }
        }
        return false;
    }
}
