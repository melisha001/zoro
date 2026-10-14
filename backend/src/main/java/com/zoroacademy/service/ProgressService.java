package com.zoroacademy.service;

import com.zoroacademy.dto.HeartbeatRequestDto;
import com.zoroacademy.dto.HeartbeatResponseDto;
import com.zoroacademy.entity.CourseModule;
import com.zoroacademy.entity.StudentModuleProgress;
import com.zoroacademy.entity.StudentProgress;
import com.zoroacademy.repository.StudentProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProgressService {

    private final StudentProgressRepository progressRepository;
    private final com.zoroacademy.repository.StudentModuleProgressRepository moduleProgressRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;
    private final com.zoroacademy.repository.CourseModuleRepository courseModuleRepository;

    public ProgressService(StudentProgressRepository progressRepository,
                           com.zoroacademy.repository.StudentModuleProgressRepository moduleProgressRepository,
                           com.zoroacademy.repository.UserRepository userRepository,
                           @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.CourseModuleRepository courseModuleRepository) {
        this.progressRepository = progressRepository;
        this.moduleProgressRepository = moduleProgressRepository;
        this.userRepository = userRepository;
        this.courseModuleRepository = courseModuleRepository;
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

    @Transactional
    public HeartbeatResponseDto recordVideoHeartbeat(String studentId, HeartbeatRequestDto request) {
        String effectiveStudentId = resolveStudentId(studentId);
        String moduleId = request.getModuleId();
        if (moduleId == null || moduleId.isBlank()) {
            throw new IllegalArgumentException("Module ID is required for video heartbeat");
        }

        CourseModule module = courseModuleRepository != null ? courseModuleRepository.findById(moduleId).orElse(null) : null;
        String courseId = request.getCourseId();
        if ((courseId == null || courseId.isBlank()) && module != null && module.getCourse() != null) {
            courseId = module.getCourse().getId();
        }

        int currentPos = request.getPosition() != null ? (int) Math.round(request.getPosition()) : 0;
        int duration = request.getDuration() != null ? (int) Math.round(request.getDuration()) : 0;

        LocalDateTime now = LocalDateTime.now();
        StudentModuleProgress smp = moduleProgressRepository
                .findByStudentIdAndModuleId(effectiveStudentId, moduleId)
                .orElse(null);

        int increment = 0;
        if (smp == null) {
            // Initial heartbeat
            increment = Math.min(Math.max(0, currentPos), 10);
            smp = StudentModuleProgress.builder()
                    .id("smp_" + UUID.randomUUID())
                    .studentId(effectiveStudentId)
                    .moduleId(moduleId)
                    .courseId(courseId)
                    .watchedSeconds(increment)
                    .durationSeconds(duration)
                    .lastPosition(currentPos)
                    .videoCompleted(false)
                    .completed(false)
                    .updatedAt(now)
                    .build();
        } else {
            LocalDateTime prevUpdate = smp.getUpdatedAt() != null ? smp.getUpdatedAt() : now.minusSeconds(5);
            long elapsedReal = java.time.Duration.between(prevUpdate, now).toSeconds();
            if (elapsedReal < 0) elapsedReal = 0;
            // Heartbeats sent every 5s while playing; cap allowable window between heartbeats to 10s
            long allowableElapsed = Math.min(Math.max(0, elapsedReal), 10);

            int prevPos = smp.getLastPosition() != null ? smp.getLastPosition() : 0;
            int deltaPos = currentPos - prevPos;

            // Seeking forward cannot add watched time beyond allowable real elapsed time
            if (deltaPos > 0 && allowableElapsed > 0) {
                increment = (int) Math.min(deltaPos, allowableElapsed);
            } else {
                increment = 0;
            }

            int newWatched = (smp.getWatchedSeconds() != null ? smp.getWatchedSeconds() : 0) + increment;
            if (duration > 0 && newWatched > duration) {
                newWatched = duration;
            }
            smp.setWatchedSeconds(newWatched);
            smp.setLastPosition(currentPos);
            if (duration > 0) {
                smp.setDurationSeconds(duration);
            }
            smp.setUpdatedAt(now);
        }

        // 95% completion threshold
        int effectiveDuration = smp.getDurationSeconds() != null && smp.getDurationSeconds() > 0 ? smp.getDurationSeconds() : duration;
        boolean videoDone = smp.getVideoCompleted();
        if (!videoDone && effectiveDuration > 0) {
            int thresholdSeconds = (int) Math.ceil(effectiveDuration * 0.95);
            if (smp.getWatchedSeconds() >= thresholdSeconds) {
                videoDone = true;
                smp.setVideoCompleted(true);
            }
        }

        // "A module without an assignment becomes Completed when its video is completed."
        boolean hasAssignment = module != null && (
                (module.getAssignmentFileUrl() != null && !module.getAssignmentFileUrl().isBlank()) ||
                (module.getAssignmentFileName() != null && !module.getAssignmentFileName().isBlank())
        );

        if (videoDone && !hasAssignment) {
            smp.setCompleted(true);
            if (courseId != null) {
                StudentProgress sp = progressRepository
                        .findByStudentIdIgnoreCaseAndCourseIdAndModuleId(effectiveStudentId, courseId, moduleId)
                        .orElse(StudentProgress.builder()
                                .studentId(effectiveStudentId)
                                .courseId(courseId)
                                .moduleId(moduleId)
                                .build());
                sp.setLastPosition(currentPos);
                sp.setCompletionPercentage(100);
                sp.setStatus("Completed");
                sp.setLastAccessedTime(now);
                progressRepository.save(sp);
            }
        } else {
            int pct = effectiveDuration > 0 ? Math.min(100, (int) Math.round(((double) smp.getWatchedSeconds() / effectiveDuration) * 100)) : 0;
            if (courseId != null) {
                StudentProgress sp = progressRepository
                        .findByStudentIdIgnoreCaseAndCourseIdAndModuleId(effectiveStudentId, courseId, moduleId)
                        .orElse(StudentProgress.builder()
                                .studentId(effectiveStudentId)
                                .courseId(courseId)
                                .moduleId(moduleId)
                                .build());
                sp.setLastPosition(currentPos);
                sp.setCompletionPercentage(pct);
                if (!Boolean.TRUE.equals(smp.getCompleted())) {
                    sp.setStatus(pct > 0 ? "In Progress" : "In Progress");
                }
                sp.setLastAccessedTime(now);
                progressRepository.save(sp);
            }
        }

        StudentModuleProgress saved = moduleProgressRepository.save(smp);

        return new HeartbeatResponseDto(
                moduleId,
                saved.getWatchedSeconds(),
                saved.getDurationSeconds(),
                saved.getVideoCompleted(),
                saved.getLastPosition(),
                saved.getCompleted(),
                videoDone ? "Video completed" : "Heartbeat recorded"
        );
    }
}
