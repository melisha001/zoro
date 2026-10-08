package com.zoroacademy.service;

import com.zoroacademy.entity.Batch;
import com.zoroacademy.repository.BatchRepository;
import com.zoroacademy.repository.CourseRepository;
import com.zoroacademy.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BatchService {

    private final BatchRepository batchRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public BatchService(BatchRepository batchRepository,
                        CourseRepository courseRepository,
                        UserRepository userRepository) {
        this.batchRepository = batchRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Batch> getBatchesByCourse(String courseIdOrName) {
        if (courseIdOrName == null || courseIdOrName.isBlank()) {
            return getAllBatches();
        }
        List<Batch> byId = batchRepository.findByCourseId(courseIdOrName);
        if (!byId.isEmpty()) {
            return byId;
        }
        return batchRepository.findByCourseNameIgnoreCase(courseIdOrName);
    }

    @Transactional(readOnly = true)
    public List<Batch> getBatchesByTrainer(String trainerIdOrName) {
        if (trainerIdOrName == null || trainerIdOrName.isBlank()) {
            return getAllBatches();
        }
        return batchRepository.findByTrainerIdOrTrainerNameIgnoreCase(trainerIdOrName, trainerIdOrName);
    }

    @Transactional(readOnly = true)
    public Batch getBatchById(String id) {
        return batchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found: " + id));
    }

    @Transactional
    public Batch createBatch(Batch batch) {
        if (batch.getId() == null || batch.getId().isBlank()) {
            batch.setId("btc_" + java.util.UUID.randomUUID());
        }

        // Resolve Course
        if (batch.getCourseId() != null && !batch.getCourseId().isBlank()) {
            courseRepository.findById(batch.getCourseId()).ifPresent(c -> batch.setCourseName(c.getTitle()));
        } else if (batch.getCourseName() != null && !batch.getCourseName().isBlank()) {
            courseRepository.findByTitleIgnoreCase(batch.getCourseName()).ifPresent(c -> batch.setCourseId(c.getId()));
        }

        // Resolve Trainer
        if (batch.getTrainerId() != null && !batch.getTrainerId().isBlank()) {
            userRepository.findById(batch.getTrainerId()).ifPresent(u -> batch.setTrainerName(u.getName()));
        } else if (batch.getTrainerName() != null && !batch.getTrainerName().isBlank()) {
            userRepository.findByNameIgnoreCase(batch.getTrainerName()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> batch.setTrainerId(u.getId()));
        }

        return batchRepository.save(batch);
    }

    @Transactional
    public Batch updateBatch(String id, Batch updated) {
        Batch existing = getBatchById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDays() != null) existing.setDays(updated.getDays());
        if (updated.getSession() != null) existing.setSession(updated.getSession());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());

        // Update Course
        if (updated.getCourseId() != null && !updated.getCourseId().isBlank()) {
            existing.setCourseId(updated.getCourseId());
            courseRepository.findById(updated.getCourseId()).ifPresent(c -> existing.setCourseName(c.getTitle()));
        } else if (updated.getCourseName() != null && !updated.getCourseName().isBlank()) {
            existing.setCourseName(updated.getCourseName());
            courseRepository.findByTitleIgnoreCase(updated.getCourseName()).ifPresent(c -> existing.setCourseId(c.getId()));
        }

        // Update Trainer
        if (updated.getTrainerId() != null && !updated.getTrainerId().isBlank()) {
            existing.setTrainerId(updated.getTrainerId());
            userRepository.findById(updated.getTrainerId()).ifPresent(u -> existing.setTrainerName(u.getName()));
        } else if (updated.getTrainerName() != null) {
            existing.setTrainerName(updated.getTrainerName());
            userRepository.findByNameIgnoreCase(updated.getTrainerName()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> existing.setTrainerId(u.getId()));
        }

        return batchRepository.save(existing);
    }

    @Transactional
    public void deleteBatch(String id) {
        batchRepository.deleteById(id);
    }
}
