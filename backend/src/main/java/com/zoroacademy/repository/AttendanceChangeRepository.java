package com.zoroacademy.repository;

import com.zoroacademy.entity.AttendanceChange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceChangeRepository extends JpaRepository<AttendanceChange, String> {
    List<AttendanceChange> findByAttendanceId(String attendanceId);
    List<AttendanceChange> findByScheduleId(String scheduleId);
    List<AttendanceChange> findByStudentId(String studentId);
}
