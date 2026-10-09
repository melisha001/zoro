package com.zoroacademy.repository;

import com.zoroacademy.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, String> {
    List<Batch> findByCourseNameIgnoreCase(String courseName);
    List<Batch> findByTrainerNameIgnoreCase(String trainerName);
    List<Batch> findByStatusIgnoreCase(String status);
    List<Batch> findByCourseId(String courseId);
    List<Batch> findByTrainerId(String trainerId);
    List<Batch> findByTrainerIdOrTrainerNameIgnoreCase(String trainerId, String trainerName);
    List<Batch> findByCourseIdAndStatusIgnoreCase(String courseId, String status);
    List<Batch> findByTrainerIdAndStatusIgnoreCase(String trainerId, String status);
    List<Batch> findByNameIgnoreCase(String name);
    java.util.Optional<Batch> findByNameIgnoreCaseAndCourseId(String name, String courseId);
    java.util.Optional<Batch> findByNameIgnoreCaseAndCourseNameIgnoreCase(String name, String courseName);
}
