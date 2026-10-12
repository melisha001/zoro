package com.zoroacademy.service;

import com.zoroacademy.entity.*;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentCourseBatchRepository studentCourseBatchRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final ScheduleRepository scheduleRepository;
    private final AssignmentRepository assignmentRepository;
    private final DoubtRepository doubtRepository;
    private final BunnyStreamService bunnyStreamService;
    private final FileStorageService fileStorageService;
    private final VideoRepository videoRepository;

    public CourseService(CourseRepository courseRepository,
                         CourseModuleRepository moduleRepository,
                         CourseResourceRepository resourceRepository,
                         UserRepository userRepository,
                         BatchRepository batchRepository,
                         EnrollmentRepository enrollmentRepository,
                         StudentCourseBatchRepository studentCourseBatchRepository,
                         StudentFeeRepository studentFeeRepository,
                         ScheduleRepository scheduleRepository,
                         AssignmentRepository assignmentRepository,
                         DoubtRepository doubtRepository,
                         BunnyStreamService bunnyStreamService,
                         FileStorageService fileStorageService,
                         VideoRepository videoRepository) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.batchRepository = batchRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.studentFeeRepository = studentFeeRepository;
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
        this.doubtRepository = doubtRepository;
        this.bunnyStreamService = bunnyStreamService;
        this.fileStorageService = fileStorageService;
        this.videoRepository = videoRepository;
    }

    @Transactional(readOnly = true)
    public List<Course> getAllCourses(String audience) {
        if (audience != null && !audience.isBlank()) {
            return courseRepository.findByAudienceIgnoreCase(audience);
        }
        return courseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Course getCourseById(String idOrSlug) {
        return courseRepository.findById(idOrSlug)
                .or(() -> courseRepository.findBySlug(idOrSlug))
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + idOrSlug));
    }

    public Course sanitizeCourseForPublic(Course course) {
        if (course == null) return null;
        Course copy = new Course();
        copy.setId(course.getId());
        copy.setSlug(course.getSlug());
        copy.setTitle(course.getTitle());
        copy.setDescription(course.getDescription());
        copy.setCategory(course.getCategory());
        copy.setMode(course.getMode());
        copy.setLevel(course.getLevel());
        copy.setAudience(course.getAudience());
        copy.setDuration(course.getDuration());
        copy.setPrice(course.getPrice());
        copy.setOriginalPrice(course.getOriginalPrice());
        copy.setThumbnail(course.getThumbnail());
        copy.setPreviewVideoUrl(course.getPreviewVideoUrl());
        copy.setEnrolled(course.getEnrolled());
        copy.setRating(course.getRating());
        copy.setStatus(course.getStatus());
        copy.setAssignedTrainer(course.getAssignedTrainer());
        copy.setTrainerId(course.getTrainerId());
        copy.setCreatedAt(course.getCreatedAt());
        copy.setUpdatedAt(course.getUpdatedAt());

        if (course.getModules() != null) {
            java.util.List<CourseModule> safeModules = new java.util.ArrayList<>();
            for (CourseModule m : course.getModules()) {
                CourseModule sm = new CourseModule();
                sm.setId(m.getId());
                sm.setModuleOrder(m.getModuleOrder());
                sm.setTitle(m.getTitle());
                sm.setDescription(m.getDescription());
                sm.setDuration(m.getDuration());
                sm.setThumbnailUrl(m.getThumbnailUrl());
                sm.setVideoStorageRef(null);
                sm.setAfterSessionAssessment(null);
                sm.setNotesFileUrl(null);
                sm.setNotesFileName(null);
                sm.setWorksheetFileUrl(null);
                sm.setWorksheetFileName(null);
                sm.setAssignmentFileUrl(null);
                sm.setAssignmentFileName(null);
                sm.setCreatedAt(m.getCreatedAt());
                sm.setUpdatedAt(m.getUpdatedAt());
                safeModules.add(sm);
            }
            copy.setModules(safeModules);
        } else {
            copy.setModules(new java.util.ArrayList<>());
        }
        copy.setResources(new java.util.ArrayList<>());
        return copy;
    }

    private String generateUniqueSlug(String titleOrSlug, String currentCourseId) {
        if (titleOrSlug == null || titleOrSlug.isBlank()) {
            return "course-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        }
        String baseSlug = titleOrSlug.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (baseSlug.isBlank()) {
            baseSlug = "course-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        }
        String candidate = baseSlug;
        int counter = 1;
        while (true) {
            java.util.Optional<Course> existing = courseRepository.findBySlug(candidate);
            if (existing.isEmpty() || (currentCourseId != null && existing.get().getId().equals(currentCourseId))) {
                return candidate;
            }
            counter++;
            candidate = baseSlug + "-" + counter;
        }
    }

    @Transactional
    public Course createCourse(Course course) {
        if (course.getId() == null || course.getId().isBlank()) {
            course.setId("crs_" + java.util.UUID.randomUUID());
        }

        if (course.getSlug() == null || course.getSlug().isBlank()) {
            course.setSlug(generateUniqueSlug(course.getTitle(), null));
        } else {
            course.setSlug(generateUniqueSlug(course.getSlug(), null));
        }

        if (course.getTrainerId() != null && !course.getTrainerId().isBlank()) {
            userRepository.findById(course.getTrainerId()).ifPresent(u -> course.setAssignedTrainer(u.getName()));
        } else if (course.getAssignedTrainer() != null && !course.getAssignedTrainer().isBlank()
                && !"None (Self-Paced)".equalsIgnoreCase(course.getAssignedTrainer())
                && !"Unassigned".equalsIgnoreCase(course.getAssignedTrainer())) {
            userRepository.findByNameIgnoreCase(course.getAssignedTrainer()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> course.setTrainerId(u.getId()));
        }

        if (course.getModules() != null) {
            course.getModules().forEach(m -> m.setCourse(course));
        }
        if (course.getResources() != null) {
            course.getResources().forEach(r -> r.setCourse(course));
        }
        return courseRepository.save(course);
    }

    @Transactional
    public Course updateCourse(String id, Course updated) {
        final Course targetCourse = getCourseById(id);
        String oldTitle = targetCourse.getTitle();

        if (updated.getTitle() != null) targetCourse.setTitle(updated.getTitle());
        if (updated.getDescription() != null) targetCourse.setDescription(updated.getDescription());
        if (updated.getCategory() != null) targetCourse.setCategory(updated.getCategory());
        if (updated.getMode() != null) targetCourse.setMode(updated.getMode());
        if (updated.getLevel() != null) targetCourse.setLevel(updated.getLevel());
        if (updated.getAudience() != null) targetCourse.setAudience(updated.getAudience());
        if (updated.getDuration() != null) targetCourse.setDuration(updated.getDuration());
        if (updated.getPrice() != null) targetCourse.setPrice(updated.getPrice());
        if (updated.getOriginalPrice() != null) targetCourse.setOriginalPrice(updated.getOriginalPrice());
        if (updated.getThumbnail() != null) targetCourse.setThumbnail(updated.getThumbnail());
        if (updated.getPreviewVideoUrl() != null) targetCourse.setPreviewVideoUrl(updated.getPreviewVideoUrl());
        if (updated.getEnrolled() != null) targetCourse.setEnrolled(updated.getEnrolled());
        if (updated.getRating() != null) targetCourse.setRating(updated.getRating());
        if (updated.getStatus() != null) targetCourse.setStatus(updated.getStatus());

        if (updated.getSlug() != null && !updated.getSlug().isBlank()) {
            targetCourse.setSlug(generateUniqueSlug(updated.getSlug(), targetCourse.getId()));
        } else if (updated.getTitle() != null && !updated.getTitle().equalsIgnoreCase(oldTitle)) {
            targetCourse.setSlug(generateUniqueSlug(targetCourse.getTitle(), targetCourse.getId()));
        } else if (targetCourse.getSlug() == null || targetCourse.getSlug().isBlank()) {
            targetCourse.setSlug(generateUniqueSlug(targetCourse.getTitle(), targetCourse.getId()));
        }

        if (updated.getTrainerId() != null && !updated.getTrainerId().isBlank()) {
            targetCourse.setTrainerId(updated.getTrainerId());
            userRepository.findById(updated.getTrainerId()).ifPresent(u -> targetCourse.setAssignedTrainer(u.getName()));
        } else if (updated.getAssignedTrainer() != null) {
            targetCourse.setAssignedTrainer(updated.getAssignedTrainer());
            if ("None (Self-Paced)".equalsIgnoreCase(updated.getAssignedTrainer()) || "Unassigned".equalsIgnoreCase(updated.getAssignedTrainer())) {
                targetCourse.setTrainerId(null);
            } else {
                userRepository.findByNameIgnoreCase(updated.getAssignedTrainer()).stream()
                        .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                        .findFirst()
                        .ifPresent(u -> targetCourse.setTrainerId(u.getId()));
            }
        }

        Course savedCourse = courseRepository.save(targetCourse);

        // Propagate renamed course title to related records
        if (updated.getTitle() != null && !updated.getTitle().equalsIgnoreCase(oldTitle)) {
            String newTitle = updated.getTitle();
            String cId = savedCourse.getId();

            for (Batch b : batchRepository.findByCourseId(cId)) {
                b.setCourseName(newTitle);
                batchRepository.save(b);
            }
            for (Enrollment e : enrollmentRepository.findByCourseId(cId)) {
                e.setCourseTitle(newTitle);
                enrollmentRepository.save(e);
            }
            for (StudentCourseBatch scb : studentCourseBatchRepository.findByCourseId(cId)) {
                scb.setCourseName(newTitle);
                studentCourseBatchRepository.save(scb);
            }
            for (StudentFee f : studentFeeRepository.findByCourseId(cId)) {
                f.setCourse(newTitle);
                studentFeeRepository.save(f);
            }
            for (Schedule s : scheduleRepository.findByCourseId(cId)) {
                s.setCourse(newTitle);
                scheduleRepository.save(s);
            }
            for (Assignment a : assignmentRepository.findByCourseId(cId)) {
                a.setCourse(newTitle);
                assignmentRepository.save(a);
            }
            for (Doubt d : doubtRepository.findByCourseId(cId)) {
                d.setCourseTitle(newTitle);
                doubtRepository.save(d);
            }
        }

        return savedCourse;
    }

    private void cleanupStoredFilesFromText(String text) {
        if (text == null || text.isBlank()) return;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})").matcher(text);
        while (matcher.find()) {
            try {
                fileStorageService.deleteFile(matcher.group(1));
            } catch (Exception ignored) {}
        }
    }

    private void cleanupModuleFilesAndVideos(CourseModule module) {
        if (module == null) return;
        java.util.Set<String> deletedVideoIds = new java.util.HashSet<>();
        List<Video> videos = videoRepository.findByModuleId(module.getId());
        for (Video v : videos) {
            if (deletedVideoIds.add(v.getBunnyVideoId())) {
                bunnyStreamService.deleteVideo(v.getBunnyVideoId());
            }
        }
        if (module.getVideoStorageRef() != null) {
            try {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(module.getVideoStorageRef());
                if (node.has("videoId")) {
                    String vid = node.get("videoId").asText();
                    if (deletedVideoIds.add(vid)) {
                        bunnyStreamService.deleteVideo(vid);
                    }
                }
            } catch (Exception ignored) {}
            cleanupStoredFilesFromText(module.getVideoStorageRef());
        }
        if (module.getAfterSessionAssessment() != null) {
            cleanupStoredFilesFromText(module.getAfterSessionAssessment());
        }
        cleanupStoredFilesFromText(module.getThumbnailUrl());
        cleanupStoredFilesFromText(module.getNotesFileUrl());
        cleanupStoredFilesFromText(module.getWorksheetFileUrl());
        cleanupStoredFilesFromText(module.getAssignmentFileUrl());
    }

    @Transactional
    public void deleteCourse(String id) {
        long activeEnrollments = enrollmentRepository.findByCourseId(id).stream()
                .filter(e -> "Active".equalsIgnoreCase(e.getStatus()))
                .count();
        if (activeEnrollments > 0) {
            throw new ConflictException("Cannot delete course with " + activeEnrollments + " active enrollments");
        }
        List<Batch> batches = batchRepository.findByCourseId(id);
        if (!batches.isEmpty()) {
            throw new ConflictException("Cannot delete course with " + batches.size() + " active batches");
        }

        Course course = courseRepository.findById(id).orElse(null);
        if (course != null) {
            if (course.getModules() != null) {
                for (CourseModule m : course.getModules()) {
                    cleanupModuleFilesAndVideos(m);
                }
            }
            List<Video> courseVideos = videoRepository.findByCourseId(id);
            for (Video v : courseVideos) {
                bunnyStreamService.deleteVideo(v.getBunnyVideoId());
            }
            cleanupStoredFilesFromText(course.getThumbnail());
            cleanupStoredFilesFromText(course.getPreviewVideoUrl());
            courseRepository.delete(course);
        }
    }

    @Transactional
    public CourseModule addModule(String courseId, CourseModule module) {
        Course course = getCourseById(courseId);
        if (module.getId() == null || module.getId().isBlank()) {
            module.setId("mod_" + UUID.randomUUID());
        }
        module.setCourse(course);
        CourseModule saved = moduleRepository.save(module);

        if (saved.getVideoStorageRef() != null) {
            try {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(saved.getVideoStorageRef());
                if (node.has("videoId")) {
                    String vid = node.get("videoId").asText();
                    videoRepository.findById(vid).or(() -> videoRepository.findByBunnyVideoId(vid)).ifPresent(v -> {
                        v.setCourseId(courseId);
                        v.setModuleId(saved.getId());
                        videoRepository.save(v);
                    });
                }
            } catch (Exception ignored) {}
        }

        return saved;
    }

    @Transactional
    public CourseModule updateModule(String courseId, String moduleId, CourseModule updated) {
        CourseModule existing = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleId));

        if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getDuration() != null) existing.setDuration(updated.getDuration());

        if (updated.getVideoStorageRef() != null) {
            // If replacing video, delete previous video if it changed
            String oldRef = existing.getVideoStorageRef();
            if (oldRef != null && !oldRef.equals(updated.getVideoStorageRef())) {
                try {
                    com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(oldRef);
                    if (node.has("videoId")) {
                        bunnyStreamService.deleteVideo(node.get("videoId").asText());
                    }
                } catch (Exception ignored) {}
            }
            existing.setVideoStorageRef(updated.getVideoStorageRef());

            try {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(updated.getVideoStorageRef());
                if (node.has("videoId")) {
                    String vid = node.get("videoId").asText();
                    videoRepository.findById(vid).or(() -> videoRepository.findByBunnyVideoId(vid)).ifPresent(v -> {
                        v.setCourseId(courseId);
                        v.setModuleId(moduleId);
                        videoRepository.save(v);
                    });
                }
            } catch (Exception ignored) {}
        }

        if (updated.getThumbnailUrl() != null) {
            if (existing.getThumbnailUrl() != null && !existing.getThumbnailUrl().equals(updated.getThumbnailUrl())) {
                cleanupStoredFilesFromText(existing.getThumbnailUrl());
            }
            existing.setThumbnailUrl(updated.getThumbnailUrl().isBlank() ? null : updated.getThumbnailUrl());
        }

        if (updated.getNotesFileUrl() != null) {
            if (existing.getNotesFileUrl() != null && !existing.getNotesFileUrl().equals(updated.getNotesFileUrl())) {
                cleanupStoredFilesFromText(existing.getNotesFileUrl());
            }
            existing.setNotesFileUrl(updated.getNotesFileUrl().isBlank() ? null : updated.getNotesFileUrl());
            existing.setNotesFileName(updated.getNotesFileName());
        } else if (updated.getNotesFileName() != null) {
            existing.setNotesFileName(updated.getNotesFileName());
        }

        if (updated.getWorksheetFileUrl() != null) {
            if (existing.getWorksheetFileUrl() != null && !existing.getWorksheetFileUrl().equals(updated.getWorksheetFileUrl())) {
                cleanupStoredFilesFromText(existing.getWorksheetFileUrl());
            }
            existing.setWorksheetFileUrl(updated.getWorksheetFileUrl().isBlank() ? null : updated.getWorksheetFileUrl());
            existing.setWorksheetFileName(updated.getWorksheetFileName());
        } else if (updated.getWorksheetFileName() != null) {
            existing.setWorksheetFileName(updated.getWorksheetFileName());
        }

        if (updated.getAssignmentFileUrl() != null) {
            if (existing.getAssignmentFileUrl() != null && !existing.getAssignmentFileUrl().equals(updated.getAssignmentFileUrl())) {
                cleanupStoredFilesFromText(existing.getAssignmentFileUrl());
            }
            existing.setAssignmentFileUrl(updated.getAssignmentFileUrl().isBlank() ? null : updated.getAssignmentFileUrl());
            existing.setAssignmentFileName(updated.getAssignmentFileName());
        } else if (updated.getAssignmentFileName() != null) {
            existing.setAssignmentFileName(updated.getAssignmentFileName());
        }

        if (updated.getAfterSessionAssessment() != null) {
            if (existing.getAfterSessionAssessment() != null && !existing.getAfterSessionAssessment().equals(updated.getAfterSessionAssessment())) {
                cleanupStoredFilesFromText(existing.getAfterSessionAssessment());
            }
            existing.setAfterSessionAssessment(updated.getAfterSessionAssessment().isBlank() ? null : updated.getAfterSessionAssessment());
        }

        return moduleRepository.save(existing);
    }

    @Transactional
    public void deleteModule(String courseId, String moduleId) {
        CourseModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module != null) {
            cleanupModuleFilesAndVideos(module);
            moduleRepository.delete(module);
        }
    }

    @Transactional
    public CourseResource addResource(String courseId, CourseResource resource) {
        Course course = getCourseById(courseId);
        if (resource.getId() == null || resource.getId().isBlank()) {
            resource.setId("res_" + UUID.randomUUID());
        }
        resource.setCourse(course);
        return resourceRepository.save(resource);
    }

    @Transactional
    public void deleteResource(String courseId, String resourceId) {
        resourceRepository.deleteById(resourceId);
    }

    @Transactional
    public void deleteResource(String resourceId) {
        resourceRepository.deleteById(resourceId);
    }
}
