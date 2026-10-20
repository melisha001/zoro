package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "competition_results", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"competition_id", "registration_id"})
})
public class CompetitionResult {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "competition_id", nullable = false, length = 128)
    private String competitionId;

    @Column(name = "registration_id", nullable = false, length = 128)
    private String registrationId;

    @Column(name = "total_marks", precision = 8, scale = 2, nullable = false)
    private BigDecimal totalMarks = BigDecimal.ZERO;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "percentile", precision = 6, scale = 2)
    private BigDecimal percentile;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public CompetitionResult() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getRegistrationId() { return registrationId; }
    public void setRegistrationId(String registrationId) { this.registrationId = registrationId; }

    public BigDecimal getTotalMarks() { return totalMarks; }
    public void setTotalMarks(BigDecimal totalMarks) { this.totalMarks = totalMarks; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public BigDecimal getPercentile() { return percentile; }
    public void setPercentile(BigDecimal percentile) { this.percentile = percentile; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
