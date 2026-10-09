package com.zoroacademy.service;

import com.zoroacademy.dto.TrainerDependencyDto;
import com.zoroacademy.dto.TrainerReplacementRequest;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.util.PhoneValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentCourseBatchRepository studentCourseBatchRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final BatchRepository batchRepository;
    private final ScheduleRepository scheduleRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final EnrollmentService enrollmentService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final DoubtRepository doubtRepository;
    private final NotificationRepository notificationRepository;
    private final StudentProgressRepository studentProgressRepository;
    private final StudentModuleProgressRepository studentModuleProgressRepository;
    private final EnrollmentRequestRepository enrollmentRequestRepository;
    private final CompetitionRegistrationRepository competitionRegistrationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       StudentCourseBatchRepository studentCourseBatchRepository,
                       EnrollmentRepository enrollmentRepository,
                       CourseRepository courseRepository,
                       BatchRepository batchRepository,
                       ScheduleRepository scheduleRepository,
                       StudentFeeRepository studentFeeRepository,
                       EnrollmentService enrollmentService,
                       NotificationService notificationService,
                       ActivityLogService activityLogService,
                       AttendanceRecordRepository attendanceRecordRepository,
                       AssignmentSubmissionRepository assignmentSubmissionRepository,
                       DoubtRepository doubtRepository,
                       NotificationRepository notificationRepository,
                       StudentProgressRepository studentProgressRepository,
                       StudentModuleProgressRepository studentModuleProgressRepository,
                       EnrollmentRequestRepository enrollmentRequestRepository,
                       CompetitionRegistrationRepository competitionRegistrationRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
        this.scheduleRepository = scheduleRepository;
        this.studentFeeRepository = studentFeeRepository;
        this.enrollmentService = enrollmentService;
        this.notificationService = notificationService;
        this.activityLogService = activityLogService;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.doubtRepository = doubtRepository;
        this.notificationRepository = notificationRepository;
        this.studentProgressRepository = studentProgressRepository;
        this.studentModuleProgressRepository = studentModuleProgressRepository;
        this.enrollmentRequestRepository = enrollmentRequestRepository;
        this.competitionRegistrationRepository = competitionRegistrationRepository;
    }

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       StudentCourseBatchRepository studentCourseBatchRepository,
                       EnrollmentRepository enrollmentRepository,
                       CourseRepository courseRepository,
                       BatchRepository batchRepository,
                       ScheduleRepository scheduleRepository,
                       StudentFeeRepository studentFeeRepository,
                       EnrollmentService enrollmentService,
                       NotificationService notificationService,
                       ActivityLogService activityLogService) {
        this(userRepository, passwordEncoder, studentCourseBatchRepository, enrollmentRepository,
             courseRepository, batchRepository, scheduleRepository, studentFeeRepository,
             enrollmentService, notificationService, activityLogService,
             null, null, null, null, null, null, null, null);
    }

    private UserDto convertUserToDto(User user) {
        if (user == null) return null;
        UserDto dto = UserDto.fromEntity(user);
        if ("STUDENT".equalsIgnoreCase(user.getRole())) {
            List<StudentCourseBatch> scbs = studentCourseBatchRepository.findByStudentId(user.getId());
            if (scbs != null && !scbs.isEmpty()) {
                List<Map<String, Object>> list = scbs.stream().map(scb -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("course", scb.getCourseName());
                    map.put("courseId", scb.getCourseId());
                    map.put("batch", scb.getBatchName());
                    map.put("batchId", scb.getBatchId());
                    return map;
                }).collect(Collectors.toList());
                dto.setCourseBatches(list);

                String readable = list.stream()
                        .map(m -> m.get("course") + " (" + m.get("batch") + ")")
                        .collect(Collectors.joining(", "));
                dto.setCourse(readable);
            }
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getStudents() {
        return userRepository.findByRoleIgnoreCase("STUDENT")
                .stream().map(this::convertUserToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getTrainers() {
        return userRepository.findByRoleIgnoreCase("TRAINER")
                .stream().map(UserDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream().map(this::convertUserToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(String id) {
        User user = userRepository.findById(id)
                .or(() -> userRepository.findByEmailIgnoreCase(id))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        return convertUserToDto(user);
    }

    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @Transactional
    public UserDto saveStudent(UserDto dto) {
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException("Student email is required");
        }
        final String cleanEmail = dto.getEmail().trim().toLowerCase();
        final String cleanUsername = dto.getUsername() != null && !dto.getUsername().isBlank()
                ? dto.getUsername().trim()
                : cleanEmail;

        final String userId = (dto.getId() != null && !dto.getId().isBlank()) 
                ? dto.getId() 
                : "std_" + UUID.randomUUID().toString();

        // Prevent duplicate email with another account
        userRepository.findByEmailIgnoreCase(cleanEmail).ifPresent(existing -> {
            if (existing.getId() == null || !existing.getId().equals(userId)) {
                throw new com.zoroacademy.exception.ConflictException("Email is already registered: " + cleanEmail);
            }
        });

        // Prevent duplicate username with another account
        userRepository.findByUsernameIgnoreCase(cleanUsername).ifPresent(existing -> {
            if (existing.getId() == null || !existing.getId().equals(userId)) {
                throw new com.zoroacademy.exception.ConflictException("Username is already taken: " + cleanUsername);
            }
        });

        User user = userRepository.findById(userId).orElseGet(() -> User.builder().id(userId).role("STUDENT").build());
        user.setEmail(cleanEmail);
        user.setName(dto.getName() != null ? dto.getName().trim() : "Student");
        user.setUsername(cleanUsername);

        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            PhoneValidator.validate(dto.getPhone());
            user.setPhone(PhoneValidator.sanitize(dto.getPhone()));
        } else {
            user.setPhone(null);
        }

        user.setAddress(dto.getAddress());
        user.setJoinedOn(dto.getJoinedOn());
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : "Active");
        user.setCourse(dto.getCourse());

        String generatedTempPassword = null;
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (dto.getPassword().length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters long");
            }
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else if (user.getPassword() == null || user.getPassword().isBlank()) {
            generatedTempPassword = generateTemporaryPassword();
            user.setPassword(passwordEncoder.encode(generatedTempPassword));
        }

        user = userRepository.save(user);


        // Relational course-batch & enrollment synchronization via EnrollmentService
        if (dto.getCourseBatches() != null) {
            Set<String> previousCourseIds = enrollmentRepository.findByStudentId(userId).stream()
                    .filter(e -> "Active".equalsIgnoreCase(e.getStatus()))
                    .map(Enrollment::getCourseId)
                    .collect(Collectors.toSet());
            Set<String> newCourseIds = new HashSet<>();
            List<String> readableEntries = new ArrayList<>();

            for (Map<String, Object> item : dto.getCourseBatches()) {
                String rawCName = item.get("course") != null ? item.get("course").toString().trim() : "";
                String rawCId = item.get("courseId") != null ? item.get("courseId").toString().trim() : null;
                String rawBName = item.get("batch") != null ? item.get("batch").toString().trim() : "";
                String rawBId = item.get("batchId") != null ? item.get("batchId").toString().trim() : null;

                String resolvedCId = rawCId;
                String resolvedCName = rawCName;

                if ((resolvedCId == null || resolvedCId.isBlank()) && !resolvedCName.isBlank()) {
                    resolvedCId = courseRepository.findByTitleIgnoreCase(resolvedCName).map(Course::getId).orElse(null);
                } else if (resolvedCId != null && !resolvedCId.isBlank() && resolvedCName.isBlank()) {
                    resolvedCName = courseRepository.findById(resolvedCId).map(Course::getTitle).orElse(resolvedCId);
                }

                String resolvedBId = rawBId;
                String resolvedBName = rawBName;

                if ((resolvedBId == null || resolvedBId.isBlank()) && !resolvedBName.isBlank()) {
                    final String matchBName = resolvedBName;
                    if (resolvedCId != null) {
                        resolvedBId = batchRepository.findByNameIgnoreCaseAndCourseId(matchBName, resolvedCId)
                                .map(Batch::getId).orElse(null);
                    }
                    if (resolvedBId == null && resolvedCName != null) {
                        resolvedBId = batchRepository.findByNameIgnoreCaseAndCourseNameIgnoreCase(matchBName, resolvedCName)
                                .map(Batch::getId).orElse(null);
                    }
                } else if (resolvedBId != null && !resolvedBId.isBlank() && resolvedBName.isBlank()) {
                    resolvedBName = batchRepository.findById(resolvedBId).map(Batch::getName).orElse(resolvedBId);
                }

                if (resolvedCId != null && !resolvedCId.isBlank()) {
                    newCourseIds.add(resolvedCId);
                    enrollmentService.enroll(userId, dto.getEmail(), resolvedCId, resolvedBId != null ? resolvedBId : resolvedBName);
                    readableEntries.add(resolvedCName + (!resolvedBName.isBlank() ? " (" + resolvedBName + ")" : ""));
                }
            }

            // Deactivate any courses from which the student was removed
            for (String oldCourseId : previousCourseIds) {
                if (!newCourseIds.contains(oldCourseId)) {
                    enrollmentService.deactivateEnrollment(userId, oldCourseId);
                }
            }

            if (!readableEntries.isEmpty()) {
                user.setCourse(String.join(", ", readableEntries));
                userRepository.save(user);
            }
        }

        UserDto resultDto = convertUserToDto(user);
        if (generatedTempPassword != null) {
            resultDto.setTemporaryPassword(generatedTempPassword);
        }
        return resultDto;
    }

    @Transactional
    public UserDto saveTrainer(UserDto dto) {
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException("Trainer email is required");
        }
        final String cleanEmail = dto.getEmail().trim().toLowerCase();
        final String cleanUsername = dto.getUsername() != null && !dto.getUsername().isBlank()
                ? dto.getUsername().trim()
                : cleanEmail;

        final String userId = (dto.getId() != null && !dto.getId().isBlank()) 
                ? dto.getId() 
                : "trn_" + UUID.randomUUID().toString();

        // Prevent duplicate email with another account
        userRepository.findByEmailIgnoreCase(cleanEmail).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new com.zoroacademy.exception.ConflictException("Email is already registered: " + cleanEmail);
            }
        });

        // Prevent duplicate username with another account
        userRepository.findByUsernameIgnoreCase(cleanUsername).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new com.zoroacademy.exception.ConflictException("Username is already taken: " + cleanUsername);
            }
        });

        User user = userRepository.findById(userId).orElseGet(() -> User.builder().id(userId).role("TRAINER").build());
        user.setEmail(cleanEmail);
        user.setName(dto.getName() != null ? dto.getName().trim() : "Trainer");
        user.setUsername(cleanUsername);

        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            PhoneValidator.validate(dto.getPhone());
            user.setPhone(PhoneValidator.sanitize(dto.getPhone()));
        } else {
            user.setPhone(null);
        }

        user.setAddress(dto.getAddress());
        user.setJoinedOn(dto.getJoinedOn());
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : "Active");
        user.setSpecialty(dto.getSpecialty());
        user.setCode(dto.getCode());
        user.setSalaryAmount(dto.getSalaryAmount());
        user.setSalaryCreditDate(dto.getSalaryCreditDate());

        String generatedTempPassword = null;
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (dto.getPassword().length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters long");
            }
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else if (user.getPassword() == null || user.getPassword().isBlank()) {
            generatedTempPassword = generateTemporaryPassword();
            user.setPassword(passwordEncoder.encode(generatedTempPassword));
        }

        user = userRepository.save(user);
        UserDto resultDto = UserDto.fromEntity(user);
        if (generatedTempPassword != null) {
            resultDto.setTemporaryPassword(generatedTempPassword);
        }
        return resultDto;
    }


    @Transactional(readOnly = true)
    public TrainerDependencyDto getTrainerDependencies(String trainerId) {
        User trainer = userRepository.findById(trainerId)
                .or(() -> userRepository.findByEmailIgnoreCase(trainerId))
                .orElse(null);

        String tName = trainer != null ? trainer.getName() : null;
        String tId = trainer != null ? trainer.getId() : trainerId;

        List<Course> courses = courseRepository.findByTrainerIdOrAssignedTrainerIgnoreCase(tId, tName != null ? tName : "");
        List<Batch> batches = batchRepository.findByTrainerIdOrTrainerNameIgnoreCase(tId, tName != null ? tName : "");
        List<Schedule> schedules = scheduleRepository.findByTrainerIdOrTrainerIgnoreCaseOrderByDateAsc(tId, tName != null ? tName : "");

        List<Map<String, String>> courseMaps = courses.stream().map(c -> {
            Map<String, String> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("title", c.getTitle());
            m.put("category", c.getCategory());
            return m;
        }).collect(Collectors.toList());

        List<Map<String, String>> batchMaps = batches.stream().map(b -> {
            Map<String, String> m = new HashMap<>();
            m.put("id", b.getId());
            m.put("name", b.getName());
            m.put("courseName", b.getCourseName());
            return m;
        }).collect(Collectors.toList());

        List<Map<String, String>> schedMaps = schedules.stream().map(s -> {
            Map<String, String> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("title", s.getTitle());
            m.put("course", s.getCourse());
            m.put("batch", s.getBatch());
            m.put("date", s.getDate());
            return m;
        }).collect(Collectors.toList());

        boolean hasDeps = !courses.isEmpty() || !batches.isEmpty() || !schedules.isEmpty();

        return new TrainerDependencyDto(tId, tName, hasDeps, courses.size(), batches.size(), schedules.size(),
                courseMaps, batchMaps, schedMaps);
    }

    @Transactional
    public boolean replaceTrainer(String oldTrainerId, TrainerReplacementRequest request) {
        User oldTrainer = userRepository.findById(oldTrainerId)
                .or(() -> userRepository.findByEmailIgnoreCase(oldTrainerId))
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found: " + oldTrainerId));

        if (request.getNewTrainerId() == null || request.getNewTrainerId().isBlank()) {
            throw new IllegalArgumentException("New replacement trainer ID is required");
        }

        User newTrainer = userRepository.findById(request.getNewTrainerId())
                .or(() -> userRepository.findByEmailIgnoreCase(request.getNewTrainerId()))
                .orElseThrow(() -> new IllegalArgumentException("Replacement trainer not found: " + request.getNewTrainerId()));

        String oldId = oldTrainer.getId();
        String oldName = oldTrainer.getName();
        String newId = newTrainer.getId();
        String newName = newTrainer.getName();

        // 1. Reassign Courses
        List<Course> courses = courseRepository.findByTrainerIdOrAssignedTrainerIgnoreCase(oldId, oldName != null ? oldName : "");
        for (Course c : courses) {
            c.setTrainerId(newId);
            c.setAssignedTrainer(newName);
            courseRepository.save(c);
        }

        // 2. Reassign Batches
        List<Batch> batches = batchRepository.findByTrainerIdOrTrainerNameIgnoreCase(oldId, oldName != null ? oldName : "");
        for (Batch b : batches) {
            b.setTrainerId(newId);
            b.setTrainerName(newName);
            batchRepository.save(b);
        }

        // 3. Reassign Schedules
        List<Schedule> schedules = scheduleRepository.findByTrainerIdOrTrainerIgnoreCaseOrderByDateAsc(oldId, oldName != null ? oldName : "");
        for (Schedule s : schedules) {
            s.setTrainerId(newId);
            s.setTrainer(newName);
            scheduleRepository.save(s);
        }

        // 4. Handle requested action on old trainer
        if ("DELETE".equalsIgnoreCase(request.getAction())) {
            userRepository.delete(oldTrainer);
        } else {
            oldTrainer.setStatus("Inactive");
            userRepository.save(oldTrainer);
        }

        activityLogService.logAction(newId, newName, "TRAINER_REPLACED",
                "Replaced trainer " + oldName + " with " + newName + " (" + courses.size() + " courses, " + batches.size() + " batches, " + schedules.size() + " schedules)", "System");

        notificationService.createNotification(Notification.builder()
                .id("notif_" + UUID.randomUUID())
                .recipientId(newId)
                .recipientRole("TRAINER")
                .title("Assigned to Replacement Courses & Batches")
                .message("You have been assigned to replace " + oldName + " across " + courses.size() + " courses and " + batches.size() + " batches.")
                .readStatus(false)
                .build());

        return true;
    }

    @Transactional
    public boolean updatePassword(String userIdOrEmail, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters long");
        }

        User user = userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findByEmailIgnoreCase(userIdOrEmail))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userIdOrEmail));

        // Strictly verify current password using passwordEncoder
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false;
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }

    @Transactional
    public UserDto updateUserStatus(String id, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        User user = userRepository.findById(id)
                .or(() -> userRepository.findByEmailIgnoreCase(id))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        user.setStatus(status.trim());
        user = userRepository.save(user);
        return convertUserToDto(user);
    }

    @Transactional
    public void deleteUser(String id) {
        deleteUser(id, false);
    }

    @Transactional
    public void deleteUser(String id, boolean force) {
        User user = userRepository.findById(id)
                .or(() -> userRepository.findByEmailIgnoreCase(id))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            long adminCount = userRepository.countByRoleIgnoreCase("ADMIN");
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot delete the last remaining administrator account");
            }
        }

        if (!force) {
            if ("TRAINER".equalsIgnoreCase(user.getRole())) {
                TrainerDependencyDto dep = getTrainerDependencies(user.getId());
                if (dep.isHasDependencies()) {
                    throw new com.zoroacademy.exception.ConflictException("Cannot delete trainer with " + dep.getCourseCount() + " assigned courses, " + dep.getBatchCount() + " batches, and " + dep.getScheduleCount() + " schedules. Reassign them first.");
                }
            }

            if ("STUDENT".equalsIgnoreCase(user.getRole())) {
                List<Enrollment> activeEnrs = enrollmentRepository.findByStudentId(user.getId()).stream()
                        .filter(e -> "Active".equalsIgnoreCase(e.getStatus()))
                        .toList();
                if (!activeEnrs.isEmpty()) {
                    throw new com.zoroacademy.exception.ConflictException("Cannot delete student with " + activeEnrs.size() + " active course enrollments.");
                }
                List<StudentFee> pendingFees = studentFeeRepository.findByStudentId(user.getId()).stream()
                        .filter(f -> "Pending".equalsIgnoreCase(f.getStatus()))
                        .toList();
                if (!pendingFees.isEmpty()) {
                    throw new com.zoroacademy.exception.ConflictException("Cannot delete student with " + pendingFees.size() + " pending fee records.");
                }
            }
        }

        // Cascaded removal of student's dependents in ONE transaction
        if (attendanceRecordRepository != null) {
            attendanceRecordRepository.deleteAll(attendanceRecordRepository.findByStudentId(user.getId()));
        }
        if (assignmentSubmissionRepository != null) {
            assignmentSubmissionRepository.deleteAll(assignmentSubmissionRepository.findByStudentId(user.getId()));
            if (user.getEmail() != null) {
                assignmentSubmissionRepository.deleteAll(assignmentSubmissionRepository.findByStudentEmailIgnoreCase(user.getEmail()));
            }
        }
        if (doubtRepository != null) {
            doubtRepository.deleteAll(doubtRepository.findByStudentId(user.getId()));
        }
        if (notificationRepository != null) {
            notificationRepository.deleteAll(notificationRepository.findByRecipientId(user.getId()));
        }
        if (studentProgressRepository != null) {
            studentProgressRepository.deleteAll(studentProgressRepository.findByStudentIdIgnoreCase(user.getId()));
        }
        if (studentModuleProgressRepository != null) {
            studentModuleProgressRepository.deleteAll(studentModuleProgressRepository.findByStudentId(user.getId()));
        }
        if (enrollmentRequestRepository != null) {
            enrollmentRequestRepository.deleteAll(enrollmentRequestRepository.findByStudentId(user.getId()));
            if (user.getEmail() != null) {
                enrollmentRequestRepository.deleteAll(enrollmentRequestRepository.findByStudentEmailIgnoreCase(user.getEmail()));
            }
        }
        if (competitionRegistrationRepository != null) {
            competitionRegistrationRepository.deleteAll(competitionRegistrationRepository.findByStudentId(user.getId()));
        }
        if (studentFeeRepository != null) {
            studentFeeRepository.deleteAll(studentFeeRepository.findByStudentId(user.getId()));
        }

        studentCourseBatchRepository.deleteByStudentId(user.getId());
        List<Enrollment> enrs = enrollmentRepository.findByStudentId(user.getId());
        if (enrs != null && !enrs.isEmpty()) {
            enrollmentRepository.deleteAll(enrs);
        }
        if (user.getEmail() != null) {
            List<Enrollment> enrsByEmail = enrollmentRepository.findByStudentEmailIgnoreCase(user.getEmail());
            if (enrsByEmail != null && !enrsByEmail.isEmpty()) {
                enrollmentRepository.deleteAll(enrsByEmail);
            }
        }
        userRepository.delete(user);
    }

}
