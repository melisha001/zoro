package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

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
    @JsonRawValue
    private String videoStorageRef;

    @Column(name = "after_session_assessment", columnDefinition = "jsonb")
    @JsonRawValue
    private String afterSessionAssessment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public CourseModule() {}

    public CourseModule(String id, Course course, Integer moduleOrder, String title, String description, String duration, String videoStorageRef, String afterSessionAssessment, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.course = course;
        this.moduleOrder = moduleOrder;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.videoStorageRef = videoStorageRef;
        this.afterSessionAssessment = afterSessionAssessment;
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
        return videoStorageRef;
    }

    public void setVideoStorageRef(String videoStorageRef) {
        this.videoStorageRef = videoStorageRef;
    }

    public String getAfterSessionAssessment() {
        return afterSessionAssessment;
    }

    public void setAfterSessionAssessment(String afterSessionAssessment) {
        this.afterSessionAssessment = afterSessionAssessment;
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
        private String afterSessionAssessment;
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
        public Builder afterSessionAssessment(String afterSessionAssessment) {
            this.afterSessionAssessment = afterSessionAssessment;
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
            return new CourseModule(id, course, moduleOrder, title, description, duration, videoStorageRef, afterSessionAssessment, createdAt, updatedAt);
        }
    }

}
