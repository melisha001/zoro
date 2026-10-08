package com.zoroacademy.repository;

import com.zoroacademy.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, String> {
    List<AttendanceRecord> findByScheduleId(String scheduleId);
    List<AttendanceRecord> findByStudentId(String studentId);
    List<AttendanceRecord> findByDate(String date);
    java.util.Optional<AttendanceRecord> findByStudentIdAndScheduleId(String studentId, String scheduleId);
    long countByStatusIgnoreCase(String status);
}
