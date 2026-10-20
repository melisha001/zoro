package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attempt_answers", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"attempt_id", "question_id"})
})
public class AttemptAnswer {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "attempt_id", nullable = false, length = 64)
    private String attemptId;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(name = "selected_option_id")
    private UUID selectedOptionId;

    @Column(name = "audio_file_id", length = 64)
    private String audioFileId;

    @Column(name = "voice_file_id", length = 64)
    private String voiceFileId;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "voice_duration_sec")
    private Integer voiceDurationSec;

    @Column(name = "saved_at", nullable = false)
    private OffsetDateTime savedAt;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "evaluation_status", nullable = false, length = 50)
    private String evaluationStatus = "AUTO"; // AUTO, PENDING_TRAINER, EVALUATED

    @Column(name = "marks_awarded", precision = 8, scale = 2)
    private BigDecimal marksAwarded;

    @Column(name = "trainer_feedback", columnDefinition = "TEXT")
    private String trainerFeedback;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "evaluated_by", length = 64)
    private String evaluatedBy;

    @Column(name = "evaluator_id", length = 64)
    private String evaluatorId;

    @Column(name = "evaluated_at")
    private OffsetDateTime evaluatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public AttemptAnswer() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAttemptId() { return attemptId; }
    public void setAttemptId(String attemptId) { this.attemptId = attemptId; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public UUID getSelectedOptionId() { return selectedOptionId; }
    public void setSelectedOptionId(UUID selectedOptionId) { this.selectedOptionId = selectedOptionId; }

    public String getAudioFileId() { return audioFileId; }
    public void setAudioFileId(String audioFileId) {
        this.audioFileId = audioFileId;
        if (this.voiceFileId == null) this.voiceFileId = audioFileId;
    }

    public String getVoiceFileId() { return voiceFileId != null ? voiceFileId : audioFileId; }
    public void setVoiceFileId(String voiceFileId) {
        this.voiceFileId = voiceFileId;
        if (this.audioFileId == null) this.audioFileId = voiceFileId;
    }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
        if (this.voiceDurationSec == null) this.voiceDurationSec = durationSeconds;
    }

    public Integer getVoiceDurationSec() { return voiceDurationSec != null ? voiceDurationSec : durationSeconds; }
    public void setVoiceDurationSec(Integer voiceDurationSec) {
        this.voiceDurationSec = voiceDurationSec;
        if (this.durationSeconds == null) this.durationSeconds = voiceDurationSec;
    }

    public OffsetDateTime getSavedAt() { return savedAt != null ? savedAt : createdAt; }
    public void setSavedAt(OffsetDateTime savedAt) { this.savedAt = savedAt; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public String getEvaluationStatus() { return evaluationStatus; }
    public void setEvaluationStatus(String evaluationStatus) { this.evaluationStatus = evaluationStatus; }

    public BigDecimal getMarksAwarded() { return marksAwarded; }
    public void setMarksAwarded(BigDecimal marksAwarded) { this.marksAwarded = marksAwarded; }

    public String getTrainerFeedback() { return trainerFeedback; }
    public void setTrainerFeedback(String trainerFeedback) {
        this.trainerFeedback = trainerFeedback;
        if (this.feedback == null) this.feedback = trainerFeedback;
    }

    public String getFeedback() { return feedback != null ? feedback : trainerFeedback; }
    public void setFeedback(String feedback) {
        this.feedback = feedback;
        if (this.trainerFeedback == null) this.trainerFeedback = feedback;
    }

    public String getEvaluatedBy() { return evaluatedBy; }
    public void setEvaluatedBy(String evaluatedBy) {
        this.evaluatedBy = evaluatedBy;
        if (this.evaluatorId == null) this.evaluatorId = evaluatedBy;
    }

    public String getEvaluatorId() { return evaluatorId != null ? evaluatorId : evaluatedBy; }
    public void setEvaluatorId(String evaluatorId) {
        this.evaluatorId = evaluatorId;
        if (this.evaluatedBy == null) this.evaluatedBy = evaluatorId;
    }

    public OffsetDateTime getEvaluatedAt() { return evaluatedAt; }
    public void setEvaluatedAt(OffsetDateTime evaluatedAt) { this.evaluatedAt = evaluatedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
