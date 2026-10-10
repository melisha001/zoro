package com.zoroacademy.service.storage;

import com.zoroacademy.config.BunnyStorageProperties;
import com.zoroacademy.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Paths;

public class BunnyStorageProvider implements StorageProvider {

    private static final Logger log = LoggerFactory.getLogger(BunnyStorageProvider.class);

    private final BunnyStorageProperties properties;
    private final LocalStorageProvider fallbackProvider;
    private final RestTemplate restTemplate;

    public BunnyStorageProvider(BunnyStorageProperties properties, LocalStorageProvider fallbackProvider) {
        this.properties = properties;
        this.fallbackProvider = fallbackProvider;
        this.restTemplate = new RestTemplate();
    }

    private boolean isBunnyConfigured() {
        return properties != null
                && properties.getZone() != null && !properties.getZone().isBlank()
                && properties.getPassword() != null && !properties.getPassword().isBlank();
    }

    private String buildBunnyUrl(String storagePath) {
        String host = properties.getHost();
        String zone = properties.getZone();
        String cleanPath = storagePath.startsWith("/") ? storagePath.substring(1) : storagePath;
        return "https://" + host + "/" + zone + "/" + cleanPath;
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("AccessKey", properties.getPassword());
        return headers;
    }

    @Override
    public void store(String storagePath, byte[] data, String contentType) {
        if (!isBunnyConfigured()) {
            log.warn("Bunny Storage is not configured. Falling back to local disk storage for {}", storagePath);
            fallbackProvider.store(storagePath, data, contentType);
            return;
        }

        String url = buildBunnyUrl(storagePath);
        try {
            HttpHeaders headers = createAuthHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(data, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, requestEntity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Bunny Storage upload returned HTTP " + response.getStatusCode().value());
            }

            // Also keep a local copy as cache / fallback
            try {
                fallbackProvider.store(storagePath, data, contentType);
            } catch (Exception ignored) {}

        } catch (Exception e) {
            log.error("Failed to store file in Bunny Storage at {}: {}. Attempting fallback to local disk.",
                    storagePath, sanitizeError(e.getMessage()));
            fallbackProvider.store(storagePath, data, contentType);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        if (!isBunnyConfigured()) {
            return fallbackProvider.loadAsResource(storagePath);
        }

        String url = buildBunnyUrl(storagePath);
        try {
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, byte[].class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String filename = Paths.get(storagePath).getFileName().toString();
                return new ByteArrayResource(response.getBody(), filename) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                };
            }
        } catch (Exception e) {
            log.debug("Could not fetch file from Bunny Storage ({}): {}. Falling back to local disk.",
                    storagePath, sanitizeError(e.getMessage()));
        }

        // Fallback to local storage
        return fallbackProvider.loadAsResource(storagePath);
    }

    @Override
    public void delete(String storagePath) {
        // Delete from local disk
        try {
            fallbackProvider.delete(storagePath);
        } catch (Exception ignored) {}

        if (!isBunnyConfigured()) {
            return;
        }

        String url = buildBunnyUrl(storagePath);
        try {
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.DELETE, requestEntity, String.class);
        } catch (Exception e) {
            log.warn("Failed to delete file from Bunny Storage at {}: {}", storagePath, sanitizeError(e.getMessage()));
        }
    }

    @Override
    public String getPublicUrl(String storagePath) {
        if (properties == null || properties.getCdnHost() == null || properties.getCdnHost().isBlank()) {
            return null;
        }

        String cdn = properties.getCdnHost().replaceFirst("^https?://", "").replaceAll("/+$", "");
        String cleanPath = storagePath.startsWith("/") ? storagePath.substring(1) : storagePath;
        return "https://" + cdn + "/" + cleanPath;
    }

    @Override
    public boolean exists(String storagePath) {
        if (!isBunnyConfigured()) {
            return fallbackProvider.exists(storagePath);
        }

        String url = buildBunnyUrl(storagePath);
        try {
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, byte[].class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return fallbackProvider.exists(storagePath);
        }
    }

    private String sanitizeError(String message) {
        if (message == null) return "Unknown error";
        if (properties != null && properties.getPassword() != null && !properties.getPassword().isBlank()) {
            message = message.replace(properties.getPassword(), "[REDACTED]");
        }
        return message;
    }
}
