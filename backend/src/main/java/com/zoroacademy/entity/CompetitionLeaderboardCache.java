package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "competition_leaderboard_cache", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"competition_id", "registration_id"})
})
public class CompetitionLeaderboardCache {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "competition_id", nullable = false, length = 128)
    private String competitionId;

    @Column(name = "registration_id", nullable = false, length = 128)
    private String registrationId;

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(name = "set_code", length = 10)
    private String setCode;

    @Column(name = "total_marks", precision = 8, scale = 2, nullable = false)
    private BigDecimal totalMarks = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer rank;

    @Column(precision = 6, scale = 2)
    private BigDecimal percentile;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @UpdateTimestamp
    @Column(name = "last_refreshed_at")
    private OffsetDateTime lastRefreshedAt;

    public CompetitionLeaderboardCache() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getRegistrationId() { return registrationId; }
    public void setRegistrationId(String registrationId) { this.registrationId = registrationId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getSetCode() { return setCode; }
    public void setSetCode(String setCode) { this.setCode = setCode; }

    public BigDecimal getTotalMarks() { return totalMarks; }
    public void setTotalMarks(BigDecimal totalMarks) { this.totalMarks = totalMarks; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public BigDecimal getPercentile() { return percentile; }
    public void setPercentile(BigDecimal percentile) { this.percentile = percentile; }

    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime publishedAt) { this.publishedAt = publishedAt; }

    public OffsetDateTime getLastRefreshedAt() { return lastRefreshedAt; }
    public void setLastRefreshedAt(OffsetDateTime lastRefreshedAt) { this.lastRefreshedAt = lastRefreshedAt; }
}
