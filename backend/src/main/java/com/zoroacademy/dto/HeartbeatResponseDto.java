package com.zoroacademy.dto;

public class HeartbeatResponseDto {
    private String moduleId;
    private Integer watchedSeconds;
    private Integer durationSeconds;
    private Boolean videoCompleted;
    private Integer lastPosition;
    private Boolean moduleCompleted;
    private String message;

    public HeartbeatResponseDto() {}

    public HeartbeatResponseDto(String moduleId, Integer watchedSeconds, Integer durationSeconds,
                                Boolean videoCompleted, Integer lastPosition, Boolean moduleCompleted, String message) {
        this.moduleId = moduleId;
        this.watchedSeconds = watchedSeconds;
        this.durationSeconds = durationSeconds;
        this.videoCompleted = videoCompleted;
        this.lastPosition = lastPosition;
        this.moduleCompleted = moduleCompleted;
        this.message = message;
    }

    public String getModuleId() {
        return moduleId;
    }

    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }

    public Integer getWatchedSeconds() {
        return watchedSeconds;
    }

    public void setWatchedSeconds(Integer watchedSeconds) {
        this.watchedSeconds = watchedSeconds;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Boolean getVideoCompleted() {
        return videoCompleted;
    }

    public void setVideoCompleted(Boolean videoCompleted) {
        this.videoCompleted = videoCompleted;
    }

    public Integer getLastPosition() {
        return lastPosition;
    }

    public void setLastPosition(Integer lastPosition) {
        this.lastPosition = lastPosition;
    }

    public Boolean getModuleCompleted() {
        return moduleCompleted;
    }

    public void setModuleCompleted(Boolean moduleCompleted) {
        this.moduleCompleted = moduleCompleted;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
