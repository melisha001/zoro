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
}
