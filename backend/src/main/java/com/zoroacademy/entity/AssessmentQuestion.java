package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "assessment_questions")
public class AssessmentQuestion {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "assessment_id", nullable = false, length = 64)
    private String assessmentId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "question_format", nullable = false, length = 50)
    private String questionFormat = "MCQ"; // MCQ, VIDEO, AUDIO

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "media_ref")
    private String mediaRef; // Bunny Stream video id or stored file id

    @Column(name = "answer_format", nullable = false, length = 50)
    private String answerFormat = "MCQ_OPTIONS"; // MCQ_OPTIONS, VOICE

    @Column(name = "guidance_text", columnDefinition = "TEXT")
    private String guidanceText;

    @Column(name = "max_duration_seconds", nullable = false)
    private Integer maxDurationSeconds = 120;

    @Column(nullable = false)
    private Integer marks = 1;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public AssessmentQuestion() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public String getQuestionFormat() { return questionFormat; }
    public void setQuestionFormat(String questionFormat) { this.questionFormat = questionFormat; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getMediaRef() { return mediaRef; }
    public void setMediaRef(String mediaRef) { this.mediaRef = mediaRef; }

    public String getAnswerFormat() { return answerFormat; }
    public void setAnswerFormat(String answerFormat) { this.answerFormat = answerFormat; }

    public String getGuidanceText() { return guidanceText; }
    public void setGuidanceText(String guidanceText) { this.guidanceText = guidanceText; }

    public Integer getMaxDurationSeconds() { return maxDurationSeconds; }
    public void setMaxDurationSeconds(Integer maxDurationSeconds) { this.maxDurationSeconds = maxDurationSeconds; }

    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
