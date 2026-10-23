package com.zoroacademy.repository;

import com.zoroacademy.entity.ExamProctorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamProctorEventRepository extends JpaRepository<ExamProctorEvent, String> {
    List<ExamProctorEvent> findByAttemptIdOrderByCreatedAtAsc(String attemptId);
    long countByAttemptId(String attemptId);
}
