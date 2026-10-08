package com.zoroacademy.dto;

import java.math.BigDecimal;

public class RegisterRequest {
    private String id;
    private String email;
    private String username;
    private String password;
    private String name;
    private String role;
    private String phone;
    private String address;
    private String specialty;
    private String code;
    private BigDecimal salaryAmount;
    private String salaryCreditDate;
    private String course;

    public RegisterRequest() {}

    public RegisterRequest(String id, String email, String username, String password, String name, String role,
                           String phone, String address, String specialty, String code, BigDecimal salaryAmount,
                           String salaryCreditDate, String course) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.password = password;
        this.name = name;
        this.role = role;
        this.phone = phone;
        this.address = address;
        this.specialty = specialty;
        this.code = code;
        this.salaryAmount = salaryAmount;
        this.salaryCreditDate = salaryCreditDate;
        this.course = course;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public BigDecimal getSalaryAmount() { return salaryAmount; }
    public void setSalaryAmount(BigDecimal salaryAmount) { this.salaryAmount = salaryAmount; }
    public String getSalaryCreditDate() { return salaryCreditDate; }
    public void setSalaryCreditDate(String salaryCreditDate) { this.salaryCreditDate = salaryCreditDate; }
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String email;
        private String username;
        private String password;
        private String name;
        private String role;
        private String phone;
        private String address;
        private String specialty;
        private String code;
        private BigDecimal salaryAmount;
        private String salaryCreditDate;
        private String course;

        public Builder id(String id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder specialty(String specialty) { this.specialty = specialty; return this; }
        public Builder code(String code) { this.code = code; return this; }
        public Builder salaryAmount(BigDecimal salaryAmount) { this.salaryAmount = salaryAmount; return this; }
        public Builder salaryCreditDate(String salaryCreditDate) { this.salaryCreditDate = salaryCreditDate; return this; }
        public Builder course(String course) { this.course = course; return this; }

        public RegisterRequest build() {
            return new RegisterRequest(id, email, username, password, name, role, phone, address, specialty, code, salaryAmount, salaryCreditDate, course);
        }
    }
}
