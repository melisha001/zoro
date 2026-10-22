package com.zoroacademy.repository;

import com.zoroacademy.entity.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, String> {
    Optional<AssessmentAttempt> findByAssessmentIdAndRegistrationId(String assessmentId, String registrationId);
    Optional<AssessmentAttempt> findByAssessmentIdAndRegistrationIdAndPublishVersion(String assessmentId, String registrationId, Integer publishVersion);
    List<AssessmentAttempt> findByAssessmentIdAndRegistrationIdOrderByPublishVersionDesc(String assessmentId, String registrationId);
    Optional<AssessmentAttempt> findTopByAssessmentIdAndRegistrationIdOrderByPublishVersionDesc(String assessmentId, String registrationId);
    List<AssessmentAttempt> findByRegistrationId(String registrationId);
    List<AssessmentAttempt> findByAssessmentId(String assessmentId);
    long countByAssessmentId(String assessmentId);
    long countByAssessmentIdAndPublishVersion(String assessmentId, Integer publishVersion);
}
