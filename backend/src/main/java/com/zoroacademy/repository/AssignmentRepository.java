package com.zoroacademy.repository;

import com.zoroacademy.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, String> {
    List<Assignment> findByCourseIgnoreCase(String course);
    List<Assignment> findByBatchIgnoreCase(String batch);
    List<Assignment> findByTrainerIgnoreCase(String trainer);
    List<Assignment> findByCourseId(String courseId);
    List<Assignment> findByBatchId(String batchId);
    List<Assignment> findByTrainerId(String trainerId);
    List<Assignment> findByTrainerIdOrTrainerIgnoreCase(String trainerId, String trainer);
    List<Assignment> findByCourseIdOrCourseIgnoreCase(String courseId, String course);
    List<Assignment> findByBatchIdOrBatchIgnoreCase(String batchId, String batch);
}
