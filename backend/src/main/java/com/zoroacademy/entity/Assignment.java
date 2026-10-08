package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @Column(length = 128)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String course;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(length = 255)
    private String batch;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @Column(length = 255)
    private String trainer;

    @Column(name = "due_date", length = 50)
    private String dueDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "jsonb")
    @JsonRawValue
    private String attachment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Assignment() {}

    public Assignment(String id, String title, String course, String courseId, String batch, String batchId, String trainer, String dueDate, String description, String attachment, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.course = course;
        this.courseId = courseId;
        this.batch = batch;
        this.batchId = batchId;
        this.trainer = trainer;
        this.dueDate = dueDate;
        this.description = description;
        this.attachment = attachment;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getTrainer() {
        return trainer;
    }

    public void setTrainer(String trainer) {
        this.trainer = trainer;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAttachment() {
        return attachment;
    }

    public void setAttachment(String attachment) {
        this.attachment = attachment;
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
        private String title;
        private String course;
        private String courseId;
        private String batch;
        private String batchId;
        private String trainer;
        private String dueDate;
        private String description;
        private String attachment;
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        public Builder course(String course) {
            this.course = course;
            return this;
        }
        public Builder courseId(String courseId) {
            this.courseId = courseId;
            return this;
        }
        public Builder batch(String batch) {
            this.batch = batch;
            return this;
        }
        public Builder batchId(String batchId) {
            this.batchId = batchId;
            return this;
        }
        public Builder trainer(String trainer) {
            this.trainer = trainer;
            return this;
        }
        public Builder dueDate(String dueDate) {
            this.dueDate = dueDate;
            return this;
        }
        public Builder description(String description) {
            this.description = description;
            return this;
        }
        public Builder attachment(String attachment) {
            this.attachment = attachment;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Assignment build() {
            return new Assignment(id, title, course, courseId, batch, batchId, trainer, dueDate, description, attachment, createdAt);
        }
    }

}
