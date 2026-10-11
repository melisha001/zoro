package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_submissions")
public class AssignmentSubmission {

    @Id
    @Column(length = 128)
    private String id;

    @Column(length = 50)
    private String mode; // Online, Recorded, Hybrid

    @Column(name = "course_title")
    private String courseTitle;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "batch_name")
    private String batchName;

    @Column(name = "student_id", length = 64)
    private String studentId;

    @Column(name = "trainer_id", length = 64)
    private String trainerId;

    @Column(name = "assignment_id", length = 128)
    private String assignmentId;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_email")
    private String studentEmail;

    @Column(name = "assignment_title")
    private String assignmentTitle;

    @Column(name = "source_type", length = 50)
    private String sourceType; // schedule, module, assignment

    @Column(name = "source_id", length = 128)
    private String sourceId;

    @Column(name = "submitted_at", length = 50)
    private String submittedAt;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(columnDefinition = "jsonb")
    @org.hibernate.annotations.ColumnTransformer(write = "?::jsonb")
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.zoroacademy.util.JsonAsStringDeserializer.class)
    @JsonRawValue
    private String attachment;

    @Column(length = 50)
    private String status = "Pending Correction";

    @Column(name = "assigned_trainer")
    private String assignedTrainer;

    @Column(name = "corrected_by")
    private String correctedBy;

    @Column(name = "corrected_at", length = 50)
    private String correctedAt;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(length = 50)
    private String score;

    @Column(name = "correction_attachment", columnDefinition = "jsonb")
    @org.hibernate.annotations.ColumnTransformer(write = "?::jsonb")
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.zoroacademy.util.JsonAsStringDeserializer.class)
    @JsonRawValue
    private String correctionAttachment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public AssignmentSubmission() {}

    public AssignmentSubmission(String id, String studentId, String trainerId, String assignmentId, String batchId, String mode, String courseTitle, String courseId, String batchName, String studentName, String studentEmail, String assignmentTitle, String sourceType, String sourceId, String submittedAt, String answerText, String attachment, String status, String assignedTrainer, String correctedBy, String correctedAt, String remarks, String score, String correctionAttachment, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.trainerId = trainerId;
        this.assignmentId = assignmentId;
        this.batchId = batchId;
        this.mode = mode;
        this.courseTitle = courseTitle;
        this.courseId = courseId;
        this.batchName = batchName;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.assignmentTitle = assignmentTitle;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.submittedAt = submittedAt;
        this.answerText = answerText;
        this.attachment = attachment;
        this.status = status;
        this.assignedTrainer = assignedTrainer;
        this.correctedBy = correctedBy;
        this.correctedAt = correctedAt;
        this.remarks = remarks;
        this.score = score;
        this.correctionAttachment = correctionAttachment;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(String trainerId) {
        this.trainerId = trainerId;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getAssignmentTitle() {
        return assignmentTitle;
    }

    public void setAssignmentTitle(String assignmentTitle) {
        this.assignmentTitle = assignmentTitle;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public String getSourceId() {
        return sourceId;
    }

    public void setSourceId(String sourceId) {
        this.sourceId = sourceId;
    }

    public String getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(String submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public String getAttachment() {
        return (attachment == null || attachment.trim().isEmpty()) ? null : attachment.trim();
    }

    public void setAttachment(String attachment) {
        this.attachment = (attachment == null || attachment.trim().isEmpty()) ? null : attachment.trim();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAssignedTrainer() {
        return assignedTrainer;
    }

    public void setAssignedTrainer(String assignedTrainer) {
        this.assignedTrainer = assignedTrainer;
    }

    public String getCorrectedBy() {
        return correctedBy;
    }

    public void setCorrectedBy(String correctedBy) {
        this.correctedBy = correctedBy;
    }

    public String getCorrectedAt() {
        return correctedAt;
    }

    public void setCorrectedAt(String correctedAt) {
        this.correctedAt = correctedAt;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getScore() {
        return score;
    }

    public void setScore(String score) {
        this.score = score;
    }

    public String getCorrectionAttachment() {
        return (correctionAttachment == null || correctionAttachment.trim().isEmpty()) ? null : correctionAttachment.trim();
    }

    public void setCorrectionAttachment(String correctionAttachment) {
        this.correctionAttachment = (correctionAttachment == null || correctionAttachment.trim().isEmpty()) ? null : correctionAttachment.trim();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String studentId;
        private String trainerId;
        private String assignmentId;
        private String batchId;
        private String mode;
        private String courseTitle;
        private String courseId;
        private String batchName;
        private String studentName;
        private String studentEmail;
        private String assignmentTitle;
        private String sourceType;
        private String sourceId;
        private String submittedAt;
        private String answerText;
        private String attachment;
        private String status = "Pending Correction";
        private String assignedTrainer;
        private String correctedBy;
        private String correctedAt;
        private String remarks;
        private String score;
        private String correctionAttachment;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }
        public Builder trainerId(String trainerId) {
            this.trainerId = trainerId;
            return this;
        }
        public Builder assignmentId(String assignmentId) {
            this.assignmentId = assignmentId;
            return this;
        }
        public Builder batchId(String batchId) {
            this.batchId = batchId;
            return this;
        }
        public Builder mode(String mode) {
            this.mode = mode;
            return this;
        }
        public Builder courseTitle(String courseTitle) {
            this.courseTitle = courseTitle;
            return this;
        }
        public Builder courseId(String courseId) {
            this.courseId = courseId;
            return this;
        }
        public Builder batchName(String batchName) {
            this.batchName = batchName;
            return this;
        }
        public Builder studentName(String studentName) {
            this.studentName = studentName;
            return this;
        }
        public Builder studentEmail(String studentEmail) {
            this.studentEmail = studentEmail;
            return this;
        }
        public Builder assignmentTitle(String assignmentTitle) {
            this.assignmentTitle = assignmentTitle;
            return this;
        }
        public Builder sourceType(String sourceType) {
            this.sourceType = sourceType;
            return this;
        }
        public Builder sourceId(String sourceId) {
            this.sourceId = sourceId;
            return this;
        }
        public Builder submittedAt(String submittedAt) {
            this.submittedAt = submittedAt;
            return this;
        }
        public Builder answerText(String answerText) {
            this.answerText = answerText;
            return this;
        }
        public Builder attachment(String attachment) {
            this.attachment = attachment;
            return this;
        }
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        public Builder assignedTrainer(String assignedTrainer) {
            this.assignedTrainer = assignedTrainer;
            return this;
        }
        public Builder correctedBy(String correctedBy) {
            this.correctedBy = correctedBy;
            return this;
        }
        public Builder correctedAt(String correctedAt) {
            this.correctedAt = correctedAt;
            return this;
        }
        public Builder remarks(String remarks) {
            this.remarks = remarks;
            return this;
        }
        public Builder score(String score) {
            this.score = score;
            return this;
        }
        public Builder correctionAttachment(String correctionAttachment) {
            this.correctionAttachment = correctionAttachment;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public AssignmentSubmission build() {
            return new AssignmentSubmission(id, studentId, trainerId, assignmentId, batchId, mode, courseTitle, courseId, batchName, studentName, studentEmail, assignmentTitle, sourceType, sourceId, submittedAt, answerText, attachment, status, assignedTrainer, correctedBy, correctedAt, remarks, score, correctionAttachment, createdAt, updatedAt);
        }
    }

}
