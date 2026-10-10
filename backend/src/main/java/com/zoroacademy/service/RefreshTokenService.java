package com.zoroacademy.service;

import com.zoroacademy.entity.RefreshToken;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.UnauthorizedException;
import com.zoroacademy.repository.RefreshTokenRepository;
import com.zoroacademy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RefreshTokenService {
    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${jwt.refresh-token-expiration-days:7}")
    private long refreshTokenExpirationDays;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    public static String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Token cannot be blank");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String generateRandomToken() {
        byte[] bytes = new byte[32]; // 256 bits
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    @Transactional
    public String createRefreshToken(User user, String userAgent) {
        String rawToken = generateRandomToken();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .id("rt_" + UUID.randomUUID().toString().replace("-", ""))
                .userId(user.getId())
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays > 0 ? refreshTokenExpirationDays : 7))
                .revoked(false)
                .userAgent(userAgent != null && userAgent.length() > 250 ? userAgent.substring(0, 250) : userAgent)
                .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional
    public RotationResult rotateRefreshToken(String rawToken, String userAgent) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is required");
        }

        String tokenHash = hashToken(rawToken.trim());
        RefreshToken existingToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        // Reuse detection: if a revoked token is presented, revoke all tokens for this user
        if (Boolean.TRUE.equals(existingToken.getRevoked())) {
            log.warn("Revoked refresh token reuse detected for user ID {}. Revoking all tokens.", existingToken.getUserId());
            refreshTokenRepository.revokeAllByUserId(existingToken.getUserId());
            throw new UnauthorizedException("Revoked refresh token reused; session terminated");
        }

        if (existingToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }

        User user = userRepository.findById(existingToken.getUserId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (user.getStatus() != null && !"Active".equalsIgnoreCase(user.getStatus().trim())) {
            throw new UnauthorizedException("User account is inactive");
        }

        // Revoke the old token
        existingToken.setRevoked(true);
        refreshTokenRepository.save(existingToken);

        // Issue a new token
        String newRawToken = generateRandomToken();
        String newTokenHash = hashToken(newRawToken);

        RefreshToken newRefreshToken = RefreshToken.builder()
                .id("rt_" + UUID.randomUUID().toString().replace("-", ""))
                .userId(user.getId())
                .tokenHash(newTokenHash)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays > 0 ? refreshTokenExpirationDays : 7))
                .revoked(false)
                .userAgent(userAgent != null && userAgent.length() > 250 ? userAgent.substring(0, 250) : userAgent)
                .build();

        refreshTokenRepository.save(newRefreshToken);

        return new RotationResult(newRawToken, user);
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        try {
            String tokenHash = hashToken(rawToken.trim());
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        } catch (Exception e) {
            log.debug("Error revoking refresh token: {}", e.getMessage());
        }
    }

    @Transactional
    public void revokeAllForUser(String userId) {
        if (userId != null && !userId.isBlank()) {
            refreshTokenRepository.revokeAllByUserId(userId);
        }
    }

    public static class RotationResult {
        private final String newRefreshToken;
        private final User user;

        public RotationResult(String newRefreshToken, User user) {
            this.newRefreshToken = newRefreshToken;
            this.user = user;
        }

        public String getNewRefreshToken() { return newRefreshToken; }
        public User getUser() { return user; }
    }
}
