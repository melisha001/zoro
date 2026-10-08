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
    List<Schedule> findByDate(String date);
    List<Schedule> findAllByOrderByDateAsc();
}
