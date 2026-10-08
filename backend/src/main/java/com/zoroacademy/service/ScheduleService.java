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
    private final com.zoroacademy.repository.CourseRepository courseRepository;
    private final com.zoroacademy.repository.BatchRepository batchRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;

    public ScheduleService(ScheduleRepository scheduleRepository,
                           com.zoroacademy.repository.CourseRepository courseRepository,
                           com.zoroacademy.repository.BatchRepository batchRepository,
                           com.zoroacademy.repository.UserRepository userRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAllByOrderByDateAsc();
    }

    @Transactional(readOnly = true)
    public List<Schedule> getTrainerSchedules(String trainerIdOrName) {
        return scheduleRepository.findByTrainerIdOrTrainerIgnoreCaseOrderByDateAsc(trainerIdOrName, trainerIdOrName);
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
            courseRepository.findById(schedule.getCourseId()).ifPresent(c -> schedule.setCourse(c.getTitle()));
        } else if (schedule.getCourse() != null && !schedule.getCourse().isBlank()) {
            courseRepository.findByTitleIgnoreCase(schedule.getCourse()).ifPresent(c -> schedule.setCourseId(c.getId()));
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
