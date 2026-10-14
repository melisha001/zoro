package com.zoroacademy.dto;

public class CleanupResultDto {
    private boolean dryRun;
    private long orphanedFilesFound;
    private long orphanedFilesDeleted;
    private long orphanedVideosFound;
    private long orphanedVideosDeleted;
    private long submissionsPurged;
    private long bytesReclaimed;
    private String executionTime;
    private String message;

    public CleanupResultDto() {}

    public boolean isDryRun() {
        return dryRun;
    }

    public void setDryRun(boolean dryRun) {
        this.dryRun = dryRun;
    }

    public long getOrphanedFilesFound() {
        return orphanedFilesFound;
    }

    public void setOrphanedFilesFound(long orphanedFilesFound) {
        this.orphanedFilesFound = orphanedFilesFound;
    }

    public long getOrphanedFilesDeleted() {
        return orphanedFilesDeleted;
    }

    public void setOrphanedFilesDeleted(long orphanedFilesDeleted) {
        this.orphanedFilesDeleted = orphanedFilesDeleted;
    }

    public long getOrphanedVideosFound() {
        return orphanedVideosFound;
    }

    public void setOrphanedVideosFound(long orphanedVideosFound) {
        this.orphanedVideosFound = orphanedVideosFound;
    }

    public long getOrphanedVideosDeleted() {
        return orphanedVideosDeleted;
    }

    public void setOrphanedVideosDeleted(long orphanedVideosDeleted) {
        this.orphanedVideosDeleted = orphanedVideosDeleted;
    }

    public long getSubmissionsPurged() {
        return submissionsPurged;
    }

    public void setSubmissionsPurged(long submissionsPurged) {
        this.submissionsPurged = submissionsPurged;
    }

    public long getBytesReclaimed() {
        return bytesReclaimed;
    }

    public void setBytesReclaimed(long bytesReclaimed) {
        this.bytesReclaimed = bytesReclaimed;
    }

    public String getExecutionTime() {
        return executionTime;
    }

    public void setExecutionTime(String executionTime) {
        this.executionTime = executionTime;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
