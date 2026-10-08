package com.zoroacademy.repository;

import com.zoroacademy.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    List<Course> findByAudienceIgnoreCase(String audience);
    List<Course> findByModeIgnoreCase(String mode);
    List<Course> findByStatusIgnoreCase(String status);
    List<Course> findByTrainerId(String trainerId);
    List<Course> findByAssignedTrainerIgnoreCase(String assignedTrainer);
    List<Course> findByTrainerIdOrAssignedTrainerIgnoreCase(String trainerId, String assignedTrainer);
    java.util.Optional<Course> findByTitleIgnoreCase(String title);
    java.util.Optional<Course> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
