package com.zoroacademy.service.storage;

import org.springframework.core.io.Resource;

public interface StorageProvider {

    /**
     * Store raw file bytes at the specified storage path.
     */
    void store(String storagePath, byte[] data, String contentType);

    /**
     * Load the stored file as a Spring Resource.
     */
    Resource loadAsResource(String storagePath);

    /**
     * Delete the file at the specified storage path.
     */
    void delete(String storagePath);

    /**
     * Return direct public CDN URL if applicable, or null for fallback.
     */
    String getPublicUrl(String storagePath);

    /**
     * Check whether a file exists at the specified storage path.
     */
    boolean exists(String storagePath);
}
