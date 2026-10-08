package com.zoroacademy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_progress", uniqueConstraints = {
    @UniqueConstraint(name = "uk_student_course_module", columnNames = {"student_id", "course_id", "module_id"})
})
public class StudentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "course_id", nullable = false, length = 128)
    private String courseId;

    @Column(name = "module_id", nullable = false, length = 128)
    private String moduleId;

    @Column(name = "last_position")
    private Integer lastPosition = 0;

    @Column(name = "completion_percentage")
    private Integer completionPercentage = 0;

    @Column(length = 50)
    private String status = "Not Started"; // Not Started, In Progress, Completed

    @Column(name = "last_accessed_time")
    private LocalDateTime lastAccessedTime = LocalDateTime.now();

    public StudentProgress() {}

    public StudentProgress(Long id, String studentId, String courseId, String moduleId, Integer lastPosition, Integer completionPercentage, String status, LocalDateTime lastAccessedTime) {
        this.id = id;
        this.studentId = studentId;
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.lastPosition = lastPosition;
        this.completionPercentage = completionPercentage;
        this.status = status;
        this.lastAccessedTime = lastAccessedTime;
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

    public Integer getLastPosition() {
        return lastPosition;
    }

    public void setLastPosition(Integer lastPosition) {
        this.lastPosition = lastPosition;
    }

    public Integer getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastAccessedTime() {
        return lastAccessedTime;
    }

    public void setLastAccessedTime(LocalDateTime lastAccessedTime) {
        this.lastAccessedTime = lastAccessedTime;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String studentId;
        private String courseId;
        private String moduleId;
        private Integer lastPosition = 0;
        private Integer completionPercentage = 0;
        private String status = "Not Started";
        private LocalDateTime lastAccessedTime = LocalDateTime.now();

        public Builder id(Long id) {
            this.id = id;
            return this;
        }
        public Builder studentId(String studentId) {
            this.studentId = studentId;
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
        public Builder lastPosition(Integer lastPosition) {
            this.lastPosition = lastPosition;
            return this;
        }
        public Builder completionPercentage(Integer completionPercentage) {
            this.completionPercentage = completionPercentage;
            return this;
        }
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        public Builder lastAccessedTime(LocalDateTime lastAccessedTime) {
            this.lastAccessedTime = lastAccessedTime;
            return this;
        }

        public StudentProgress build() {
            return new StudentProgress(id, studentId, courseId, moduleId, lastPosition, completionPercentage, status, lastAccessedTime);
        }
    }

}
