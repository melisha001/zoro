package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.WebsiteSettings;
import com.zoroacademy.service.WebsiteSettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/website-settings")
public class WebsiteSettingsController {

    private final WebsiteSettingsService settingsService;
    public WebsiteSettingsController(WebsiteSettingsService settingsService) {
        this.settingsService = settingsService;
    }


    @GetMapping
    public ApiResponse<WebsiteSettings> getSettings() {
        return ApiResponse.ok(settingsService.getSettings());
    }

    @PutMapping
    public ApiResponse<WebsiteSettings> updateSettings(@RequestBody WebsiteSettings settings) {
        return ApiResponse.ok(settingsService.updateSettings(settings), "Settings updated successfully");
    }
}
