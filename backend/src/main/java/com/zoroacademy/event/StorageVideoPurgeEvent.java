package com.zoroacademy.event;

public class StorageVideoPurgeEvent {
    private final String videoId;

    public StorageVideoPurgeEvent(String videoId) {
        this.videoId = videoId;
    }

    public String getVideoId() {
        return videoId;
    }
}
