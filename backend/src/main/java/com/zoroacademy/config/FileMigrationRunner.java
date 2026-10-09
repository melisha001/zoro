package com.zoroacademy.config;

import com.zoroacademy.entity.StoredFile;
import com.zoroacademy.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
public class FileMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(FileMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;
    private final FileStorageService fileStorageService;

    public FileMigrationRunner(JdbcTemplate jdbcTemplate, FileStorageService fileStorageService) {
        this.jdbcTemplate = jdbcTemplate;
        this.fileStorageService = fileStorageService;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting one-time file storage data migration scan for data: and blob: URLs...");

        String[][] targets = {
                {"users", "avatar", "avatar"},
                {"courses", "thumbnail", "thumbnail"},
                {"competitions", "banner_url", "banner"},
                {"competitions", "rules_pdf_url", "document"},
                {"competitions", "registration_form_url", "document"},
                {"course_contents", "thumbnail", "thumbnail"},
                {"course_contents", "notes_file_url", "notes"},
                {"course_contents", "worksheet_file_url", "worksheet"},
                {"course_contents", "assignment_file_url", "assignment"},
                {"course_contents", "assessment_file_url", "assignment"},
                {"assignments", "attachment_url", "attachment"},
                {"submissions", "submission_file_url", "submission"},
                {"doubts", "attachment_url", "attachment"},
                {"schedules", "attachment_url", "attachment"}
        };

        for (String[] target : targets) {
            String table = target[0];
            String column = target[1];
            String category = target[2];
            migrateTableColumn(table, column, category);
        }

        log.info("Completed file storage data migration scan.");
    }

    private void migrateTableColumn(String table, String column, String category) {
        try {
            // 1. Clear blob: URLs
            String clearBlobSql = "UPDATE " + table + " SET " + column + " = NULL WHERE " + column + " LIKE 'blob:%'";
            int clearedBlobCount = jdbcTemplate.update(clearBlobSql);
            if (clearedBlobCount > 0) {
                log.warn("Cleared {} unrecoverable 'blob:' URLs in {}.{}", clearedBlobCount, table, column);
            }

            // 2. Decode & replace data: URIs
            String selectDataSql = "SELECT id, " + column + " FROM " + table + " WHERE " + column + " LIKE 'data:%'";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(selectDataSql);

            int migratedCount = 0;
            for (Map<String, Object> row : rows) {
                String id = String.valueOf(row.get("id"));
                String dataUri = String.valueOf(row.get(column));

                try {
                    StoredFile storedFile = convertDataUriToStoredFile(dataUri, id, category);
                    if (storedFile != null) {
                        String newUrl = "/api/files/" + storedFile.getId();
                        String updateSql = "UPDATE " + table + " SET " + column + " = ? WHERE id = ?";
                        jdbcTemplate.update(updateSql, newUrl, id);
                        migratedCount++;
                    }
                } catch (Exception e) {
                    log.error("Failed to migrate data: URI in {}.{} for id {}: {}", table, column, id, e.getMessage());
                }
            }

            if (migratedCount > 0) {
                log.info("Migrated {} 'data:' URIs in {}.{} to stored_files", migratedCount, table, column);
            }
        } catch (Exception e) {
            // Table or column may not exist in specific test schemas; log debug
            log.debug("Skipping migration for {}.{}: {}", table, column, e.getMessage());
        }
    }

    private StoredFile convertDataUriToStoredFile(String dataUri, String entityId, String category) {
        if (dataUri == null || !dataUri.startsWith("data:")) {
            return null;
        }

        int commaIdx = dataUri.indexOf(',');
        if (commaIdx < 0) {
            return null;
        }

        String metadata = dataUri.substring(5, commaIdx); // e.g. "image/png;base64"
        String base64Data = dataUri.substring(commaIdx + 1);

        String contentType = "application/octet-stream";
        if (metadata.contains(";")) {
            contentType = metadata.substring(0, metadata.indexOf(';'));
        } else if (!metadata.isBlank()) {
            contentType = metadata;
        }

        byte[] decodedBytes;
        try {
            decodedBytes = Base64.getDecoder().decode(base64Data.trim());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid Base64 string for entity id {}: {}", entityId, e.getMessage());
            return null;
        }

        String ext = getExtFromContentType(contentType);
        String originalName = category + "_" + entityId + "." + ext;

        return fileStorageService.storeRawBytes(decodedBytes, originalName, category, contentType, null);
    }

    private String getExtFromContentType(String contentType) {
        if (contentType == null) return "bin";
        String lower = contentType.toLowerCase();
        if (lower.contains("png")) return "png";
        if (lower.contains("jpeg") || lower.contains("jpg")) return "jpg";
        if (lower.contains("webp")) return "webp";
        if (lower.contains("gif")) return "gif";
        if (lower.contains("pdf")) return "pdf";
        if (lower.contains("word") || lower.contains("docx")) return "docx";
        if (lower.contains("excel") || lower.contains("xlsx")) return "xlsx";
        if (lower.contains("text")) return "txt";
        return "bin";
    }
}
