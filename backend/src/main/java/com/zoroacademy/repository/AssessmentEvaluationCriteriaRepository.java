package com.zoroacademy.repository;

import com.zoroacademy.entity.AssessmentEvaluationCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentEvaluationCriteriaRepository extends JpaRepository<AssessmentEvaluationCriteria, String> {
    List<AssessmentEvaluationCriteria> findByQuestionIdOrderBySortOrderAsc(String questionId);
    void deleteByQuestionId(String questionId);
}
