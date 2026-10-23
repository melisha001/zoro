package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "exam_proctor_events")
public class ExamProctorEvent {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "attempt_id", length = 128, nullable = false)
    private String attemptId;

    @Column(name = "candidate_id", length = 128)
    private String candidateId;

    @Column(name = "event_type", length = 64, nullable = false)
    private String eventType;

    @Column(name = "event_count")
    private Integer eventCount = 1;

    @Column(columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public ExamProctorEvent() {}

    public ExamProctorEvent(String id, String attemptId, String candidateId, String eventType, Integer eventCount, String details) {
        this.id = id;
        this.attemptId = attemptId;
        this.candidateId = candidateId;
        this.eventType = eventType;
        this.eventCount = eventCount;
        this.details = details;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(String attemptId) {
        this.attemptId = attemptId;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Integer getEventCount() {
        return eventCount;
    }

    public void setEventCount(Integer eventCount) {
        this.eventCount = eventCount;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
