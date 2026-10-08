package com.zoroacademy.dto;

public class VideoPlaybackResponse {
    private boolean authorized;
    private String videoId;
    private String courseId;
    private String moduleId;
    private String token;
    private Long expiresAt;
    private String streamUrl;
    private String embedUrl;
    private String fallbackUrl;
    private String message;

    public VideoPlaybackResponse() {}

    public VideoPlaybackResponse(boolean authorized, String videoId, String courseId, String moduleId,
                                 String token, Long expiresAt, String streamUrl, String embedUrl,
                                 String fallbackUrl, String message) {
        this.authorized = authorized;
        this.videoId = videoId;
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.token = token;
        this.expiresAt = expiresAt;
        this.streamUrl = streamUrl;
        this.embedUrl = embedUrl;
        this.fallbackUrl = fallbackUrl;
        this.message = message;
    }

    public boolean isAuthorized() { return authorized; }
    public void setAuthorized(boolean authorized) { this.authorized = authorized; }
    public String getVideoId() { return videoId; }
    public void setVideoId(String videoId) { this.videoId = videoId; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Long expiresAt) { this.expiresAt = expiresAt; }
    public String getStreamUrl() { return streamUrl; }
    public void setStreamUrl(String streamUrl) { this.streamUrl = streamUrl; }
    public String getEmbedUrl() { return embedUrl; }
    public void setEmbedUrl(String embedUrl) { this.embedUrl = embedUrl; }
    public String getFallbackUrl() { return fallbackUrl; }
    public void setFallbackUrl(String fallbackUrl) { this.fallbackUrl = fallbackUrl; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private boolean authorized;
        private String videoId;
        private String courseId;
        private String moduleId;
        private String token;
        private Long expiresAt;
        private String streamUrl;
        private String embedUrl;
        private String fallbackUrl;
        private String message;

        public Builder authorized(boolean authorized) { this.authorized = authorized; return this; }
        public Builder videoId(String videoId) { this.videoId = videoId; return this; }
        public Builder courseId(String courseId) { this.courseId = courseId; return this; }
        public Builder moduleId(String moduleId) { this.moduleId = moduleId; return this; }
        public Builder token(String token) { this.token = token; return this; }
        public Builder expiresAt(Long expiresAt) { this.expiresAt = expiresAt; return this; }
        public Builder streamUrl(String streamUrl) { this.streamUrl = streamUrl; return this; }
        public Builder embedUrl(String embedUrl) { this.embedUrl = embedUrl; return this; }
        public Builder fallbackUrl(String fallbackUrl) { this.fallbackUrl = fallbackUrl; return this; }
        public Builder message(String message) { this.message = message; return this; }

        public VideoPlaybackResponse build() {
            return new VideoPlaybackResponse(authorized, videoId, courseId, moduleId, token, expiresAt, streamUrl, embedUrl, fallbackUrl, message);
        }
    }
}
