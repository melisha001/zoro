package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "videos")
public class Video {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "bunny_video_id", unique = true, nullable = false, length = 128)
    private String bunnyVideoId;

    @Column(name = "library_id", nullable = false)
    private Integer libraryId = 770045;

    @Column(nullable = false)
    private String title;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "module_id", length = 128)
    private String moduleId;

    @Column(name = "duration_seconds")
    private Integer durationSeconds = 0;

    @Column(nullable = false)
    private Integer status = 0; // 0=Created, 1=Uploaded, 2=Processing, 3=Transcoded/Ready, 4=Error

    @Column(name = "status_label", length = 50)
    private String statusLabel = "Processing";

    @Column(name = "storage_key")
    private String storageKey;

    @Column(name = "direct_stream_url", columnDefinition = "TEXT")
    private String directStreamUrl;

    @Column(name = "hls_playlist_url", columnDefinition = "TEXT")
    private String hlsPlaylistUrl;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Video() {}

    public Video(String id, String bunnyVideoId, Integer libraryId, String title, String courseId, String moduleId, Integer durationSeconds, Integer status, String statusLabel, String storageKey, String directStreamUrl, String hlsPlaylistUrl, String thumbnailUrl, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.bunnyVideoId = bunnyVideoId;
        this.libraryId = libraryId;
        this.title = title;
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.durationSeconds = durationSeconds;
        this.status = status;
        this.statusLabel = statusLabel;
        this.storageKey = storageKey;
        this.directStreamUrl = directStreamUrl;
        this.hlsPlaylistUrl = hlsPlaylistUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBunnyVideoId() {
        return bunnyVideoId;
    }

    public void setBunnyVideoId(String bunnyVideoId) {
        this.bunnyVideoId = bunnyVideoId;
    }

    public Integer getLibraryId() {
        return libraryId;
    }

    public void setLibraryId(Integer libraryId) {
        this.libraryId = libraryId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getModuleId() {
        return moduleId;
    }

    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getStatusLabel() {
        return statusLabel;
    }

    public void setStatusLabel(String statusLabel) {
        this.statusLabel = statusLabel;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getDirectStreamUrl() {
        return directStreamUrl;
    }

    public void setDirectStreamUrl(String directStreamUrl) {
        this.directStreamUrl = directStreamUrl;
    }

    public String getHlsPlaylistUrl() {
        return hlsPlaylistUrl;
    }

    public void setHlsPlaylistUrl(String hlsPlaylistUrl) {
        this.hlsPlaylistUrl = hlsPlaylistUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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
        private String bunnyVideoId;
        private Integer libraryId = 770045;
        private String title;
        private String courseId;
        private String moduleId;
        private Integer durationSeconds = 0;
        private Integer status = 0;
        private String statusLabel = "Processing";
        private String storageKey;
        private String directStreamUrl;
        private String hlsPlaylistUrl;
        private String thumbnailUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder bunnyVideoId(String bunnyVideoId) {
            this.bunnyVideoId = bunnyVideoId;
            return this;
        }
        public Builder libraryId(Integer libraryId) {
            this.libraryId = libraryId;
            return this;
        }
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        public Builder courseId(String courseId) {
            this.courseId = courseId;
            return this;
        }
        public Builder moduleId(String moduleId) {
            this.moduleId = moduleId;
            return this;
        }
        public Builder durationSeconds(Integer durationSeconds) {
            this.durationSeconds = durationSeconds;
            return this;
        }
        public Builder status(Integer status) {
            this.status = status;
            return this;
        }
        public Builder statusLabel(String statusLabel) {
            this.statusLabel = statusLabel;
            return this;
        }
        public Builder storageKey(String storageKey) {
            this.storageKey = storageKey;
            return this;
        }
        public Builder directStreamUrl(String directStreamUrl) {
            this.directStreamUrl = directStreamUrl;
            return this;
        }
        public Builder hlsPlaylistUrl(String hlsPlaylistUrl) {
            this.hlsPlaylistUrl = hlsPlaylistUrl;
            return this;
        }
        public Builder thumbnailUrl(String thumbnailUrl) {
            this.thumbnailUrl = thumbnailUrl;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Video build() {
            return new Video(id, bunnyVideoId, libraryId, title, courseId, moduleId, durationSeconds, status, statusLabel, storageKey, directStreamUrl, hlsPlaylistUrl, thumbnailUrl, createdAt, updatedAt);
        }
    }

}
