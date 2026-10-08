package com.zoroacademy.service;

import com.zoroacademy.entity.StudentProgress;
import com.zoroacademy.repository.StudentProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProgressService {

    private final StudentProgressRepository progressRepository;
    private final com.zoroacademy.repository.StudentModuleProgressRepository moduleProgressRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;

    public ProgressService(StudentProgressRepository progressRepository,
                           com.zoroacademy.repository.StudentModuleProgressRepository moduleProgressRepository,
                           com.zoroacademy.repository.UserRepository userRepository) {
        this.progressRepository = progressRepository;
        this.moduleProgressRepository = moduleProgressRepository;
        this.userRepository = userRepository;
    }

    private String resolveStudentId(String studentIdOrEmail) {
        if (studentIdOrEmail != null && studentIdOrEmail.contains("@")) {
            return userRepository.findByEmailIgnoreCase(studentIdOrEmail)
                    .map(com.zoroacademy.entity.User::getId)
                    .orElse(studentIdOrEmail);
        }
        return studentIdOrEmail;
    }

    @Transactional(readOnly = true)
    public List<StudentProgress> getStudentProgress(String studentId, String courseId) {
        String effectiveStudentId = resolveStudentId(studentId);
        return progressRepository.findByStudentIdIgnoreCaseAndCourseId(effectiveStudentId, courseId);
    }

    @Transactional(readOnly = true)
    public List<com.zoroacademy.entity.StudentModuleProgress> getModuleProgressForStudent(String studentId, String courseId) {
        String effectiveStudentId = resolveStudentId(studentId);
        if (courseId != null && !courseId.isBlank()) {
            return moduleProgressRepository.findByStudentIdAndCourseId(effectiveStudentId, courseId);
        }
        return moduleProgressRepository.findByStudentId(effectiveStudentId);
    }

    @Transactional
    public StudentProgress updateModuleProgress(String studentId, String courseId, String moduleId,
                                                Integer lastPosition, Integer completionPercentage, String status) {
        String effectiveStudentId = resolveStudentId(studentId);

        Optional<StudentProgress> existingOpt = progressRepository
                .findByStudentIdIgnoreCaseAndCourseIdAndModuleId(effectiveStudentId, courseId, moduleId);

        String calcStatus = status;
        if (calcStatus == null || calcStatus.isBlank()) {
            if (completionPercentage != null && completionPercentage >= 80) {
                calcStatus = "Completed";
            } else if (completionPercentage != null && completionPercentage > 0) {
                calcStatus = "In Progress";
            } else {
                calcStatus = "Not Started";
            }
        }

        StudentProgress progress;
        if (existingOpt.isPresent()) {
            progress = existingOpt.get();
            if (lastPosition != null) progress.setLastPosition(lastPosition);
            if (completionPercentage != null) progress.setCompletionPercentage(completionPercentage);
            progress.setStatus(calcStatus);
            progress.setLastAccessedTime(LocalDateTime.now());
        } else {
            progress = StudentProgress.builder()
                    .studentId(effectiveStudentId)
                    .courseId(courseId)
                    .moduleId(moduleId)
                    .lastPosition(lastPosition != null ? lastPosition : 0)
                    .completionPercentage(completionPercentage != null ? completionPercentage : 0)
                    .status(calcStatus)
                    .lastAccessedTime(LocalDateTime.now())
                    .build();
        }

        StudentProgress saved = progressRepository.save(progress);

        // Also update student_module_progress table (student_id, module_id, watched_seconds, completed, last_position_seconds, updated_at)
        boolean isCompleted = "Completed".equalsIgnoreCase(calcStatus);
        int posSeconds = lastPosition != null ? lastPosition : 0;
        int watchedSecs = posSeconds;

        Optional<com.zoroacademy.entity.StudentModuleProgress> smpOpt = moduleProgressRepository
                .findByStudentIdAndModuleId(effectiveStudentId, moduleId);
        com.zoroacademy.entity.StudentModuleProgress smp;
        if (smpOpt.isPresent()) {
            smp = smpOpt.get();
            smp.setLastPositionSeconds(posSeconds);
            smp.setWatchedSeconds(Math.max(smp.getWatchedSeconds() != null ? smp.getWatchedSeconds() : 0, watchedSecs));
            if (isCompleted) smp.setCompleted(true);
            smp.setCourseId(courseId);
            smp.setUpdatedAt(LocalDateTime.now());
        } else {
            smp = com.zoroacademy.entity.StudentModuleProgress.builder()
                    .id("smp_" + java.util.UUID.randomUUID())
                    .studentId(effectiveStudentId)
                    .moduleId(moduleId)
                    .courseId(courseId)
                    .watchedSeconds(watchedSecs)
                    .completed(isCompleted)
                    .lastPositionSeconds(posSeconds)
                    .updatedAt(LocalDateTime.now())
                    .build();
        }
        moduleProgressRepository.save(smp);

        return saved;
    }
}
