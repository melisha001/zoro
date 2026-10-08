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
    public AttendanceService(AttendanceRecordRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
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
    public List<AttendanceRecord> getByStudent(String studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    @Transactional
    public AttendanceRecord recordAttendance(AttendanceRecord record) {
        if (record.getId() == null || record.getId().isBlank()) {
            record.setId("att_" + System.currentTimeMillis());
        }
        if (record.getDate() == null || record.getDate().isBlank()) {
            record.setDate(LocalDate.now().toString());
        }
        return attendanceRepository.save(record);
    }

    @Transactional
    public List<AttendanceRecord> recordBatchAttendance(List<AttendanceRecord> records) {
        records.forEach(r -> {
            if (r.getId() == null || r.getId().isBlank()) {
                r.setId("att_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000));
            }
            if (r.getDate() == null || r.getDate().isBlank()) {
                r.setDate(LocalDate.now().toString());
            }
        });
        return attendanceRepository.saveAll(records);
    }
}
