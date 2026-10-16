package com.zoroacademy;

import com.zoroacademy.controller.AttendanceController;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.AttendanceService;
import com.zoroacademy.service.ScheduleService;
import com.zoroacademy.util.ScheduleTimeUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AttendanceAutomaticWorkflowTest {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private AttendanceController attendanceController;

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private TrainerAttendanceRecordRepository trainerAttendanceRecordRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentCourseBatchRepository studentCourseBatchRepository;

    private String testSuffix;
    private Course testCourse;
    private Batch testBatch;
    private User testStudent;
    private User testTrainer;
    private Schedule testSchedule;

    @BeforeEach
    void setup() {
        testSuffix = UUID.randomUUID().toString().substring(0, 8);

        // Create Online test course
        testCourse = Course.builder()
                .id("crs_test_" + testSuffix)
                .title("ZZTEST_Automation Course " + testSuffix)
                .mode("Online")
                .audience("student")
                .googleMeetUrl("https://meet.google.com/test-" + testSuffix)
                .build();
        courseRepository.save(testCourse);

        // Create Trainer
        testTrainer = User.builder()
                .id("trn_test_" + testSuffix)
                .name("ZZTEST_Trainer " + testSuffix)
                .email("zztest_tr_" + testSuffix + "@example.com")
                .password("testpass")
                .role("TRAINER")
                .build();
        userRepository.save(testTrainer);

        // Create Batch
        testBatch = Batch.builder()
                .id("btc_test_" + testSuffix)
                .name("ZZTEST_Batch " + testSuffix)
                .courseId(testCourse.getId())
                .courseName(testCourse.getTitle())
                .trainerId(testTrainer.getId())
                .trainerName(testTrainer.getName())
                .status("Active")
                .build();
        batchRepository.save(testBatch);

        // Create Student
        testStudent = User.builder()
                .id("std_test_" + testSuffix)
                .name("ZZTEST_Student " + testSuffix)
                .email("zztest_st_" + testSuffix + "@example.com")
                .password("testpass")
                .role("STUDENT")
                .build();
        userRepository.save(testStudent);

        // Enroll Student in Batch
        StudentCourseBatch scb = new StudentCourseBatch();
        scb.setStudentId(testStudent.getId());
        scb.setCourseName(testCourse.getTitle());
        scb.setCourseId(testCourse.getId());
        scb.setBatchName(testBatch.getName());
        scb.setBatchId(testBatch.getId());
        studentCourseBatchRepository.save(scb);

        // Create Schedule for today 10:00 AM - 11:00 AM
        String today = LocalDate.now(ScheduleTimeUtil.KOLKATA_ZONE).toString();
        testSchedule = Schedule.builder()
                .id("sch_test_" + testSuffix)
                .title("ZZTEST_Session " + testSuffix)
                .course(testCourse.getTitle())
                .courseId(testCourse.getId())
                .batch(testBatch.getName())
                .batchId(testBatch.getId())
                .trainer(testTrainer.getName())
                .trainerId(testTrainer.getId())
                .date(today)
                .time("10:00 AM - 11:00 AM")
                .meetLink(testCourse.getGoogleMeetUrl())
                .status("Upcoming")
                .build();
        testSchedule.setStartTime("10:00");
        testSchedule.setEndTime("11:00");
        scheduleRepository.save(testSchedule);
    }

    @Test
    void testManualAttendanceEndpointsRefuseWith403Forbidden() {
        AttendanceRecord dummy = new AttendanceRecord();
        dummy.setStudentId(testStudent.getId());
        dummy.setStatus("Present");

        ResponseStatusException ex1 = assertThrows(ResponseStatusException.class, () -> {
            attendanceController.recordAttendance(dummy);
        });
        assertEquals(403, ex1.getStatusCode().value());
        assertTrue(ex1.getReason().contains("Manual attendance marking is disabled"));

        ResponseStatusException ex2 = assertThrows(ResponseStatusException.class, () -> {
            attendanceController.recordBatchAttendance(List.of(dummy));
        });
        assertEquals(403, ex2.getStatusCode().value());
        assertTrue(ex2.getReason().contains("Manual attendance marking is disabled"));
    }

    @Test
    void testAutomaticAbsentJobWithMockedClock() {
        LocalDate sDate = LocalDate.parse(testSchedule.getDate());

        // 1. Mock Clock during session (10:30 AM) -> NO ABSENT SHOULD BE CREATED
        ZonedDateTime liveClock = ZonedDateTime.of(sDate, LocalTime.of(10, 30), ScheduleTimeUtil.KOLKATA_ZONE);
        attendanceService.syncAbsentForFinishedSchedules(liveClock);

        assertFalse(attendanceRecordRepository.findByStudentIdAndScheduleId(testStudent.getId(), testSchedule.getId()).isPresent(),
                "Active/live session must never mark student as Absent before session end time");
        assertFalse(trainerAttendanceRecordRepository.findByScheduleIdAndTrainerId(testSchedule.getId(), testTrainer.getId()).isPresent(),
                "Active/live session must never mark trainer as Absent before session end time");

        // 2. Mock Clock after session finished (11:05 AM) -> ABSENT MUST BE CREATED AUTOMATICALLY
        ZonedDateTime finishedClock = ZonedDateTime.of(sDate, LocalTime.of(11, 5), ScheduleTimeUtil.KOLKATA_ZONE);
        attendanceService.syncAbsentForFinishedSchedules(finishedClock);

        // Verify Student Absent
        var studentAtt = attendanceRecordRepository.findByStudentIdAndScheduleId(testStudent.getId(), testSchedule.getId());
        assertTrue(studentAtt.isPresent(), "Student should be marked Absent after session end");
        assertEquals("Absent", studentAtt.get().getStatus());
        assertEquals("SYSTEM_AUTO", studentAtt.get().getRecordedBy());

        // Verify Trainer Absent
        var trainerAtt = trainerAttendanceRecordRepository.findByScheduleIdAndTrainerId(testSchedule.getId(), testTrainer.getId());
        assertTrue(trainerAtt.isPresent(), "Trainer should be marked Absent after session end without start/join");
        assertEquals("Absent", trainerAtt.get().getStatus());

        // 3. Idempotent check: Running again does not duplicate or alter records
        attendanceService.syncAbsentForFinishedSchedules(finishedClock);
        assertEquals(1, attendanceRecordRepository.findByScheduleId(testSchedule.getId()).size());
        assertEquals(1, trainerAttendanceRecordRepository.findByScheduleId(testSchedule.getId()).size());
    }

    @Test
    void testRemarkUpdatesAutosavedAndSharedBetweenAdminAndTrainer() {
        // Update Student remark
        AttendanceRecord stRecord = attendanceService.updateStudentRemark(
                testSchedule.getId(), testStudent.getId(), "Student was unwell with flu", "Admin");
        assertNotNull(stRecord);
        assertEquals("Student was unwell with flu", stRecord.getRemarks());
        assertEquals("Admin", stRecord.getRemarkBy());
        assertNotNull(stRecord.getRemarkAt());

        // Trainer updates or appends remark
        AttendanceRecord stRecordTrainer = attendanceService.updateStudentRemark(
                testSchedule.getId(), testStudent.getId(), "Student informed via WhatsApp in morning", "Trainer Abhishek");
        assertEquals("Student informed via WhatsApp in morning", stRecordTrainer.getRemarks());
        assertEquals("Trainer Abhishek", stRecordTrainer.getRemarkBy());

        // Update Trainer remark
        TrainerAttendanceRecord trRecord = attendanceService.updateTrainerRemark(
                testSchedule.getId(), testTrainer.getId(), "Trainer was in power cut, class rescheduled", "Admin");
        assertNotNull(trRecord);
        assertEquals("Trainer was in power cut, class rescheduled", trRecord.getRemarks());
        assertEquals("Admin", trRecord.getRemarkBy());
        assertNotNull(trRecord.getRemarkAt());
    }
}
