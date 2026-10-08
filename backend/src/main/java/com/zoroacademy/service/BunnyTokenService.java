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
     * Generates a Bunny Stream Token Authentication token using SHA-256 and Base64 URL safe encoding.
     * Bunny token specification: Base64UrlSafe(SHA256(securityToken + path + expires + (ip ? ip : "")))
     */
    public String generateToken(String videoId, long expiresSeconds, String ip) {
        String securityToken = properties.getTokenAuthKey();
        String path = "/" + videoId + "/";

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
     * Generates a full signed playback URL for Bunny Stream HLS Playlist.
     */
    public String generateSignedPlaybackUrl(String videoId, String ip) {
        long expires = (System.currentTimeMillis() / 1000) + properties.getTokenExpirationSeconds();
        String token = generateToken(videoId, expires, ip);
        return String.format("https://%s/%s/playlist.m3u8?token=%s&expires=%d",
                properties.getCdnHost(), videoId, token, expires);
    }

    /**
     * Generates signed iframe embed URL for Bunny Stream Player.
     */
    public String generateSignedEmbedUrl(String videoId, String ip) {
        long expires = (System.currentTimeMillis() / 1000) + properties.getTokenExpirationSeconds();
        String token = generateToken(videoId, expires, ip);
        return String.format("https://iframe.mediadelivery.net/embed/%s/%s?token=%s&expires=%d",
                properties.getLibraryId(), videoId, token, expires);
    }
}
