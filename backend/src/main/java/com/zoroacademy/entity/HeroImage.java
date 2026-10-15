package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "hero_images")
public class HeroImage {

    @Id
    @Column(length = 128)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "storage_key", length = 255)
    private String storageKey;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public HeroImage() {}

    public HeroImage(String id, String url, String storageKey, Integer sortOrder, String altText, Boolean active) {
        this.id = id != null ? id : "hero_" + UUID.randomUUID().toString();
        this.url = url;
        this.storageKey = storageKey;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.altText = altText;
        this.active = active != null ? active : true;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getAltText() {
        return altText;
    }

    public void setAltText(String altText) {
        this.altText = altText;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
