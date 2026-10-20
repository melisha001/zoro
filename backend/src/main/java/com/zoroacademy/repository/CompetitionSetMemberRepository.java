package com.zoroacademy.repository;

import com.zoroacademy.entity.CompetitionSetMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionSetMemberRepository extends JpaRepository<CompetitionSetMember, String> {
    Optional<CompetitionSetMember> findByRegistrationId(String registrationId);
    List<CompetitionSetMember> findByCompetitionId(String competitionId);
    List<CompetitionSetMember> findBySetId(String setId);
    long countBySetId(String setId);

    @Query("SELECT s.id, count(m.id) FROM CompetitionSet s LEFT JOIN CompetitionSetMember m ON s.id = m.setId WHERE s.competitionId = :compId GROUP BY s.id, s.code ORDER BY s.code ASC")
    List<Object[]> countMembersPerSet(@Param("compId") String competitionId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCompetitionId(String competitionId);
}
