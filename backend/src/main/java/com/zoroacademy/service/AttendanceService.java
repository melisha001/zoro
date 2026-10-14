package com.zoroacademy.service;

import com.zoroacademy.entity.AttendanceRecord;
import com.zoroacademy.repository.AttendanceRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;
    private final com.zoroacademy.repository.ScheduleRepository scheduleRepository;
    private final com.zoroacademy.repository.StudentCourseBatchRepository studentCourseBatchRepository;
    private final com.zoroacademy.repository.CourseRepository courseRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public AttendanceService(AttendanceRecordRepository attendanceRepository,
                             com.zoroacademy.repository.UserRepository userRepository,
                             com.zoroacademy.repository.ScheduleRepository scheduleRepository,
                             @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.StudentCourseBatchRepository studentCourseBatchRepository,
                             @org.springframework.beans.factory.annotation.Autowired(required = false) com.zoroacademy.repository.CourseRepository courseRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.scheduleRepository = scheduleRepository;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.courseRepository = courseRepository;
    }

    public AttendanceService(AttendanceRecordRepository attendanceRepository,
                             com.zoroacademy.repository.UserRepository userRepository,
                             com.zoroacademy.repository.ScheduleRepository scheduleRepository) {
        this(attendanceRepository, userRepository, scheduleRepository, null, null);
    }

    public void enrichAttendanceRecord(AttendanceRecord r) {
        if (r == null) return;

        com.zoroacademy.entity.Schedule sch = null;
        if (r.getScheduleId() != null && !r.getScheduleId().isBlank() && scheduleRepository != null) {
            sch = scheduleRepository.findById(r.getScheduleId()).orElse(null);
        }

        // 1. Resolve Course Title (never show raw crs_...)
        String courseTitle = null;
        if (sch != null && sch.getCourse() != null && !sch.getCourse().isBlank()) {
            courseTitle = sch.getCourse();
        } else if (r.getCourseId() != null && !r.getCourseId().isBlank() && courseRepository != null) {
            courseTitle = courseRepository.findById(r.getCourseId())
                    .map(com.zoroacademy.entity.Course::getTitle)
                    .orElse(null);
        }
        if (courseTitle == null || courseTitle.isBlank()) {
            courseTitle = r.getCourse();
        }
        if (courseTitle == null || courseTitle.isBlank()) {
            courseTitle = r.getCourseId();
        }
        r.setCourse(courseTitle != null && !courseTitle.isBlank() ? courseTitle : "General Course");

        // 2. Resolve Topic (must be schedule title)
        if (sch != null && sch.getTitle() != null && !sch.getTitle().isBlank()) {
            r.setTopic(sch.getTitle());
        } else if (r.getTopic() == null || r.getTopic().isBlank() || r.getTopic().contains("Classroom Session") || r.getTopic().contains("Portal Live Class Join")) {
            if (r.getRemarks() != null && !r.getRemarks().isBlank()
                    && !r.getRemarks().contains("STUDENT_JOIN") && !r.getRemarks().contains("SYSTEM_AUTO")
                    && !r.getRemarks().contains("Classroom Session") && !r.getRemarks().contains("Portal Live Class Join")) {
                r.setTopic(r.getRemarks());
            } else {
                r.setTopic(r.getCourse() != null ? r.getCourse() + " Session" : "Live Session");
            }
        }

        // 3. Resolve Trainer (never display internal markers STUDENT_JOIN or SYSTEM_AUTO)
        String trainerName = null;
        if (sch != null && sch.getTrainer() != null && !sch.getTrainer().isBlank()) {
            trainerName = sch.getTrainer();
        } else if (sch != null && sch.getTrainerId() != null && !sch.getTrainerId().isBlank() && userRepository != null) {
            trainerName = userRepository.findById(sch.getTrainerId()).map(com.zoroacademy.entity.User::getName).orElse(null);
        }
        if (trainerName == null && r.getRecordedBy() != null && !r.getRecordedBy().isBlank()
                && !r.getRecordedBy().equalsIgnoreCase("STUDENT_JOIN")
                && !r.getRecordedBy().equalsIgnoreCase("SYSTEM_AUTO")) {
            if (userRepository != null) {
                trainerName = userRepository.findById(r.getRecordedBy()).map(com.zoroacademy.entity.User::getName).orElse(r.getRecordedBy());
            } else {
                trainerName = r.getRecordedBy();
            }
        }
        r.setTrainer(trainerName != null && !trainerName.isBlank() ? trainerName : "Assigned Trainer");

        // 4. Resolve Time (must show start-end time, not "Completed Session")
        if (sch != null && sch.getTime() != null && !sch.getTime().isBlank()) {
            r.setTime(sch.getTime());
        } else if (r.getTime() == null || r.getTime().isBlank() || r.getTime().equals("Completed Session")) {
            if (r.getJoinedAt() != null) {
                r.setTime(r.getJoinedAt().format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a")));
            } else {
                r.setTime("10:00 AM - 11:00 AM");
            }
        }
    }

    private void deriveAbsentForActiveSchedules(List<AttendanceRecord> records, String specificStudentId) {
        if (scheduleRepository == null || studentCourseBatchRepository == null) return;
        List<com.zoroacademy.entity.Schedule> schedules = scheduleRepository.findAll();
        java.time.ZonedDateTime now = com.zoroacademy.util.ScheduleTimeUtil.nowInKolkata();

        for (com.zoroacademy.entity.Schedule s : schedules) {
            boolean isActive = com.zoroacademy.util.ScheduleTimeUtil.isSessionActive(s.getDate(), s.getTime(), now);
            if (!isActive) continue;

            java.util.List<com.zoroacademy.entity.StudentCourseBatch> scbs = new java.util.ArrayList<>();
            if (s.getBatchId() != null && !s.getBatchId().isBlank() && !"All".equalsIgnoreCase(s.getBatchId())) {
                scbs.addAll(studentCourseBatchRepository.findByBatchId(s.getBatchId()));
            } else if (s.getCourseId() != null && !s.getCourseId().isBlank()) {
                scbs.addAll(studentCourseBatchRepository.findByCourseId(s.getCourseId()));
            }

            for (com.zoroacademy.entity.StudentCourseBatch scb : scbs) {
                String stId = scb.getStudentId();
                if (stId == null || stId.isBlank()) continue;
                if (specificStudentId != null && !specificStudentId.equals(stId)) continue;

                boolean exists = records.stream().anyMatch(r ->
                        stId.equals(r.getStudentId()) && s.getId().equals(r.getScheduleId()));
                if (!exists) {
                    String stName = userRepository != null ? userRepository.findById(stId).map(com.zoroacademy.entity.User::getName).orElse("Student") : "Student";
                    AttendanceRecord derived = AttendanceRecord.builder()
                            .id("active_" + s.getId() + "_" + stId)
                            .scheduleId(s.getId())
                            .studentId(stId)
                            .studentName(stName)
                            .courseId(s.getCourseId())
                            .batchId(s.getBatchId())
                            .date(s.getDate())
                            .status("Absent")
                            .remarks("Live now - join to mark present")
                            .recordedBy("SYSTEM_AUTO")
                            .build();
                    enrichAttendanceRecord(derived);
                    records.add(derived);
                }
            }
        }
    }

    @Transactional
    public void syncAbsentForFinishedSchedules() {
        if (scheduleRepository == null || studentCourseBatchRepository == null) return;
        List<com.zoroacademy.entity.Schedule> schedules = scheduleRepository.findAll();
        java.time.ZonedDateTime now = com.zoroacademy.util.ScheduleTimeUtil.nowInKolkata();

        for (com.zoroacademy.entity.Schedule s : schedules) {
            boolean isFinished = com.zoroacademy.util.ScheduleTimeUtil.isSessionFinished(s.getDate(), s.getTime(), now);
            if (!isFinished) continue;

            java.util.List<com.zoroacademy.entity.StudentCourseBatch> scbs = new java.util.ArrayList<>();
            if (s.getBatchId() != null && !s.getBatchId().isBlank() && !"All".equalsIgnoreCase(s.getBatchId())) {
                scbs.addAll(studentCourseBatchRepository.findByBatchId(s.getBatchId()));
            } else if (s.getCourseId() != null && !s.getCourseId().isBlank()) {
                scbs.addAll(studentCourseBatchRepository.findByCourseId(s.getCourseId()));
            }

            for (com.zoroacademy.entity.StudentCourseBatch scb : scbs) {
                String stId = scb.getStudentId();
                if (stId == null || stId.isBlank()) continue;
                java.util.Optional<AttendanceRecord> existing = attendanceRepository.findByStudentIdAndScheduleId(stId, s.getId());
                if (existing.isEmpty()) {
                    String stName = userRepository != null ? userRepository.findById(stId).map(com.zoroacademy.entity.User::getName).orElse("Student") : "Student";
                    AttendanceRecord abs = AttendanceRecord.builder()
                            .id("att_" + java.util.UUID.randomUUID())
                            .studentId(stId)
                            .studentName(stName)
                            .scheduleId(s.getId())
                            .courseId(s.getCourseId())
                            .batchId(s.getBatchId())
                            .date(s.getDate())
                            .status("Absent")
                            .recordedBy("SYSTEM_AUTO")
                            .build();
                    attendanceRepository.save(abs);
                }
            }
        }
    }

    @Transactional
    public List<AttendanceRecord> getAllAttendance() {
        syncAbsentForFinishedSchedules();
        List<AttendanceRecord> list = new java.util.ArrayList<>(attendanceRepository.findAll());
        deriveAbsentForActiveSchedules(list, null);
        list.forEach(this::enrichAttendanceRecord);
        return list;
    }

    @Transactional
    public List<AttendanceRecord> getBySchedule(String scheduleId) {
        syncAbsentForFinishedSchedules();
        List<AttendanceRecord> list = new java.util.ArrayList<>(attendanceRepository.findByScheduleId(scheduleId));
        list.forEach(this::enrichAttendanceRecord);
        return list;
    }

    @Transactional
    public List<AttendanceRecord> getByStudent(String studentIdOrEmail) {
        syncAbsentForFinishedSchedules();
        String effectiveId = studentIdOrEmail;
        if (studentIdOrEmail != null && studentIdOrEmail.contains("@")) {
            effectiveId = userRepository.findByEmailIgnoreCase(studentIdOrEmail)
                    .map(com.zoroacademy.entity.User::getId)
                    .orElse(studentIdOrEmail);
        }
        List<AttendanceRecord> list = new java.util.ArrayList<>(attendanceRepository.findByStudentId(effectiveId));
        deriveAbsentForActiveSchedules(list, effectiveId);
        list.forEach(this::enrichAttendanceRecord);
        return list;
    }

    @Transactional
    public AttendanceRecord recordAttendance(AttendanceRecord record) {
        // Resolve studentId
        resolveStudent(record);

        if (record.getDate() == null || record.getDate().isBlank()) {
            record.setDate(LocalDate.now().toString());
        }

        if (record.getScheduleId() != null && !record.getScheduleId().isBlank()) {
            scheduleRepository.findById(record.getScheduleId()).ifPresent(sch -> {
                if (record.getCourseId() == null || record.getCourseId().isBlank()) record.setCourseId(sch.getCourseId());
                if (record.getBatchId() == null || record.getBatchId().isBlank()) record.setBatchId(sch.getBatchId());
                if (record.getDate() == null || record.getDate().isBlank()) record.setDate(sch.getDate());
            });
        }

        // Upsert by (studentId, scheduleId) if scheduleId is provided
        if (record.getScheduleId() != null && !record.getScheduleId().isBlank() && record.getStudentId() != null) {
            java.util.Optional<AttendanceRecord> existing = attendanceRepository.findByStudentIdAndScheduleId(record.getStudentId(), record.getScheduleId());
            if (existing.isPresent()) {
                AttendanceRecord att = existing.get();
                att.setStatus(record.getStatus());
                if (record.getRemarks() != null) att.setRemarks(record.getRemarks());
                if (record.getDate() != null) att.setDate(record.getDate());
                if (record.getRecordedBy() != null) att.setRecordedBy(record.getRecordedBy());
                if (record.getCourseId() != null) att.setCourseId(record.getCourseId());
                if (record.getBatchId() != null) att.setBatchId(record.getBatchId());
                return attendanceRepository.save(att);
            }
        }

        if (record.getId() == null || record.getId().isBlank()) {
            record.setId("att_" + java.util.UUID.randomUUID());
        }

        return attendanceRepository.save(record);
    }

    @Transactional
    public AttendanceRecord markAttendance(AttendanceRecord record) {
        return recordAttendance(record);
    }

    @Transactional
    public List<AttendanceRecord> recordBatchAttendance(List<AttendanceRecord> records) {
        List<AttendanceRecord> saved = new java.util.ArrayList<>();
        for (AttendanceRecord r : records) {
            saved.add(recordAttendance(r));
        }
        return saved;
    }

    private void resolveStudent(AttendanceRecord record) {
        if (record.getStudentId() != null && record.getStudentId().contains("@")) {
            userRepository.findByEmailIgnoreCase(record.getStudentId()).ifPresent(u -> {
                record.setStudentId(u.getId());
                if (record.getStudentName() == null || record.getStudentName().isBlank()) {
                    record.setStudentName(u.getName());
                }
            });
        } else if (record.getStudentId() != null && !record.getStudentId().isBlank()) {
            userRepository.findById(record.getStudentId()).ifPresent(u -> {
                if (record.getStudentName() == null || record.getStudentName().isBlank()) {
                    record.setStudentName(u.getName());
                }
            });
        }
    }
}
