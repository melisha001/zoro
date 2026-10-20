package com.zoroacademy.repository;

import com.zoroacademy.entity.Competition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, String> {
    List<Competition> findByStatusIgnoreCase(String status);
    List<Competition> findByRulesPdfUrlContaining(String fileId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Competition c WHERE c.id = :id")
    java.util.Optional<Competition> findByIdWithLock(@org.springframework.data.repository.query.Param("id") String id);
}
