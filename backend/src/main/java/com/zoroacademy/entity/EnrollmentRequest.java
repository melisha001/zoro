package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollment_requests")
public class EnrollmentRequest {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_email")
    private String studentEmail;

    @Column(name = "student_phone", length = 50)
    private String studentPhone;

    @Column(name = "course_id", nullable = false, length = 128)
    private String courseId;

    @Column(name = "course_title", nullable = false)
    private String courseTitle;

    @Column(length = 50)
    private String mode;

    @Column(name = "batch_name")
    private String batchName;

    @Column(length = 50)
    private String status = "Pending"; // Pending, Approved, Rejected

    @Column(name = "request_date", length = 50)
    private String requestDate;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public EnrollmentRequest() {}

    public EnrollmentRequest(String id, String studentId, String studentName, String studentEmail, String studentPhone, String courseId, String courseTitle, String mode, String batchName, String status, String requestDate, String remarks, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.studentPhone = studentPhone;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.mode = mode;
        this.batchName = batchName;
        this.status = status;
        this.requestDate = requestDate;
        this.remarks = remarks;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getStudentPhone() {
        return studentPhone;
    }

    public void setStudentPhone(String studentPhone) {
        this.studentPhone = studentPhone;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(String requestDate) {
        this.requestDate = requestDate;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
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
        private String studentId;
        private String studentName;
        private String studentEmail;
        private String studentPhone;
        private String courseId;
        private String courseTitle;
        private String mode;
        private String batchName;
        private String status = "Pending";
        private String requestDate;
        private String remarks;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
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
        public Builder studentEmail(String studentEmail) {
            this.studentEmail = studentEmail;
            return this;
        }
        public Builder studentPhone(String studentPhone) {
            this.studentPhone = studentPhone;
            return this;
        }
        public Builder courseId(String courseId) {
            this.courseId = courseId;
            return this;
        }
        public Builder courseTitle(String courseTitle) {
            this.courseTitle = courseTitle;
            return this;
        }
        public Builder mode(String mode) {
            this.mode = mode;
            return this;
        }
        public Builder batchName(String batchName) {
            this.batchName = batchName;
            return this;
        }
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        public Builder requestDate(String requestDate) {
            this.requestDate = requestDate;
            return this;
        }
        public Builder remarks(String remarks) {
            this.remarks = remarks;
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

        public EnrollmentRequest build() {
            return new EnrollmentRequest(id, studentId, studentName, studentEmail, studentPhone, courseId, courseTitle, mode, batchName, status, requestDate, remarks, createdAt, updatedAt);
        }
    }

}
