package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "competition_registrations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_comp_reg_comp_email", columnNames = {"competition_id", "student_email"})
})
public class CompetitionRegistration {

    @Id
    @Column(length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    @JsonBackReference
    private Competition competition;

    @Column(name = "student_id", length = 64)
    private String studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_email")
    private String studentEmail;

    @Column(name = "student_phone", length = 32)
    private String studentPhone;

    private Integer age;

    @Column(length = 255)
    private String school;

    @Column(length = 255)
    private String city;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus = "Pending";

    @Column(precision = 6, scale = 2)
    private BigDecimal score;

    private Integer rank;

    @Column(name = "certificate_url", columnDefinition = "TEXT")
    private String certificateUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public CompetitionRegistration() {}

    public CompetitionRegistration(String id, Competition competition, String studentId, String studentName, String studentEmail, String studentPhone, Integer age, String school, String city, String paymentStatus, BigDecimal score, Integer rank, String certificateUrl, LocalDateTime createdAt) {
        this.id = id;
        this.competition = competition;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.studentPhone = studentPhone;
        this.age = age;
        this.school = school;
        this.city = city;
        this.paymentStatus = paymentStatus;
        this.score = score;
        this.rank = rank;
        this.certificateUrl = certificateUrl;
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

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
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

    public String getStudentPhone() {
        return studentPhone;
    }

    public void setStudentPhone(String studentPhone) {
        this.studentPhone = studentPhone;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getSchool() {
        return school;
    }

    public void setSchool(String school) {
        this.school = school;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public String getCertificateUrl() {
        return certificateUrl;
    }

    public void setCertificateUrl(String certificateUrl) {
        this.certificateUrl = certificateUrl;
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
        private String studentId;
        private String studentName;
        private String studentEmail;
        private String studentPhone;
        private Integer age;
        private String school;
        private String city;
        private String paymentStatus = "Pending";
        private BigDecimal score;
        private Integer rank;
        private String certificateUrl;
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder competition(Competition competition) {
            this.competition = competition;
            return this;
        }
        public Builder studentId(String studentId) {
            this.studentId = studentId;
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
        public Builder studentPhone(String studentPhone) {
            this.studentPhone = studentPhone;
            return this;
        }
        public Builder age(Integer age) {
            this.age = age;
            return this;
        }
        public Builder school(String school) {
            this.school = school;
            return this;
        }
        public Builder city(String city) {
            this.city = city;
            return this;
        }
        public Builder paymentStatus(String paymentStatus) {
            this.paymentStatus = paymentStatus;
            return this;
        }
        public Builder score(BigDecimal score) {
            this.score = score;
            return this;
        }
        public Builder rank(Integer rank) {
            this.rank = rank;
            return this;
        }
        public Builder certificateUrl(String certificateUrl) {
            this.certificateUrl = certificateUrl;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public CompetitionRegistration build() {
            return new CompetitionRegistration(id, competition, studentId, studentName, studentEmail, studentPhone, age, school, city, paymentStatus, score, rank, certificateUrl, createdAt);
        }
    }

}
