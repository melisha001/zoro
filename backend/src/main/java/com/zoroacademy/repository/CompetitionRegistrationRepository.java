package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionRegistrationRepository extends JpaRepository<CompetitionRegistration, String> {
    List<CompetitionRegistration> findByCompetitionId(String competitionId);
    List<CompetitionRegistration> findByStudentId(String studentId);
    Optional<CompetitionRegistration> findByCompetitionIdAndStudentId(String competitionId, String studentId);
}
