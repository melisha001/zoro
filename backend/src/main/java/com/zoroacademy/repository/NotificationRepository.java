package com.zoroacademy.repository;

import com.zoroacademy.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByRecipientRoleIgnoreCaseOrRecipientRoleIgnoreCase(String role1, String role2);
    List<Notification> findByRecipientId(String recipientId);
}
