package com.zoroacademy.service;

import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.entity.Enquiry;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final ITemplateEngine templateEngine;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${app.mail.from-email:noreply@zoroacademy.com}")
    private String fromEmail;

    @Value("${app.mail.from-name:Zoro Academy}")
    private String fromName;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender,
                        ITemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public boolean isMailConfigured() {
        return mailSender != null && smtpHost != null && !smtpHost.trim().isEmpty();
    }

    @Async
    public void sendEnquiryAcknowledgement(Enquiry enquiry) {
        if (enquiry == null || enquiry.getEmail() == null || enquiry.getEmail().isBlank()) {
            return;
        }

        if (!isMailConfigured()) {
            log.info("AWS SES SMTP not configured; skipping enquiry acknowledgement email to {}", enquiry.getEmail());
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("name", enquiry.getName() != null ? enquiry.getName() : "Learner");
            context.setVariable("enquiryId", enquiry.getId());
            context.setVariable("courseInterest", enquiry.getCourseInterest() != null ? enquiry.getCourseInterest() : "English Course");
            context.setVariable("phone", enquiry.getPhone());
            context.setVariable("message", enquiry.getMessage());

            String htmlBody = templateEngine.process("email/enquiry-acknowledgement", context);
            sendHtmlEmail(enquiry.getEmail().trim(), "We received your enquiry - Zoro Academy", htmlBody);
            log.info("Enquiry acknowledgement email sent to {}", enquiry.getEmail());
        } catch (Exception e) {
            handleMailException(enquiry.getEmail(), "enquiry acknowledgement email", e);
        }
    }

    @Async
    public void sendCompetitionRegistrationConfirmation(CompetitionRegistration registration) {
        if (registration == null || registration.getStudentEmail() == null || registration.getStudentEmail().isBlank()) {
            return;
        }

        if (!isMailConfigured()) {
            log.info("AWS SES SMTP not configured; skipping competition confirmation email to {}", registration.getStudentEmail());
            return;
        }

        try {
            Competition comp = registration.getCompetition();
            Context context = new Context();
            context.setVariable("studentName", registration.getStudentName() != null ? registration.getStudentName() : "Participant");
            context.setVariable("registrationId", registration.getId());
            context.setVariable("competitionTitle", comp != null && comp.getTitle() != null ? comp.getTitle() : "Annual Competition");
            context.setVariable("category", comp != null ? comp.getCategory() : "");
            context.setVariable("startDate", comp != null ? comp.getStartDate() : "");
            context.setVariable("venue", comp != null ? comp.getVenue() : "Online");
            context.setVariable("paymentStatus", registration.getPaymentStatus() != null ? registration.getPaymentStatus() : "Confirmed");

            String htmlBody = templateEngine.process("email/competition-confirmation", context);
            String title = comp != null && comp.getTitle() != null ? comp.getTitle() : "Competition";
            sendHtmlEmail(registration.getStudentEmail().trim(), "Registration Confirmed: " + title + " - Zoro Academy", htmlBody);
            log.info("Competition confirmation email sent to {}", registration.getStudentEmail());
        } catch (Exception e) {
            handleMailException(registration.getStudentEmail(), "competition confirmation email", e);
        }
    }

    @Async
    public void sendCompetitionCredentials(String email, String name, String plainPassword, String competitionTitle) {
        if (email == null || email.isBlank()) {
            return;
        }

        if (!isMailConfigured()) {
            log.info("AWS SES SMTP not configured; skipping competition credentials email to {}", email);
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("name", name != null && !name.isBlank() ? name : "Participant");
            context.setVariable("email", email.trim());
            context.setVariable("plainPassword", plainPassword);
            context.setVariable("competitionTitle", competitionTitle != null ? competitionTitle : "Competition");
            context.setVariable("loginUrl", frontendUrl + "/login");

            String htmlBody = templateEngine.process("email/competition-credentials", context);
            sendHtmlEmail(email.trim(), "Your Zoro Academy Competition Login Credentials - " + competitionTitle, htmlBody);
            log.info("Competition credentials email sent to {}", email);
        } catch (Exception e) {
            handleMailException(email, "competition credentials email", e);
        }
    }

    @Async
    public void sendStudentWelcomeEmail(String email, String name, String plainPassword) {
        if (email == null || email.isBlank()) {
            return;
        }

        if (!isMailConfigured()) {
            log.info("AWS SES SMTP not configured; skipping student welcome email to {}", email);
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("name", name != null && !name.isBlank() ? name : "Student");
            context.setVariable("email", email.trim());
            context.setVariable("plainPassword", plainPassword);
            context.setVariable("loginUrl", frontendUrl + "/login");

            String htmlBody = templateEngine.process("email/student-welcome", context);
            sendHtmlEmail(email.trim(), "Welcome to Zoro Academy - Your Student Portal Account", htmlBody);
            log.info("Student welcome email sent to {}", email);
        } catch (Exception e) {
            handleMailException(email, "student welcome email", e);
        }
    }

    @Async
    public void sendTrainerWelcomeEmail(String email, String name, String plainPassword, String specialty) {
        if (email == null || email.isBlank()) {
            return;
        }

        if (!isMailConfigured()) {
            log.info("AWS SES SMTP not configured; skipping trainer welcome email to {}", email);
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("name", name != null && !name.isBlank() ? name : "Trainer");
            context.setVariable("email", email.trim());
            context.setVariable("plainPassword", plainPassword);
            context.setVariable("specialty", specialty);
            context.setVariable("loginUrl", frontendUrl + "/login");

            String htmlBody = templateEngine.process("email/trainer-welcome", context);
            sendHtmlEmail(email.trim(), "Welcome to Zoro Academy Faculty - Your Account Details", htmlBody);
            log.info("Trainer welcome email sent to {}", email);
        } catch (Exception e) {
            handleMailException(email, "trainer welcome email", e);
        }
    }

    public void sendTrainerWelcomeEmail(String email, String name, String plainPassword) {
        sendTrainerWelcomeEmail(email, name, plainPassword, null);
    }

    private void handleMailException(String email, String emailType, Exception e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        if (msg.contains("Email address is not verified") || msg.contains("identities failed the check")) {
            log.warn("Amazon SES Sandbox Mode: Cannot send {} to unverified recipient {}. " +
                    "To send emails in Sandbox mode, verify '{}' in the AWS SES Console (AP-SOUTH-1 -> Verified Identities). " +
                    "To send to any recipient, request Production Access in the AWS SES Account Dashboard.", emailType, email, email);
        } else {
            log.error("Failed to send {} to {}: {}", emailType, email, msg);
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

        helper.setFrom(fromEmail, fromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }
}
