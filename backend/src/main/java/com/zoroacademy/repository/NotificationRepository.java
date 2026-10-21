package com.zoroacademy.repository;

import com.zoroacademy.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByRecipientRoleIgnoreCaseOrRecipientRoleIgnoreCase(String role1, String role2);
    List<Notification> findByRecipientId(String recipientId);
    List<Notification> findByRecipientIdIgnoreCase(String recipientId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff AND n.readStatus = true")
    int deleteOldReadNotifications(@Param("cutoff") LocalDateTime cutoff);

    boolean existsByRecipientRoleIgnoreCaseAndTitleAndMessageContaining(String recipientRole, String title, String messagePart);
}
