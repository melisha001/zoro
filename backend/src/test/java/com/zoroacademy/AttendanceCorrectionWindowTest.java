package com.zoroacademy;

import com.zoroacademy.entity.*;
import com.zoroacademy.exception.BadRequestException;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.AttendanceService;
import com.zoroacademy.util.ScheduleTimeUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AttendanceCorrectionWindowTest {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private AttendanceChangeRepository attendanceChangeRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;

    private User testStudent;
    private User testTrainer;
    private Course testCourse;
    private Batch testBatch;
    private Schedule testSchedule;

    @BeforeEach
    public void setup() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        testStudent = userRepository.save(User.builder()
                .id("usr_st_" + suffix)
                .name("__TEST__ Student " + suffix)
                .email("test.student." + suffix + "@zoro.com")
                .password("testpass")
                .role("STUDENT")
                .status("Active")
                .build());

        testTrainer = userRepository.save(User.builder()
                .id("usr_tr_" + suffix)
                .name("__TEST__ Trainer " + suffix)
                .email("test.trainer." + suffix + "@zoro.com")
                .password("testpass")
                .role("TRAINER")
                .status("Active")
                .build());

        testCourse = courseRepository.save(Course.builder()
                .id("crs_" + suffix)
                .title("__TEST__ Course " + suffix)
                .description("Description")
                .mode("Online")
                .audience("student")
                .build());

        testBatch = batchRepository.save(Batch.builder()
                .id("btc_" + suffix)
                .name("__TEST__ Batch " + suffix)
                .courseName(testCourse.getTitle())
                .courseId(testCourse.getId())
                .trainerName(testTrainer.getName())
                .trainerId(testTrainer.getId())
                .status("Active")
                .build());

        // Schedule today from 10:00 AM - 11:00 AM
        LocalDate today = LocalDate.now();
        testSchedule = scheduleRepository.save(Schedule.builder()
                .id("sch_" + suffix)
                .title("__TEST__ Live Class " + suffix)
                .course(testCourse.getTitle())
                .courseId(testCourse.getId())
                .batch(testBatch.getName())
                .batchId(testBatch.getId())
                .trainer(testTrainer.getName())
                .trainerId(testTrainer.getId())
                .date(today.toString())
                .time("10:00 AM - 11:00 AM")
                .meetLink("https://meet.google.com/test-link")
                .build());
    }

    @AfterEach
    public void tearDown() {
        // Reset clock to system
        attendanceService.setClock(Clock.system(ScheduleTimeUtil.KOLKATA_ZONE));
    }

    @Test
    public void testCorrectionWithinWindow_SucceedsWithMandatoryRemarkAndAuditRecord() {
        // Session ended at 11:00 AM.
        // Set clock to 11:25 AM (25 minutes after end, inside 60-minute window)
        LocalDate today = LocalDate.parse(testSchedule.getDate());
        LocalDateTime dtAt1125 = LocalDateTime.of(today, LocalTime.of(11, 25));
        Clock fixedClock = Clock.fixed(dtAt1125.atZone(ScheduleTimeUtil.KOLKATA_ZONE).toInstant(), ScheduleTimeUtil.KOLKATA_ZONE);
        attendanceService.setClock(fixedClock);

        // Pre-existing status was Absent (auto-synced)
        AttendanceRecord initial = AttendanceRecord.builder()
                .id("att_" + UUID.randomUUID())
                .scheduleId(testSchedule.getId())
                .studentId(testStudent.getId())
                .studentName(testStudent.getName())
                .courseId(testCourse.getId())
                .batchId(testBatch.getId())
                .date(testSchedule.getDate())
                .status("Absent")
                .recordedBy("SYSTEM_AUTO")
                .createdAt(LocalDateTime.now())
                .build();
        attendanceRecordRepository.save(initial);

        // Trainer corrects status to Present with mandatory remark
        String remark = "Student attended via offline classroom phone bridge";
        AttendanceRecord corrected = attendanceService.correctStudentAttendance(
                testSchedule.getId(),
                testStudent.getId(),
                "Present",
                remark,
                testTrainer.getName()
        );

        assertNotNull(corrected);
        assertEquals("Present", corrected.getStatus());
        assertEquals("Absent", corrected.getOriginalStatus());
        assertEquals(testTrainer.getName(), corrected.getStatusChangedBy());
        assertNotNull(corrected.getStatusChangedAt());
        assertEquals(remark, corrected.getRemarks());

        // Verify audit record was created in attendance_changes
        List<AttendanceChange> changes = attendanceChangeRepository.findByScheduleId(testSchedule.getId());
        assertFalse(changes.isEmpty());
        AttendanceChange change = changes.get(0);
        assertEquals("Absent", change.getOriginalStatus());
        assertEquals("Present", change.getNewStatus());
        assertEquals(testTrainer.getName(), change.getChangedBy());
        assertEquals(remark, change.getRemark());
        assertEquals(testStudent.getId(), change.getStudentId());
    }

    @Test
    public void testCorrection_FailsWhenRemarkIsEmpty() {
        // Clock at 11:20 AM (inside window)
        LocalDate today = LocalDate.parse(testSchedule.getDate());
        LocalDateTime dtAt1120 = LocalDateTime.of(today, LocalTime.of(11, 20));
        Clock fixedClock = Clock.fixed(dtAt1120.atZone(ScheduleTimeUtil.KOLKATA_ZONE).toInstant(), ScheduleTimeUtil.KOLKATA_ZONE);
        attendanceService.setClock(fixedClock);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            attendanceService.correctStudentAttendance(
                    testSchedule.getId(),
                    testStudent.getId(),
                    "Present",
                    "   ", // blank remark
                    testTrainer.getName()
            );
        });

        assertTrue(ex.getMessage().toLowerCase().contains("remark is mandatory"),
                "Expected message about mandatory remark, got: " + ex.getMessage());
    }

    @Test
    public void testCorrection_FailsBeforeSessionEnded() {
        // Clock at 10:30 AM (session is currently LIVE: 10:00 AM - 11:00 AM)
        LocalDate today = LocalDate.parse(testSchedule.getDate());
        LocalDateTime dtAt1030 = LocalDateTime.of(today, LocalTime.of(10, 30));
        Clock fixedClock = Clock.fixed(dtAt1030.atZone(ScheduleTimeUtil.KOLKATA_ZONE).toInstant(), ScheduleTimeUtil.KOLKATA_ZONE);
        attendanceService.setClock(fixedClock);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            attendanceService.correctStudentAttendance(
                    testSchedule.getId(),
                    testStudent.getId(),
                    "Present",
                    "Valid remark text",
                    testTrainer.getName()
            );
        });

        assertTrue(ex.getMessage().toLowerCase().contains("correction window opens only after the session has ended"),
                "Expected message about window opening after session end, got: " + ex.getMessage());
    }

    @Test
    public void testCorrection_FailsAfterWindowExpired() {
        // Session ended at 11:00 AM.
        // Clock at 12:05 PM (65 minutes after end, beyond 60-minute window)
        LocalDate today = LocalDate.parse(testSchedule.getDate());
        LocalDateTime dtAt1205 = LocalDateTime.of(today, LocalTime.of(12, 5));
        Clock fixedClock = Clock.fixed(dtAt1205.atZone(ScheduleTimeUtil.KOLKATA_ZONE).toInstant(), ScheduleTimeUtil.KOLKATA_ZONE);
        attendanceService.setClock(fixedClock);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            attendanceService.correctStudentAttendance(
                    testSchedule.getId(),
                    testStudent.getId(),
                    "Present",
                    "Valid remark text",
                    testTrainer.getName()
            );
        });

        assertTrue(ex.getMessage().toLowerCase().contains("correction window of 60 minutes has expired"),
                "Expected message about window expiration, got: " + ex.getMessage());
    }
}
