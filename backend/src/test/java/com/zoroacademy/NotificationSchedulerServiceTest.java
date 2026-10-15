package com.zoroacademy;

import com.zoroacademy.entity.Notification;
import com.zoroacademy.entity.SalaryRecord;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.NotificationRepository;
import com.zoroacademy.repository.SalaryRecordRepository;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.service.NotificationSchedulerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class NotificationSchedulerServiceTest {

    @Autowired
    private NotificationSchedulerService schedulerService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalaryRecordRepository salaryRecordRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @BeforeEach
    void setup() {
        notificationRepository.deleteAll();
    }

    @Test
    void testDailySalaryNotificationGeneratedWhenDueAndUnpaid() {
        String trainerId = "trn_test_" + UUID.randomUUID();
        User trainer = User.builder()
                .id(trainerId)
                .name("Kavitha Trainer")
                .email("kavitha@test.com")
                .password("testPassword123")
                .role("TRAINER")
                .salaryAmount(new BigDecimal("35000"))
                .salaryCreditDate("20")
                .build();
        userRepository.save(trainer);

        // Date is 25th of month (past credit date 20th)
        LocalDate testDate = LocalDate.of(2026, 10, 25);
        String monthYear = testDate.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH));

        int created = schedulerService.runDailySalaryCheck(testDate);
        assertTrue(created >= 1);

        List<Notification> adminNotifs = notificationRepository.findByRecipientRoleIgnoreCaseOrRecipientRoleIgnoreCase("ALL", "ADMIN");
        boolean found = adminNotifs.stream().anyMatch(n ->
                n.getTitle().contains("Salary Payment Due") &&
                n.getMessage().contains("₹35000") &&
                n.getMessage().contains("Kavitha Trainer") &&
                n.getMessage().contains(monthYear)
        );
        assertTrue(found, "Notification should be generated for unpaid due salary");

        // Running again should not create duplicate
        int duplicateCount = schedulerService.runDailySalaryCheck(testDate);
        assertEquals(0, duplicateCount, "Duplicate notification should not be created");
    }

    @Test
    void testDailySalaryNotificationNotGeneratedIfAlreadyPaid() {
        String trainerId = "trn_test_" + UUID.randomUUID();
        User trainer = User.builder()
                .id(trainerId)
                .name("Arun Trainer")
                .email("arun@test.com")
                .password("testPassword123")
                .role("TRAINER")
                .salaryAmount(new BigDecimal("40000"))
                .salaryCreditDate("10")
                .build();
        userRepository.save(trainer);

        LocalDate testDate = LocalDate.of(2026, 10, 15);
        String monthYear = testDate.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH));

        // Create paid record
        SalaryRecord record = SalaryRecord.builder()
                .id("sal_" + UUID.randomUUID())
                .trainerId(trainerId)
                .trainerName("Arun Trainer")
                .month(monthYear)
                .amount(new BigDecimal("40000"))
                .status("Paid")
                .paymentDate("2026-10-10")
                .build();
        salaryRecordRepository.save(record);

        int created = schedulerService.runDailySalaryCheck(testDate);
        assertEquals(0, created, "No notification should be generated if salary is already paid");
    }

    @Test
    void testRetentionJobDeletesOlderThan30DaysAndKeepsNewer() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Notification 45 days old -> MUST be deleted
        Notification oldNotif = Notification.builder()
                .id("notif_old_" + UUID.randomUUID())
                .recipientRole("ADMIN")
                .title("Ancient Notice")
                .message("This is 45 days old")
                .readStatus(true)
                .build();
        notificationRepository.save(oldNotif);

        // 2. Notification 10 days old -> MUST be kept
        Notification recentNotif = Notification.builder()
                .id("notif_recent_" + UUID.randomUUID())
                .recipientRole("ADMIN")
                .title("Recent Notice")
                .message("This is 10 days old")
                .readStatus(false)
                .build();
        notificationRepository.save(recentNotif);

        entityManager.flush();

        // Directly set created_at in database bypassing @CreationTimestamp
        entityManager.createNativeQuery("UPDATE notifications SET created_at = :oldTime WHERE id = :id")
                .setParameter("oldTime", now.minusDays(45))
                .setParameter("id", oldNotif.getId())
                .executeUpdate();

        entityManager.createNativeQuery("UPDATE notifications SET created_at = :recentTime WHERE id = :id")
                .setParameter("recentTime", now.minusDays(10))
                .setParameter("id", recentNotif.getId())
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        // Run retention cleanup for cutoff 30 days ago
        LocalDateTime cutoff = now.minusDays(30);
        int deleted = schedulerService.runRetentionCleanup(cutoff);

        assertTrue(deleted >= 1);
        assertFalse(notificationRepository.existsById(oldNotif.getId()), "Old notification (>30 days) must be deleted");
        assertTrue(notificationRepository.existsById(recentNotif.getId()), "Recent notification (<30 days) must be retained");
    }
}
