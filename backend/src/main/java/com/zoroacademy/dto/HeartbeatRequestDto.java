package com.zoroacademy.dto;

public class HeartbeatRequestDto {
    private String moduleId;
    private Double position;
    private Double duration;
    private String studentId;
    private String courseId;

    public HeartbeatRequestDto() {}

    public HeartbeatRequestDto(String moduleId, Double position, Double duration, String studentId, String courseId) {
        this.moduleId = moduleId;
        this.position = position;
        this.duration = duration;
        this.studentId = studentId;
        this.courseId = courseId;
    }

    public String getModuleId() {
        return moduleId;
    }

    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }

    public Double getPosition() {
        return position;
    }

    public void setPosition(Double position) {
        this.position = position;
    }

    public Double getDuration() {
        return duration;
    }

    public void setDuration(Double duration) {
        this.duration = duration;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }
}
