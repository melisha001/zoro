package com.zoroacademy.service;

import com.zoroacademy.entity.Schedule;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final com.zoroacademy.repository.CourseRepository courseRepository;
    private final com.zoroacademy.repository.BatchRepository batchRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final com.zoroacademy.repository.StudentCourseBatchRepository studentCourseBatchRepository;
    private final com.zoroacademy.repository.AttendanceRecordRepository attendanceRecordRepository;

    @org.springframework.beans.factory.annotation.Value("${schedule.resources-unlock-minutes:60}")
    private int resourcesUnlockMinutes = 60;

    public int getResourcesUnlockMinutes() {
        return resourcesUnlockMinutes;
    }

    public void setResourcesUnlockMinutes(int resourcesUnlockMinutes) {
        this.resourcesUnlockMinutes = resourcesUnlockMinutes;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ScheduleService(ScheduleRepository scheduleRepository,
                           com.zoroacademy.repository.CourseRepository courseRepository,
                           com.zoroacademy.repository.BatchRepository batchRepository,
                           com.zoroacademy.repository.UserRepository userRepository,
                           FileStorageService fileStorageService,
                           @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.StudentCourseBatchRepository studentCourseBatchRepository,
                           @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.AttendanceRecordRepository attendanceRecordRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    public ScheduleService(ScheduleRepository scheduleRepository,
                           com.zoroacademy.repository.CourseRepository courseRepository,
                           com.zoroacademy.repository.BatchRepository batchRepository,
                           com.zoroacademy.repository.UserRepository userRepository) {
        this(scheduleRepository, courseRepository, batchRepository, userRepository, null, null, null);
    }

    private void enrichSchedule(Schedule s) {
        if (s == null) return;
        java.time.ZonedDateTime now = com.zoroacademy.util.ScheduleTimeUtil.nowInKolkata();
        s.setServerNow(now.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        java.time.ZonedDateTime start = com.zoroacademy.util.ScheduleTimeUtil.getSessionStart(s.getDate(), s.getTime());
        java.time.ZonedDateTime end = com.zoroacademy.util.ScheduleTimeUtil.getSessionEnd(s.getDate(), s.getTime());
        if (start != null && end != null) {
            if (now.isBefore(start)) {
                s.setStatus("Upcoming");
            } else if (!now.isAfter(end)) {
                s.setStatus("Live");
            } else {
                s.setStatus("Completed");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Schedule> getAllSchedules() {
        List<Schedule> list = scheduleRepository.findAllByOrderByDateAsc();
        list.forEach(this::enrichSchedule);
        return list;
    }

    @Transactional(readOnly = true)
    public List<Schedule> getTrainerSchedules(String trainerIdOrName) {
        List<Schedule> list = scheduleRepository.findByTrainerIdOrTrainerIgnoreCaseOrderByDateAsc(trainerIdOrName, trainerIdOrName);
        list.forEach(this::enrichSchedule);
        return list;
    }

    public void validateAndNormalizeSchedule(Schedule schedule, String currentScheduleId) {
        if (schedule.getDate() == null || schedule.getDate().isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Schedule date is required");
        }

        java.time.LocalDate sDate;
        try {
            sDate = java.time.LocalDate.parse(schedule.getDate().trim());
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid schedule date: " + schedule.getDate());
        }

        java.time.LocalDate todayKolkata = java.time.LocalDate.now(com.zoroacademy.util.ScheduleTimeUtil.KOLKATA_ZONE);
        if (sDate.isBefore(todayKolkata)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Schedule date cannot be in the past (" + schedule.getDate() + ")");
        }

        java.time.LocalTime st = null;
        java.time.LocalTime et = null;

        if (schedule.getStartTime() != null && !schedule.getStartTime().isBlank()
                && schedule.getEndTime() != null && !schedule.getEndTime().isBlank()) {
            try {
                st = java.time.LocalTime.parse(schedule.getStartTime().trim());
                et = java.time.LocalTime.parse(schedule.getEndTime().trim());
            } catch (Exception e) {
                int sMin = com.zoroacademy.util.ScheduleTimeUtil.parseTimeToMinutes(schedule.getStartTime());
                int eMin = com.zoroacademy.util.ScheduleTimeUtil.parseEndTimeToMinutes(" - " + schedule.getEndTime());
                st = java.time.LocalTime.of(sMin / 60, sMin % 60);
                et = java.time.LocalTime.of(eMin / 60, eMin % 60);
            }
        } else if (schedule.getTime() != null && !schedule.getTime().isBlank()) {
            int sMin = com.zoroacademy.util.ScheduleTimeUtil.parseTimeToMinutes(schedule.getTime());
            int eMin = com.zoroacademy.util.ScheduleTimeUtil.parseEndTimeToMinutes(schedule.getTime());
            st = java.time.LocalTime.of(sMin / 60, sMin % 60);
            et = java.time.LocalTime.of(eMin / 60, eMin % 60);
        } else {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Start time and end time are required");
        }

        if (!et.isAfter(st)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "End time (" + et + ") must be after start time (" + st + ")");
        }

        long durationMinutes = java.time.Duration.between(st, et).toMinutes();
        if (durationMinutes < 15) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Session duration must be at least 15 minutes");
        }
        if (durationMinutes > 240) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Session duration cannot exceed 4 hours (240 minutes)");
        }

        java.time.format.DateTimeFormatter dtf24 = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
        java.time.format.DateTimeFormatter dtf12 = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH);

        schedule.setStartTime(st.format(dtf24));
        schedule.setEndTime(et.format(dtf24));
        schedule.setTime(st.format(dtf12) + " - " + et.format(dtf12));
        schedule.setStartAt(sDate.atTime(st));
        schedule.setEndAt(sDate.atTime(et));

        // Overlap validation for same date:
        List<Schedule> sameDate = scheduleRepository.findByDate(schedule.getDate().trim());
        for (Schedule existing : sameDate) {
            if (currentScheduleId != null && currentScheduleId.equals(existing.getId())) {
                continue;
            }
            if (schedule.getId() != null && schedule.getId().equals(existing.getId())) {
                continue;
            }

            boolean batchMatch = (schedule.getBatchId() != null && !schedule.getBatchId().isBlank() && !"All".equalsIgnoreCase(schedule.getBatchId()) && schedule.getBatchId().equals(existing.getBatchId()))
                    || (schedule.getBatch() != null && !schedule.getBatch().isBlank() && !"All".equalsIgnoreCase(schedule.getBatch()) && schedule.getBatch().equalsIgnoreCase(existing.getBatch()));

            boolean trainerMatch = (schedule.getTrainerId() != null && !schedule.getTrainerId().isBlank() && schedule.getTrainerId().equals(existing.getTrainerId()))
                    || (schedule.getTrainer() != null && !schedule.getTrainer().isBlank() && schedule.getTrainer().equalsIgnoreCase(existing.getTrainer()));

            if (batchMatch || trainerMatch) {
                java.time.LocalTime exSt = null;
                java.time.LocalTime exEt = null;
                if (existing.getStartTime() != null && existing.getEndTime() != null) {
                    try {
                        exSt = java.time.LocalTime.parse(existing.getStartTime().trim());
                        exEt = java.time.LocalTime.parse(existing.getEndTime().trim());
                    } catch (Exception ignored) {}
                }
                if (exSt == null || exEt == null) {
                    int esMin = com.zoroacademy.util.ScheduleTimeUtil.parseTimeToMinutes(existing.getTime());
                    int eeMin = com.zoroacademy.util.ScheduleTimeUtil.parseEndTimeToMinutes(existing.getTime());
                    exSt = java.time.LocalTime.of(esMin / 60, esMin % 60);
                    exEt = java.time.LocalTime.of(eeMin / 60, eeMin % 60);
                }

                if (st.isBefore(exEt) && et.isAfter(exSt)) {
                    if (batchMatch) {
                        throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.CONFLICT,
                            "Schedule overlaps with existing session '" + existing.getTitle() + "' (" + existing.getTime() + ") for batch '" + (existing.getBatch() != null ? existing.getBatch() : schedule.getBatch()) + "'");
                    } else {
                        throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.CONFLICT,
                            "Schedule overlaps with existing session '" + existing.getTitle() + "' (" + existing.getTime() + ") for trainer '" + (existing.getTrainer() != null ? existing.getTrainer() : schedule.getTrainer()) + "'");
                    }
                }
            }
        }
    }

    @Transactional
    public Schedule createSchedule(Schedule schedule) {
        if (schedule.getId() == null || schedule.getId().isBlank()) {
            schedule.setId("sch_" + java.util.UUID.randomUUID());
        }
        if (schedule.getStatus() == null || schedule.getStatus().isBlank()) {
            schedule.setStatus("Upcoming");
        }

        // Relational course resolution
        if (schedule.getCourseId() != null && !schedule.getCourseId().isBlank()) {
            courseRepository.findById(schedule.getCourseId()).ifPresent(c -> {
                schedule.setCourse(c.getTitle());
                if (schedule.getMeetLink() == null || schedule.getMeetLink().isBlank()) {
                    schedule.setMeetLink(c.getGoogleMeetUrl());
                }
            });
        } else if (schedule.getCourse() != null && !schedule.getCourse().isBlank()) {
            courseRepository.findByTitleIgnoreCase(schedule.getCourse()).ifPresent(c -> {
                schedule.setCourseId(c.getId());
                if (schedule.getMeetLink() == null || schedule.getMeetLink().isBlank()) {
                    schedule.setMeetLink(c.getGoogleMeetUrl());
                }
            });
        }

        // Relational batch resolution
        if (schedule.getBatchId() != null && !schedule.getBatchId().isBlank()) {
            batchRepository.findById(schedule.getBatchId()).ifPresent(b -> schedule.setBatch(b.getName()));
        } else if (schedule.getBatch() != null && !schedule.getBatch().isBlank()) {
            batchRepository.findByNameIgnoreCaseAndCourseId(schedule.getBatch(), schedule.getCourseId())
                    .or(() -> batchRepository.findByNameIgnoreCaseAndCourseNameIgnoreCase(schedule.getBatch(), schedule.getCourse()))
                    .ifPresent(b -> schedule.setBatchId(b.getId()));
        }

        // Relational trainer resolution
        if (schedule.getTrainerId() != null && !schedule.getTrainerId().isBlank()) {
            userRepository.findById(schedule.getTrainerId()).ifPresent(u -> schedule.setTrainer(u.getName()));
        } else if (schedule.getTrainer() != null && !schedule.getTrainer().isBlank()) {
            userRepository.findByNameIgnoreCase(schedule.getTrainer()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> schedule.setTrainerId(u.getId()));
        }

        // Validate that trainer belongs to the batch if batch has assigned trainers
        if (schedule.getBatchId() != null && !schedule.getBatchId().isBlank() && !"All".equalsIgnoreCase(schedule.getBatchId())) {
            batchRepository.findById(schedule.getBatchId()).ifPresent(b -> {
                if (b.getTrainerIds() != null && !b.getTrainerIds().isEmpty()) {
                    boolean found = false;
                    for (String bTid : b.getTrainerIds()) {
                        if ((schedule.getTrainerId() != null && schedule.getTrainerId().equals(bTid)) ||
                            (schedule.getTrainer() != null && schedule.getTrainer().equalsIgnoreCase(
                                userRepository.findById(bTid).map(User::getName).orElse("")))) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, 
                            "Selected trainer is not assigned to batch '" + b.getName() + "'. Please choose an assigned batch trainer.");
                    }
                }
            });
        }

        validateAndNormalizeSchedule(schedule, null);
        enrichSchedule(schedule);

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Schedule updateSchedule(String id, Schedule updated) {
        Schedule existing = scheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + id));

        if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
        if (updated.getCourse() != null) existing.setCourse(updated.getCourse());
        if (updated.getCourseId() != null) existing.setCourseId(updated.getCourseId());
        if (updated.getBatch() != null) existing.setBatch(updated.getBatch());
        if (updated.getBatchId() != null) existing.setBatchId(updated.getBatchId());
        if (updated.getTrainer() != null) existing.setTrainer(updated.getTrainer());
        if (updated.getTrainerId() != null) existing.setTrainerId(updated.getTrainerId());
        if (updated.getStartTime() != null) existing.setStartTime(updated.getStartTime());
        if (updated.getEndTime() != null) existing.setEndTime(updated.getEndTime());
        if (updated.getTime() != null) existing.setTime(updated.getTime());
        if (updated.getDate() != null) existing.setDate(updated.getDate());
        if (updated.getMeetLink() != null) existing.setMeetLink(updated.getMeetLink());
        if (updated.getStudentsCount() != null) existing.setStudentsCount(updated.getStudentsCount());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getNotesFileUrl() != null) {
            if (existing.getNotesFileUrl() != null && !existing.getNotesFileUrl().equals(updated.getNotesFileUrl())) {
                cleanupStoredFilesFromText(existing.getNotesFileUrl());
            }
            existing.setNotesFileUrl(updated.getNotesFileUrl().isBlank() ? null : updated.getNotesFileUrl());
            existing.setNotesFileName(updated.getNotesFileName());
        }
        if (updated.getWorksheetFileUrl() != null) {
            if (existing.getWorksheetFileUrl() != null && !existing.getWorksheetFileUrl().equals(updated.getWorksheetFileUrl())) {
                cleanupStoredFilesFromText(existing.getWorksheetFileUrl());
            }
            existing.setWorksheetFileUrl(updated.getWorksheetFileUrl().isBlank() ? null : updated.getWorksheetFileUrl());
            existing.setWorksheetFileName(updated.getWorksheetFileName());
        }
        if (updated.getAssignmentFileUrl() != null) {
            if (existing.getAssignmentFileUrl() != null && !existing.getAssignmentFileUrl().equals(updated.getAssignmentFileUrl())) {
                cleanupStoredFilesFromText(existing.getAssignmentFileUrl());
            }
            existing.setAssignmentFileUrl(updated.getAssignmentFileUrl().isBlank() ? null : updated.getAssignmentFileUrl());
            existing.setAssignmentFileName(updated.getAssignmentFileName());
        }

        // Relational batch resolution
        if (existing.getBatchId() != null && !existing.getBatchId().isBlank()) {
            batchRepository.findById(existing.getBatchId()).ifPresent(b -> existing.setBatch(b.getName()));
        } else if (existing.getBatch() != null && !existing.getBatch().isBlank()) {
            batchRepository.findByNameIgnoreCaseAndCourseId(existing.getBatch(), existing.getCourseId())
                    .or(() -> batchRepository.findByNameIgnoreCaseAndCourseNameIgnoreCase(existing.getBatch(), existing.getCourse()))
                    .ifPresent(b -> existing.setBatchId(b.getId()));
        }

        // Relational trainer resolution
        if (existing.getTrainerId() != null && !existing.getTrainerId().isBlank()) {
            userRepository.findById(existing.getTrainerId()).ifPresent(u -> existing.setTrainer(u.getName()));
        } else if (existing.getTrainer() != null && !existing.getTrainer().isBlank()) {
            userRepository.findByNameIgnoreCase(existing.getTrainer()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> existing.setTrainerId(u.getId()));
        }

        // Validate that trainer belongs to the batch if batch has assigned trainers
        if (existing.getBatchId() != null && !existing.getBatchId().isBlank() && !"All".equalsIgnoreCase(existing.getBatchId())) {
            batchRepository.findById(existing.getBatchId()).ifPresent(b -> {
                if (b.getTrainerIds() != null && !b.getTrainerIds().isEmpty()) {
                    boolean found = false;
                    for (String bTid : b.getTrainerIds()) {
                        if ((existing.getTrainerId() != null && existing.getTrainerId().equals(bTid)) ||
                            (existing.getTrainer() != null && existing.getTrainer().equalsIgnoreCase(
                                userRepository.findById(bTid).map(User::getName).orElse("")))) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, 
                            "Selected trainer is not assigned to batch '" + b.getName() + "'. Please choose an assigned batch trainer.");
                    }
                }
            });
        }

        validateAndNormalizeSchedule(existing, id);
        enrichSchedule(existing);

        return scheduleRepository.save(existing);
    }

    private void cleanupStoredFilesFromText(String text) {
        if (text == null || text.isBlank()) return;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})").matcher(text);
        while (matcher.find()) {
            try {
                fileStorageService.deleteFile(matcher.group(1));
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public void deleteSchedule(String id) {
        Schedule schedule = scheduleRepository.findById(id).orElse(null);
        if (schedule != null) {
            cleanupStoredFilesFromText(schedule.getNotesFileUrl());
            cleanupStoredFilesFromText(schedule.getWorksheetFileUrl());
            cleanupStoredFilesFromText(schedule.getAssignmentFileUrl());
            scheduleRepository.delete(schedule);
        }
    }

    public boolean isScheduleLockedForStudent(Schedule schedule, String studentId, String studentEmail) {
        if (schedule == null) return false;
        if (schedule.getDate() == null || schedule.getTime() == null) return false;

        java.time.ZonedDateTime now = com.zoroacademy.util.ScheduleTimeUtil.nowInKolkata();
        java.time.ZonedDateTime sessionStart = com.zoroacademy.util.ScheduleTimeUtil.getSessionStart(schedule.getDate(), schedule.getTime());
        if (sessionStart == null) return false;

        // If session has already started or completed -> UNLOCKED
        if (!now.isBefore(sessionStart)) {
            return false;
        }

        // If within resourcesUnlockMinutes (60 min) before start time -> UNLOCKED
        java.time.ZonedDateTime unlockThreshold = sessionStart.minusMinutes(resourcesUnlockMinutes);
        if (!now.isBefore(unlockThreshold)) {
            return false;
        }

        // More than 60 minutes before start -> LOCKED (no nearest upcoming exception)
        return true;
    }

    @Transactional(readOnly = true)
    public List<Schedule> getSchedulesForStudent(String studentId, String studentEmail) {
        List<Schedule> all = getAllSchedules();
        List<Schedule> result = new java.util.ArrayList<>();
        for (Schedule s : all) {
            Schedule copy = new Schedule(
                    s.getId(), s.getTitle(), s.getCourse(), s.getCourseId(), s.getBatch(), s.getBatchId(),
                    s.getTrainer(), s.getTrainerId(), s.getTime(), s.getDate(), s.getMeetLink(),
                    s.getStudentsCount(), s.getStatus(), s.getNotesFileUrl(), s.getNotesFileName(),
                    s.getWorksheetFileUrl(), s.getWorksheetFileName(), s.getAssignmentFileUrl(),
                    s.getAssignmentFileName(), s.getCreatedAt(), s.getUpdatedAt()
            );
            copy.setStartTime(s.getStartTime());
            copy.setEndTime(s.getEndTime());
            copy.setStartAt(s.getStartAt());
            copy.setEndAt(s.getEndAt());
            copy.setAudience(s.getAudience());
            copy.setServerNow(s.getServerNow());

            boolean isLocked = isScheduleLockedForStudent(s, studentId, studentEmail);
            copy.setLocked(isLocked);
            if (isLocked) {
                copy.setUnlockTimeLabel(com.zoroacademy.util.ScheduleTimeUtil.formatUnlockTime(s.getDate(), s.getTime(), resourcesUnlockMinutes));
                copy.setNotesFileUrl(null);
                copy.setNotesFileName(null);
                copy.setWorksheetFileUrl(null);
                copy.setWorksheetFileName(null);
                copy.setAssignmentFileUrl(null);
                copy.setAssignmentFileName(null);
            }
            result.add(copy);
        }
        return result;
    }

    @Transactional
    public java.util.Map<String, Object> joinSchedule(String scheduleId, String studentId, String studentEmail, String userRole) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId));

        boolean isStaff = "ADMIN".equalsIgnoreCase(userRole) || "SUPER_ADMIN".equalsIgnoreCase(userRole) || "TRAINER".equalsIgnoreCase(userRole);

        // 1. Resolve student user
        com.zoroacademy.entity.User student = null;
        if (studentId != null && !studentId.isBlank()) {
            student = userRepository.findById(studentId).orElse(null);
        }
        if (student == null && studentEmail != null && !studentEmail.isBlank()) {
            student = userRepository.findByEmailIgnoreCase(studentEmail).orElse(null);
        }

        if (!isStaff) {
            if (student == null) {
                throw new IllegalArgumentException("Student not found");
            }
            String effectiveStudentId = student.getId();

            // 2. Check enrollment in course/batch
            boolean enrolled = false;
            if (studentCourseBatchRepository != null) {
                java.util.List<com.zoroacademy.entity.StudentCourseBatch> scbs = studentCourseBatchRepository.findByStudentId(effectiveStudentId);
                if (scbs.isEmpty() && student.getEmail() != null) {
                    scbs = studentCourseBatchRepository.findByStudentId(student.getEmail());
                }
                for (com.zoroacademy.entity.StudentCourseBatch scb : scbs) {
                    boolean matchCourse = (schedule.getCourseId() != null && schedule.getCourseId().equals(scb.getCourseId()));
                    boolean matchBatch = (schedule.getBatchId() == null || "All".equalsIgnoreCase(schedule.getBatchId()) || schedule.getBatchId().equals(scb.getBatchId()));
                    if (matchCourse && matchBatch) {
                        enrolled = true;
                        break;
                    }
                }
            } else {
                enrolled = true;
            }

            if (!enrolled) {
                throw new org.springframework.security.access.AccessDeniedException("Student is not enrolled in this session's course/batch");
            }
        }

        // 3. Time check [start, end] strictly using Asia/Kolkata
        java.time.ZonedDateTime now = com.zoroacademy.util.ScheduleTimeUtil.nowInKolkata();
        java.time.ZonedDateTime start = com.zoroacademy.util.ScheduleTimeUtil.getSessionStart(schedule.getDate(), schedule.getTime());
        java.time.ZonedDateTime end = com.zoroacademy.util.ScheduleTimeUtil.getSessionEnd(schedule.getDate(), schedule.getTime());

        if (start != null && now.isBefore(start)) {
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("hh:mm a");
            throw new com.zoroacademy.exception.BadRequestException("Session has not started yet. Join opens at " + start.format(fmt));
        }
        if (end != null && now.isAfter(end)) {
            throw new com.zoroacademy.exception.BadRequestException("Session has already ended");
        }

        // 4. Meeting link resolution
        String meetUrl = schedule.getMeetLink();
        if (meetUrl == null || meetUrl.isBlank() || meetUrl.contains("meet.google.com/new") || meetUrl.contains("zoro-live-class") || meetUrl.contains("abc-defg-hij")) {
            if (schedule.getCourseId() != null) {
                com.zoroacademy.entity.Course c = courseRepository.findById(schedule.getCourseId()).orElse(null);
                if (c != null && c.getGoogleMeetUrl() != null && !c.getGoogleMeetUrl().isBlank()) {
                    meetUrl = c.getGoogleMeetUrl();
                }
            }
        }
        if (meetUrl == null || meetUrl.isBlank() || meetUrl.contains("meet.google.com/new") || meetUrl.contains("zoro-live-class") || meetUrl.contains("abc-defg-hij")) {
            throw new com.zoroacademy.exception.BadRequestException("Meeting link not set. Contact admin.");
        }

        // 5. Mark Attendance for student as PRESENT
        if (!isStaff && student != null && attendanceRecordRepository != null) {
            String sId = student.getId();
            com.zoroacademy.entity.AttendanceRecord att = attendanceRecordRepository.findByStudentIdAndScheduleId(sId, schedule.getId())
                    .orElse(com.zoroacademy.entity.AttendanceRecord.builder()
                            .id("att_" + java.util.UUID.randomUUID())
                            .studentId(sId)
                            .studentName(student.getName())
                            .scheduleId(schedule.getId())
                            .courseId(schedule.getCourseId())
                            .batchId(schedule.getBatchId())
                            .date(schedule.getDate())
                            .recordedBy("STUDENT_JOIN")
                            .build());
            att.setStatus("Present");
            att.setJoinedAt(java.time.LocalDateTime.now());
            attendanceRecordRepository.save(att);
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("meetUrl", meetUrl);
        response.put("scheduleId", schedule.getId());
        response.put("status", "Present");
        response.put("message", "Joined successfully");
        return response;
    }
}
