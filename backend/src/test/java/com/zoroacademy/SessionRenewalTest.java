package com.zoroacademy;

import com.zoroacademy.dto.LoginResponse;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.UnauthorizedException;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.security.JwtTokenProvider;
import com.zoroacademy.service.AuthService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionRenewalTest {

    private JwtTokenProvider tokenProvider;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() throws Exception {
        tokenProvider = new JwtTokenProvider();
        java.lang.reflect.Field secretField = JwtTokenProvider.class.getDeclaredField("jwtSecret");
        secretField.setAccessible(true);
        secretField.set(tokenProvider, "Wmd2Wk9ST1NFQ1VSRUpXVFNFQ1JFVEtFWTIwMjZaT1JPQUM=");

        java.lang.reflect.Field expField = JwtTokenProvider.class.getDeclaredField("jwtExpirationMs");
        expField.setAccessible(true);
        expField.set(tokenProvider, 28800000L); // 8 hours

        tokenProvider.init();

        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        authService = new AuthService(userRepository, passwordEncoder, tokenProvider);
    }

    @Test
    void testTokenSubjectIsUserIdAndRememberMeSetsLongerExpiration() {
        String shortToken = tokenProvider.generateToken("user-101", "student@zoro.com", "STUDENT", "Student User", false);
        String longToken = tokenProvider.generateToken("user-101", "student@zoro.com", "STUDENT", "Student User", true);

        assertEquals("user-101", tokenProvider.getUserIdFromJwt(shortToken));
        assertEquals("student@zoro.com", tokenProvider.getUsernameFromJwt(shortToken));

        Claims shortClaims = tokenProvider.getClaimsFromJwt(shortToken);
        Claims longClaims = tokenProvider.getClaimsFromJwt(longToken);

        assertEquals("user-101", shortClaims.getSubject());
        assertEquals("student@zoro.com", shortClaims.get("email"));
        assertEquals(false, shortClaims.get("rememberMe"));
        assertEquals(true, longClaims.get("rememberMe"));

        Date shortExp = shortClaims.getExpiration();
        Date longExp = longClaims.getExpiration();

        long shortDurationMs = shortExp.getTime() - shortClaims.getIssuedAt().getTime();
        long longDurationMs = longExp.getTime() - longClaims.getIssuedAt().getTime();

        assertTrue(shortDurationMs <= 28805000L); // ~8 hours
        assertTrue(longDurationMs >= 2591000000L); // ~30 days
    }

    @Test
    void testRefreshTokenSuccess() {
        String token = tokenProvider.generateToken("user-202", "trainer@zoro.com", "TRAINER", "Trainer Zoro", true);

        User activeTrainer = User.builder()
                .id("user-202")
                .email("trainer@zoro.com")
                .name("Trainer Zoro")
                .role("TRAINER")
                .status("Active")
                .password("encoded_pass")
                .build();

        when(userRepository.findById("user-202")).thenReturn(Optional.of(activeTrainer));

        LoginResponse refreshResponse = authService.refreshToken(token);

        assertNotNull(refreshResponse);
        assertNotNull(refreshResponse.getToken());
        assertEquals("user-202", refreshResponse.getUser().getId());
        assertEquals("trainer@zoro.com", refreshResponse.getUser().getEmail());

        Claims refreshedClaims = tokenProvider.getClaimsFromJwt(refreshResponse.getToken());
        assertEquals(true, refreshedClaims.get("rememberMe"));
    }

    @Test
    void testRefreshTokenFailsWhenAccountDeactivated() {
        String token = tokenProvider.generateToken("user-303", "deactivated@zoro.com", "STUDENT", "Deactivated Student", false);

        User disabledStudent = User.builder()
                .id("user-303")
                .email("deactivated@zoro.com")
                .name("Deactivated Student")
                .role("STUDENT")
                .status("Inactive")
                .password("encoded_pass")
                .build();

        when(userRepository.findById("user-303")).thenReturn(Optional.of(disabledStudent));

        assertThrows(UnauthorizedException.class, () -> authService.refreshToken(token));
    }

    @Test
    void testRefreshTokenFailsWhenNullOrEmpty() {
        assertThrows(UnauthorizedException.class, () -> authService.refreshToken(null));
        assertThrows(UnauthorizedException.class, () -> authService.refreshToken("   "));
    }
}
