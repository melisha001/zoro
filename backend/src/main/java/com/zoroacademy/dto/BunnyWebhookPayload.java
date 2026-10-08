package com.zoroacademy.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class BunnyWebhookPayload {

    @JsonProperty("VideoGuid")
    private String videoGuid;

    @JsonProperty("VideoLibraryId")
    private Integer videoLibraryId;

    @JsonProperty("Status")
    private Integer status;

    @JsonProperty("Title")
    private String title;

    @JsonProperty("Length")
    private Integer length;

    public BunnyWebhookPayload() {}

    public BunnyWebhookPayload(String videoGuid, Integer videoLibraryId, Integer status, String title, Integer length) {
        this.videoGuid = videoGuid;
        this.videoLibraryId = videoLibraryId;
        this.status = status;
        this.title = title;
        this.length = length;
    }

    public String getVideoGuid() { return videoGuid; }
    public void setVideoGuid(String videoGuid) { this.videoGuid = videoGuid; }
    public Integer getVideoLibraryId() { return videoLibraryId; }
    public void setVideoLibraryId(Integer videoLibraryId) { this.videoLibraryId = videoLibraryId; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getLength() { return length; }
    public void setLength(Integer length) { this.length = length; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String videoGuid;
        private Integer videoLibraryId;
        private Integer status;
        private String title;
        private Integer length;

        public Builder videoGuid(String videoGuid) { this.videoGuid = videoGuid; return this; }
        public Builder videoLibraryId(Integer videoLibraryId) { this.videoLibraryId = videoLibraryId; return this; }
        public Builder status(Integer status) { this.status = status; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder length(Integer length) { this.length = length; return this; }

        public BunnyWebhookPayload build() {
            return new BunnyWebhookPayload(videoGuid, videoLibraryId, status, title, length);
        }
    }
}
