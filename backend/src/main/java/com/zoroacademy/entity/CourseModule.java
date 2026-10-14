package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "course_modules")
public class CourseModule {

    @Id
    @Column(length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonBackReference
    private Course course;

    @Column(name = "module_order", nullable = false)
    private Integer moduleOrder = 1;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String duration;

    @Column(name = "video_storage_ref", columnDefinition = "jsonb")
    @org.hibernate.annotations.ColumnTransformer(write = "?::jsonb")
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.zoroacademy.util.JsonAsStringDeserializer.class)
    @JsonRawValue
    private String videoStorageRef;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "notes_file_url", columnDefinition = "TEXT")
    private String notesFileUrl;

    @Column(name = "notes_file_name", length = 255)
    private String notesFileName;

    @Column(name = "worksheet_file_url", columnDefinition = "TEXT")
    private String worksheetFileUrl;

    @Column(name = "worksheet_file_name", length = 255)
    private String worksheetFileName;

    @Column(name = "assignment_file_url", columnDefinition = "TEXT")
    private String assignmentFileUrl;

    @Column(name = "assignment_file_name", length = 255)
    private String assignmentFileName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    private Boolean locked;

    public Boolean getLocked() {
        return locked;
    }

    public void setLocked(Boolean locked) {
        this.locked = locked;
    }

    @JsonProperty("isLocked")
    public Boolean isLocked() {
        return Boolean.TRUE.equals(locked);
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "mod_" + java.util.UUID.randomUUID();
        }
    }

    public CourseModule() {}

    public CourseModule(String id, Course course, Integer moduleOrder, String title, String description, String duration, String videoStorageRef, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.course = course;
        this.moduleOrder = moduleOrder;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.videoStorageRef = videoStorageRef;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public CourseModule(String id, Course course, Integer moduleOrder, String title, String description, String duration, String videoStorageRef, String thumbnailUrl, String notesFileUrl, String notesFileName, String worksheetFileUrl, String worksheetFileName, String assignmentFileUrl, String assignmentFileName, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.course = course;
        this.moduleOrder = moduleOrder;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.videoStorageRef = videoStorageRef;
        this.thumbnailUrl = thumbnailUrl;
        this.notesFileUrl = notesFileUrl;
        this.notesFileName = notesFileName;
        this.worksheetFileUrl = worksheetFileUrl;
        this.worksheetFileName = worksheetFileName;
        this.assignmentFileUrl = assignmentFileUrl;
        this.assignmentFileName = assignmentFileName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public Integer getModuleOrder() {
        return moduleOrder;
    }

    public void setModuleOrder(Integer moduleOrder) {
        this.moduleOrder = moduleOrder;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getVideoStorageRef() {
        return (videoStorageRef == null || videoStorageRef.trim().isEmpty()) ? null : videoStorageRef.trim();
    }

    public void setVideoStorageRef(String videoStorageRef) {
        this.videoStorageRef = (videoStorageRef == null || videoStorageRef.trim().isEmpty()) ? null : videoStorageRef.trim();
    }

    public String getThumbnailUrl() {
        return (thumbnailUrl == null || thumbnailUrl.trim().isEmpty()) ? null : thumbnailUrl.trim();
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = (thumbnailUrl == null || thumbnailUrl.trim().isEmpty()) ? null : thumbnailUrl.trim();
    }

    @JsonProperty("thumbnail")
    public String getThumbnail() {
        return getThumbnailUrl();
    }

    @JsonProperty("thumbnail")
    public void setThumbnail(String thumbnail) {
        if (thumbnail != null && !thumbnail.isBlank()) {
            this.thumbnailUrl = thumbnail.trim();
        }
    }

    public String getNotesFileUrl() {
        return (notesFileUrl == null || notesFileUrl.trim().isEmpty()) ? null : notesFileUrl.trim();
    }

    public void setNotesFileUrl(String notesFileUrl) {
        this.notesFileUrl = (notesFileUrl == null || notesFileUrl.trim().isEmpty()) ? null : notesFileUrl.trim();
    }

    public String getNotesFileName() {
        return notesFileName;
    }

    public void setNotesFileName(String notesFileName) {
        this.notesFileName = notesFileName;
    }

    @JsonProperty("notesFile")
    public Map<String, Object> getNotesFile() {
        if (notesFileUrl == null && notesFileName == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("fileUrl", notesFileUrl);
        map.put("name", notesFileName != null ? notesFileName : "Notes");
        return map;
    }

    @JsonProperty("notesFile")
    public void setNotesFile(Object notesFile) {
        if (notesFile instanceof Map<?, ?> map) {
            Object url = map.get("fileUrl");
            if (url == null) url = map.get("url");
            if (url != null) this.notesFileUrl = url.toString().trim();
            Object name = map.get("name");
            if (name != null) this.notesFileName = name.toString().trim();
        } else if (notesFile instanceof String str && !str.isBlank()) {
            this.notesFileUrl = str.trim();
        }
    }

    public String getWorksheetFileUrl() {
        return (worksheetFileUrl == null || worksheetFileUrl.trim().isEmpty()) ? null : worksheetFileUrl.trim();
    }

    public void setWorksheetFileUrl(String worksheetFileUrl) {
        this.worksheetFileUrl = (worksheetFileUrl == null || worksheetFileUrl.trim().isEmpty()) ? null : worksheetFileUrl.trim();
    }

    public String getWorksheetFileName() {
        return worksheetFileName;
    }

    public void setWorksheetFileName(String worksheetFileName) {
        this.worksheetFileName = worksheetFileName;
    }

    @JsonProperty("worksheetFile")
    public Map<String, Object> getWorksheetFile() {
        if (worksheetFileUrl == null && worksheetFileName == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("fileUrl", worksheetFileUrl);
        map.put("name", worksheetFileName != null ? worksheetFileName : "Worksheet");
        return map;
    }

    @JsonProperty("worksheetFile")
    public void setWorksheetFile(Object worksheetFile) {
        if (worksheetFile instanceof Map<?, ?> map) {
            Object url = map.get("fileUrl");
            if (url == null) url = map.get("url");
            if (url != null) this.worksheetFileUrl = url.toString().trim();
            Object name = map.get("name");
            if (name != null) this.worksheetFileName = name.toString().trim();
        } else if (worksheetFile instanceof String str && !str.isBlank()) {
            this.worksheetFileUrl = str.trim();
        }
    }

    public String getAssignmentFileUrl() {
        return (assignmentFileUrl == null || assignmentFileUrl.trim().isEmpty()) ? null : assignmentFileUrl.trim();
    }

    public void setAssignmentFileUrl(String assignmentFileUrl) {
        this.assignmentFileUrl = (assignmentFileUrl == null || assignmentFileUrl.trim().isEmpty()) ? null : assignmentFileUrl.trim();
    }

    public String getAssignmentFileName() {
        return assignmentFileName;
    }

    public void setAssignmentFileName(String assignmentFileName) {
        this.assignmentFileName = assignmentFileName;
    }

    @JsonProperty("assignmentFile")
    public Map<String, Object> getAssignmentFile() {
        if (assignmentFileUrl == null && assignmentFileName == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("fileUrl", assignmentFileUrl);
        map.put("name", assignmentFileName != null ? assignmentFileName : "Assignment");
        return map;
    }

    @JsonProperty("assignmentFile")
    public void setAssignmentFile(Object assignmentFile) {
        if (assignmentFile instanceof Map<?, ?> map) {
            Object url = map.get("fileUrl");
            if (url == null) url = map.get("url");
            if (url != null) this.assignmentFileUrl = url.toString().trim();
            Object name = map.get("name");
            if (name != null) this.assignmentFileName = name.toString().trim();
        } else if (assignmentFile instanceof String str && !str.isBlank()) {
            this.assignmentFileUrl = str.trim();
        }
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
        private Course course;
        private Integer moduleOrder = 1;
        private String title;
        private String description;
        private String duration;
        private String videoStorageRef;
        private String thumbnailUrl;
        private String notesFileUrl;
        private String notesFileName;
        private String worksheetFileUrl;
        private String worksheetFileName;
        private String assignmentFileUrl;
        private String assignmentFileName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder course(Course course) {
            this.course = course;
            return this;
        }
        public Builder moduleOrder(Integer moduleOrder) {
            this.moduleOrder = moduleOrder;
            return this;
        }
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        public Builder description(String description) {
            this.description = description;
            return this;
        }
        public Builder duration(String duration) {
            this.duration = duration;
            return this;
        }
        public Builder videoStorageRef(String videoStorageRef) {
            this.videoStorageRef = videoStorageRef;
            return this;
        }
        public Builder thumbnailUrl(String thumbnailUrl) {
            this.thumbnailUrl = thumbnailUrl;
            return this;
        }
        public Builder notesFileUrl(String notesFileUrl) {
            this.notesFileUrl = notesFileUrl;
            return this;
        }
        public Builder notesFileName(String notesFileName) {
            this.notesFileName = notesFileName;
            return this;
        }
        public Builder worksheetFileUrl(String worksheetFileUrl) {
            this.worksheetFileUrl = worksheetFileUrl;
            return this;
        }
        public Builder worksheetFileName(String worksheetFileName) {
            this.worksheetFileName = worksheetFileName;
            return this;
        }
        public Builder assignmentFileUrl(String assignmentFileUrl) {
            this.assignmentFileUrl = assignmentFileUrl;
            return this;
        }
        public Builder assignmentFileName(String assignmentFileName) {
            this.assignmentFileName = assignmentFileName;
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

        public CourseModule build() {
            return new CourseModule(id, course, moduleOrder, title, description, duration, videoStorageRef, thumbnailUrl, notesFileUrl, notesFileName, worksheetFileUrl, worksheetFileName, assignmentFileUrl, assignmentFileName, createdAt, updatedAt);
        }
    }

}
