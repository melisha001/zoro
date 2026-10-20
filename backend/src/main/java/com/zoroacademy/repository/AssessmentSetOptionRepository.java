package com.zoroacademy.repository;

import com.zoroacademy.entity.AssessmentSetOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentSetOptionRepository extends JpaRepository<AssessmentSetOption, String> {
    List<AssessmentSetOption> findByAssessmentIdAndSetIdAndQuestionIdOrderByPositionAsc(String assessmentId, String setId, String questionId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByAssessmentId(String assessmentId);
}
