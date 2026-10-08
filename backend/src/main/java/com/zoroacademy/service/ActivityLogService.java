package com.zoroacademy.service;

import com.zoroacademy.entity.ActivityLog;
import com.zoroacademy.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }


    @Transactional(readOnly = true)
    public List<ActivityLog> getRecentLogs() {
        return activityLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public ActivityLog logAction(String userId, String userName, String action, String details, String ipAddress) {
        ActivityLog log = ActivityLog.builder()
                .id("log_" + java.util.UUID.randomUUID())
                .userId(userId)
                .userName(userName)
                .action(action)
                .details(details)
                .ipAddress(ipAddress)
                .build();
        return activityLogRepository.save(log);
    }
}
