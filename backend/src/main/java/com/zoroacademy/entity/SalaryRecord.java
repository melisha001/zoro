package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_records")
public class SalaryRecord {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "trainer_id", nullable = false, length = 64)
    private String trainerId;

    @Column(name = "trainer_name", nullable = false)
    private String trainerName;

    @Column(nullable = false, length = 50)
    private String month;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 50)
    private String status = "Paid";

    @Column(name = "payment_date", length = 50)
    private String paymentDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public SalaryRecord() {}

    public SalaryRecord(String id, String trainerId, String trainerName, String month, BigDecimal amount, String status, String paymentDate, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.month = month;
        this.amount = amount;
        this.status = status;
        this.paymentDate = paymentDate;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(String trainerId) {
        this.trainerId = trainerId;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public void setTrainerName(String trainerName) {
        this.trainerName = trainerName;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(String paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
        private String trainerId;
        private String trainerName;
        private String month;
        private BigDecimal amount;
        private String status = "Paid";
        private String paymentDate;
        private String notes;
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder trainerId(String trainerId) {
            this.trainerId = trainerId;
            return this;
        }
        public Builder trainerName(String trainerName) {
            this.trainerName = trainerName;
            return this;
        }
        public Builder month(String month) {
            this.month = month;
            return this;
        }
        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        public Builder paymentDate(String paymentDate) {
            this.paymentDate = paymentDate;
            return this;
        }
        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public SalaryRecord build() {
            return new SalaryRecord(id, trainerId, trainerName, month, amount, status, paymentDate, notes, createdAt);
        }
    }

}
