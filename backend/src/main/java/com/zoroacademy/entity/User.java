package com.zoroacademy.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 50)
    private String role; // ADMIN, TRAINER, STUDENT

    @Column(length = 50)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Column(length = 50)
    private String status = "Active";

    @Column(nullable = false, length = 50)
    private String origin = "LEARNING";

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "joined_on", length = 50)
    private String joinedOn;

    @Column(length = 255)
    private String specialty;

    @Column(length = 50)
    private String code;

    @Column(name = "salary_amount", precision = 12, scale = 2)
    private BigDecimal salaryAmount = BigDecimal.ZERO;

    @Column(name = "salary_credit_date", length = 20)
    private String salaryCreditDate;

    @Column(length = 255)
    private String course;

    @Column(name = "must_change_password")
    private Boolean mustChangePassword = false;

    @Column(name = "admin_visible_password", columnDefinition = "TEXT")
    private String adminVisiblePassword;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public User() {}

    public User(String id, String email, String username, String password, String name, String role, String phone, String avatar, String status, String address, String joinedOn, String specialty, String code, BigDecimal salaryAmount, String salaryCreditDate, String course, Boolean mustChangePassword, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.password = password;
        this.name = name;
        this.role = role;
        this.phone = phone;
        this.avatar = avatar;
        this.status = status;
        this.address = address;
        this.joinedOn = joinedOn;
        this.specialty = specialty;
        this.code = code;
        this.salaryAmount = salaryAmount;
        this.salaryCreditDate = salaryCreditDate;
        this.course = course;
        this.mustChangePassword = mustChangePassword != null ? mustChangePassword : false;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public User(String id, String email, String username, String password, String name, String role, String phone, String avatar, String status, String address, String joinedOn, String specialty, String code, BigDecimal salaryAmount, String salaryCreditDate, String course, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, email, username, password, name, role, phone, avatar, status, address, joinedOn, specialty, code, salaryAmount, salaryCreditDate, course, false, createdAt, updatedAt);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getOrigin() {
        return origin != null ? origin : "LEARNING";
    }

    public void setOrigin(String origin) {
        this.origin = origin != null ? origin : "LEARNING";
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getJoinedOn() {
        return joinedOn;
    }

    public void setJoinedOn(String joinedOn) {
        this.joinedOn = joinedOn;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public BigDecimal getSalaryAmount() {
        return salaryAmount;
    }

    public void setSalaryAmount(BigDecimal salaryAmount) {
        this.salaryAmount = salaryAmount;
    }

    public String getSalaryCreditDate() {
        return salaryCreditDate;
    }

    public void setSalaryCreditDate(String salaryCreditDate) {
        this.salaryCreditDate = salaryCreditDate;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
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

    public Boolean getMustChangePassword() {
        return mustChangePassword != null ? mustChangePassword : false;
    }

    public void setMustChangePassword(Boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public String getAdminVisiblePassword() {
        return adminVisiblePassword;
    }

    public void setAdminVisiblePassword(String adminVisiblePassword) {
        this.adminVisiblePassword = adminVisiblePassword;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String email;
        private String username;
        private String password;
        private String adminVisiblePassword;
        private String name;
        private String role;
        private String phone;
        private String avatar;
        private String status = "Active";
        private String address;
        private String joinedOn;
        private String specialty;
        private String code;
        private BigDecimal salaryAmount = BigDecimal.ZERO;
        private String salaryCreditDate;
        private String course;
        private String origin = "LEARNING";
        private Boolean mustChangePassword = false;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder origin(String origin) {
            this.origin = origin != null ? origin : "LEARNING";
            return this;
        }

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder email(String email) {
            this.email = email;
            return this;
        }
        public Builder username(String username) {
            this.username = username;
            return this;
        }
        public Builder password(String password) {
            this.password = password;
            return this;
        }
        public Builder adminVisiblePassword(String adminVisiblePassword) {
            this.adminVisiblePassword = adminVisiblePassword;
            return this;
        }
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        public Builder role(String role) {
            this.role = role;
            return this;
        }
        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }
        public Builder avatar(String avatar) {
            this.avatar = avatar;
            return this;
        }
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        public Builder address(String address) {
            this.address = address;
            return this;
        }
        public Builder joinedOn(String joinedOn) {
            this.joinedOn = joinedOn;
            return this;
        }
        public Builder specialty(String specialty) {
            this.specialty = specialty;
            return this;
        }
        public Builder code(String code) {
            this.code = code;
            return this;
        }
        public Builder salaryAmount(BigDecimal salaryAmount) {
            this.salaryAmount = salaryAmount;
            return this;
        }
        public Builder salaryCreditDate(String salaryCreditDate) {
            this.salaryCreditDate = salaryCreditDate;
            return this;
        }
        public Builder course(String course) {
            this.course = course;
            return this;
        }
        public Builder mustChangePassword(Boolean mustChangePassword) {
            this.mustChangePassword = mustChangePassword;
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

        public User build() {
            User u = new User(id, email, username, password, name, role, phone, avatar, status, address, joinedOn, specialty, code, salaryAmount, salaryCreditDate, course, mustChangePassword, createdAt, updatedAt);
            u.setAdminVisiblePassword(adminVisiblePassword);
            u.setOrigin(origin != null ? origin : "LEARNING");
            return u;
        }
    }

}
