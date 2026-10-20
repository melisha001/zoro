package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "competition_sets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"competition_id", "code"})
})
public class CompetitionSet {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "competition_id", nullable = false, length = 128)
    private String competitionId;

    @Column(nullable = false, length = 10)
    private String code; // 'A', 'B', 'C', 'D'

    @Column(name = "trainer_id", length = 64)
    private String trainerId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public CompetitionSet() {}

    public CompetitionSet(String id, String competitionId, String code) {
        this.id = id;
        this.competitionId = competitionId;
        this.code = code;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTrainerId() { return trainerId; }
    public void setTrainerId(String trainerId) { this.trainerId = trainerId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
