package com.zoroacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.FileAccessResult;
import com.zoroacademy.service.FileAccessService;
import com.zoroacademy.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FileAccessServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private FileAccessService fileAccessService;

    @Autowired
    private StoredFileRepository storedFileRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseModuleRepository courseModuleRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrainerCourseRequestRepository trainerCourseRequestRepository;

    @Autowired
    private CompetitionStudyMaterialRepository competitionStudyMaterialRepository;

    private String testCourseId;
    private String testBatchId;

    @BeforeEach
    public void setup() {
        testCourseId = "crs_test_" + UUID.randomUUID();
        testBatchId = "batch_test_" + UUID.randomUUID();

        Course course = new Course();
        course.setId(testCourseId);
        course.setTitle("English Fluency Mastery");
        course.setMode("Online");
        course.setStatus("Published");
        course.setAudience("student");
        courseRepository.save(course);

        Batch batch = new Batch();
        batch.setId(testBatchId);
        batch.setName("Morning Batch A");
        batch.setCourseId(testCourseId);
        batch.setCourseName("English Fluency Mastery");
        batch.setTrainerId("trainer-1");
        batch.setTrainerName("John Doe");
        batchRepository.save(batch);
    }

    private StoredFile createPrivateStoredFile(String originalName, String category, String ownerId) {
        StoredFile file = new StoredFile();
        file.setId(UUID.randomUUID().toString());
        file.setOriginalName(originalName);
        file.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        file.setSizeBytes(1024L);
        file.setCategory(category);
        file.setOwnerId(ownerId);
        file.setIsPublic(false);
        file.setStoragePath("test/" + file.getId() + "_" + originalName);
        return storedFileRepository.save(file);
    }

    @Test
    public void testMimeTypesResolutionForRealFileExtensions() {
        assertEquals("application/pdf", com.zoroacademy.controller.FileController.resolveMimeType("document.pdf", null));
        assertEquals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", com.zoroacademy.controller.FileController.resolveMimeType("notes.docx", null));
        assertEquals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", com.zoroacademy.controller.FileController.resolveMimeType("grades.xlsx", null));
        assertEquals("application/vnd.openxmlformats-officedocument.presentationml.presentation", com.zoroacademy.controller.FileController.resolveMimeType("slides.pptx", null));
        assertEquals("image/jpeg", com.zoroacademy.controller.FileController.resolveMimeType("photo.jpg", null));
        assertEquals("image/png", com.zoroacademy.controller.FileController.resolveMimeType("diagram.png", null));
        assertEquals("video/mp4", com.zoroacademy.controller.FileController.resolveMimeType("session.mp4", null));
        assertEquals("audio/mpeg", com.zoroacademy.controller.FileController.resolveMimeType("recording.mp3", null));
    }

    @Test
    @WithMockUser(username = "admin@zoro.com", roles = {"ADMIN"})
    public void testAdminAlwaysAllowedForPrivateReferencedFile() throws Exception {
        StoredFile file = createPrivateStoredFile("admin_test.pdf", "notes", "someone_else");

        CourseModule module = new CourseModule();
        module.setId("mod_" + UUID.randomUUID());
        module.setCourse(courseRepository.findById(testCourseId).get());
        module.setTitle("Module 1");
        module.setNotesFileUrl("/api/files/" + file.getId());
        courseModuleRepository.save(module);

        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").exists());
    }

    @Test
    @WithMockUser(username = "student@zoro.com", roles = {"STUDENT"})
    public void testEnrolledStudentAllowedForModule1Resource() throws Exception {
        StoredFile file = createPrivateStoredFile("module1_notes.pdf", "notes", "admin");

        CourseModule module = new CourseModule();
        module.setId("mod_" + UUID.randomUUID());
        module.setCourse(courseRepository.findById(testCourseId).get());
        module.setTitle("Module 1");
        module.setModuleOrder(1);
        module.setNotesFileUrl("/api/files/" + file.getId());
        courseModuleRepository.save(module);

        Enrollment enrollment = new Enrollment();
        enrollment.setId("enr_" + UUID.randomUUID());
        enrollment.setStudentId("student-1");
        enrollment.setStudentEmail("student@zoro.com");
        enrollment.setCourseId(testCourseId);
        enrollment.setStatus("Active");
        enrollmentRepository.save(enrollment);

        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").exists());
    }

    @Test
    @WithMockUser(username = "unenrolled@zoro.com", roles = {"STUDENT"})
    public void testNotEnrolledStudentDeniedWithStructuredError() throws Exception {
        StoredFile file = createPrivateStoredFile("private_module.pdf", "notes", "admin");

        CourseModule module = new CourseModule();
        module.setId("mod_" + UUID.randomUUID());
        module.setCourse(courseRepository.findById(testCourseId).get());
        module.setTitle("Module 1");
        module.setModuleOrder(1);
        module.setNotesFileUrl("/api/files/" + file.getId());
        courseModuleRepository.save(module);

        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_ENROLLED"))
                .andExpect(jsonPath("$.message").value("You are not enrolled in this course"));
    }

    @Test
    @WithMockUser(username = "student_locked@zoro.com", roles = {"STUDENT"})
    public void testLockedScheduleDeniedWithUnlockAt() throws Exception {
        StoredFile file = createPrivateStoredFile("class_worksheet.xlsx", "worksheet", "admin");

        // Schedule set to tomorrow (far in the future -> locked)
        String futureDate = LocalDate.now().plusDays(2).format(DateTimeFormatter.ISO_LOCAL_DATE);
        Schedule schedule = new Schedule();
        schedule.setId("sched_" + UUID.randomUUID());
        schedule.setTitle("Advanced Conversation");
        schedule.setCourseId(testCourseId);
        schedule.setCourse("English Fluency Mastery");
        schedule.setBatchId(testBatchId);
        schedule.setBatch("Morning Batch A");
        schedule.setTrainer("John Doe");
        schedule.setTrainerId("trainer-1");
        schedule.setDate(futureDate);
        schedule.setTime("10:00 AM - 11:30 AM");
        schedule.setStartTime("10:00 AM");
        schedule.setEndTime("11:30 AM");
        schedule.setWorksheetFileUrl("/api/files/" + file.getId());
        scheduleRepository.save(schedule);

        // Student is enrolled in batch
        Enrollment enrollment = new Enrollment();
        enrollment.setId("enr_" + UUID.randomUUID());
        enrollment.setStudentId("student-locked-1");
        enrollment.setStudentEmail("student_locked@zoro.com");
        enrollment.setCourseId(testCourseId);
        enrollment.setBatchId(testBatchId);
        enrollment.setStatus("Active");
        enrollmentRepository.save(enrollment);

        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LOCKED_SCHEDULE"))
                .andExpect(jsonPath("$.data.unlockAt").exists());
    }

    @Test
    @WithMockUser(username = "student_other_batch@zoro.com", roles = {"STUDENT"})
    public void testOtherBatchStudentDeniedForScheduleResource() throws Exception {
        StoredFile file = createPrivateStoredFile("batch_a_only.pdf", "notes", "admin");

        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        Schedule schedule = new Schedule();
        schedule.setId("sched_" + UUID.randomUUID());
        schedule.setTitle("Live Class");
        schedule.setCourseId(testCourseId);
        schedule.setCourse("English Fluency Mastery");
        schedule.setBatchId(testBatchId); // Batch A
        schedule.setBatch("Morning Batch A");
        schedule.setTrainer("John Doe");
        schedule.setTrainerId("trainer-1");
        schedule.setDate(today);
        schedule.setTime("10:00 AM - 11:30 AM");
        schedule.setNotesFileUrl("/api/files/" + file.getId());
        scheduleRepository.save(schedule);

        // Student is enrolled in a DIFFERENT batch (Batch B)
        Enrollment enrollment = new Enrollment();
        enrollment.setId("enr_" + UUID.randomUUID());
        enrollment.setStudentId("student-other-1");
        enrollment.setStudentEmail("student_other_batch@zoro.com");
        enrollment.setCourseId(testCourseId);
        enrollment.setBatchId("different_batch_b");
        enrollment.setStatus("Active");
        enrollmentRepository.save(enrollment);

        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("This schedule resource is for another batch"));
    }

    @Test
    @WithMockUser(username = "random_user@zoro.com", roles = {"STUDENT"})
    public void testUnreferencedPrivateFileDeniedWithClearReason() throws Exception {
        StoredFile file = createPrivateStoredFile("orphan_secret.pdf", "document", "admin");

        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Access denied: Private file is not referenced by any course, schedule, or assignment"));
    }

    @Test
    @WithMockUser(username = "trainer_bob@zoro.com", roles = {"TRAINER"})
    public void testTrainerCanViewStudyMaterialAndViewOnlyForbiddenDownload() throws Exception {
        StoredFile file = createPrivateStoredFile("study_guide.pdf", "competition-study-material", "admin");

        CompetitionStudyMaterial csm = new CompetitionStudyMaterial();
        csm.setId("csm_" + UUID.randomUUID());
        csm.setCompetitionId("comp_" + UUID.randomUUID());
        csm.setStoredFileId(file.getId());
        csm.setTitle("Official Guide");
        competitionStudyMaterialRepository.save(csm);

        // Viewing is allowed
        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Downloading is forbidden for non-admin
        mockMvc.perform(get("/api/files/" + file.getId() + "/link?download=true"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("DOWNLOAD_FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "student_alice@zoro.com", roles = {"STUDENT"})
    public void testStudentCanViewStudyMaterialAndViewOnlyForbiddenDownload() throws Exception {
        StoredFile file = createPrivateStoredFile("notes.pdf", "competition-study-material", "admin");

        CompetitionStudyMaterial csm = new CompetitionStudyMaterial();
        csm.setId("csm_" + UUID.randomUUID());
        csm.setCompetitionId("comp_" + UUID.randomUUID());
        csm.setStoredFileId(file.getId());
        csm.setTitle("Public Study Notes");
        competitionStudyMaterialRepository.save(csm);

        // Viewing is allowed for enrolled or un-enrolled students
        mockMvc.perform(get("/api/files/" + file.getId() + "/link"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Downloading is forbidden for students
        mockMvc.perform(get("/api/files/" + file.getId() + "/link?download=true"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("DOWNLOAD_FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "admin@zoro.com", roles = {"ADMIN"})
    public void testAdminCanDownloadFile() throws Exception {
        StoredFile file = createPrivateStoredFile("admin_rules.pdf", "competition-study-material", "admin");

        CompetitionStudyMaterial csm = new CompetitionStudyMaterial();
        csm.setId("csm_" + UUID.randomUUID());
        csm.setCompetitionId("comp_" + UUID.randomUUID());
        csm.setStoredFileId(file.getId());
        csm.setTitle("Admin Downloadable Rules");
        competitionStudyMaterialRepository.save(csm);

        // Admin download is allowed
        mockMvc.perform(get("/api/files/" + file.getId() + "/link?download=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").value(org.hamcrest.Matchers.containsString("download=true")));
    }
}
