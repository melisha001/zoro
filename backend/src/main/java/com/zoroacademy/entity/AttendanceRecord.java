package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records", uniqueConstraints = {
    @UniqueConstraint(name = "uk_attendance_student_schedule", columnNames = {"student_id", "schedule_id"})
})
public class AttendanceRecord {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "schedule_id", length = 128)
    private String scheduleId;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @Column(length = 50)
    private String date;

    @Column(nullable = false, length = 50)
    private String status; // Present, Absent, Late

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "remark_by", length = 128)
    private String remarkBy;

    @Column(name = "remark_at")
    private LocalDateTime remarkAt;

    @Column(name = "recorded_by")
    private String recordedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "original_status", length = 50)
    private String originalStatus;

    @Column(name = "status_changed_by", length = 128)
    private String statusChangedBy;

    @Column(name = "status_changed_at")
    private LocalDateTime statusChangedAt;

    @Transient
    private String course;

    @Transient
    private String topic;

    @Transient
    private String trainer;

    @Transient
    private String time;

    public AttendanceRecord() {}

    public AttendanceRecord(String id, String scheduleId, String studentId, String studentName, String courseId, String batchId, String date, String status, String remarks, String recordedBy, LocalDateTime createdAt) {
        this.id = id;
        this.scheduleId = scheduleId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.courseId = courseId;
        this.batchId = batchId;
        this.date = date;
        this.status = status;
        this.remarks = remarks;
        this.recordedBy = recordedBy;
        this.createdAt = createdAt;
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

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
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

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("remark")
    public String getRemark() {
        return remarks;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("remark")
    public void setRemark(String remark) {
        this.remarks = remark;
    }

    public String getRemarkBy() {
        return remarkBy;
    }

    public void setRemarkBy(String remarkBy) {
        this.remarkBy = remarkBy;
    }

    public java.time.LocalDateTime getRemarkAt() {
        return remarkAt;
    }

    public void setRemarkAt(java.time.LocalDateTime remarkAt) {
        this.remarkAt = remarkAt;
    }

    public String getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(String recordedBy) {
        this.recordedBy = recordedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
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

    public String getTrainer() {
        return trainer;
    }

    public void setTrainer(String trainer) {
        this.trainer = trainer;
    }

    public String getOriginalStatus() {
        return originalStatus;
    }

    public void setOriginalStatus(String originalStatus) {
        this.originalStatus = originalStatus;
    }

    public String getStatusChangedBy() {
        return statusChangedBy;
    }

    public void setStatusChangedBy(String statusChangedBy) {
        this.statusChangedBy = statusChangedBy;
    }

    public LocalDateTime getStatusChangedAt() {
        return statusChangedAt;
    }

    public void setStatusChangedAt(LocalDateTime statusChangedAt) {
        this.statusChangedAt = statusChangedAt;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String scheduleId;
        private String studentId;
        private String studentName;
        private String courseId;
        private String batchId;
        private String date;
        private String status;
        private String remarks;
        private String remarkBy;
        private LocalDateTime remarkAt;
        private String recordedBy;
        private LocalDateTime createdAt;
        private LocalDateTime joinedAt;
        private String originalStatus;
        private String statusChangedBy;
        private LocalDateTime statusChangedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder scheduleId(String scheduleId) {
            this.scheduleId = scheduleId;
            return this;
        }
        public Builder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }
        public Builder studentName(String studentName) {
            this.studentName = studentName;
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
        public Builder recordedBy(String recordedBy) {
            this.recordedBy = recordedBy;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        public Builder joinedAt(LocalDateTime joinedAt) {
            this.joinedAt = joinedAt;
            return this;
        }
        public Builder originalStatus(String originalStatus) {
            this.originalStatus = originalStatus;
            return this;
        }
        public Builder statusChangedBy(String statusChangedBy) {
            this.statusChangedBy = statusChangedBy;
            return this;
        }
        public Builder statusChangedAt(LocalDateTime statusChangedAt) {
            this.statusChangedAt = statusChangedAt;
            return this;
        }

        public AttendanceRecord build() {
            AttendanceRecord r = new AttendanceRecord(id, scheduleId, studentId, studentName, courseId, batchId, date, status, remarks, recordedBy, createdAt);
            r.setJoinedAt(joinedAt);
            r.setRemarkBy(remarkBy);
            r.setRemarkAt(remarkAt);
            r.setOriginalStatus(originalStatus);
            r.setStatusChangedBy(statusChangedBy);
            r.setStatusChangedAt(statusChangedAt);
            return r;
        }
    }

}
