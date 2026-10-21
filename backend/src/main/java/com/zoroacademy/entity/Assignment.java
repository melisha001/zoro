package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @Column(length = 128)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String course;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(length = 255)
    private String batch;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @Column(length = 255)
    private String trainer;

    @Column(name = "trainer_id", length = 64)
    private String trainerId;

    @Column(name = "due_date", length = 50)
    private String dueDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "jsonb")
    @org.hibernate.annotations.ColumnTransformer(write = "?::jsonb")
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.zoroacademy.util.JsonAsStringDeserializer.class)
    @JsonRawValue
    private String attachment;

    @Column(name = "target_type", length = 20)
    private String targetType = "batch";

    @Column(name = "target_name", length = 255)
    private String targetName;

    @Column(name = "target_student_ids", columnDefinition = "TEXT")
    private String targetStudentIds;

    @Column(name = "target_student_emails", columnDefinition = "TEXT")
    private String targetStudentEmails;

    @Column(name = "target_student_names", columnDefinition = "TEXT")
    private String targetStudentNames;

    @Column(name = "created_by", length = 255)
    private String createdBy;

    @Column(name = "creator_role", length = 50)
    private String creatorRole = "ADMIN";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Assignment() {}

    public Assignment(String id, String title, String course, String courseId, String batch, String batchId, String trainer, String trainerId, String dueDate, String description, String attachment, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.course = course;
        this.courseId = courseId;
        this.batch = batch;
        this.batchId = batchId;
        this.trainer = trainer;
        this.trainerId = trainerId;
        this.dueDate = dueDate;
        this.description = description;
        this.attachment = attachment;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getTrainer() {
        return trainer;
    }

    public void setTrainer(String trainer) {
        this.trainer = trainer;
    }

    public String getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(String trainerId) {
        this.trainerId = trainerId;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAttachment() {
        return (attachment == null || attachment.trim().isEmpty()) ? null : attachment.trim();
    }

    public void setAttachment(String attachment) {
        this.attachment = (attachment == null || attachment.trim().isEmpty()) ? null : attachment.trim();
    }

    public String getTargetType() {
        return targetType != null ? targetType : "batch";
    }

    public void setTargetType(String targetType) {
        if ("course".equalsIgnoreCase(targetType)) {
            this.targetType = "batch";
        } else {
            this.targetType = targetType;
        }
    }

    public String getTargetName() {
        return targetName;
    }

    public void setTargetName(String targetName) {
        this.targetName = targetName;
    }

    public Object getTargetStudentIds() {
        if (targetStudentIds == null || targetStudentIds.isBlank()) return java.util.Collections.emptyList();
        if (targetStudentIds.trim().startsWith("[")) {
            try {
                return new com.fasterxml.jackson.databind.ObjectMapper().readValue(targetStudentIds, java.util.List.class);
            } catch (Exception ignored) {}
        }
        return java.util.Arrays.stream(targetStudentIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }

    public String getRawTargetStudentIds() {
        return targetStudentIds;
    }

    public void setTargetStudentIds(Object targetStudentIds) {
        if (targetStudentIds instanceof java.util.List<?> list) {
            this.targetStudentIds = list.stream().map(Object::toString).collect(java.util.stream.Collectors.joining(","));
        } else if (targetStudentIds != null) {
            this.targetStudentIds = targetStudentIds.toString();
        } else {
            this.targetStudentIds = null;
        }
    }

    public Object getTargetStudentEmails() {
        if (targetStudentEmails == null || targetStudentEmails.isBlank()) return java.util.Collections.emptyList();
        if (targetStudentEmails.trim().startsWith("[")) {
            try {
                return new com.fasterxml.jackson.databind.ObjectMapper().readValue(targetStudentEmails, java.util.List.class);
            } catch (Exception ignored) {}
        }
        return java.util.Arrays.stream(targetStudentEmails.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }

    public String getRawTargetStudentEmails() {
        return targetStudentEmails;
    }

    public void setTargetStudentEmails(Object targetStudentEmails) {
        if (targetStudentEmails instanceof java.util.List<?> list) {
            this.targetStudentEmails = list.stream().map(Object::toString).collect(java.util.stream.Collectors.joining(","));
        } else if (targetStudentEmails != null) {
            this.targetStudentEmails = targetStudentEmails.toString();
        } else {
            this.targetStudentEmails = null;
        }
    }

    public Object getTargetStudentNames() {
        if (targetStudentNames == null || targetStudentNames.isBlank()) return java.util.Collections.emptyList();
        if (targetStudentNames.trim().startsWith("[")) {
            try {
                return new com.fasterxml.jackson.databind.ObjectMapper().readValue(targetStudentNames, java.util.List.class);
            } catch (Exception ignored) {}
        }
        return java.util.Arrays.stream(targetStudentNames.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }

    public String getRawTargetStudentNames() {
        return targetStudentNames;
    }

    public void setTargetStudentNames(Object targetStudentNames) {
        if (targetStudentNames instanceof java.util.List<?> list) {
            this.targetStudentNames = list.stream().map(Object::toString).collect(java.util.stream.Collectors.joining(","));
        } else if (targetStudentNames != null) {
            this.targetStudentNames = targetStudentNames.toString();
        } else {
            this.targetStudentNames = null;
        }
    }

    public String getTargetStudentEmail() {
        if (targetStudentEmails != null && !targetStudentEmails.isBlank()) {
            return targetStudentEmails.split(",")[0].trim().replace("[", "").replace("]", "").replace("\"", "");
        }
        return null;
    }

    public void setTargetStudentEmail(String targetStudentEmail) {
        if (targetStudentEmail != null && !targetStudentEmail.isBlank()) {
            if (this.targetStudentEmails == null || this.targetStudentEmails.isBlank()) {
                this.targetStudentEmails = targetStudentEmail;
            }
        }
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatorRole() {
        return creatorRole != null ? creatorRole : "ADMIN";
    }

    public void setCreatorRole(String creatorRole) {
        this.creatorRole = creatorRole;
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
        private String title;
        private String course;
        private String courseId;
        private String batch;
        private String batchId;
        private String trainer;
        private String trainerId;
        private String dueDate;
        private String description;
        private String attachment;
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        public Builder course(String course) {
            this.course = course;
            return this;
        }
        public Builder courseId(String courseId) {
            this.courseId = courseId;
            return this;
        }
        public Builder batch(String batch) {
            this.batch = batch;
            return this;
        }
        public Builder batchId(String batchId) {
            this.batchId = batchId;
            return this;
        }
        public Builder trainer(String trainer) {
            this.trainer = trainer;
            return this;
        }
        public Builder trainerId(String trainerId) {
            this.trainerId = trainerId;
            return this;
        }
        public Builder dueDate(String dueDate) {
            this.dueDate = dueDate;
            return this;
        }
        public Builder description(String description) {
            this.description = description;
            return this;
        }
        public Builder attachment(String attachment) {
            this.attachment = attachment;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Assignment build() {
            return new Assignment(id, title, course, courseId, batch, batchId, trainer, trainerId, dueDate, description, attachment, createdAt);
        }
    }

}
