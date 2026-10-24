package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "republish_audit")
public class RepublishAudit {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "assessment_id", nullable = false, length = 64)
    private String assessmentId;

    @Column(name = "admin_id", length = 64)
    private String adminId;

    @CreationTimestamp
    @Column(name = "republished_at", nullable = false, updatable = false)
    private OffsetDateTime republishedAt;

    @Column(name = "deleted_attempts_count", nullable = false)
    private int deletedAttemptsCount;

    @Column(name = "deleted_answers_count", nullable = false)
    private int deletedAnswersCount;

    @Column(name = "deleted_recordings_count", nullable = false)
    private int deletedRecordingsCount;

    public RepublishAudit() {}

    public RepublishAudit(String id, String assessmentId, String adminId, int deletedAttemptsCount, int deletedAnswersCount, int deletedRecordingsCount) {
        this.id = id;
        this.assessmentId = assessmentId;
        this.adminId = adminId;
        this.deletedAttemptsCount = deletedAttemptsCount;
        this.deletedAnswersCount = deletedAnswersCount;
        this.deletedRecordingsCount = deletedRecordingsCount;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public OffsetDateTime getRepublishedAt() { return republishedAt; }
    public void setRepublishedAt(OffsetDateTime republishedAt) { this.republishedAt = republishedAt; }

    public int getDeletedAttemptsCount() { return deletedAttemptsCount; }
    public void setDeletedAttemptsCount(int deletedAttemptsCount) { this.deletedAttemptsCount = deletedAttemptsCount; }

    public int getDeletedAnswersCount() { return deletedAnswersCount; }
    public void setDeletedAnswersCount(int deletedAnswersCount) { this.deletedAnswersCount = deletedAnswersCount; }

    public int getDeletedRecordingsCount() { return deletedRecordingsCount; }
    public void setDeletedRecordingsCount(int deletedRecordingsCount) { this.deletedRecordingsCount = deletedRecordingsCount; }
}
