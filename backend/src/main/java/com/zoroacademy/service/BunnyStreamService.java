package com.zoroacademy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.dto.BunnyWebhookPayload;
import com.zoroacademy.dto.VideoPlaybackResponse;
import com.zoroacademy.dto.VideoUploadRequest;
import com.zoroacademy.dto.VideoUploadResponse;
import com.zoroacademy.entity.Video;
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
    public BunnyStreamService(BunnyStreamProperties properties, BunnyTokenService tokenService, VideoRepository videoRepository, EnrollmentRepository enrollmentRepository) {
        this.properties = properties;
        this.tokenService = tokenService;
        this.videoRepository = videoRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Creates an upload session with Bunny Stream API.
     * Admin creates a video entry on Bunny and gets back video ID & upload URL.
     */
    @Transactional
    public VideoUploadResponse createUploadSession(VideoUploadRequest request) {
        String videoTitle = (request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle()
                : "Lesson Video " + System.currentTimeMillis();

        String videoId;
        try {
            String url = String.format("https://video.bunnycdn.com/library/%s/videos", properties.getLibraryId());
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
        String uploadUrl = String.format("https://video.bunnycdn.com/library/%s/videos/%s", properties.getLibraryId(), videoId);

        Video video = Video.builder()
                .id(videoId)
                .bunnyVideoId(videoId)
                .libraryId(Integer.parseInt(properties.getLibraryId()))
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
                .libraryId(Integer.parseInt(properties.getLibraryId()))
                .uploadUrl(uploadUrl)
                .authorizationSignature(properties.getApiKey())
                .directStreamUrl(streamUrl)
                .title(videoTitle)
                .status("Created")
                .build();
    }

    /**
     * Authorizes video playback for student/trainer/admin and returns signed Bunny token & URL.
     */
    @Transactional(readOnly = true)
    public VideoPlaybackResponse getPlaybackAuthorization(String videoOrModuleId, String studentIdOrEmail, String userRole, String clientIp) {
        // Find video by ID or moduleId
        Optional<Video> videoOpt = videoRepository.findById(videoOrModuleId)
                .or(() -> videoRepository.findByBunnyVideoId(videoOrModuleId))
                .or(() -> {
                    List<Video> byMod = videoRepository.findByModuleId(videoOrModuleId);
                    return byMod.isEmpty() ? Optional.empty() : Optional.of(byMod.get(0));
                });

        String effectiveVideoId = videoOpt.map(Video::getBunnyVideoId).orElse(videoOrModuleId);
        String courseId = videoOpt.map(Video::getCourseId).orElse(null);

        // Verification: Admin and Trainer always authorized; Student must be enrolled if courseId is present
        boolean isAuthorized = false;
        String authMessage = "Authorized";

        if ("ADMIN".equalsIgnoreCase(userRole) || "TRAINER".equalsIgnoreCase(userRole)) {
            isAuthorized = true;
        } else if (studentIdOrEmail != null && !studentIdOrEmail.isBlank()) {
            if (courseId == null) {
                // If courseId is not attached to video, check general enrollment or allow logged-in student
                isAuthorized = true;
            } else {
                boolean enrolled = enrollmentRepository.existsByStudentIdAndCourseId(studentIdOrEmail, courseId)
                        || enrollmentRepository.existsByStudentEmailIgnoreCaseAndCourseId(studentIdOrEmail, courseId);
                if (enrolled) {
                    isAuthorized = true;
                } else {
                    isAuthorized = false;
                    authMessage = "Access Denied: You are not enrolled in this course.";
                }
            }
        } else {
            isAuthorized = false;
            authMessage = "Access Denied: Please log in to stream private videos.";
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
        String token = tokenService.generateToken(effectiveVideoId, expiresAt, clientIp);
        String signedStreamUrl = String.format("https://%s/%s/playlist.m3u8?token=%s&expires=%d",
                properties.getCdnHost(), effectiveVideoId, token, expiresAt);
        String signedEmbedUrl = String.format("https://iframe.mediadelivery.net/embed/%s/%s?token=%s&expires=%d",
                properties.getLibraryId(), effectiveVideoId, token, expiresAt);

        return VideoPlaybackResponse.builder()
                .authorized(true)
                .videoId(effectiveVideoId)
                .courseId(courseId)
                .moduleId(videoOpt.map(Video::getModuleId).orElse(null))
                .token(token)
                .expiresAt(expiresAt)
                .streamUrl(signedStreamUrl)
                .embedUrl(signedEmbedUrl)
                .fallbackUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")
                .message("Playback authorized successfully")
                .build();
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
}
