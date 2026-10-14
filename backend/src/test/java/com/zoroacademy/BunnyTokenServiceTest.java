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
        properties.setLibraryId(System.getenv().getOrDefault("TEST_BUNNY_LIBRARY_ID", "123456"));
        properties.setApiKey(System.getenv().getOrDefault("TEST_BUNNY_API_KEY", "test-bunny-api-key-placeholder"));
        properties.setCdnHost(System.getenv().getOrDefault("TEST_BUNNY_CDN_HOST", "test-cdn.b-cdn.net"));
        properties.setTokenAuthKey(System.getenv().getOrDefault("TEST_BUNNY_TOKEN_AUTH_KEY", "test-bunny-token-key-placeholder"));
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
        assertTrue(url.startsWith("https://" + properties.getCdnHost() + "/sample-guid-456/playlist.m3u8?token="));
        assertTrue(url.contains("&expires="));
    }
}
