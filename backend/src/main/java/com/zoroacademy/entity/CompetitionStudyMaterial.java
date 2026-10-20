package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "competition_study_materials")
public class CompetitionStudyMaterial {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "competition_id", nullable = false, length = 128)
    private String competitionId;

    @Column(nullable = false)
    private String title;

    @Column(name = "stored_file_id", length = 64)
    private String storedFileId;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public CompetitionStudyMaterial() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStoredFileId() { return storedFileId; }
    public void setStoredFileId(String storedFileId) { this.storedFileId = storedFileId; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
