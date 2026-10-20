package com.zoroacademy.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "assessment_set_questions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assessment_id", "set_id", "question_id"})
})
public class AssessmentSetQuestion {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "assessment_id", nullable = false, length = 64)
    private String assessmentId;

    @Column(name = "set_id", nullable = false, length = 64)
    private String setId;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(nullable = false)
    private Integer position;

    public AssessmentSetQuestion() {}

    public AssessmentSetQuestion(String id, String assessmentId, String setId, String questionId, Integer position) {
        this.id = id;
        this.assessmentId = assessmentId;
        this.setId = setId;
        this.questionId = questionId;
        this.position = position;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getSetId() { return setId; }
    public void setSetId(String setId) { this.setId = setId; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
