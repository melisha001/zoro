package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionGuidanceVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionGuidanceVideoRepository extends JpaRepository<CompetitionGuidanceVideo, String> {
    List<CompetitionGuidanceVideo> findByCompetitionIdOrderBySortOrderAsc(String competitionId);
    Optional<CompetitionGuidanceVideo> findByCompetitionIdAndBunnyVideoId(String competitionId, String bunnyVideoId);
    void deleteByCompetitionId(String competitionId);
}
