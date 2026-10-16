package com.zoroacademy.repository;

import com.zoroacademy.entity.TrainerAttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainerAttendanceRecordRepository extends JpaRepository<TrainerAttendanceRecord, String> {
    List<TrainerAttendanceRecord> findByScheduleId(String scheduleId);
    List<TrainerAttendanceRecord> findByTrainerId(String trainerId);
    Optional<TrainerAttendanceRecord> findByScheduleIdAndTrainerId(String scheduleId, String trainerId);
    List<TrainerAttendanceRecord> findByDate(String date);
    long countByStatusIgnoreCase(String status);
    void deleteByScheduleId(String scheduleId);
}
