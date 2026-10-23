package com.zoroacademy.repository;

import com.zoroacademy.entity.AssessmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, String> {
    List<AssessmentQuestion> findByAssessmentIdOrderBySortOrderAsc(String assessmentId);
    List<AssessmentQuestion> findByMediaRefContaining(String mediaRef);
    long countByAssessmentId(String assessmentId);
}
