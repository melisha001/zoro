package com.zoroacademy.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "competitions")
public class Competition {

    @Id
    @Column(length = 128)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(length = 100)
    private String category;

    @Column(name = "start_date", length = 50)
    private String startDate;

    @Column(name = "end_date", length = 50)
    private String endDate;

    @Column(name = "reg_start_date", length = 50)
    private String regStartDate;

    @Column(name = "reg_end_date", length = 50)
    private String regEndDate;

    @Column(name = "start_time", length = 20)
    private String startTime;

    @Column(name = "end_time", length = 20)
    private String endTime;

    @Column(length = 255)
    private String venue;

    @Column(name = "banner_url", columnDefinition = "TEXT")
    private String bannerUrl;

    @Column(name = "rules_pdf_url", columnDefinition = "TEXT")
    private String rulesPdfUrl;

    @Column(name = "registration_form_url", columnDefinition = "TEXT")
    private String registrationFormUrl;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "contact_details", columnDefinition = "TEXT")
    private String contactDetails;

    @Column(name = "registration_fee", precision = 10, scale = 2)
    private BigDecimal registrationFee = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String rules;

    @Column(length = 50)
    private String status = "Active";

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<CompetitionModule> modules = new ArrayList<>();

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<CompetitionRegistration> registrations = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Competition() {}

    public Competition(String id, String title, String category, String startDate, String endDate,
                       String regStartDate, String regEndDate, String startTime, String endTime,
                       String venue, String bannerUrl, String rulesPdfUrl, String registrationFormUrl,
                       String instructions, String contactDetails, BigDecimal registrationFee,
                       String description, String rules, String status, List<CompetitionModule> modules,
                       List<CompetitionRegistration> registrations, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.startDate = startDate;
        this.endDate = endDate;
        this.regStartDate = regStartDate;
        this.regEndDate = regEndDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.venue = venue;
        this.bannerUrl = bannerUrl;
        this.rulesPdfUrl = rulesPdfUrl;
        this.registrationFormUrl = registrationFormUrl;
        this.instructions = instructions;
        this.contactDetails = contactDetails;
        this.registrationFee = registrationFee;
        this.description = description;
        this.rules = rules;
        this.status = status;
        this.modules = modules != null ? modules : new ArrayList<>();
        this.registrations = registrations != null ? registrations : new ArrayList<>();
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getRegStartDate() {
        return regStartDate;
    }

    public void setRegStartDate(String regStartDate) {
        this.regStartDate = regStartDate;
    }

    public String getRegEndDate() {
        return regEndDate;
    }

    public void setRegEndDate(String regEndDate) {
        this.regEndDate = regEndDate;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getBannerUrl() {
        return bannerUrl;
    }

    public void setBannerUrl(String bannerUrl) {
        this.bannerUrl = bannerUrl;
    }

    public String getRulesPdfUrl() {
        return rulesPdfUrl;
    }

    public void setRulesPdfUrl(String rulesPdfUrl) {
        this.rulesPdfUrl = rulesPdfUrl;
    }

    public String getRegistrationFormUrl() {
        return registrationFormUrl;
    }

    public void setRegistrationFormUrl(String registrationFormUrl) {
        this.registrationFormUrl = registrationFormUrl;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getContactDetails() {
        return contactDetails;
    }

    public void setContactDetails(String contactDetails) {
        this.contactDetails = contactDetails;
    }

    public BigDecimal getRegistrationFee() {
        return registrationFee;
    }

    public void setRegistrationFee(BigDecimal registrationFee) {
        this.registrationFee = registrationFee;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRules() {
        return rules;
    }

    public void setRules(String rules) {
        this.rules = rules;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<CompetitionModule> getModules() {
        return modules;
    }

    public void setModules(List<CompetitionModule> modules) {
        this.modules = modules;
    }

    public List<CompetitionRegistration> getRegistrations() {
        return registrations;
    }

    public void setRegistrations(List<CompetitionRegistration> registrations) {
        this.registrations = registrations;
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
        private String category;
        private String startDate;
        private String endDate;
        private String regStartDate;
        private String regEndDate;
        private String startTime;
        private String endTime;
        private String venue;
        private String bannerUrl;
        private String rulesPdfUrl;
        private String registrationFormUrl;
        private String instructions;
        private String contactDetails;
        private BigDecimal registrationFee = BigDecimal.ZERO;
        private String description;
        private String rules;
        private String status = "Active";
        private List<CompetitionModule> modules = new ArrayList<>();
        private List<CompetitionRegistration> registrations = new ArrayList<>();
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        public Builder category(String category) {
            this.category = category;
            return this;
        }
        public Builder startDate(String startDate) {
            this.startDate = startDate;
            return this;
        }
        public Builder endDate(String endDate) {
            this.endDate = endDate;
            return this;
        }
        public Builder regStartDate(String regStartDate) {
            this.regStartDate = regStartDate;
            return this;
        }
        public Builder regEndDate(String regEndDate) {
            this.regEndDate = regEndDate;
            return this;
        }
        public Builder startTime(String startTime) {
            this.startTime = startTime;
            return this;
        }
        public Builder endTime(String endTime) {
            this.endTime = endTime;
            return this;
        }
        public Builder venue(String venue) {
            this.venue = venue;
            return this;
        }
        public Builder bannerUrl(String bannerUrl) {
            this.bannerUrl = bannerUrl;
            return this;
        }
        public Builder rulesPdfUrl(String rulesPdfUrl) {
            this.rulesPdfUrl = rulesPdfUrl;
            return this;
        }
        public Builder registrationFormUrl(String registrationFormUrl) {
            this.registrationFormUrl = registrationFormUrl;
            return this;
        }
        public Builder instructions(String instructions) {
            this.instructions = instructions;
            return this;
        }
        public Builder contactDetails(String contactDetails) {
            this.contactDetails = contactDetails;
            return this;
        }
        public Builder registrationFee(BigDecimal registrationFee) {
            this.registrationFee = registrationFee;
            return this;
        }
        public Builder description(String description) {
            this.description = description;
            return this;
        }
        public Builder rules(String rules) {
            this.rules = rules;
            return this;
        }
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        public Builder modules(List<CompetitionModule> modules) {
            this.modules = modules;
            return this;
        }
        public Builder registrations(List<CompetitionRegistration> registrations) {
            this.registrations = registrations;
            return this;
        }
        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Competition build() {
            return new Competition(id, title, category, startDate, endDate,
                    regStartDate, regEndDate, startTime, endTime, venue, bannerUrl,
                    rulesPdfUrl, registrationFormUrl, instructions, contactDetails,
                    registrationFee, description, rules, status, modules, registrations, createdAt);
        }
    }
}
