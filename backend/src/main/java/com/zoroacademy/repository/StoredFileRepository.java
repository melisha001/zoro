package com.zoroacademy.repository;

import com.zoroacademy.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, String> {
    Optional<StoredFile> findFirstBySha256HashAndOwnerId(String sha256Hash, String ownerId);
    Optional<StoredFile> findFirstBySha256Hash(String sha256Hash);
    long countByStoragePath(String storagePath);
    List<StoredFile> findByCreatedAtBefore(OffsetDateTime cutoff);
}
