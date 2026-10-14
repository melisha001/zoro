package com.zoroacademy.repository;

import com.zoroacademy.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    List<Schedule> findByBatchIgnoreCase(String batch);
    List<Schedule> findByCourseIgnoreCase(String course);
    List<Schedule> findByTrainerIgnoreCase(String trainer);
    List<Schedule> findByTrainerId(String trainerId);
    List<Schedule> findByCourseId(String courseId);
    List<Schedule> findByBatchId(String batchId);
    List<Schedule> findByTrainerIdOrderByDateAsc(String trainerId);
    List<Schedule> findByTrainerIdOrTrainerIgnoreCaseOrderByDateAsc(String trainerId, String trainer);
    List<Schedule> findByDate(String date);
    List<Schedule> findAllByOrderByDateAsc();

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Schedule s WHERE s.notesFileUrl LIKE %:fileId% OR s.worksheetFileUrl LIKE %:fileId% OR s.assignmentFileUrl LIKE %:fileId%")
    List<Schedule> findByAnyFileUrlContaining(@org.springframework.data.repository.query.Param("fileId") String fileId);
}
