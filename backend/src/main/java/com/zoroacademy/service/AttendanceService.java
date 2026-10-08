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

    public AttendanceService(AttendanceRecordRepository attendanceRepository,
                             com.zoroacademy.repository.UserRepository userRepository,
                             com.zoroacademy.repository.ScheduleRepository scheduleRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getBySchedule(String scheduleId) {
        return attendanceRepository.findByScheduleId(scheduleId);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getByStudent(String studentIdOrEmail) {
        // Resolve studentId if email was passed
        String effectiveId = studentIdOrEmail;
        if (studentIdOrEmail != null && studentIdOrEmail.contains("@")) {
            effectiveId = userRepository.findByEmailIgnoreCase(studentIdOrEmail)
                    .map(com.zoroacademy.entity.User::getId)
                    .orElse(studentIdOrEmail);
        }
        return attendanceRepository.findByStudentId(effectiveId);
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
