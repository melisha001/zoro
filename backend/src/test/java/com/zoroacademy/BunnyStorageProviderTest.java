package com.zoroacademy;

import com.zoroacademy.config.BunnyStorageProperties;
import com.zoroacademy.service.storage.BunnyStorageProvider;
import com.zoroacademy.service.storage.LocalStorageProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

import java.io.InputStream;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class BunnyStorageProviderTest {

    @TempDir
    Path tempDir;

    private BunnyStorageProperties properties;
    private LocalStorageProvider localStorageProvider;
    private BunnyStorageProvider bunnyStorageProvider;

    @BeforeEach
    void setUp() {
        properties = new BunnyStorageProperties();
        properties.setHost("storage.bunnycdn.com");
        properties.setZone("test-zone");
        properties.setPassword("test-storage-pw");
        properties.setCdnHost("zoro-test.b-cdn.net");

        localStorageProvider = new LocalStorageProvider(tempDir.toString());
        bunnyStorageProvider = new BunnyStorageProvider(properties, localStorageProvider);
    }

    @Test
    void testGetPublicUrl() {
        String publicUrl = bunnyStorageProvider.getPublicUrl("public/thumbnail/sample.png");
        assertNotNull(publicUrl);
        assertEquals("https://zoro-test.b-cdn.net/public/thumbnail/sample.png", publicUrl);
    }

    @Test
    void testLocalStorageProviderStoreAndLoad() throws Exception {
        byte[] content = "Hello Local Storage".getBytes();
        String path = "public/test/hello.txt";

        localStorageProvider.store(path, content, "text/plain");
        assertTrue(localStorageProvider.exists(path));

        Resource resource = localStorageProvider.loadAsResource(path);
        assertNotNull(resource);
        assertTrue(resource.exists());
        try (InputStream is = resource.getInputStream()) {
            assertArrayEquals(content, is.readAllBytes());
        }

        localStorageProvider.delete(path);
        assertFalse(localStorageProvider.exists(path));
    }

    @Test
    void testBunnyFallbackToLocalWhenUnreachable() throws Exception {
        byte[] content = "Fallback Content".getBytes();
        String path = "public/fallback/doc.txt";

        bunnyStorageProvider.store(path, content, "text/plain");

        Resource resource = bunnyStorageProvider.loadAsResource(path);
        assertNotNull(resource);
        assertTrue(resource.exists());
        try (InputStream is = resource.getInputStream()) {
            assertArrayEquals(content, is.readAllBytes());
        }

        bunnyStorageProvider.delete(path);
    }
}
