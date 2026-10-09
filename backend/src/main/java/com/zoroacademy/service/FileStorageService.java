package com.zoroacademy.service;

import com.zoroacademy.entity.StoredFile;
import com.zoroacademy.exception.BadRequestException;
import com.zoroacademy.exception.ResourceNotFoundException;

import com.zoroacademy.repository.StoredFileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private final StoredFileRepository storedFileRepository;
    private final Path storageLocation;

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final long MAX_DOC_SIZE = 100 * 1024 * 1024; // 100 MB

    private static final Set<String> IMAGE_CATEGORIES = Set.of(
            "image", "images", "avatar", "thumbnail", "banner", "profile"
    );

    private static final Set<String> PUBLIC_CATEGORIES = Set.of(
            "avatar", "thumbnail", "banner", "profile", "public", "image", "images"
    );

    public FileStorageService(
            StoredFileRepository storedFileRepository,
            @Value("${app.storage.dir:./uploads}") String storageDir
    ) {
        this.storedFileRepository = storedFileRepository;
        this.storageLocation = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload storage directory at " + this.storageLocation, e);
        }
    }

    public StoredFile storeFile(MultipartFile file, String category, String ownerId) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }

        String normCategory = (category != null ? category.trim().toLowerCase(Locale.ROOT) : "document");
        boolean isImage = IMAGE_CATEGORIES.contains(normCategory);

        // Size check
        long size = file.getSize();
        if (isImage && size > MAX_IMAGE_SIZE) {
            throw new BadRequestException("Image file size exceeds maximum limit of 5 MB.");
        } else if (size > MAX_DOC_SIZE) {
            throw new BadRequestException("Document file size exceeds maximum limit of 100 MB.");
        }

        // Magic bytes & type validation
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "uploaded_file";
        }
        // Extract plain basename to avoid client path injection
        originalFilename = Paths.get(originalFilename).getFileName().toString();

        byte[] headerBytes = new byte[16];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(headerBytes);
            if (read <= 0) {
                throw new BadRequestException("File is empty or unreadable.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to read file header: " + e.getMessage());
        }

        validateMagicBytes(headerBytes, originalFilename, isImage);

        // Determine public status
        boolean isPublic = PUBLIC_CATEGORIES.contains(normCategory);

        // Store file with UUID name
        String ext = getFileExtension(originalFilename);
        String fileId = UUID.randomUUID().toString();
        String storedFilename = fileId + (ext.isEmpty() ? "" : "." + ext);
        Path targetPath = this.storageLocation.resolve(storedFilename);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write file to disk: " + e.getMessage(), e);
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = isImage ? "image/" + (ext.isEmpty() ? "jpeg" : ext) : "application/octet-stream";
        }

        StoredFile storedFile = new StoredFile(
                fileId,
                originalFilename,
                contentType,
                size,
                normCategory,
                ownerId,
                targetPath.toString(),
                isPublic
        );

        return storedFileRepository.save(storedFile);
    }

    public StoredFile storeRawBytes(byte[] data, String originalName, String category, String contentType, String ownerId) {
        if (data == null || data.length == 0) {
            return null;
        }

        String normCategory = (category != null ? category.trim().toLowerCase(Locale.ROOT) : "document");
        boolean isPublic = PUBLIC_CATEGORIES.contains(normCategory);

        String ext = getFileExtension(originalName);
        String fileId = UUID.randomUUID().toString();
        String storedFilename = fileId + (ext.isEmpty() ? "" : "." + ext);
        Path targetPath = this.storageLocation.resolve(storedFilename);

        try {
            Files.write(targetPath, data);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write raw bytes to disk: " + e.getMessage(), e);
        }

        StoredFile storedFile = new StoredFile(
                fileId,
                originalName,
                contentType != null ? contentType : "application/octet-stream",
                (long) data.length,
                normCategory,
                ownerId,
                targetPath.toString(),
                isPublic
        );

        return storedFileRepository.save(storedFile);
    }

    public StoredFile getFileMetadata(String id) {
        return storedFileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with id: " + id));
    }

    public Resource loadFileAsResource(StoredFile storedFile) {
        try {
            Path filePath = Paths.get(storedFile.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File content not found on disk for id: " + storedFile.getId());
            }
        } catch (Exception e) {
            throw new ResourceNotFoundException("File content not found: " + e.getMessage());
        }
    }

    public void deleteFile(String id) {
        StoredFile storedFile = getFileMetadata(id);
        try {
            Path filePath = Paths.get(storedFile.getStoragePath()).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}
        storedFileRepository.delete(storedFile);
    }

    private void validateMagicBytes(byte[] header, String originalFilename, boolean requireImage) {
        String ext = getFileExtension(originalFilename).toLowerCase(Locale.ROOT);

        boolean isJpg = header.length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
        boolean isPng = header.length >= 4 && (header[0] & 0xFF) == 0x89 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G';
        boolean isWebp = header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';

        boolean isPdf = header.length >= 4 && header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F';
        boolean isZipOrOfficeXml = header.length >= 4 && header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04; // PK..
        boolean isOle2Office = header.length >= 4 && (header[0] & 0xFF) == 0xD0 && (header[1] & 0xFF) == 0xCF && (header[2] & 0xFF) == 0x11 && (header[3] & 0xFF) == 0xE0;

        if (requireImage) {
            if (!isJpg && !isPng && !isWebp) {
                // Allow fallback if extension is jpg/png/webp/gif
                if (!Set.of("jpg", "jpeg", "png", "webp", "gif").contains(ext)) {
                    throw new BadRequestException("Uploaded file header does not match valid image format (JPEG, PNG, WEBP).");
                }
            }
        } else {
            // General document/file validation
            boolean isValidDoc = isPdf || isZipOrOfficeXml || isOle2Office || isJpg || isPng || isWebp
                    || Set.of("pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "json").contains(ext);
            if (!isValidDoc) {
                throw new BadRequestException("Invalid or unsupported file format: " + ext);
            }
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int dotIdx = filename.lastIndexOf('.');
        return (dotIdx >= 0 && dotIdx < filename.length() - 1) ? filename.substring(dotIdx + 1) : "";
    }
}
