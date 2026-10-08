package com.zoroacademy.repository;

import com.zoroacademy.entity.TrainerCourseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainerCourseRequestRepository extends JpaRepository<TrainerCourseRequest, String> {
    List<TrainerCourseRequest> findByTrainerId(String trainerId);
    List<TrainerCourseRequest> findByTrainerEmailIgnoreCase(String email);
    List<TrainerCourseRequest> findByCourseId(String courseId);
    List<TrainerCourseRequest> findByStatusIgnoreCase(String status);
    List<TrainerCourseRequest> findByTrainerIdAndStatusIgnoreCase(String trainerId, String status);
    Optional<TrainerCourseRequest> findByTrainerIdAndCourseIdAndStatusIgnoreCase(String trainerId, String courseId, String status);
}
