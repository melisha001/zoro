package com.zoroacademy.service.storage;

import com.zoroacademy.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class LocalStorageProvider implements StorageProvider {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageProvider.class);
    private final Path storageLocation;

    public LocalStorageProvider(String storageDir) {
        this.storageLocation = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize local storage directory at " + this.storageLocation, e);
        }
    }

    @Override
    public void store(String storagePath, byte[] data, String contentType) {
        try {
            Path targetPath = resolvePath(storagePath);
            if (targetPath.getParent() != null) {
                Files.createDirectories(targetPath.getParent());
            }
            Files.write(targetPath, data);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file to local disk at " + storagePath, e);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        try {
            Path targetPath = resolvePath(storagePath);
            if (!Files.exists(targetPath)) {
                // Fallback for legacy files stored directly by filename in root of uploads
                Path legacyPath = storageLocation.resolve(Paths.get(storagePath).getFileName()).normalize();
                if (Files.exists(legacyPath)) {
                    targetPath = legacyPath;
                }
            }

            Resource resource = new UrlResource(targetPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File content not found on local disk: " + storagePath);
            }
        } catch (Exception e) {
            throw new ResourceNotFoundException("Error loading local file: " + e.getMessage());
        }
    }

    @Override
    public void delete(String storagePath) {
        try {
            Path targetPath = resolvePath(storagePath);
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            log.warn("Failed to delete local file at {}: {}", storagePath, e.getMessage());
        }
    }

    @Override
    public String getPublicUrl(String storagePath) {
        return null;
    }

    @Override
    public boolean exists(String storagePath) {
        Path targetPath = resolvePath(storagePath);
        if (Files.exists(targetPath)) {
            return true;
        }
        if (storagePath != null && !storagePath.contains("/") && !storagePath.contains("\\")) {
            Path legacyPath = storageLocation.resolve(Paths.get(storagePath).getFileName()).normalize();
            return Files.exists(legacyPath);
        }
        return false;
    }

    private Path resolvePath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return storageLocation;
        }
        Path path = Paths.get(storagePath);
        if (path.isAbsolute()) {
            return path.normalize();
        }
        return storageLocation.resolve(storagePath).normalize();
    }
}
