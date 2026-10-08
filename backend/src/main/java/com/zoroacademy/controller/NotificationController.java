package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Notification;
import com.zoroacademy.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }


    @GetMapping
    public ApiResponse<List<Notification>> getNotifications(@RequestParam(required = false) String role,
                                                           @RequestParam(required = false) String userId) {
        return ApiResponse.ok(notificationService.getNotificationsForRoleOrUser(role, userId));
    }

    @PostMapping
    public ApiResponse<Notification> createNotification(@RequestBody Notification notification) {
        return ApiResponse.ok(notificationService.createNotification(notification), "Notification created");
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Boolean> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ApiResponse.ok(true, "Marked as read");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ApiResponse.ok(true, "Notification deleted");
    }
}
