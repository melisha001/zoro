package com.zoroacademy;

import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.dto.VideoPlaybackResponse;
import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.entity.Video;
import com.zoroacademy.repository.CourseModuleRepository;
import com.zoroacademy.repository.EnrollmentRepository;
import com.zoroacademy.repository.VideoRepository;
import com.zoroacademy.security.JwtTokenProvider;
import com.zoroacademy.service.BunnyStreamService;
import com.zoroacademy.service.BunnyTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityRbacTest {

    private JwtTokenProvider jwtTokenProvider;
    private BunnyStreamService bunnyStreamService;

    private VideoRepository videoRepository;
    private EnrollmentRepository enrollmentRepository;
    private CourseModuleRepository courseModuleRepository;
    private BunnyTokenService bunnyTokenService;
    private BunnyStreamProperties props;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        try {
            java.lang.reflect.Field secretField = JwtTokenProvider.class.getDeclaredField("jwtSecret");
            secretField.setAccessible(true);
            secretField.set(jwtTokenProvider, System.getenv().getOrDefault("TEST_JWT_SECRET", "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItdW5pdC10ZXN0cy0xMjM0NTY3ODkwMTI="));

            java.lang.reflect.Field expField = JwtTokenProvider.class.getDeclaredField("jwtExpirationMs");
            expField.setAccessible(true);
            expField.set(jwtTokenProvider, 86400000L);

            jwtTokenProvider.init();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        props = new BunnyStreamProperties();
        props.setApiKey(System.getenv().getOrDefault("TEST_BUNNY_API_KEY", "test-api-key"));
        props.setTokenAuthKey(System.getenv().getOrDefault("TEST_BUNNY_TOKEN_AUTH_KEY", "test-token-key"));
        props.setLibraryId(System.getenv().getOrDefault("TEST_BUNNY_LIBRARY_ID", "123456"));
        props.setCdnHost("vz-test.b-cdn.net");

        videoRepository = mock(VideoRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        courseModuleRepository = mock(CourseModuleRepository.class);
        bunnyTokenService = mock(BunnyTokenService.class);

        bunnyStreamService = new BunnyStreamService(
                props,
                bunnyTokenService,
                videoRepository,
                enrollmentRepository,
                courseModuleRepository
        );
    }

    @Test
    void testJwtTokenGenerationAndClaimsExtraction() {
        String token = jwtTokenProvider.generateTokenFromUsername("student@zoro.com", "usr-123", "STUDENT", "Arjun");

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("student@zoro.com", jwtTokenProvider.getUsernameFromJwt(token));
    }

    @Test
    void testPlaybackDeniedWhenVideoHasNoCourse() {
        Video video = Video.builder()
                .id("vid-1")
                .bunnyVideoId("b-vid-1")
                .courseId(null)
                .build();

        when(videoRepository.findById("vid-1")).thenReturn(Optional.of(video));
        when(courseModuleRepository.findById("vid-1")).thenReturn(Optional.empty());

        VideoPlaybackResponse resp = bunnyStreamService.getPlaybackAuthorization("vid-1", "std-1", "STUDENT", "127.0.0.1");
        assertNotNull(resp);
        assertFalse(resp.isAuthorized());
        assertTrue(resp.getMessage().contains("Access Denied"));
    }

    @Test
    void testPlaybackDeniedWhenStudentNotEnrolled() {
        Video video = Video.builder()
                .id("vid-1")
                .bunnyVideoId("b-vid-1")
                .courseId("crs-english")
                .build();

        when(videoRepository.findById("vid-1")).thenReturn(Optional.of(video));
        when(courseModuleRepository.findById("vid-1")).thenReturn(Optional.empty());
        when(enrollmentRepository.existsByStudentIdAndCourseId("std-1", "crs-english")).thenReturn(false);
        when(enrollmentRepository.existsByStudentEmailIgnoreCaseAndCourseId("std-1", "crs-english")).thenReturn(false);

        VideoPlaybackResponse resp = bunnyStreamService.getPlaybackAuthorization("vid-1", "std-1", "STUDENT", "127.0.0.1");
        assertNotNull(resp);
        assertFalse(resp.isAuthorized());
        assertTrue(resp.getMessage().contains("Access Denied"));
    }

    @Test
    void testPlaybackAuthorizedWhenStudentIsEnrolled() {
        Video video = Video.builder()
                .id("vid-1")
                .bunnyVideoId("b-vid-1")
                .courseId("crs-english")
                .build();

        when(videoRepository.findById("vid-1")).thenReturn(Optional.of(video));
        when(courseModuleRepository.findById("vid-1")).thenReturn(Optional.empty());
        when(enrollmentRepository.existsByStudentIdAndCourseId("std-1", "crs-english")).thenReturn(true);

        when(bunnyTokenService.generateSignedPlaybackUrl(anyString(), any()))
                .thenReturn("https://vz-test.b-cdn.net/b-vid-1/playlist.m3u8?token=mock");
        when(bunnyTokenService.generateSignedEmbedUrl(anyString(), any()))
                .thenReturn("https://iframe.mediadelivery.net/embed/" + props.getLibraryId() + "/b-vid-1?token=mock");

        VideoPlaybackResponse resp = bunnyStreamService.getPlaybackAuthorization("vid-1", "std-1", "STUDENT", "127.0.0.1");

        assertNotNull(resp);
        assertTrue(resp.isAuthorized());
        assertEquals("b-vid-1", resp.getVideoId());
    }
}
