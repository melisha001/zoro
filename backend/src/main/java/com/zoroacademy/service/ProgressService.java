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
    public ProgressService(StudentProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }


    @Transactional(readOnly = true)
    public List<StudentProgress> getStudentProgress(String studentId, String courseId) {
        return progressRepository.findByStudentIdIgnoreCaseAndCourseId(studentId, courseId);
    }

    @Transactional
    public StudentProgress updateModuleProgress(String studentId, String courseId, String moduleId,
                                                Integer lastPosition, Integer completionPercentage, String status) {
        Optional<StudentProgress> existingOpt = progressRepository
                .findByStudentIdIgnoreCaseAndCourseIdAndModuleId(studentId, courseId, moduleId);

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
                    .studentId(studentId)
                    .courseId(courseId)
                    .moduleId(moduleId)
                    .lastPosition(lastPosition != null ? lastPosition : 0)
                    .completionPercentage(completionPercentage != null ? completionPercentage : 0)
                    .status(calcStatus)
                    .lastAccessedTime(LocalDateTime.now())
                    .build();
        }

        return progressRepository.save(progress);
    }
}
