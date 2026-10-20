package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "competition_set_members")
public class CompetitionSetMember {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "competition_id", nullable = false, length = 128)
    private String competitionId;

    @Column(name = "registration_id", nullable = false, length = 128, unique = true)
    private String registrationId;

    @Column(name = "set_id", nullable = false, length = 64)
    private String setId;

    @CreationTimestamp
    @Column(name = "assigned_at", updatable = false)
    private OffsetDateTime assignedAt;

    public CompetitionSetMember() {}

    public CompetitionSetMember(String id, String competitionId, String registrationId, String setId) {
        this.id = id;
        this.competitionId = competitionId;
        this.registrationId = registrationId;
        this.setId = setId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getRegistrationId() { return registrationId; }
    public void setRegistrationId(String registrationId) { this.registrationId = registrationId; }

    public String getSetId() { return setId; }
    public void setSetId(String setId) { this.setId = setId; }

    public OffsetDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(OffsetDateTime assignedAt) { this.assignedAt = assignedAt; }
}
