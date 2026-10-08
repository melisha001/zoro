package com.zoroacademy;

import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.service.BunnyTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BunnyTokenServiceTest {

    private BunnyTokenService tokenService;
    private BunnyStreamProperties properties;

    @BeforeEach
    void setUp() {
        properties = new BunnyStreamProperties();
        properties.setLibraryId("770045");
        properties.setApiKey("0726be56-9703-46cd-a987ac2f79f2-558e-4b2c4");
        properties.setCdnHost("vz-251d06e3-32f.b-cdn.net");
        properties.setTokenAuthKey("0726be56-9703-46cd-a987ac2f79f2-558e-4b2c4");
        properties.setTokenExpirationSeconds(7200);

        tokenService = new BunnyTokenService(properties);
    }

    @Test
    void testGenerateToken() {
        String videoId = "test-video-123";
        long expires = 1700000000L;
        String token = tokenService.generateToken(videoId, expires, null);

        assertNotNull(token);
        assertFalse(token.isBlank());
        // Token should be Base64 URL safe without padding
        assertFalse(token.contains("="));
        assertFalse(token.contains("+"));
        assertFalse(token.contains("/"));
    }

    @Test
    void testGenerateSignedPlaybackUrl() {
        String videoId = "sample-guid-456";
        String url = tokenService.generateSignedPlaybackUrl(videoId, "127.0.0.1");

        assertNotNull(url);
        assertTrue(url.startsWith("https://vz-251d06e3-32f.b-cdn.net/sample-guid-456/playlist.m3u8?token="));
        assertTrue(url.contains("&expires="));
    }
}
