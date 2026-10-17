package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_changes")
public class AttendanceChange {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "attendance_id", length = 128)
    private String attendanceId;

    @Column(name = "schedule_id", length = 128)
    private String scheduleId;

    @Column(name = "student_id", length = 64)
    private String studentId;

    @Column(name = "original_status", nullable = false, length = 50)
    private String originalStatus;

    @Column(name = "new_status", nullable = false, length = 50)
    private String newStatus;

    @Column(name = "changed_by", nullable = false, length = 128)
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public AttendanceChange() {}

    public AttendanceChange(String id, String attendanceId, String scheduleId, String studentId,
                            String originalStatus, String newStatus, String changedBy,
                            LocalDateTime changedAt, String remark) {
        this.id = id;
        this.attendanceId = attendanceId;
        this.scheduleId = scheduleId;
        this.studentId = studentId;
        this.originalStatus = originalStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
        this.remark = remark;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String attendanceId;
        private String scheduleId;
        private String studentId;
        private String originalStatus;
        private String newStatus;
        private String changedBy;
        private LocalDateTime changedAt;
        private String remark;

        public Builder id(String id) { this.id = id; return this; }
        public Builder attendanceId(String attendanceId) { this.attendanceId = attendanceId; return this; }
        public Builder scheduleId(String scheduleId) { this.scheduleId = scheduleId; return this; }
        public Builder studentId(String studentId) { this.studentId = studentId; return this; }
        public Builder originalStatus(String originalStatus) { this.originalStatus = originalStatus; return this; }
        public Builder newStatus(String newStatus) { this.newStatus = newStatus; return this; }
        public Builder changedBy(String changedBy) { this.changedBy = changedBy; return this; }
        public Builder changedAt(LocalDateTime changedAt) { this.changedAt = changedAt; return this; }
        public Builder remark(String remark) { this.remark = remark; return this; }

        public AttendanceChange build() {
            return new AttendanceChange(id, attendanceId, scheduleId, studentId, originalStatus, newStatus, changedBy, changedAt, remark);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAttendanceId() { return attendanceId; }
    public void setAttendanceId(String attendanceId) { this.attendanceId = attendanceId; }

    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getOriginalStatus() { return originalStatus; }
    public void setOriginalStatus(String originalStatus) { this.originalStatus = originalStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
