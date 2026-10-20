package com.zoroacademy.repository;

import com.zoroacademy.entity.LeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, String> {
    List<LeaderboardEntry> findByCompetitionIdOrderByRankAsc(String competitionId);
    Optional<LeaderboardEntry> findByCompetitionIdAndRegistrationId(String competitionId, String registrationId);
    void deleteByCompetitionId(String competitionId);
}
