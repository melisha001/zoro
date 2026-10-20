package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionGuidanceVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionGuidanceVideoRepository extends JpaRepository<CompetitionGuidanceVideo, String> {
    List<CompetitionGuidanceVideo> findByCompetitionIdOrderBySortOrderAsc(String competitionId);
    void deleteByCompetitionId(String competitionId);
}
