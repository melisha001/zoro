package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "result_corrections")
public class ResultCorrection {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "competition_id", nullable = false, length = 128)
    private String competitionId;

    @Column(name = "registration_id", nullable = false, length = 128)
    private String registrationId;

    @Column(name = "old_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal oldMarks;

    @Column(name = "new_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal newMarks;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "changed_by", length = 64)
    private String changedBy;

    @CreationTimestamp
    @Column(name = "changed_at", updatable = false)
    private OffsetDateTime changedAt;

    public ResultCorrection() {}

    public ResultCorrection(String id, String competitionId, String registrationId, BigDecimal oldMarks, BigDecimal newMarks, String reason, String changedBy) {
        this.id = id;
        this.competitionId = competitionId;
        this.registrationId = registrationId;
        this.oldMarks = oldMarks;
        this.newMarks = newMarks;
        this.reason = reason;
        this.changedBy = changedBy;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getRegistrationId() { return registrationId; }
    public void setRegistrationId(String registrationId) { this.registrationId = registrationId; }

    public BigDecimal getOldMarks() { return oldMarks; }
    public void setOldMarks(BigDecimal oldMarks) { this.oldMarks = oldMarks; }

    public BigDecimal getNewMarks() { return newMarks; }
    public void setNewMarks(BigDecimal newMarks) { this.newMarks = newMarks; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public OffsetDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(OffsetDateTime changedAt) { this.changedAt = changedAt; }
}
