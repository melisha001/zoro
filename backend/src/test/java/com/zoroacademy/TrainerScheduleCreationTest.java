package com.zoroacademy;

import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.Notification;
import com.zoroacademy.entity.Schedule;
import com.zoroacademy.entity.TrainerCourseRequest;
import com.zoroacademy.repository.CourseRepository;
import com.zoroacademy.repository.NotificationRepository;
import com.zoroacademy.repository.ScheduleRepository;
import com.zoroacademy.repository.TrainerCourseRequestRepository;
import com.zoroacademy.service.ScheduleService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class TrainerScheduleCreationTest {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TrainerCourseRequestRepository trainerCourseRequestRepository;

    private static final String TEST_PREFIX = "ZZTEST_";
    private String testCourseId;
    private String testScheduleId;
    private String testTrainerId;

    @BeforeEach
    void setUp() {
        cleanTestData();

        testCourseId = TEST_PREFIX + "crs_trainer_" + System.currentTimeMillis();
        testTrainerId = TEST_PREFIX + "trainer_user_1";

        Course course = new Course();
        course.setId(testCourseId);
        course.setTitle("ZZTEST Trainer Pedagogy Masterclass");
        course.setAudience("trainer");
        course.setMode("Online");
        course.setGoogleMeetUrl("https://meet.google.com/test-trainer-meet");
        courseRepository.save(course);

        TrainerCourseRequest req = new TrainerCourseRequest();
        req.setId(TEST_PREFIX + "req_" + System.currentTimeMillis());
        req.setCourseId(testCourseId);
        req.setCourseTitle(course.getTitle());
        req.setTrainerId(testTrainerId);
        req.setTrainerName("ZZTEST Trainer Person");
        req.setStatus("Approved");
        trainerCourseRequestRepository.save(req);
    }

    @AfterEach
    void tearDown() {
        cleanTestData();
    }

    private void cleanTestData() {
        scheduleRepository.findAll().stream()
                .filter(s -> s.getId() != null && s.getId().startsWith(TEST_PREFIX))
                .forEach(scheduleRepository::delete);

        courseRepository.findAll().stream()
                .filter(c -> c.getId() != null && c.getId().startsWith(TEST_PREFIX))
                .forEach(courseRepository::delete);

        trainerCourseRequestRepository.findAll().stream()
                .filter(r -> r.getId() != null && r.getId().startsWith(TEST_PREFIX))
                .forEach(trainerCourseRequestRepository::delete);

        notificationRepository.findAll().stream()
                .filter(n -> n.getTitle() != null && n.getTitle().contains("ZZTEST"))
                .forEach(notificationRepository::delete);
    }

    @Test
    @DisplayName("Create schedule for trainer-audience course with null batch and trainer succeeds")
    void testCreateTrainerSchedule_NullBatchAndTrainer_Success() {
        testScheduleId = TEST_PREFIX + "sch_" + System.currentTimeMillis();

        LocalDate futureDate = LocalDate.now().plusDays(2);

        Schedule schedule = new Schedule();
        schedule.setId(testScheduleId);
        schedule.setTitle("ZZTEST Microteaching Session 1");
        schedule.setCourseId(testCourseId);
        schedule.setDate(futureDate.toString());
        schedule.setStartTime("10:00");
        schedule.setEndTime("11:00");
        schedule.setTime("10:00 AM - 11:00 AM");
        schedule.setBatch(null);
        schedule.setBatchId(null);
        schedule.setTrainer(null);
        schedule.setTrainerId(null);

        Schedule created = scheduleService.createSchedule(schedule);

        assertThat(created).isNotNull();
        assertThat(created.getId()).isEqualTo(testScheduleId);
        assertThat(created.getAudience()).isEqualTo("TRAINER");
        assertThat(created.getBatch()).isNull();
        assertThat(created.getBatchId()).isNull();
        assertThat(created.getCourse()).isEqualTo("ZZTEST Trainer Pedagogy Masterclass");
        assertThat(created.getMeetLink()).isEqualTo("https://meet.google.com/test-trainer-meet");

        // Verify notification was sent
        List<Notification> notifs = notificationRepository.findByRecipientId(testTrainerId);
        assertThat(notifs).anyMatch(n -> n.getTitle().contains("ZZTEST Microteaching Session 1"));
    }

    @Test
    @DisplayName("Overlapping schedule for same trainer course on same day is rejected with 409 Conflict")
    void testTrainerCourseSchedule_OverlapDetection() {
        testScheduleId = TEST_PREFIX + "sch_orig_" + System.currentTimeMillis();
        LocalDate futureDate = LocalDate.now().plusDays(3);

        Schedule s1 = new Schedule();
        s1.setId(testScheduleId);
        s1.setTitle("ZZTEST Session Part 1");
        s1.setCourseId(testCourseId);
        s1.setDate(futureDate.toString());
        s1.setStartTime("14:00");
        s1.setEndTime("15:30");
        s1.setTime("02:00 PM - 03:30 PM");
        s1.setBatch(null);
        s1.setTrainer(null);
        scheduleService.createSchedule(s1);

        // Attempt overlap on same course and date
        Schedule s2 = new Schedule();
        s2.setId(TEST_PREFIX + "sch_overlap_" + System.currentTimeMillis());
        s2.setTitle("ZZTEST Overlap Session");
        s2.setCourseId(testCourseId);
        s2.setDate(futureDate.toString());
        s2.setStartTime("14:30");
        s2.setEndTime("16:00");
        s2.setTime("02:30 PM - 04:00 PM");
        s2.setBatch(null);
        s2.setTrainer(null);

        assertThatThrownBy(() -> scheduleService.createSchedule(s2))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("overlaps");
    }
}
