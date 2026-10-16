package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "trainer_attendance_records", uniqueConstraints = {
    @UniqueConstraint(name = "uk_trainer_attendance_schedule_trainer", columnNames = {"schedule_id", "trainer_id"})
})
public class TrainerAttendanceRecord {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "schedule_id", nullable = false, length = 128)
    private String scheduleId;

    @Column(name = "trainer_id", nullable = false, length = 64)
    private String trainerId;

    @Column(name = "trainer_name")
    private String trainerName;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @Column(length = 50)
    private String date;

    @Column(nullable = false, length = 50)
    private String status; // Present, Absent

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "remark_by", length = 128)
    private String remarkBy;

    @Column(name = "remark_at")
    private LocalDateTime remarkAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    private String course;

    @Transient
    private String topic;

    @Transient
    private String batch;

    @Transient
    private String time;

    @Transient
    private String meetLink;

    public TrainerAttendanceRecord() {}

    public TrainerAttendanceRecord(String id, String scheduleId, String trainerId, String trainerName,
                                   String courseId, String batchId, String date, String status,
                                   LocalDateTime joinedAt, String remarks, String remarkBy,
                                   LocalDateTime remarkAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.scheduleId = scheduleId;
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.courseId = courseId;
        this.batchId = batchId;
        this.date = date;
        this.status = status;
        this.joinedAt = joinedAt;
        this.remarks = remarks;
        this.remarkBy = remarkBy;
        this.remarkAt = remarkAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(String trainerId) {
        this.trainerId = trainerId;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public void setTrainerName(String trainerName) {
        this.trainerName = trainerName;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    @JsonProperty("remark")
    public String getRemark() {
        return remarks;
    }

    @JsonProperty("remark")
    public void setRemark(String remark) {
        this.remarks = remark;
    }

    public String getRemarkBy() {
        return remarkBy;
    }

    public void setRemarkBy(String remarkBy) {
        this.remarkBy = remarkBy;
    }

    public LocalDateTime getRemarkAt() {
        return remarkAt;
    }

    public void setRemarkAt(LocalDateTime remarkAt) {
        this.remarkAt = remarkAt;
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

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getMeetLink() {
        return meetLink;
    }

    public void setMeetLink(String meetLink) {
        this.meetLink = meetLink;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String scheduleId;
        private String trainerId;
        private String trainerName;
        private String courseId;
        private String batchId;
        private String date;
        private String status;
        private LocalDateTime joinedAt;
        private String remarks;
        private String remarkBy;
        private LocalDateTime remarkAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder scheduleId(String scheduleId) {
            this.scheduleId = scheduleId;
            return this;
        }

        public Builder trainerId(String trainerId) {
            this.trainerId = trainerId;
            return this;
        }

        public Builder trainerName(String trainerName) {
            this.trainerName = trainerName;
            return this;
        }

        public Builder courseId(String courseId) {
            this.courseId = courseId;
            return this;
        }

        public Builder batchId(String batchId) {
            this.batchId = batchId;
            return this;
        }

        public Builder date(String date) {
            this.date = date;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder joinedAt(LocalDateTime joinedAt) {
            this.joinedAt = joinedAt;
            return this;
        }

        public Builder remarks(String remarks) {
            this.remarks = remarks;
            return this;
        }

        public Builder remark(String remark) {
            this.remarks = remark;
            return this;
        }

        public Builder remarkBy(String remarkBy) {
            this.remarkBy = remarkBy;
            return this;
        }

        public Builder remarkAt(LocalDateTime remarkAt) {
            this.remarkAt = remarkAt;
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

        public TrainerAttendanceRecord build() {
            return new TrainerAttendanceRecord(id, scheduleId, trainerId, trainerName, courseId, batchId, date, status, joinedAt, remarks, remarkBy, remarkAt, createdAt, updatedAt);
        }
    }
}
