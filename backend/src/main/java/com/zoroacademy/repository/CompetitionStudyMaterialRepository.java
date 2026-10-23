package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionStudyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionStudyMaterialRepository extends JpaRepository<CompetitionStudyMaterial, String> {
    List<CompetitionStudyMaterial> findByCompetitionIdOrderBySortOrderAsc(String competitionId);
    List<CompetitionStudyMaterial> findByStoredFileId(String storedFileId);
    void deleteByCompetitionId(String competitionId);
}
