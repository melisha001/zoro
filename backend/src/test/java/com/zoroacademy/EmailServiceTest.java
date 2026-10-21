package com.zoroacademy;

import com.zoroacademy.entity.Competition;
import com.zoroacademy.entity.CompetitionRegistration;
import com.zoroacademy.entity.Enquiry;
import com.zoroacademy.service.EmailService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private TemplateEngine templateEngine;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");

        org.thymeleaf.spring6.SpringTemplateEngine springEngine = new org.thymeleaf.spring6.SpringTemplateEngine();
        springEngine.setTemplateResolver(resolver);
        this.templateEngine = springEngine;

        emailService = new EmailService(mailSender, templateEngine);
        ReflectionTestUtils.setField(emailService, "smtpHost", "email-smtp.ap-south-1.amazonaws.com");
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@zoroacademy.com");
        ReflectionTestUtils.setField(emailService, "fromName", "Zoro Academy");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
    }

    @Test
    @DisplayName("Email sending is safely skipped when SMTP host is unconfigured")
    void testEmailSkippedWhenHostNotConfigured() {
        ReflectionTestUtils.setField(emailService, "smtpHost", "");
        assertFalse(emailService.isMailConfigured());

        Enquiry enq = new Enquiry();
        enq.setEmail("test@example.com");
        emailService.sendEnquiryAcknowledgement(enq);

        verifyNoInteractions(mailSender);
    }

    @Test
    @DisplayName("Enquiry acknowledgement email is generated and sent")
    void testSendEnquiryAcknowledgement() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        Enquiry enq = new Enquiry();
        enq.setId("enq_test_123");
        enq.setName("John Doe");
        enq.setEmail("john@example.com");
        enq.setCourseInterest("Spoken English");
        enq.setPhone("+91 9988776655");
        enq.setMessage("Please share details");

        emailService.sendEnquiryAcknowledgement(enq);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());
        assertNotNull(captor.getValue());
    }

    @Test
    @DisplayName("Competition registration confirmation email is generated and sent")
    void testSendCompetitionRegistrationConfirmation() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        Competition comp = new Competition();
        comp.setTitle("Spell Bee 2026");
        comp.setCategory("Juniors");
        comp.setStartDate("2026-11-20");
        comp.setVenue("Online");

        CompetitionRegistration reg = new CompetitionRegistration();
        reg.setId("reg_test_999");
        reg.setStudentName("Alice Smith");
        reg.setStudentEmail("alice@example.com");
        reg.setPaymentStatus("Paid");
        reg.setCompetition(comp);

        emailService.sendCompetitionRegistrationConfirmation(reg);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());
        assertNotNull(captor.getValue());
    }

    @Test
    @DisplayName("Student welcome email with credentials is generated and sent")
    void testSendStudentWelcomeEmail() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendStudentWelcomeEmail("student@example.com", "Bob Williams", "TempPass123!");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());
        assertNotNull(captor.getValue());
    }

    @Test
    @DisplayName("Trainer welcome email is generated and sent")
    void testSendTrainerWelcomeEmail() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendTrainerWelcomeEmail("trainer@example.com", "Jane Trainer", "TrainerPass123!", "IELTS");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());
        assertNotNull(captor.getValue());
    }
}
