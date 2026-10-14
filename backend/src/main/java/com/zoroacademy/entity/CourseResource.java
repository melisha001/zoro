package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_resources")
public class CourseResource {

    @Id
    @Column(length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonBackReference
    private Course course;

    @Column(name = "module_id", length = 128)
    private String moduleId;

    @Column(nullable = false)
    private String title;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size", length = 50)
    private String fileSize;

    @Column(name = "target_audience", length = 50)
    private String targetAudience = "all";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "res_" + java.util.UUID.randomUUID();
        }
    }

    public CourseResource() {}

    public CourseResource(String id, Course course, String moduleId, String title, String fileUrl, String fileType, String fileSize, String targetAudience, LocalDateTime createdAt) {
        this.id = id;
        this.course = course;
        this.moduleId = moduleId;
        this.title = title;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.targetAudience = targetAudience;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public String getModuleId() {
        return moduleId;
    }

    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getFileSize() {
        return fileSize;
    }

    public void setFileSize(String fileSize) {
        this.fileSize = fileSize;
    }

    public String getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(String targetAudience) {
        this.targetAudience = targetAudience;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private Course course;
        private String moduleId;
        private String title;
        private String fileUrl;
        private String fileType;
        private String fileSize;
        private String targetAudience = "all";
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder course(Course course) {
            this.course = course;
            return this;
        }
        public Builder moduleId(String moduleId) {
            this.moduleId = moduleId;
            return this;
        }
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        public Builder fileUrl(String fileUrl) {
            this.fileUrl = fileUrl;
            return this;
        }
        public Builder fileType(String fileType) {
            this.fileType = fileType;
            return this;
        }
        public Builder fileSize(String fileSize) {
            this.fileSize = fileSize;
            return this;
        }
        public Builder targetAudience(String targetAudience) {
            this.targetAudience = targetAudience;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public CourseResource build() {
            return new CourseResource(id, course, moduleId, title, fileUrl, fileType, fileSize, targetAudience, createdAt);
        }
    }

}
