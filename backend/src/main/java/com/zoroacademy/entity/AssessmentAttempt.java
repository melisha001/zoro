package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "assessment_attempts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assessment_id", "registration_id", "publish_version"})
})
public class AssessmentAttempt {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "assessment_id", nullable = false, length = 64)
    private String assessmentId;

    @Column(name = "registration_id", nullable = false, length = 128)
    private String registrationId;

    @Column(name = "set_id", length = 64)
    private String setId;

    @Column(nullable = false, length = 50)
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, SUBMITTED, AUTO_SUBMITTED, EVALUATION_PENDING, COMPLETED

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "deadline_at")
    private OffsetDateTime deadlineAt;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "mcq_marks", precision = 8, scale = 2)
    private BigDecimal mcqMarks = BigDecimal.ZERO;

    @Column(name = "voice_marks", precision = 8, scale = 2)
    private BigDecimal voiceMarks = BigDecimal.ZERO;

    @Column(name = "total_marks", precision = 8, scale = 2)
    private BigDecimal totalMarks = BigDecimal.ZERO;

    @Column(name = "publish_version", nullable = false)
    private Integer publishVersion = 1;

    @Column(name = "proctor_violation_count")
    private Integer proctorViolationCount = 0;

    @Column(name = "auto_submitted")
    private Boolean autoSubmitted = false;

    @Column(name = "evaluation_mode", length = 50)
    private String evaluationMode; // AUTO_EVALUATED, MANUAL_PENDING

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public AssessmentAttempt() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getRegistrationId() { return registrationId; }
    public void setRegistrationId(String registrationId) { this.registrationId = registrationId; }

    public String getSetId() { return setId; }
    public void setSetId(String setId) { this.setId = setId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public OffsetDateTime getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(OffsetDateTime deadlineAt) { this.deadlineAt = deadlineAt; }

    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }

    public BigDecimal getMcqMarks() { return mcqMarks; }
    public void setMcqMarks(BigDecimal mcqMarks) { this.mcqMarks = mcqMarks; }

    public BigDecimal getVoiceMarks() { return voiceMarks; }
    public void setVoiceMarks(BigDecimal voiceMarks) { this.voiceMarks = voiceMarks; }

    public BigDecimal getTotalMarks() { return totalMarks; }
    public void setTotalMarks(BigDecimal totalMarks) { this.totalMarks = totalMarks; }

    public Integer getPublishVersion() { return publishVersion; }
    public void setPublishVersion(Integer publishVersion) { this.publishVersion = publishVersion; }

    public Integer getProctorViolationCount() { return proctorViolationCount != null ? proctorViolationCount : 0; }
    public void setProctorViolationCount(Integer proctorViolationCount) { this.proctorViolationCount = proctorViolationCount; }

    public Boolean getAutoSubmitted() { return autoSubmitted != null ? autoSubmitted : false; }
    public void setAutoSubmitted(Boolean autoSubmitted) { this.autoSubmitted = autoSubmitted; }

    public String getEvaluationMode() { return evaluationMode; }
    public void setEvaluationMode(String evaluationMode) { this.evaluationMode = evaluationMode; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
