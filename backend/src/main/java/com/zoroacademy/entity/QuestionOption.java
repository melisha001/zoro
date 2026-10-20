package com.zoroacademy.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "question_options")
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;

    public QuestionOption() {}

    public QuestionOption(String questionId, String text, Integer sortOrder, Boolean isCorrect) {
        this.questionId = questionId;
        this.text = text;
        this.sortOrder = sortOrder;
        this.isCorrect = isCorrect;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
}
