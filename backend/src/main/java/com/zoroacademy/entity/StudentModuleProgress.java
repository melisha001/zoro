package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_module_progress", uniqueConstraints = {
    @UniqueConstraint(name = "uk_student_module_prog", columnNames = {"student_id", "module_id"})
})
public class StudentModuleProgress {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "module_id", nullable = false, length = 128)
    private String moduleId;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "watched_seconds")
    private Integer watchedSeconds = 0;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(name = "last_position_seconds")
    private Integer lastPositionSeconds = 0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public StudentModuleProgress() {}

    public StudentModuleProgress(String id, String studentId, String moduleId, String courseId, Integer watchedSeconds, Boolean completed, Integer lastPositionSeconds, LocalDateTime updatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.watchedSeconds = watchedSeconds;
        this.completed = completed;
        this.lastPositionSeconds = lastPositionSeconds;
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

    public String getModuleId() {
        return moduleId;
    }

    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public Integer getWatchedSeconds() {
        return watchedSeconds;
    }

    public void setWatchedSeconds(Integer watchedSeconds) {
        this.watchedSeconds = watchedSeconds;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public Integer getLastPositionSeconds() {
        return lastPositionSeconds;
    }

    public void setLastPositionSeconds(Integer lastPositionSeconds) {
        this.lastPositionSeconds = lastPositionSeconds;
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
        private String moduleId;
        private String courseId;
        private Integer watchedSeconds = 0;
        private Boolean completed = false;
        private Integer lastPositionSeconds = 0;
        private LocalDateTime updatedAt = LocalDateTime.now();

        public Builder id(String id) { this.id = id; return this; }
        public Builder studentId(String studentId) { this.studentId = studentId; return this; }
        public Builder moduleId(String moduleId) { this.moduleId = moduleId; return this; }
        public Builder courseId(String courseId) { this.courseId = courseId; return this; }
        public Builder watchedSeconds(Integer watchedSeconds) { this.watchedSeconds = watchedSeconds; return this; }
        public Builder completed(Boolean completed) { this.completed = completed; return this; }
        public Builder lastPositionSeconds(Integer lastPositionSeconds) { this.lastPositionSeconds = lastPositionSeconds; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public StudentModuleProgress build() {
            return new StudentModuleProgress(id, studentId, moduleId, courseId, watchedSeconds, completed, lastPositionSeconds, updatedAt);
        }
    }
}
