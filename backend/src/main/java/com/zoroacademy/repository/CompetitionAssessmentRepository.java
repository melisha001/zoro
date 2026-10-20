package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionAssessmentRepository extends JpaRepository<CompetitionAssessment, String> {
    List<CompetitionAssessment> findByCompetitionIdOrderBySequenceNoAsc(String competitionId);
    List<CompetitionAssessment> findByCompetitionIdAndTypeOrderBySequenceNoAsc(String competitionId, String type);
    Optional<CompetitionAssessment> findByCompetitionIdAndTypeAndSequenceNo(String competitionId, String type, Integer sequenceNo);
}
