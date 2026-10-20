package com.zoroacademy.repository;

import com.zoroacademy.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, UUID> {
    List<QuestionOption> findByQuestionIdOrderBySortOrderAsc(String questionId);
    void deleteByQuestionId(String questionId);
}
