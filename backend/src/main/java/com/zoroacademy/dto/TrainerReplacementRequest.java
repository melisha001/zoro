package com.zoroacademy.dto;

public class TrainerReplacementRequest {
    private String newTrainerId;
    private String action; // "INACTIVATE" or "DELETE"

    public TrainerReplacementRequest() {}

    public TrainerReplacementRequest(String newTrainerId, String action) {
        this.newTrainerId = newTrainerId;
        this.action = action;
    }

    public String getNewTrainerId() { return newTrainerId; }
    public void setNewTrainerId(String newTrainerId) { this.newTrainerId = newTrainerId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}
