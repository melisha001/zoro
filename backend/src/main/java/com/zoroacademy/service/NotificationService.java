package com.zoroacademy.service;

import com.zoroacademy.entity.Notification;
import com.zoroacademy.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }


    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForRoleOrUser(String role, String userId) {
        if (userId != null && !userId.isBlank()) {
            return notificationRepository.findByRecipientId(userId);
        }
        return notificationRepository.findByRecipientRoleIgnoreCaseOrRecipientRoleIgnoreCase("ALL", role != null ? role : "ALL");
    }

    @Transactional
    public Notification createNotification(Notification notification) {
        if (notification.getId() == null || notification.getId().isBlank()) {
            notification.setId("notif_" + java.util.UUID.randomUUID());
        }
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAsRead(String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setReadStatus(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }
}
