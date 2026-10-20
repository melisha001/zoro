package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionLeaderboardCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionLeaderboardCacheRepository extends JpaRepository<CompetitionLeaderboardCache, String> {
    Optional<CompetitionLeaderboardCache> findByCompetitionIdAndRegistrationId(String competitionId, String registrationId);
    List<CompetitionLeaderboardCache> findByCompetitionIdOrderByRankAsc(String competitionId);
    void deleteByCompetitionId(String competitionId);
}
