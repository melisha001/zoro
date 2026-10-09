package com.zoroacademy.dto;

public class VideoUploadResponse {
    private String videoId;
    private Integer libraryId;
    private String uploadUrl;
    private String authorizationSignature;
    private Long authorizationExpire;
    private String tusEndpoint;
    private String directStreamUrl;
    private String title;
    private String status;

    public VideoUploadResponse() {}

    public VideoUploadResponse(String videoId, Integer libraryId, String uploadUrl, String authorizationSignature,
                               Long authorizationExpire, String tusEndpoint, String directStreamUrl, String title, String status) {
        this.videoId = videoId;
        this.libraryId = libraryId;
        this.uploadUrl = uploadUrl;
        this.authorizationSignature = authorizationSignature;
        this.authorizationExpire = authorizationExpire;
        this.tusEndpoint = tusEndpoint;
        this.directStreamUrl = directStreamUrl;
        this.title = title;
        this.status = status;
    }

    public String getVideoId() { return videoId; }
    public void setVideoId(String videoId) { this.videoId = videoId; }

    public Integer getLibraryId() { return libraryId; }
    public void setLibraryId(Integer libraryId) { this.libraryId = libraryId; }

    public String getUploadUrl() { return uploadUrl; }
    public void setUploadUrl(String uploadUrl) { this.uploadUrl = uploadUrl; }

    public String getAuthorizationSignature() { return authorizationSignature; }
    public void setAuthorizationSignature(String authorizationSignature) { this.authorizationSignature = authorizationSignature; }

    public Long getAuthorizationExpire() { return authorizationExpire; }
    public void setAuthorizationExpire(Long authorizationExpire) { this.authorizationExpire = authorizationExpire; }

    public String getTusEndpoint() { return tusEndpoint; }
    public void setTusEndpoint(String tusEndpoint) { this.tusEndpoint = tusEndpoint; }

    public String getDirectStreamUrl() { return directStreamUrl; }
    public void setDirectStreamUrl(String directStreamUrl) { this.directStreamUrl = directStreamUrl; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String videoId;
        private Integer libraryId;
        private String uploadUrl;
        private String authorizationSignature;
        private Long authorizationExpire;
        private String tusEndpoint;
        private String directStreamUrl;
        private String title;
        private String status;

        public Builder videoId(String videoId) { this.videoId = videoId; return this; }
        public Builder libraryId(Integer libraryId) { this.libraryId = libraryId; return this; }
        public Builder uploadUrl(String uploadUrl) { this.uploadUrl = uploadUrl; return this; }
        public Builder authorizationSignature(String authorizationSignature) { this.authorizationSignature = authorizationSignature; return this; }
        public Builder authorizationExpire(Long authorizationExpire) { this.authorizationExpire = authorizationExpire; return this; }
        public Builder tusEndpoint(String tusEndpoint) { this.tusEndpoint = tusEndpoint; return this; }
        public Builder directStreamUrl(String directStreamUrl) { this.directStreamUrl = directStreamUrl; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder status(String status) { this.status = status; return this; }

        public VideoUploadResponse build() {
            return new VideoUploadResponse(videoId, libraryId, uploadUrl, authorizationSignature, authorizationExpire, tusEndpoint, directStreamUrl, title, status);
        }
    }
}
