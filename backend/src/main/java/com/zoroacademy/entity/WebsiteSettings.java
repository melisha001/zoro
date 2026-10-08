package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "website_settings")
public class WebsiteSettings {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "hero_headline", columnDefinition = "TEXT")
    private String heroHeadline;

    @Column(name = "hero_subheadline", columnDefinition = "TEXT")
    private String heroSubheadline;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "banner_announcement", columnDefinition = "TEXT")
    private String bannerAnnouncement;

    @Column(name = "settings_json", columnDefinition = "jsonb")
    @JsonRawValue
    private String settingsJson;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public WebsiteSettings() {}

    public WebsiteSettings(String id, String heroHeadline, String heroSubheadline, String contactEmail, String contactPhone, String address, String bannerAnnouncement, String settingsJson, LocalDateTime updatedAt) {
        this.id = id;
        this.heroHeadline = heroHeadline;
        this.heroSubheadline = heroSubheadline;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.address = address;
        this.bannerAnnouncement = bannerAnnouncement;
        this.settingsJson = settingsJson;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getHeroHeadline() {
        return heroHeadline;
    }

    public void setHeroHeadline(String heroHeadline) {
        this.heroHeadline = heroHeadline;
    }

    public String getHeroSubheadline() {
        return heroSubheadline;
    }

    public void setHeroSubheadline(String heroSubheadline) {
        this.heroSubheadline = heroSubheadline;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getBannerAnnouncement() {
        return bannerAnnouncement;
    }

    public void setBannerAnnouncement(String bannerAnnouncement) {
        this.bannerAnnouncement = bannerAnnouncement;
    }

    public String getSettingsJson() {
        return settingsJson;
    }

    public void setSettingsJson(String settingsJson) {
        this.settingsJson = settingsJson;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String heroHeadline;
        private String heroSubheadline;
        private String contactEmail;
        private String contactPhone;
        private String address;
        private String bannerAnnouncement;
        private String settingsJson;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder heroHeadline(String heroHeadline) {
            this.heroHeadline = heroHeadline;
            return this;
        }
        public Builder heroSubheadline(String heroSubheadline) {
            this.heroSubheadline = heroSubheadline;
            return this;
        }
        public Builder contactEmail(String contactEmail) {
            this.contactEmail = contactEmail;
            return this;
        }
        public Builder contactPhone(String contactPhone) {
            this.contactPhone = contactPhone;
            return this;
        }
        public Builder address(String address) {
            this.address = address;
            return this;
        }
        public Builder bannerAnnouncement(String bannerAnnouncement) {
            this.bannerAnnouncement = bannerAnnouncement;
            return this;
        }
        public Builder settingsJson(String settingsJson) {
            this.settingsJson = settingsJson;
            return this;
        }
        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public WebsiteSettings build() {
            return new WebsiteSettings(id, heroHeadline, heroSubheadline, contactEmail, contactPhone, address, bannerAnnouncement, settingsJson, updatedAt);
        }
    }

}
