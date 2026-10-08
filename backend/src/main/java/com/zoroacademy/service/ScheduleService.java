package com.zoroacademy.service;

import com.zoroacademy.entity.Schedule;
import com.zoroacademy.repository.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    public ScheduleService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }


    @Transactional(readOnly = true)
    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAllByOrderByDateAsc();
    }

    @Transactional(readOnly = true)
    public List<Schedule> getTrainerSchedules(String trainer) {
        String lower = trainer.toLowerCase().trim();
        return scheduleRepository.findAllByOrderByDateAsc().stream()
                .filter(s -> s.getTrainer() != null && s.getTrainer().toLowerCase().contains(lower))
                .collect(Collectors.toList());
    }

    @Transactional
    public Schedule createSchedule(Schedule schedule) {
        if (schedule.getId() == null || schedule.getId().isBlank()) {
            schedule.setId("sch_" + System.currentTimeMillis());
        }
        if (schedule.getStatus() == null || schedule.getStatus().isBlank()) {
            schedule.setStatus("Upcoming");
        }
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
        if (updated.getTime() != null) existing.setTime(updated.getTime());
        if (updated.getDate() != null) existing.setDate(updated.getDate());
        if (updated.getMode() != null) existing.setMode(updated.getMode());
        if (updated.getMeetLink() != null) existing.setMeetLink(updated.getMeetLink());
        if (updated.getStudentsCount() != null) existing.setStudentsCount(updated.getStudentsCount());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());

        return scheduleRepository.save(existing);
    }

    @Transactional
    public void deleteSchedule(String id) {
        scheduleRepository.deleteById(id);
    }
}
