package com.zoroacademy.service;

import com.zoroacademy.entity.WebsiteSettings;
import com.zoroacademy.repository.WebsiteSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WebsiteSettingsService {

    private final WebsiteSettingsRepository settingsRepository;
    public WebsiteSettingsService(WebsiteSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }


    @Transactional(readOnly = true)
    public WebsiteSettings getSettings() {
        return settingsRepository.findById("default")
                .orElseGet(() -> WebsiteSettings.builder()
                        .id("default")
                        .heroHeadline("Unlock English Fluency with Zoro Academy")
                        .heroSubheadline("Empowering learners with phonics, grammar, abacus and confidence.")
                        .contactEmail("contact@zoroacademy.com")
                        .contactPhone("+91 98765 43210")
                        .address("Chennai, India")
                        .build());
    }

    @Transactional
    public WebsiteSettings updateSettings(WebsiteSettings updated) {
        WebsiteSettings settings = getSettings();
        if (updated.getHeroHeadline() != null) settings.setHeroHeadline(updated.getHeroHeadline());
        if (updated.getHeroSubheadline() != null) settings.setHeroSubheadline(updated.getHeroSubheadline());
        if (updated.getContactEmail() != null) settings.setContactEmail(updated.getContactEmail());
        if (updated.getContactPhone() != null) settings.setContactPhone(updated.getContactPhone());
        if (updated.getAddress() != null) settings.setAddress(updated.getAddress());
        if (updated.getBannerAnnouncement() != null) settings.setBannerAnnouncement(updated.getBannerAnnouncement());
        if (updated.getSettingsJson() != null) settings.setSettingsJson(updated.getSettingsJson());

        return settingsRepository.save(settings);
    }
}
