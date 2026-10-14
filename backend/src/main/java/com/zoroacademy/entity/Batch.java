package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "batches")
public class Batch {

    @Id
    @Column(length = 128)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "trainer_name")
    private String trainerName;

    @Column(name = "trainer_id", length = 64)
    private String trainerId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "batch_trainers", joinColumns = @JoinColumn(name = "batch_id"))
    @Column(name = "trainer_id")
    private java.util.Set<String> trainerIds = new java.util.LinkedHashSet<>();

    @Transient
    private java.util.List<java.util.Map<String, String>> trainers = new java.util.ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String days;

    @Column(length = 100)
    private String session;

    @Column(length = 50)
    private String status = "Active";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Batch() {}

    public Batch(String id, String name, String courseName, String courseId, String trainerName, String trainerId, String days, String session, String status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.courseName = courseName;
        this.courseId = courseId;
        this.trainerName = trainerName;
        this.trainerId = trainerId;
        this.days = days;
        this.session = session;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public void setTrainerName(String trainerName) {
        this.trainerName = trainerName;
    }

    public String getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(String trainerId) {
        this.trainerId = trainerId;
    }

    public java.util.Set<String> getTrainerIds() {
        return trainerIds != null ? trainerIds : new java.util.LinkedHashSet<>();
    }

    public void setTrainerIds(java.util.Set<String> trainerIds) {
        this.trainerIds = trainerIds != null ? trainerIds : new java.util.LinkedHashSet<>();
    }

    public java.util.List<java.util.Map<String, String>> getTrainers() {
        return trainers != null ? trainers : new java.util.ArrayList<>();
    }

    public void setTrainers(java.util.List<java.util.Map<String, String>> trainers) {
        this.trainers = trainers != null ? trainers : new java.util.ArrayList<>();
    }

    public String getDays() {
        return days;
    }

    public void setDays(String days) {
        this.days = days;
    }

    @com.fasterxml.jackson.annotation.JsonSetter("days")
    public void setDaysJson(com.fasterxml.jackson.databind.JsonNode node) {
        if (node == null || node.isNull()) {
            this.days = null;
        } else if (node.isArray()) {
            java.util.List<String> list = new java.util.ArrayList<>();
            node.forEach(item -> list.add(item.asText()));
            this.days = String.join(", ", list);
        } else {
            this.days = node.asText();
        }
    }

    public String getSession() {
        return session;
    }

    public void setSession(String session) {
        this.session = session;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
        private String name;
        private String courseName;
        private String courseId;
        private String trainerName;
        private String trainerId;
        private String days;
        private String session;
        private String status = "Active";
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        public Builder courseName(String courseName) {
            this.courseName = courseName;
            return this;
        }
        public Builder courseId(String courseId) {
            this.courseId = courseId;
            return this;
        }
        public Builder trainerName(String trainerName) {
            this.trainerName = trainerName;
            return this;
        }
        public Builder trainerId(String trainerId) {
            this.trainerId = trainerId;
            return this;
        }
        public Builder days(String days) {
            this.days = days;
            return this;
        }
        public Builder session(String session) {
            this.session = session;
            return this;
        }
        public Builder status(String status) {
            this.status = status;
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

        public Batch build() {
            return new Batch(id, name, courseName, courseId, trainerName, trainerId, days, session, status, createdAt, updatedAt);
        }
    }

}
