package com.zoroacademy.repository;

import com.zoroacademy.entity.VoiceEvaluationScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoiceEvaluationScoreRepository extends JpaRepository<VoiceEvaluationScore, String> {
    List<VoiceEvaluationScore> findByAnswerId(String answerId);
    Optional<VoiceEvaluationScore> findByAnswerIdAndCriterionId(String answerId, String criterionId);
    void deleteByAnswerId(String answerId);
}
