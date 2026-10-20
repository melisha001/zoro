package com.zoroacademy.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "assessment_evaluation_criteria")
public class AssessmentEvaluationCriteria {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(nullable = false)
    private String title;

    @Column(name = "max_marks", nullable = false)
    private Integer maxMarks = 5;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    public AssessmentEvaluationCriteria() {}

    public AssessmentEvaluationCriteria(String id, String questionId, String title, Integer maxMarks, Integer sortOrder) {
        this.id = id;
        this.questionId = questionId;
        this.title = title;
        this.maxMarks = maxMarks;
        this.sortOrder = sortOrder;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Integer getMaxMarks() { return maxMarks; }
    public void setMaxMarks(Integer maxMarks) { this.maxMarks = maxMarks; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
