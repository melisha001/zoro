package com.zoroacademy.dto;

public class VideoUploadRequest {
    private String title;
    private String courseId;
    private String moduleId;

    public VideoUploadRequest() {}

    public VideoUploadRequest(String title, String courseId, String moduleId) {
        this.title = title;
        this.courseId = courseId;
        this.moduleId = moduleId;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String title;
        private String courseId;
        private String moduleId;

        public Builder title(String title) { this.title = title; return this; }
        public Builder courseId(String courseId) { this.courseId = courseId; return this; }
        public Builder moduleId(String moduleId) { this.moduleId = moduleId; return this; }

        public VideoUploadRequest build() {
            return new VideoUploadRequest(title, courseId, moduleId);
        }
    }
}
