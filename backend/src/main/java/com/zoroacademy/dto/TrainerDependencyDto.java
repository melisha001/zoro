package com.zoroacademy.dto;

import java.util.List;
import java.util.Map;

public class TrainerDependencyDto {
    private String trainerId;
    private String trainerName;
    private boolean hasDependencies;
    private int courseCount;
    private int batchCount;
    private int scheduleCount;
    private List<Map<String, String>> courses;
    private List<Map<String, String>> batches;
    private List<Map<String, String>> schedules;

    public TrainerDependencyDto() {}

    public TrainerDependencyDto(String trainerId, String trainerName, boolean hasDependencies,
                                int courseCount, int batchCount, int scheduleCount,
                                List<Map<String, String>> courses,
                                List<Map<String, String>> batches,
                                List<Map<String, String>> schedules) {
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.hasDependencies = hasDependencies;
        this.courseCount = courseCount;
        this.batchCount = batchCount;
        this.scheduleCount = scheduleCount;
        this.courses = courses;
        this.batches = batches;
        this.schedules = schedules;
    }

    public String getTrainerId() { return trainerId; }
    public void setTrainerId(String trainerId) { this.trainerId = trainerId; }

    public String getTrainerName() { return trainerName; }
    public void setTrainerName(String trainerName) { this.trainerName = trainerName; }

    public boolean isHasDependencies() { return hasDependencies; }
    public void setHasDependencies(boolean hasDependencies) { this.hasDependencies = hasDependencies; }

    public int getCourseCount() { return courseCount; }
    public void setCourseCount(int courseCount) { this.courseCount = courseCount; }

    public int getBatchCount() { return batchCount; }
    public void setBatchCount(int batchCount) { this.batchCount = batchCount; }

    public int getScheduleCount() { return scheduleCount; }
    public void setScheduleCount(int scheduleCount) { this.scheduleCount = scheduleCount; }

    public List<Map<String, String>> getCourses() { return courses; }
    public void setCourses(List<Map<String, String>> courses) { this.courses = courses; }

    public List<Map<String, String>> getBatches() { return batches; }
    public void setBatches(List<Map<String, String>> batches) { this.batches = batches; }

    public List<Map<String, String>> getSchedules() { return schedules; }
    public void setSchedules(List<Map<String, String>> schedules) { this.schedules = schedules; }
}
