package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "competition_guidance_videos", uniqueConstraints = {
    @UniqueConstraint(name = "uq_comp_guidance_video_bunny", columnNames = {"competition_id", "bunny_video_id"})
})
public class CompetitionGuidanceVideo {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "competition_id", nullable = false, length = 128)
    private String competitionId;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String caption;

    @Column(name = "bunny_video_id", nullable = false, length = 128)
    private String bunnyVideoId;

    @Column(name = "embed_url", length = 500)
    private String embedUrl;

    @Column(name = "playback_url", length = 500)
    private String playbackUrl;

    @Column(nullable = false, length = 50)
    private String status = "Ready";

    @Column(length = 50)
    private String duration;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public CompetitionGuidanceVideo() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompetitionId() { return competitionId; }
    public void setCompetitionId(String competitionId) { this.competitionId = competitionId; }

    public String getTitle() { 
        if (title != null && !title.isBlank()) return title;
        return caption != null ? caption : "Guidance Video";
    }
    public void setTitle(String title) { this.title = title; }

    public String getCaption() {
        if (caption != null && !caption.isBlank()) return caption;
        return title;
    }
    public void setCaption(String caption) { this.caption = caption; }

    public String getBunnyVideoId() { return bunnyVideoId; }
    public void setBunnyVideoId(String bunnyVideoId) { this.bunnyVideoId = bunnyVideoId; }

    public String getEmbedUrl() { return embedUrl; }
    public void setEmbedUrl(String embedUrl) { this.embedUrl = embedUrl; }

    public String getPlaybackUrl() { return playbackUrl; }
    public void setPlaybackUrl(String playbackUrl) { this.playbackUrl = playbackUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
