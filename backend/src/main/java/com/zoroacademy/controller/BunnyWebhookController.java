package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.BunnyWebhookPayload;
import com.zoroacademy.service.BunnyStreamService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks")
public class BunnyWebhookController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BunnyWebhookController.class);


    private final BunnyStreamService bunnyStreamService;
    public BunnyWebhookController(BunnyStreamService bunnyStreamService) {
        this.bunnyStreamService = bunnyStreamService;
    }


    /**
     * Webhook endpoint called by Bunny Stream when video status changes (e.g. transcoding finished).
     */
    @PostMapping("/bunny")
    public ApiResponse<String> handleBunnyWebhook(@RequestBody BunnyWebhookPayload payload) {
        log.info("Received Bunny Stream webhook for video: {}, status: {}", payload.getVideoGuid(), payload.getStatus());
        bunnyStreamService.processWebhook(payload);
        return ApiResponse.ok("Webhook processed successfully");
    }
}
