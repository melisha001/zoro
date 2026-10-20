package com.zoroacademy.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "assessment_set_options", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assessment_id", "set_id", "question_id", "option_id"})
})
public class AssessmentSetOption {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "assessment_id", nullable = false, length = 64)
    private String assessmentId;

    @Column(name = "set_id", nullable = false, length = 64)
    private String setId;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(name = "option_id", nullable = false)
    private UUID optionId;

    @Column(nullable = false)
    private Integer position;

    public AssessmentSetOption() {}

    public AssessmentSetOption(String id, String assessmentId, String setId, String questionId, UUID optionId, Integer position) {
        this.id = id;
        this.assessmentId = assessmentId;
        this.setId = setId;
        this.questionId = questionId;
        this.optionId = optionId;
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

    public UUID getOptionId() { return optionId; }
    public void setOptionId(UUID optionId) { this.optionId = optionId; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
