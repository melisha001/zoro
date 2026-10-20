package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionSetRepository extends JpaRepository<CompetitionSet, String> {
    List<CompetitionSet> findByCompetitionIdOrderByCodeAsc(String competitionId);
    Optional<CompetitionSet> findByCompetitionIdAndCode(String competitionId, String code);
    List<CompetitionSet> findByTrainerId(String trainerId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCompetitionId(String competitionId);
}
