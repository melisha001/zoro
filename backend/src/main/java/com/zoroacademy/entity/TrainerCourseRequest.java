package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "trainer_course_requests")
public class TrainerCourseRequest {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "trainer_id", nullable = false, length = 64)
    private String trainerId;

    @Column(name = "trainer_name")
    private String trainerName;

    @Column(name = "trainer_email")
    private String trainerEmail;

    @Column(name = "course_id", nullable = false, length = 128)
    private String courseId;

    @Column(name = "course_title")
    private String courseTitle;

    @Column(nullable = false, length = 50)
    private String status; // Pending, Approved, Rejected

    @Column(name = "request_date", length = 50)
    private String requestDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public TrainerCourseRequest() {}

    public TrainerCourseRequest(String id, String trainerId, String trainerName, String trainerEmail,
                                String courseId, String courseTitle, String status, String requestDate,
                                LocalDateTime createdAt) {
        this.id = id;
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.trainerEmail = trainerEmail;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.status = status;
        this.requestDate = requestDate;
        this.createdAt = createdAt;
    }

    public static TrainerCourseRequestBuilder builder() {
        return new TrainerCourseRequestBuilder();
    }

    public static class TrainerCourseRequestBuilder {
        private String id;
        private String trainerId;
        private String trainerName;
        private String trainerEmail;
        private String courseId;
        private String courseTitle;
        private String status;
        private String requestDate;
        private LocalDateTime createdAt;

        TrainerCourseRequestBuilder() {}

        public TrainerCourseRequestBuilder id(String id) { this.id = id; return this; }
        public TrainerCourseRequestBuilder trainerId(String trainerId) { this.trainerId = trainerId; return this; }
        public TrainerCourseRequestBuilder trainerName(String trainerName) { this.trainerName = trainerName; return this; }
        public TrainerCourseRequestBuilder trainerEmail(String trainerEmail) { this.trainerEmail = trainerEmail; return this; }
        public TrainerCourseRequestBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public TrainerCourseRequestBuilder courseTitle(String courseTitle) { this.courseTitle = courseTitle; return this; }
        public TrainerCourseRequestBuilder status(String status) { this.status = status; return this; }
        public TrainerCourseRequestBuilder requestDate(String requestDate) { this.requestDate = requestDate; return this; }
        public TrainerCourseRequestBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public TrainerCourseRequest build() {
            return new TrainerCourseRequest(id, trainerId, trainerName, trainerEmail, courseId, courseTitle, status, requestDate, createdAt);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTrainerId() { return trainerId; }
    public void setTrainerId(String trainerId) { this.trainerId = trainerId; }

    public String getTrainerName() { return trainerName; }
    public void setTrainerName(String trainerName) { this.trainerName = trainerName; }

    public String getTrainerEmail() { return trainerEmail; }
    public void setTrainerEmail(String trainerEmail) { this.trainerEmail = trainerEmail; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRequestDate() { return requestDate; }
    public void setRequestDate(String requestDate) { this.requestDate = requestDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
