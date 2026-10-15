package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.HeroImageOrderDto;
import com.zoroacademy.dto.HeroImageRequest;
import com.zoroacademy.entity.HeroImage;
import com.zoroacademy.service.HeroImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
public class HeroImageController {

    private final HeroImageService heroImageService;

    public HeroImageController(HeroImageService heroImageService) {
        this.heroImageService = heroImageService;
    }

    /**
     * Public read endpoint (cacheable) for landing page hero background images.
     */
    @GetMapping("/api/website-settings/hero-images")
    public ResponseEntity<ApiResponse<List<HeroImage>>> getActiveHeroImages() {
        List<HeroImage> images = heroImageService.getActiveHeroImages();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(ApiResponse.ok(images));
    }

    /**
     * Admin endpoints for managing all hero background images.
     */
    @GetMapping({"/api/admin/website-settings/hero-images", "/api/website-settings/hero-images/all"})
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<HeroImage>> getAllHeroImages() {
        return ApiResponse.ok(heroImageService.getAllHeroImages());
    }

    @PostMapping({"/api/admin/website-settings/hero-images", "/api/website-settings/hero-images"})
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<HeroImage> createHeroImage(@RequestBody HeroImageRequest request) {
        HeroImage created = heroImageService.createHeroImage(request);
        return ApiResponse.ok(created, "Hero image added successfully");
    }

    @PutMapping({"/api/admin/website-settings/hero-images/order", "/api/website-settings/hero-images/order"})
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<HeroImage>> updateOrder(@RequestBody List<HeroImageOrderDto> orders) {
        List<HeroImage> updated = heroImageService.updateOrders(orders);
        return ApiResponse.ok(updated, "Hero images order updated successfully");
    }

    @PutMapping({"/api/admin/website-settings/hero-images/{id}", "/api/website-settings/hero-images/{id}"})
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<HeroImage> updateHeroImage(
            @PathVariable String id,
            @RequestBody HeroImageRequest request
    ) {
        HeroImage updated = heroImageService.updateHeroImage(id, request);
        return ApiResponse.ok(updated, "Hero image updated successfully");
    }

    @DeleteMapping({"/api/admin/website-settings/hero-images/{id}", "/api/website-settings/hero-images/{id}"})
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteHeroImage(@PathVariable String id) {
        heroImageService.deleteHeroImage(id);
        return ApiResponse.ok(null, "Hero image deleted successfully");
    }
}
