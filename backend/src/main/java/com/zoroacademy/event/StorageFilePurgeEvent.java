package com.zoroacademy.event;

public class StorageFilePurgeEvent {
    private final String storagePath;

    public StorageFilePurgeEvent(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getStoragePath() {
        return storagePath;
    }
}
