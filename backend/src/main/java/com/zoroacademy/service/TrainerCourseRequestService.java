package com.zoroacademy.service;

import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.Notification;
import com.zoroacademy.entity.TrainerCourseRequest;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.CourseRepository;
import com.zoroacademy.repository.TrainerCourseRequestRepository;
import com.zoroacademy.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TrainerCourseRequestService {

    private final TrainerCourseRequestRepository requestRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    public TrainerCourseRequestService(TrainerCourseRequestRepository requestRepository,
                                       CourseRepository courseRepository,
                                       UserRepository userRepository,
                                       NotificationService notificationService,
                                       ActivityLogService activityLogService) {
        this.requestRepository = requestRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public List<TrainerCourseRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<TrainerCourseRequest> getRequestsByTrainer(String trainerIdOrEmail) {
        List<TrainerCourseRequest> list = requestRepository.findByTrainerId(trainerIdOrEmail);
        if (list.isEmpty()) {
            list = requestRepository.findByTrainerEmailIgnoreCase(trainerIdOrEmail);
        }
        return list;
    }

    @Transactional
    public TrainerCourseRequest createRequest(TrainerCourseRequest req) {
        String effectiveTrainerId = req.getTrainerId();
        String effectiveEmail = req.getTrainerEmail();
        String trainerName = req.getTrainerName();

        if (effectiveTrainerId != null && effectiveTrainerId.contains("@")) {
            effectiveEmail = effectiveTrainerId;
            Optional<User> uOpt = userRepository.findByEmailIgnoreCase(effectiveEmail);
            if (uOpt.isPresent()) {
                effectiveTrainerId = uOpt.get().getId();
                trainerName = uOpt.get().getName();
            }
        } else if (effectiveEmail != null && (effectiveTrainerId == null || effectiveTrainerId.isBlank())) {
            Optional<User> uOpt = userRepository.findByEmailIgnoreCase(effectiveEmail);
            if (uOpt.isPresent()) {
                effectiveTrainerId = uOpt.get().getId();
                trainerName = uOpt.get().getName();
            }
        } else if (effectiveTrainerId != null) {
            Optional<User> uOpt = userRepository.findById(effectiveTrainerId);
            if (uOpt.isPresent()) {
                effectiveEmail = uOpt.get().getEmail();
                if (trainerName == null || trainerName.isBlank()) {
                    trainerName = uOpt.get().getName();
                }
            }
        }

        if (effectiveTrainerId == null || effectiveTrainerId.isBlank()) {
            throw new IllegalArgumentException("Trainer ID or email is required");
        }

        Course course = courseRepository.findById(req.getCourseId())
                .or(() -> courseRepository.findByTitleIgnoreCase(req.getCourseTitle()))
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + req.getCourseId()));

        // Check if trainer is already assigned
        if (course.getTrainerId() != null && course.getTrainerId().equals(effectiveTrainerId)) {
            throw new ConflictException("You are already the assigned trainer for this course");
        }

        // Check if pending request exists
        Optional<TrainerCourseRequest> pending = requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase(
                effectiveTrainerId, course.getId(), "Pending");
        if (pending.isPresent()) {
            return pending.get();
        }

        TrainerCourseRequest newReq = TrainerCourseRequest.builder()
                .id("tcr_" + UUID.randomUUID())
                .trainerId(effectiveTrainerId)
                .trainerName(trainerName != null ? trainerName : "Trainer")
                .trainerEmail(effectiveEmail != null ? effectiveEmail : "")
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .status("Pending")
                .requestDate(LocalDate.now().toString())
                .build();

        newReq = requestRepository.save(newReq);

        activityLogService.logAction(effectiveTrainerId, trainerName, "TRAINER_COURSE_REQUEST",
                "Trainer requested access to course: " + course.getTitle(), "System");

        return newReq;
    }

    @Transactional
    public TrainerCourseRequest updateStatus(String requestId, String status) {
        TrainerCourseRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Trainer course request not found: " + requestId));

        req.setStatus(status);

        if ("Approved".equalsIgnoreCase(status)) {
            courseRepository.findById(req.getCourseId()).ifPresent(course -> {
                course.setTrainerId(req.getTrainerId());
                course.setAssignedTrainer(req.getTrainerName());
                courseRepository.save(course);
            });

            notificationService.createNotification(Notification.builder()
                    .id("notif_" + UUID.randomUUID())
                    .recipientId(req.getTrainerId())
                    .recipientRole("TRAINER")
                    .title("Course Access Approved")
                    .message("Your request to lead course '" + req.getCourseTitle() + "' has been approved by the Admin.")
                    .readStatus(false)
                    .build());

            activityLogService.logAction("ADMIN", "Admin", "TRAINER_COURSE_APPROVED",
                    "Approved trainer " + req.getTrainerName() + " for course " + req.getCourseTitle(), "System");
        } else if ("Rejected".equalsIgnoreCase(status)) {
            notificationService.createNotification(Notification.builder()
                    .id("notif_" + UUID.randomUUID())
                    .recipientId(req.getTrainerId())
                    .recipientRole("TRAINER")
                    .title("Course Access Rejected")
                    .message("Your request to lead course '" + req.getCourseTitle() + "' was not approved.")
                    .readStatus(false)
                    .build());

            activityLogService.logAction("ADMIN", "Admin", "TRAINER_COURSE_REJECTED",
                    "Rejected trainer " + req.getTrainerName() + " for course " + req.getCourseTitle(), "System");
        }

        return requestRepository.save(req);
    }
}
