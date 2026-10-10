package com.zoroacademy.service;

import com.zoroacademy.entity.StoredFile;
import com.zoroacademy.exception.BadRequestException;
import com.zoroacademy.exception.ResourceNotFoundException;
import com.zoroacademy.repository.StoredFileRepository;
import com.zoroacademy.service.storage.StorageProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.*;

@Service
public class FileStorageService {

    private final StoredFileRepository storedFileRepository;
    private final StorageProvider storageProvider;
    private final BunnyTokenService bunnyTokenService;

    @Value("${jwt.secret:defaultSecretForFileLinksOnlyNotForJwtAuthKey123}")
    private String linkSecret;

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final long MAX_DOC_SIZE = 100 * 1024 * 1024; // 100 MB

    private static final Set<String> IMAGE_CATEGORIES = Set.of(
            "image", "images", "avatar", "thumbnail", "banner", "profile"
    );

    private static final Set<String> PUBLIC_CATEGORIES = Set.of(
            "avatar", "thumbnail", "banner", "profile", "public", "image", "images"
    );

    @Autowired
    public FileStorageService(
            StoredFileRepository storedFileRepository,
            StorageProvider storageProvider,
            @Autowired(required = false) BunnyTokenService bunnyTokenService
    ) {
        this.storedFileRepository = storedFileRepository;
        this.storageProvider = storageProvider;
        this.bunnyTokenService = bunnyTokenService;
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

        // Determine public status and partition storage path
        boolean isPublic = PUBLIC_CATEGORIES.contains(normCategory);
        String prefix = isPublic ? "public" : "private";

        String ext = getFileExtension(originalFilename);
        String fileId = UUID.randomUUID().toString();
        String storedFilename = fileId + (ext.isEmpty() ? "" : "." + ext);
        String storagePath = prefix + "/" + normCategory + "/" + storedFilename;

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = isImage ? "image/" + (ext.isEmpty() ? "jpeg" : ext) : "application/octet-stream";
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file bytes: " + e.getMessage(), e);
        }

        storageProvider.store(storagePath, fileBytes, contentType);

        StoredFile storedFile = new StoredFile(
                fileId,
                originalFilename,
                contentType,
                size,
                normCategory,
                ownerId,
                storagePath,
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
        String prefix = isPublic ? "public" : "private";

        String ext = getFileExtension(originalName);
        String fileId = UUID.randomUUID().toString();
        String storedFilename = fileId + (ext.isEmpty() ? "" : "." + ext);
        String storagePath = prefix + "/" + normCategory + "/" + storedFilename;

        String effectiveContentType = (contentType != null && !contentType.isBlank()) ? contentType : "application/octet-stream";

        storageProvider.store(storagePath, data, effectiveContentType);

        StoredFile storedFile = new StoredFile(
                fileId,
                originalName,
                effectiveContentType,
                (long) data.length,
                normCategory,
                ownerId,
                storagePath,
                isPublic
        );

        return storedFileRepository.save(storedFile);
    }

    public StoredFile getFileMetadata(String id) {
        return storedFileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with id: " + id));
    }

    public Resource loadFileAsResource(StoredFile storedFile) {
        return storageProvider.loadAsResource(storedFile.getStoragePath());
    }

    public void deleteFile(String id) {
        StoredFile storedFile = getFileMetadata(id);
        storageProvider.delete(storedFile.getStoragePath());
        storedFileRepository.delete(storedFile);
    }

    /**
     * Resolves the primary URL for a stored file.
     * Public files return CDN URL if available, else backend relative endpoint /api/files/{id}.
     * Private files return backend relative endpoint /api/files/{id}.
     */
    public String getFileUrl(StoredFile storedFile) {
        if (storedFile == null) return null;
        if (Boolean.TRUE.equals(storedFile.getIsPublic())) {
            String publicUrl = storageProvider.getPublicUrl(storedFile.getStoragePath());
            if (publicUrl != null && !publicUrl.isBlank()) {
                return publicUrl;
            }
        }
        return "/api/files/" + storedFile.getId();
    }

    /**
     * Generates a signed access link for private files with time-based expiration.
     */
    public Map<String, Object> generateFileLink(StoredFile storedFile, long expirationSeconds) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", storedFile.getId());
        result.put("name", storedFile.getOriginalName());
        result.put("contentType", storedFile.getContentType());
        result.put("size", storedFile.getSizeBytes());
        result.put("isPublic", storedFile.getIsPublic());

        if (Boolean.TRUE.equals(storedFile.getIsPublic())) {
            result.put("url", getFileUrl(storedFile));
            result.put("expiresAt", 0L);
            return result;
        }

        long expiresAt = (System.currentTimeMillis() / 1000) + expirationSeconds;
        String publicCdn = storageProvider.getPublicUrl(storedFile.getStoragePath());
        if (publicCdn != null && bunnyTokenService != null) {
            String token = bunnyTokenService.generateToken(storedFile.getStoragePath(), expiresAt);
            result.put("url", publicCdn + "?token=" + token + "&expires=" + expiresAt);
            result.put("expiresAt", expiresAt);
            return result;
        }

        // Direct backend signed link
        String token = generateInternalToken(storedFile.getId(), expiresAt);
        result.put("url", "/api/files/" + storedFile.getId() + "?token=" + token + "&expires=" + expiresAt);
        result.put("expiresAt", expiresAt);
        return result;
    }

    public boolean validateInternalToken(String fileId, String token, Long expires) {
        if (fileId == null || token == null || expires == null) return false;
        long now = System.currentTimeMillis() / 1000;
        if (now > expires) return false;

        String expected = generateInternalToken(fileId, expires);
        return expected.equals(token);
    }

    private String generateInternalToken(String fileId, long expires) {
        try {
            String data = fileId + ":" + expires;
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(linkSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] hash = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error calculating internal link token", e);
        }
    }

    private void validateMagicBytes(byte[] header, String originalFilename, boolean requireImage) {
        String ext = getFileExtension(originalFilename).toLowerCase(Locale.ROOT);

        boolean isJpg = header.length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
        boolean isPng = header.length >= 4 && (header[0] & 0xFF) == 0x89 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G';
        boolean isWebp = header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';

        boolean isPdf = header.length >= 4 && header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F';
        boolean isZipOrOfficeXml = header.length >= 4 && header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04;
        boolean isOle2Office = header.length >= 4 && (header[0] & 0xFF) == 0xD0 && (header[1] & 0xFF) == 0xCF && (header[2] & 0xFF) == 0x11 && (header[3] & 0xFF) == 0xE0;

        if (requireImage) {
            if (!isJpg && !isPng && !isWebp) {
                if (!Set.of("jpg", "jpeg", "png", "webp", "gif").contains(ext)) {
                    throw new BadRequestException("Uploaded file header does not match valid image format (JPEG, PNG, WEBP).");
                }
            }
        } else {
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
