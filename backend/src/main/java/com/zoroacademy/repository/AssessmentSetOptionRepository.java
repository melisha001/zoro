package com.zoroacademy.repository;

import com.zoroacademy.entity.AssessmentSetOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AssessmentSetOptionRepository extends JpaRepository<AssessmentSetOption, String> {
    List<AssessmentSetOption> findByAssessmentIdAndSetIdAndQuestionIdOrderByPositionAsc(String assessmentId, String setId, String questionId);

    @Transactional
    @Modifying
    @Query("DELETE FROM AssessmentSetOption o WHERE o.assessmentId = :assessmentId")
    void deleteByAssessmentId(@Param("assessmentId") String assessmentId);
}
