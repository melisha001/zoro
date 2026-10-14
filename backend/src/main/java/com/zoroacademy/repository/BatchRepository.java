package com.zoroacademy.repository;

import com.zoroacademy.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, String> {
    List<Batch> findByCourseNameIgnoreCase(String courseName);
    List<Batch> findByTrainerNameIgnoreCase(String trainerName);
    List<Batch> findByStatusIgnoreCase(String status);
    List<Batch> findByCourseId(String courseId);

    @Query("SELECT DISTINCT b FROM Batch b LEFT JOIN b.trainerIds t WHERE t = :trainerId OR b.trainerId = :trainerId")
    List<Batch> findByTrainerId(@Param("trainerId") String trainerId);

    @Query("SELECT DISTINCT b FROM Batch b LEFT JOIN b.trainerIds t WHERE t = :trainerId OR b.trainerId = :trainerId OR LOWER(b.trainerName) = LOWER(:trainerName)")
    List<Batch> findByTrainerIdOrTrainerNameIgnoreCase(@Param("trainerId") String trainerId, @Param("trainerName") String trainerName);

    List<Batch> findByCourseIdAndStatusIgnoreCase(String courseId, String status);

    @Query("SELECT DISTINCT b FROM Batch b LEFT JOIN b.trainerIds t WHERE (t = :trainerId OR b.trainerId = :trainerId) AND LOWER(b.status) = LOWER(:status)")
    List<Batch> findByTrainerIdAndStatusIgnoreCase(@Param("trainerId") String trainerId, @Param("status") String status);

    List<Batch> findByNameIgnoreCase(String name);
    java.util.Optional<Batch> findByNameIgnoreCaseAndCourseId(String name, String courseId);
    java.util.Optional<Batch> findByNameIgnoreCaseAndCourseNameIgnoreCase(String name, String courseName);
}
