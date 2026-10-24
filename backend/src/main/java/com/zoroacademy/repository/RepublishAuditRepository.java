package com.zoroacademy.repository;

import com.zoroacademy.entity.RepublishAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepublishAuditRepository extends JpaRepository<RepublishAudit, String> {
    List<RepublishAudit> findByAssessmentIdOrderByRepublishedAtDesc(String assessmentId);
    boolean existsByAssessmentId(String assessmentId);
}
