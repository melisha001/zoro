package com.zoroacademy.repository;

import com.zoroacademy.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, String> {
    List<AttemptAnswer> findByAttemptId(String attemptId);
    Optional<AttemptAnswer> findByAttemptIdAndQuestionId(String attemptId, String questionId);
    List<AttemptAnswer> findByVoiceFileIdOrAudioFileId(String voiceFileId, String audioFileId);
    void deleteByAttemptId(String attemptId);
    long countByAttemptId(String attemptId);
}

