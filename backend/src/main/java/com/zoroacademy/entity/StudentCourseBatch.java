package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_course_batches")
public class StudentCourseBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "batch_name", nullable = false)
    private String batchName;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public StudentCourseBatch() {}

    public StudentCourseBatch(Long id, String studentId, String courseName, String batchName, String batchId, LocalDateTime createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.courseName = courseName;
        this.batchName = batchName;
        this.batchId = batchId;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
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

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
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
        private Long id;
        private String studentId;
        private String courseName;
        private String batchName;
        private String batchId;
        private LocalDateTime createdAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }
        public Builder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }
        public Builder courseName(String courseName) {
            this.courseName = courseName;
            return this;
        }
        public Builder batchName(String batchName) {
            this.batchName = batchName;
            return this;
        }
        public Builder batchId(String batchId) {
            this.batchId = batchId;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public StudentCourseBatch build() {
            return new StudentCourseBatch(id, studentId, courseName, batchName, batchId, createdAt);
        }
    }

}
