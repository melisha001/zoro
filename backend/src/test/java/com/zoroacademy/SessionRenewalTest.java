package com.zoroacademy;

import com.zoroacademy.dto.LoginRequest;
import com.zoroacademy.dto.LoginResponse;
import com.zoroacademy.entity.RefreshToken;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.UnauthorizedException;
import com.zoroacademy.repository.RefreshTokenRepository;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.security.JwtTokenProvider;
import com.zoroacademy.service.AuthService;
import com.zoroacademy.service.RefreshTokenService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class SessionRenewalTest {

    private JwtTokenProvider tokenProvider;
    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private PasswordEncoder passwordEncoder;
    private RefreshTokenService refreshTokenService;
    private AuthService authService;

    private final Map<String, RefreshToken> tokenStorage = new ConcurrentHashMap<>();
    private User testUser;

    @BeforeEach
    void setUp() throws Exception {
        tokenProvider = new JwtTokenProvider();
        Field secretField = JwtTokenProvider.class.getDeclaredField("jwtSecret");
        secretField.setAccessible(true);
        secretField.set(tokenProvider, System.getenv().getOrDefault("TEST_JWT_SECRET", "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItdW5pdC10ZXN0cy0xMjM0NTY3ODkwMTI="));

        Field expField = JwtTokenProvider.class.getDeclaredField("jwtExpirationMs");
        expField.setAccessible(true);
        expField.set(tokenProvider, 3600000L); // 1 hour

        tokenProvider.init();

        testUser = User.builder()
                .id("usr_test_123")
                .email("student@zoro.com")
                .name("Test Student")
                .role("STUDENT")
                .status("Active")
                .password("encoded_pass")
                .build();

        userRepository = mock(UserRepository.class);
        when(userRepository.findById("usr_test_123")).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmailIgnoreCase("student@zoro.com")).thenReturn(Optional.of(testUser));

        passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);

        tokenStorage.clear();
        refreshTokenRepository = mock(RefreshTokenRepository.class);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken rt = invocation.getArgument(0);
            tokenStorage.put(rt.getTokenHash(), rt);
            return rt;
        });

        when(refreshTokenRepository.findByTokenHash(anyString())).thenAnswer(invocation -> {
            String hash = invocation.getArgument(0);
            return Optional.ofNullable(tokenStorage.get(hash));
        });

        when(refreshTokenRepository.revokeAllByUserId(anyString())).thenAnswer(invocation -> {
            String uid = invocation.getArgument(0);
            int count = 0;
            for (RefreshToken rt : tokenStorage.values()) {
                if (uid.equals(rt.getUserId()) && !Boolean.TRUE.equals(rt.getRevoked())) {
                    rt.setRevoked(true);
                    count++;
                }
            }
            return count;
        });

        refreshTokenService = new RefreshTokenService(refreshTokenRepository, userRepository);
        authService = new AuthService(userRepository, passwordEncoder, tokenProvider, refreshTokenService);
    }

    @Test
    void testLoginReturnsBothTokens() {
        LoginRequest request = LoginRequest.builder()
                .email("student@zoro.com")
                .password("password123")
                .build();

        LoginResponse response = authService.login(request, "JUnit-Agent");

        assertNotNull(response);
        assertNotNull(response.getAccessToken(), "Login must return an accessToken");
        assertNotNull(response.getRefreshToken(), "Login must return a refreshToken");
        assertEquals("Bearer", response.getTokenType());
        assertEquals("usr_test_123", response.getUser().getId());

        // Validate access token claims
        Claims claims = tokenProvider.getClaimsFromJwt(response.getAccessToken());
        assertEquals("usr_test_123", claims.getSubject());
        assertEquals("student@zoro.com", claims.get("email"));
        assertEquals("STUDENT", claims.get("role"));
        assertNull(claims.get("rememberMe"), "rememberMe claim must be removed");

        // Validate refresh token is 256-bit (64 hex characters) and persisted hashed
        assertEquals(64, response.getRefreshToken().length());
        String tokenHash = RefreshTokenService.hashToken(response.getRefreshToken());
        assertTrue(tokenStorage.containsKey(tokenHash));
        assertFalse(tokenStorage.get(tokenHash).getRevoked());
    }

    @Test
    void testRefreshRotatesTokens() {
        LoginRequest request = LoginRequest.builder()
                .email("student@zoro.com")
                .password("password123")
                .build();

        LoginResponse loginResponse = authService.login(request);
        String initialRefreshToken = loginResponse.getRefreshToken();
        String initialTokenHash = RefreshTokenService.hashToken(initialRefreshToken);

        // Perform rotation
        LoginResponse rotated = authService.rotateRefreshToken(initialRefreshToken, "JUnit-Agent-Rotate");

        assertNotNull(rotated.getAccessToken());
        assertNotNull(rotated.getRefreshToken());
        assertNotEquals(initialRefreshToken, rotated.getRefreshToken(), "Rotated refresh token must be a new opaque token");

        // Old token must be revoked
        RefreshToken oldRecord = tokenStorage.get(initialTokenHash);
        assertNotNull(oldRecord);
        assertTrue(oldRecord.getRevoked(), "Old refresh token must be revoked on rotation");

        // New token must be active
        String newTokenHash = RefreshTokenService.hashToken(rotated.getRefreshToken());
        RefreshToken newRecord = tokenStorage.get(newTokenHash);
        assertNotNull(newRecord);
        assertFalse(newRecord.getRevoked(), "New refresh token must be active");
    }

    @Test
    void testReuseOfOldRefreshTokenIsRejectedAndRevokesAll() {
        LoginRequest request = LoginRequest.builder()
                .email("student@zoro.com")
                .password("password123")
                .build();

        LoginResponse loginResponse = authService.login(request);
        String initialRefreshToken = loginResponse.getRefreshToken();

        // 1st rotation - valid
        LoginResponse rotatedResponse = authService.rotateRefreshToken(initialRefreshToken, "JUnit");
        String activeRefreshToken = rotatedResponse.getRefreshToken();

        // Reusing the initial refresh token should trigger reuse detection
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                authService.rotateRefreshToken(initialRefreshToken, "Attacker-Agent")
        );
        assertTrue(ex.getMessage().contains("Revoked refresh token reused"),
                "Exception message must identify token reuse");

        // Active token of user must now be revoked due to reuse detection
        String activeHash = RefreshTokenService.hashToken(activeRefreshToken);
        assertTrue(tokenStorage.get(activeHash).getRevoked(),
                "All tokens for user must be revoked upon reuse detection");
    }

    @Test
    void testRefreshAfterUserDeletionFails() {
        LoginRequest request = LoginRequest.builder()
                .email("student@zoro.com")
                .password("password123")
                .build();

        LoginResponse loginResponse = authService.login(request);
        String refreshToken = loginResponse.getRefreshToken();

        // Simulate user deletion
        when(userRepository.findById("usr_test_123")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () ->
                authService.rotateRefreshToken(refreshToken, "JUnit")
        );
    }

    @Test
    void testAccessTokenExpiryAfter1Hour() throws Exception {
        // Normal 1 hour token
        String token = tokenProvider.generateToken("usr_test_123", "student@zoro.com", "STUDENT", "Student");
        assertTrue(tokenProvider.validateToken(token));

        Claims claims = tokenProvider.getClaimsFromJwt(token);
        long durationMs = claims.getExpiration().getTime() - claims.getIssuedAt().getTime();
        assertEquals(3600000L, durationMs, 5000L, "Token duration must be 1 hour (3600000 ms)");

        // Token generated with clock in the past (expired)
        JwtTokenProvider shortClockProvider = new JwtTokenProvider();
        Field secretField = JwtTokenProvider.class.getDeclaredField("jwtSecret");
        secretField.setAccessible(true);
        secretField.set(shortClockProvider, System.getenv().getOrDefault("TEST_JWT_SECRET", "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItdW5pdC10ZXN0cy0xMjM0NTY3ODkwMTI="));

        Field expField = JwtTokenProvider.class.getDeclaredField("jwtExpirationMs");
        expField.setAccessible(true);
        expField.set(shortClockProvider, 100L); // 100 ms

        shortClockProvider.init();

        String fastExpiringToken = shortClockProvider.generateToken("usr_test_123", "student@zoro.com", "STUDENT", "Student");
        Thread.sleep(150);

        assertFalse(shortClockProvider.validateToken(fastExpiringToken), "Token must expire after expiration window");
    }

    @Test
    void testLogoutRevokesRefreshToken() {
        LoginRequest request = LoginRequest.builder()
                .email("student@zoro.com")
                .password("password123")
                .build();

        LoginResponse loginResponse = authService.login(request);
        String refreshToken = loginResponse.getRefreshToken();
        String tokenHash = RefreshTokenService.hashToken(refreshToken);

        assertFalse(tokenStorage.get(tokenHash).getRevoked());

        authService.logout(refreshToken);

        assertTrue(tokenStorage.get(tokenHash).getRevoked(), "Refresh token must be revoked on logout");

        // Subsequent refresh with revoked token should fail
        assertThrows(UnauthorizedException.class, () ->
                authService.rotateRefreshToken(refreshToken, "JUnit")
        );
    }
}
