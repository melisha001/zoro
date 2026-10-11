package com.zoroacademy.repository;

import com.zoroacademy.entity.Competition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, String> {
    List<Competition> findByStatusIgnoreCase(String status);
    List<Competition> findByRulesPdfUrlContaining(String fileId);
}
