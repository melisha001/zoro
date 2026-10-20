package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "voice_evaluation_scores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"answer_id", "criterion_id"})
})
public class VoiceEvaluationScore {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "answer_id", nullable = false, length = 64)
    private String answerId;

    @Column(name = "criterion_id", nullable = false, length = 64)
    private String criterionId;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public VoiceEvaluationScore() {}

    public VoiceEvaluationScore(String id, String answerId, String criterionId, BigDecimal score) {
        this.id = id;
        this.answerId = answerId;
        this.criterionId = criterionId;
        this.score = score;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAnswerId() { return answerId; }
    public void setAnswerId(String answerId) { this.answerId = answerId; }

    public String getCriterionId() { return criterionId; }
    public void setCriterionId(String criterionId) { this.criterionId = criterionId; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
