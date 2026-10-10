package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.config.BunnyStorageProperties;
import com.zoroacademy.config.BunnyStreamProperties;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/bunny-health")
public class BunnyHealthController {

    private final BunnyStorageProperties storageProperties;
    private final BunnyStreamProperties streamProperties;
    private final RestTemplate restTemplate;

    public BunnyHealthController(BunnyStorageProperties storageProperties,
                                BunnyStreamProperties streamProperties) {
        this.storageProperties = storageProperties;
        this.streamProperties = streamProperties;
        this.restTemplate = new RestTemplate();
    }

    @GetMapping
    public ApiResponse<Map<String, String>> checkHealth() {
        Map<String, String> status = new LinkedHashMap<>();
        status.put("storage", checkStorage());
        status.put("stream", checkStream());
        return ApiResponse.ok(status);
    }

    private String checkStorage() {
        String zone = storageProperties.getZone();
        String password = storageProperties.getPassword();
        String host = storageProperties.getHost();

        if (zone == null || zone.isBlank() || password == null || password.isBlank()) {
            return "ERROR: Bunny storage zone or password is missing";
        }

        String path = "health/test-" + UUID.randomUUID() + ".txt";
        String url = "https://" + host + "/" + zone + "/" + path;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("AccessKey", password);
            headers.setContentType(MediaType.TEXT_PLAIN);

            HttpEntity<String> putEntity = new HttpEntity<>("bunny-health-check", headers);
            restTemplate.exchange(url, HttpMethod.PUT, putEntity, String.class);

            HttpEntity<Void> getEntity = new HttpEntity<>(headers);
            ResponseEntity<String> getRes = restTemplate.exchange(url, HttpMethod.GET, getEntity, String.class);
            if (!"bunny-health-check".equals(getRes.getBody())) {
                return "ERROR: Storage read payload mismatch";
            }

            restTemplate.exchange(url, HttpMethod.DELETE, getEntity, String.class);

            return "OK";
        } catch (Exception e) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.set("AccessKey", password);
                restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);
            } catch (Exception ignored) {}

            return sanitizeError(e, password, storageProperties.getCdnHost());
        }
    }

    private String checkStream() {
        String libraryId = streamProperties.getLibraryId();
        String apiKey = streamProperties.getApiKey();

        if (libraryId == null || libraryId.isBlank() || apiKey == null || apiKey.isBlank()) {
            return "ERROR: Bunny stream libraryId or apiKey is missing";
        }

        String url = "https://video.bunnycdn.com/library/" + libraryId + "/videos?page=1&itemsPerPage=1";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("AccessKey", apiKey);
            headers.set("Accept", MediaType.APPLICATION_JSON_VALUE);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return "OK";
            } else {
                return "ERROR: HTTP " + response.getStatusCode().value();
            }
        } catch (Exception e) {
            return sanitizeError(e, apiKey, streamProperties.getTokenAuthKey());
        }
    }

    private String sanitizeError(Exception e, String... secrets) {
        String message = e.getMessage();
        if (message == null) {
            message = e.getClass().getSimpleName();
        }
        for (String secret : secrets) {
            if (secret != null && !secret.isBlank()) {
                message = message.replace(secret, "[REDACTED]");
            }
        }
        return "ERROR: " + message;
    }
}
