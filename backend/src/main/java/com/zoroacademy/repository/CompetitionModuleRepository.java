package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionModuleRepository extends JpaRepository<CompetitionModule, String> {
    List<CompetitionModule> findByCompetitionIdOrderByRoundNumberAsc(String competitionId);
}
