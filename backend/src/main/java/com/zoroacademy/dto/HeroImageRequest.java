package com.zoroacademy.dto;

public class HeroImageRequest {

    private String url;
    private String storageKey;
    private String altText;
    private Integer sortOrder;
    private Boolean active;

    public HeroImageRequest() {}

    public HeroImageRequest(String url, String storageKey, String altText, Integer sortOrder, Boolean active) {
        this.url = url;
        this.storageKey = storageKey;
        this.altText = altText;
        this.sortOrder = sortOrder;
        this.active = active;
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

    public String getAltText() {
        return altText;
    }

    public void setAltText(String altText) {
        this.altText = altText;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
