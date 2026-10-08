package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "competition_modules")
public class CompetitionModule {

    @Id
    @Column(length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    @JsonBackReference
    private Competition competition;

    @Column(nullable = false)
    private String title;

    @Column(name = "round_number")
    private Integer roundNumber = 1;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "assessment_data", columnDefinition = "jsonb")
    @JsonRawValue
    private String assessmentData;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public CompetitionModule() {}

    public CompetitionModule(String id, Competition competition, String title, Integer roundNumber, String description, String assessmentData, LocalDateTime createdAt) {
        this.id = id;
        this.competition = competition;
        this.title = title;
        this.roundNumber = roundNumber;
        this.description = description;
        this.assessmentData = assessmentData;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Competition getCompetition() {
        return competition;
    }

    public void setCompetition(Competition competition) {
        this.competition = competition;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(Integer roundNumber) {
        this.roundNumber = roundNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAssessmentData() {
        return assessmentData;
    }

    public void setAssessmentData(String assessmentData) {
        this.assessmentData = assessmentData;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private Competition competition;
        private String title;
        private Integer roundNumber = 1;
        private String description;
        private String assessmentData;
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder competition(Competition competition) {
            this.competition = competition;
            return this;
        }
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        public Builder roundNumber(Integer roundNumber) {
            this.roundNumber = roundNumber;
            return this;
        }
        public Builder description(String description) {
            this.description = description;
            return this;
        }
        public Builder assessmentData(String assessmentData) {
            this.assessmentData = assessmentData;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public CompetitionModule build() {
            return new CompetitionModule(id, competition, title, roundNumber, description, assessmentData, createdAt);
        }
    }

}
