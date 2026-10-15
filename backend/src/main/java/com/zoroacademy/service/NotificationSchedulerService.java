package com.zoroacademy.service;

import com.zoroacademy.entity.Notification;
import com.zoroacademy.entity.SalaryRecord;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.NotificationRepository;
import com.zoroacademy.repository.SalaryRecordRepository;
import com.zoroacademy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class NotificationSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSchedulerService.class);
    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    private final UserRepository userRepository;
    private final SalaryRecordRepository salaryRecordRepository;
    private final NotificationRepository notificationRepository;

    @Value("${notifications.retention-days:30}")
    private int retentionDays = 30;

    public NotificationSchedulerService(
            UserRepository userRepository,
            SalaryRecordRepository salaryRecordRepository,
            NotificationRepository notificationRepository
    ) {
        this.userRepository = userRepository;
        this.salaryRecordRepository = salaryRecordRepository;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Daily salary notification job running at 08:00 AM IST.
     * Evaluates all trainers with monthly salary structures.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void scheduledDailySalaryCheck() {
        LocalDate today = LocalDate.now(KOLKATA_ZONE);
        runDailySalaryCheck(today);
    }

    /**
     * Core business logic for daily salary check, testable with any target date.
     */
    @Transactional
    public int runDailySalaryCheck(LocalDate date) {
        int notificationsCreated = 0;
        int currentDay = date.getDayOfMonth();
        String monthYear = date.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH));

        List<User> trainers = userRepository.findByRoleIgnoreCase("TRAINER");
        for (User trainer : trainers) {
            BigDecimal salaryAmount = trainer.getSalaryAmount();
            if (salaryAmount == null || salaryAmount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            int creditDay = 25;
            if (trainer.getSalaryCreditDate() != null && !trainer.getSalaryCreditDate().isBlank()) {
                try {
                    creditDay = Integer.parseInt(trainer.getSalaryCreditDate().trim());
                } catch (NumberFormatException ignored) {}
            }

            // Check if today is credit day or has passed in the current month
            if (currentDay >= creditDay) {
                // Check if a paid salary record exists for this month
                List<SalaryRecord> records = salaryRecordRepository.findByTrainerId(trainer.getId());
                boolean alreadyPaid = records.stream().anyMatch(r ->
                        r.getMonth() != null &&
                        r.getMonth().equalsIgnoreCase(monthYear) &&
                        "Paid".equalsIgnoreCase(r.getStatus())
                );

                if (!alreadyPaid) {
                    // Check if an admin notification has already been created for this trainer and month
                    String trainerName = trainer.getName() != null ? trainer.getName() : "Trainer";
                    String message = String.format("Salary payment of ₹%s for %s is due for %s",
                            salaryAmount.toPlainString(), trainerName, monthYear);

                    boolean alreadyNotified = notificationRepository
                            .existsByRecipientRoleIgnoreCaseAndTitleAndMessageContaining(
                                    "ADMIN", "Salary Payment Due", trainerName + " is due for " + monthYear
                            );

                    if (!alreadyNotified) {
                        Notification notification = Notification.builder()
                                .id("notif_" + UUID.randomUUID())
                                .recipientRole("ADMIN")
                                .recipientId(null)
                                .title("Salary Payment Due")
                                .message(message)
                                .readStatus(false)
                                .createdAt(LocalDateTime.now())
                                .build();
                        notificationRepository.save(notification);
                        notificationsCreated++;
                        log.info("Created salary due notification for trainer {} for month {}", trainerName, monthYear);
                    }
                }
            }
        }
        return notificationsCreated;
    }

    /**
     * Daily notification retention cleanup running at 01:30 AM IST.
     * Deletes notifications older than configured retention period (default 30 days).
     */
    @Scheduled(cron = "0 30 1 * * *", zone = "Asia/Kolkata")
    @Transactional
    public int scheduledNotificationRetentionCleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        return runRetentionCleanup(cutoff);
    }

    /**
     * Cleans up notifications created before the specified cutoff date-time.
     */
    @Transactional
    public int runRetentionCleanup(LocalDateTime cutoff) {
        int deleted = notificationRepository.deleteByCreatedAtBefore(cutoff);
        log.info("Notification retention job deleted {} notifications created before {}", deleted, cutoff);
        return deleted;
    }

    public int getRetentionDays() {
        return retentionDays;
    }

    public void setRetentionDays(int retentionDays) {
        this.retentionDays = retentionDays;
    }
}
