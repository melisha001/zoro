package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
public class Schedule {

    @Id
    @Column(length = 128)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String course;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(nullable = false)
    private String batch;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @Column(nullable = false)
    private String trainer;

    @Column(name = "trainer_id", length = 64)
    private String trainerId;

    @Column(nullable = false, length = 100)
    private String time;

    @Column(nullable = false, length = 50)
    private String date;

    @Column(length = 100)
    private String mode;

    @Column(name = "meet_link", columnDefinition = "TEXT")
    private String meetLink;

    @Column(name = "students_count")
    private Integer studentsCount = 25;

    @Column(length = 50)
    private String status = "Upcoming";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Schedule() {}

    public Schedule(String id, String title, String course, String courseId, String batch, String batchId, String trainer, String trainerId, String time, String date, String mode, String meetLink, Integer studentsCount, String status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.course = course;
        this.courseId = courseId;
        this.batch = batch;
        this.batchId = batchId;
        this.trainer = trainer;
        this.trainerId = trainerId;
        this.time = time;
        this.date = date;
        this.mode = mode;
        this.meetLink = meetLink;
        this.studentsCount = studentsCount;
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

    public String getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(String trainerId) {
        this.trainerId = trainerId;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getMeetLink() {
        return meetLink;
    }

    public void setMeetLink(String meetLink) {
        this.meetLink = meetLink;
    }

    public Integer getStudentsCount() {
        return studentsCount;
    }

    public void setStudentsCount(Integer studentsCount) {
        this.studentsCount = studentsCount;
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
        private String title;
        private String course;
        private String courseId;
        private String batch;
        private String batchId;
        private String trainer;
        private String trainerId;
        private String time;
        private String date;
        private String mode;
        private String meetLink;
        private Integer studentsCount = 25;
        private String status = "Upcoming";
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

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
        public Builder trainerId(String trainerId) {
            this.trainerId = trainerId;
            return this;
        }
        public Builder time(String time) {
            this.time = time;
            return this;
        }
        public Builder date(String date) {
            this.date = date;
            return this;
        }
        public Builder mode(String mode) {
            this.mode = mode;
            return this;
        }
        public Builder meetLink(String meetLink) {
            this.meetLink = meetLink;
            return this;
        }
        public Builder studentsCount(Integer studentsCount) {
            this.studentsCount = studentsCount;
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

        public Schedule build() {
            return new Schedule(id, title, course, courseId, batch, batchId, trainer, trainerId, time, date, mode, meetLink, studentsCount, status, createdAt, updatedAt);
        }
    }

}
