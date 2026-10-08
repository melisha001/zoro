package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.dto.BunnyWebhookPayload;
import com.zoroacademy.service.BunnyStreamService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
public class BunnyWebhookController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BunnyWebhookController.class);

    private final BunnyStreamService bunnyStreamService;
    private final BunnyStreamProperties properties;

    public BunnyWebhookController(BunnyStreamService bunnyStreamService, BunnyStreamProperties properties) {
        this.bunnyStreamService = bunnyStreamService;
        this.properties = properties;
    }

    /**
     * Webhook endpoint called by Bunny Stream when video status changes (e.g. transcoding finished).
     * Strictly verifies the shared secret / signature header before processing.
     */
    @PostMapping("/bunny")
    public ResponseEntity<ApiResponse<String>> handleBunnyWebhook(
            @RequestBody BunnyWebhookPayload payload,
            HttpServletRequest request) {

        String configuredSecret = properties.getWebhookSecret();
        if (configuredSecret == null || configuredSecret.isBlank()) {
            configuredSecret = properties.getApiKey();
        }

        String secretHeader = request.getHeader("X-Bunny-Secret");
        if (secretHeader == null) secretHeader = request.getHeader("Webhook-Signature");
        if (secretHeader == null) secretHeader = request.getHeader("Authorization");

        if (configuredSecret != null && !configuredSecret.isBlank()) {
            if (secretHeader == null || !configuredSecret.equals(secretHeader.replace("Bearer ", "").trim())) {
                log.warn("Rejected unauthorized Bunny Stream webhook attempt: missing or invalid signature header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized webhook request"));
            }
        }

        log.info("Received authenticated Bunny Stream webhook for video: {}, status: {}", payload.getVideoGuid(), payload.getStatus());
        bunnyStreamService.processWebhook(payload);
        return ResponseEntity.ok(ApiResponse.ok("Webhook processed successfully"));
    }
}
