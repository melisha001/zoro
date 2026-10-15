package com.zoroacademy.service;

public class FileAccessResult {

    private final boolean allowed;
    private final String code; // LOCKED_MODULE | LOCKED_SCHEDULE | NOT_ENROLLED | NOT_FOUND | FORBIDDEN
    private final String message;
    private final String unlockAt;

    private FileAccessResult(boolean allowed, String code, String message, String unlockAt) {
        this.allowed = allowed;
        this.code = code;
        this.message = message;
        this.unlockAt = unlockAt;
    }

    public static FileAccessResult allowed() {
        return new FileAccessResult(true, null, "Access granted", null);
    }

    public static FileAccessResult notFound(String message) {
        return new FileAccessResult(false, "NOT_FOUND", message != null ? message : "File not found", null);
    }

    public static FileAccessResult notEnrolled(String message) {
        return new FileAccessResult(false, "NOT_ENROLLED", message != null ? message : "You are not enrolled in this course", null);
    }

    public static FileAccessResult lockedModule(String message) {
        return new FileAccessResult(false, "LOCKED_MODULE", message != null ? message : "Module is locked. Complete previous module to unlock.", null);
    }

    public static FileAccessResult lockedSchedule(String message, String unlockAt) {
        return new FileAccessResult(false, "LOCKED_SCHEDULE", message != null ? message : "Schedule resources are locked.", unlockAt);
    }

    public static FileAccessResult forbidden(String message) {
        return new FileAccessResult(false, "FORBIDDEN", message != null ? message : "Access denied: insufficient permissions", null);
    }

    public static FileAccessResult authRequired(String message) {
        return new FileAccessResult(false, "AUTH_REQUIRED", message != null ? message : "Authentication required to access private file", null);
    }

    public boolean isAllowed() {
        return allowed;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public String getUnlockAt() {
        return unlockAt;
    }
}
