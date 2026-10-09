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
    Optional<CompetitionRegistration> findByCompetitionIdAndStudentEmailIgnoreCase(String competitionId, String studentEmail);
    Optional<CompetitionRegistration> findByCompetitionIdAndStudentPhone(String competitionId, String studentPhone);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(c.registrationFee), 0) FROM CompetitionRegistration r JOIN r.competition c WHERE LOWER(r.paymentStatus) = 'paid'")
    java.math.BigDecimal sumPaidCompetitionFees();
}
