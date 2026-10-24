package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionSyllabus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionSyllabusRepository extends JpaRepository<CompetitionSyllabus, String> {
    Optional<CompetitionSyllabus> findByCompetitionId(String competitionId);
    List<CompetitionSyllabus> findByStoredFileId(String storedFileId);
    void deleteByCompetitionId(String competitionId);
}
