package com.zoroacademy.listener;

import com.zoroacademy.event.StorageFilePurgeEvent;
import com.zoroacademy.event.StorageVideoPurgeEvent;
import com.zoroacademy.service.BunnyStreamService;
import com.zoroacademy.service.storage.StorageProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class StoragePurgeListener {

    private static final Logger log = LoggerFactory.getLogger(StoragePurgeListener.class);

    private final StorageProvider storageProvider;
    private final BunnyStreamService bunnyStreamService;

    public StoragePurgeListener(StorageProvider storageProvider, BunnyStreamService bunnyStreamService) {
        this.storageProvider = storageProvider;
        this.bunnyStreamService = bunnyStreamService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onFilePurge(StorageFilePurgeEvent event) {
        if (event == null || event.getStoragePath() == null || event.getStoragePath().isBlank()) {
            return;
        }
        try {
            log.info("Executing post-commit Bunny/storage file purge for: {}", event.getStoragePath());
            storageProvider.delete(event.getStoragePath());
        } catch (Exception e) {
            log.error("Failed to delete storage file from provider after transaction commit {}: {}",
                    event.getStoragePath(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onVideoPurge(StorageVideoPurgeEvent event) {
        if (event == null || event.getVideoId() == null || event.getVideoId().isBlank()) {
            return;
        }
        try {
            log.info("Executing post-commit Bunny video purge for: {}", event.getVideoId());
            bunnyStreamService.deleteVideo(event.getVideoId());
        } catch (Exception e) {
            log.error("Failed to delete video from Bunny Stream after transaction commit {}: {}",
                    event.getVideoId(), e.getMessage());
        }
    }
}
