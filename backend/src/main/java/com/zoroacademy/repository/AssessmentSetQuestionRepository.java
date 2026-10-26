package com.zoroacademy.repository;

import com.zoroacademy.entity.AssessmentSetQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AssessmentSetQuestionRepository extends JpaRepository<AssessmentSetQuestion, String> {
    List<AssessmentSetQuestion> findByAssessmentIdAndSetIdOrderByPositionAsc(String assessmentId, String setId);

    @Transactional
    @Modifying
    @Query("DELETE FROM AssessmentSetQuestion q WHERE q.assessmentId = :assessmentId")
    void deleteByAssessmentId(@Param("assessmentId") String assessmentId);
}
