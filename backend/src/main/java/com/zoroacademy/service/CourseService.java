package com.zoroacademy.service;

import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.CourseModule;
import com.zoroacademy.entity.CourseResource;
import com.zoroacademy.repository.CourseModuleRepository;
import com.zoroacademy.repository.CourseRepository;
import com.zoroacademy.repository.CourseResourceRepository;
import com.zoroacademy.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public CourseService(CourseRepository courseRepository,
                         CourseModuleRepository moduleRepository,
                         CourseResourceRepository resourceRepository,
                         UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Course> getAllCourses(String audience) {
        if (audience != null && !audience.isBlank()) {
            return courseRepository.findByAudienceIgnoreCase(audience);
        }
        return courseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Course getCourseById(String id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + id));
    }

    @Transactional
    public Course createCourse(Course course) {
        if (course.getId() == null || course.getId().isBlank()) {
            course.setId(course.getTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-"));
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
        Course existing = getCourseById(id);
        if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getMode() != null) existing.setMode(updated.getMode());
        if (updated.getLevel() != null) existing.setLevel(updated.getLevel());
        if (updated.getAudience() != null) existing.setAudience(updated.getAudience());
        if (updated.getDuration() != null) existing.setDuration(updated.getDuration());
        if (updated.getPrice() != null) existing.setPrice(updated.getPrice());
        if (updated.getOriginalPrice() != null) existing.setOriginalPrice(updated.getOriginalPrice());
        if (updated.getThumbnail() != null) existing.setThumbnail(updated.getThumbnail());
        if (updated.getPreviewVideoUrl() != null) existing.setPreviewVideoUrl(updated.getPreviewVideoUrl());
        if (updated.getEnrolled() != null) existing.setEnrolled(updated.getEnrolled());
        if (updated.getRating() != null) existing.setRating(updated.getRating());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());

        if (updated.getTrainerId() != null && !updated.getTrainerId().isBlank()) {
            existing.setTrainerId(updated.getTrainerId());
            userRepository.findById(updated.getTrainerId()).ifPresent(u -> existing.setAssignedTrainer(u.getName()));
        } else if (updated.getAssignedTrainer() != null) {
            existing.setAssignedTrainer(updated.getAssignedTrainer());
            if ("None (Self-Paced)".equalsIgnoreCase(updated.getAssignedTrainer()) || "Unassigned".equalsIgnoreCase(updated.getAssignedTrainer())) {
                existing.setTrainerId(null);
            } else {
                userRepository.findByNameIgnoreCase(updated.getAssignedTrainer()).stream()
                        .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                        .findFirst()
                        .ifPresent(u -> existing.setTrainerId(u.getId()));
            }
        }

        return courseRepository.save(existing);
    }

    @Transactional
    public void deleteCourse(String id) {
        courseRepository.deleteById(id);
    }

    @Transactional
    public CourseModule addModule(String courseId, CourseModule module) {
        Course course = getCourseById(courseId);
        if (module.getId() == null || module.getId().isBlank()) {
            module.setId("mod_" + System.currentTimeMillis());
        }
        module.setCourse(course);
        return moduleRepository.save(module);
    }

    @Transactional
    public CourseModule updateModule(String courseId, String moduleId, CourseModule updated) {
        CourseModule existing = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleId));

        if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getDuration() != null) existing.setDuration(updated.getDuration());
        if (updated.getVideoStorageRef() != null) existing.setVideoStorageRef(updated.getVideoStorageRef());
        if (updated.getAfterSessionAssessment() != null) existing.setAfterSessionAssessment(updated.getAfterSessionAssessment());

        return moduleRepository.save(existing);
    }

    @Transactional
    public void deleteModule(String courseId, String moduleId) {
        moduleRepository.deleteById(moduleId);
    }

    @Transactional
    public CourseResource addResource(String courseId, CourseResource resource) {
        Course course = getCourseById(courseId);
        if (resource.getId() == null || resource.getId().isBlank()) {
            resource.setId("res_" + System.currentTimeMillis());
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
