package com.zoroacademy.repository;

import com.zoroacademy.entity.AssessmentSetQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentSetQuestionRepository extends JpaRepository<AssessmentSetQuestion, String> {
    List<AssessmentSetQuestion> findByAssessmentIdAndSetIdOrderByPositionAsc(String assessmentId, String setId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByAssessmentId(String assessmentId);
}
