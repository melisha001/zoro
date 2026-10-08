package com.zoroacademy.service;

import com.zoroacademy.config.BunnyStreamProperties;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
public class BunnyTokenService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BunnyTokenService.class);

    private final BunnyStreamProperties properties;
    public BunnyTokenService(BunnyStreamProperties properties) {
        this.properties = properties;
    }

    /**
     * Generates a Bunny Stream Token for pull-zone / HLS playlist playback.
     * Specification: Base64UrlSafe(SHA256(securityToken + "/" + videoId + "/" + expires))
     */
    public String generateToken(String videoId, long expiresSeconds) {
        return generateToken(videoId, expiresSeconds, null);
    }

    public String generateToken(String videoId, long expiresSeconds, String ip) {
        String securityToken = properties.getTokenAuthKey() != null ? properties.getTokenAuthKey() : "";
        String path = "/" + videoId + "/";

        // Drop IP binding to prevent mobile/NAT playback failures, or support IP if passed
        String hashableBase = securityToken + path + expiresSeconds + (ip != null ? ip.trim() : "");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(hashableBase.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            throw new RuntimeException("Error generating token", e);
        }
    }

    /**
     * Generates a Bunny Stream Player Embed token for iframe embed URLs.
     * According to Bunny Stream documentation for iframe embed:
     * token = sha256_hex(token_auth_key + videoId + expires)
     */
    public String generateEmbedToken(String videoId, long expiresSeconds) {
        String securityToken = properties.getTokenAuthKey() != null ? properties.getTokenAuthKey() : "";
        String hashableBase = securityToken + videoId + expiresSeconds;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(hashableBase.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            throw new RuntimeException("Error generating embed token", e);
        }
    }

    /**
     * Generates a full signed playback URL for Bunny Stream HLS Playlist.
     */
    public String generateSignedPlaybackUrl(String videoId) {
        return generateSignedPlaybackUrl(videoId, null);
    }

    public String generateSignedPlaybackUrl(String videoId, String ip) {
        long expires = (System.currentTimeMillis() / 1000) + properties.getTokenExpirationSeconds();
        String token = generateToken(videoId, expires, ip);
        return String.format("https://%s/%s/playlist.m3u8?token=%s&expires=%d",
                properties.getCdnHost(), videoId, token, expires);
    }

    /**
     * Generates signed iframe embed URL for Bunny Stream Player using sha256 hex token.
     */
    public String generateSignedEmbedUrl(String videoId) {
        return generateSignedEmbedUrl(videoId, null);
    }

    public String generateSignedEmbedUrl(String videoId, String ip) {
        long expires = (System.currentTimeMillis() / 1000) + properties.getTokenExpirationSeconds();
        String token = generateEmbedToken(videoId, expires);
        return String.format("https://iframe.mediadelivery.net/embed/%s/%s?token=%s&expires=%d",
                properties.getLibraryId(), videoId, token, expires);
    }
}

