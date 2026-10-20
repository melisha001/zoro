package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionResultRepository extends JpaRepository<CompetitionResult, String> {
    Optional<CompetitionResult> findByCompetitionIdAndRegistrationId(String competitionId, String registrationId);
    List<CompetitionResult> findByCompetitionIdOrderByRankAsc(String competitionId);
    void deleteByCompetitionId(String competitionId);
}
