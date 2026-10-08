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

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       StudentCourseBatchRepository studentCourseBatchRepository,
                       EnrollmentRepository enrollmentRepository,
                       CourseRepository courseRepository,
                       BatchRepository batchRepository,
                       ScheduleRepository scheduleRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
        this.scheduleRepository = scheduleRepository;
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
                : "std_" + System.currentTimeMillis();

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
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            generatedTempPassword = generateTemporaryPassword();
            user.setPassword(passwordEncoder.encode(generatedTempPassword));
        }

        user = userRepository.save(user);


        // Relational course-batch & enrollment synchronization
        if (dto.getCourseBatches() != null) {
            studentCourseBatchRepository.deleteByStudentId(userId);
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

                final String finalCId = resolvedCId;
                final String finalCName = resolvedCName;

                String resolvedBId = rawBId;
                String resolvedBName = rawBName;

                if ((resolvedBId == null || resolvedBId.isBlank()) && !resolvedBName.isBlank()) {
                    final String matchBName = resolvedBName;
                    resolvedBId = batchRepository.findAll().stream()
                            .filter(b -> b.getName().equalsIgnoreCase(matchBName) &&
                                    (finalCId == null || finalCId.equals(b.getCourseId()) || (finalCName != null && finalCName.equalsIgnoreCase(b.getCourseName()))))
                            .map(Batch::getId)
                            .findFirst().orElse(null);
                } else if (resolvedBId != null && !resolvedBId.isBlank() && resolvedBName.isBlank()) {
                    resolvedBName = batchRepository.findById(resolvedBId).map(Batch::getName).orElse(resolvedBId);
                }

                if (!resolvedCName.isBlank()) {
                    StudentCourseBatch scb = new StudentCourseBatch();
                    scb.setStudentId(userId);
                    scb.setCourseName(resolvedCName);
                    scb.setCourseId(resolvedCId);
                    scb.setBatchName(resolvedBName);
                    scb.setBatchId(resolvedBId);
                    studentCourseBatchRepository.save(scb);

                    readableEntries.add(resolvedCName + (!resolvedBName.isBlank() ? " (" + resolvedBName + ")" : ""));

                    // Synchronize relational Enrollment
                    if (resolvedCId != null && !resolvedCId.isBlank()) {
                        final String enrCourseId = resolvedCId;
                        final String enrCourseTitle = resolvedCName;
                        final String enrBatchName = resolvedBName;
                        final String enrBatchId = resolvedBId;

                        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(userId, enrCourseId)
                                .orElseGet(() -> Enrollment.builder()
                                        .id("enr_" + System.currentTimeMillis() + "_" + Math.abs(enrCourseId.hashCode()))
                                        .studentId(userId)
                                        .studentEmail(dto.getEmail())
                                        .courseId(enrCourseId)
                                        .courseTitle(enrCourseTitle)
                                        .enrolledDate(dto.getJoinedOn() != null ? dto.getJoinedOn() : java.time.LocalDate.now().toString())
                                        .status("Active")
                                        .build());
                        enrollment.setStudentEmail(dto.getEmail());
                        enrollment.setCourseTitle(enrCourseTitle);
                        enrollment.setBatchName(enrBatchName);
                        enrollment.setBatchId(enrBatchId);
                        enrollmentRepository.save(enrollment);
                    }
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
                : "trn_" + System.currentTimeMillis();

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
        if (user.getPassword() == null || user.getPassword().isBlank()) {
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

        List<Course> courses = courseRepository.findAll().stream()
                .filter(c -> (c.getTrainerId() != null && c.getTrainerId().equals(tId)) ||
                        (tName != null && c.getAssignedTrainer() != null && c.getAssignedTrainer().equalsIgnoreCase(tName)))
                .toList();

        List<Batch> batches = batchRepository.findAll().stream()
                .filter(b -> (b.getTrainerId() != null && b.getTrainerId().equals(tId)) ||
                        (tName != null && b.getTrainerName() != null && b.getTrainerName().equalsIgnoreCase(tName)))
                .toList();

        List<Schedule> schedules = scheduleRepository.findAll().stream()
                .filter(s -> (s.getTrainerId() != null && s.getTrainerId().equals(tId)) ||
                        (tName != null && s.getTrainer() != null && s.getTrainer().equalsIgnoreCase(tName)))
                .toList();

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
        List<Course> courses = courseRepository.findAll().stream()
                .filter(c -> (c.getTrainerId() != null && c.getTrainerId().equals(oldId)) ||
                        (oldName != null && c.getAssignedTrainer() != null && c.getAssignedTrainer().equalsIgnoreCase(oldName)))
                .toList();
        for (Course c : courses) {
            c.setTrainerId(newId);
            c.setAssignedTrainer(newName);
            courseRepository.save(c);
        }

        // 2. Reassign Batches
        List<Batch> batches = batchRepository.findAll().stream()
                .filter(b -> (b.getTrainerId() != null && b.getTrainerId().equals(oldId)) ||
                        (oldName != null && b.getTrainerName() != null && b.getTrainerName().equalsIgnoreCase(oldName)))
                .toList();
        for (Batch b : batches) {
            b.setTrainerId(newId);
            b.setTrainerName(newName);
            batchRepository.save(b);
        }

        // 3. Reassign Schedules
        List<Schedule> schedules = scheduleRepository.findAll().stream()
                .filter(s -> (s.getTrainerId() != null && s.getTrainerId().equals(oldId)) ||
                        (oldName != null && s.getTrainer() != null && s.getTrainer().equalsIgnoreCase(oldName)))
                .toList();
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
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .or(() -> userRepository.findByEmailIgnoreCase(id))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            long adminCount = userRepository.countByRoleIgnoreCase("ADMIN");
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot delete the last remaining administrator account");
            }
        }

        if ("TRAINER".equalsIgnoreCase(user.getRole())) {
            TrainerDependencyDto dep = getTrainerDependencies(user.getId());
            if (dep.isHasDependencies()) {
                throw new IllegalStateException("Cannot delete trainer assigned to active courses (" + dep.getCourseCount() + ") or batches (" + dep.getBatchCount() + "). Please reassign dependencies first.");
            }
        }

        studentCourseBatchRepository.deleteByStudentId(user.getId());
        List<Enrollment> enrs = enrollmentRepository.findByStudentId(user.getId());
        if (enrs != null && !enrs.isEmpty()) {
            enrollmentRepository.deleteAll(enrs);
        }
        userRepository.delete(user);
    }

}
