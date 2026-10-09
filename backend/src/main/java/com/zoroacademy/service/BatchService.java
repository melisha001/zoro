package com.zoroacademy.service;

import com.zoroacademy.entity.*;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BatchService {

    private final BatchRepository batchRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentCourseBatchRepository studentCourseBatchRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final ScheduleRepository scheduleRepository;
    private final AssignmentRepository assignmentRepository;

    public BatchService(BatchRepository batchRepository,
                        CourseRepository courseRepository,
                        UserRepository userRepository,
                        EnrollmentRepository enrollmentRepository,
                        StudentCourseBatchRepository studentCourseBatchRepository,
                        StudentFeeRepository studentFeeRepository,
                        ScheduleRepository scheduleRepository,
                        AssignmentRepository assignmentRepository) {
        this.batchRepository = batchRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.studentFeeRepository = studentFeeRepository;
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
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

    @Transactional(readOnly = true)
    public List<com.zoroacademy.dto.UserDto> getStudentsInBatch(String batchIdOrName) {
        if (batchIdOrName == null || batchIdOrName.isBlank()) {
            return List.of();
        }

        String targetBatchId = batchIdOrName;
        String targetBatchName = batchIdOrName;

        java.util.Optional<Batch> bOpt = batchRepository.findById(batchIdOrName);
        if (bOpt.isPresent()) {
            targetBatchName = bOpt.get().getName();
        } else {
            List<Batch> byName = batchRepository.findByNameIgnoreCase(batchIdOrName);
            if (!byName.isEmpty()) {
                targetBatchId = byName.get(0).getId();
            }
        }

        java.util.Set<String> studentIdentifiers = new java.util.HashSet<>();

        studentCourseBatchRepository.findByBatchId(targetBatchId).forEach(scb -> {
            if (scb.getStudentId() != null) studentIdentifiers.add(scb.getStudentId());
        });

        enrollmentRepository.findByBatchId(targetBatchId).forEach(e -> {
            if (e.getStudentId() != null) studentIdentifiers.add(e.getStudentId());
            if (e.getStudentEmail() != null) studentIdentifiers.add(e.getStudentEmail());
        });
        enrollmentRepository.findByBatchNameIgnoreCase(targetBatchName).forEach(e -> {
            if (e.getStudentId() != null) studentIdentifiers.add(e.getStudentId());
            if (e.getStudentEmail() != null) studentIdentifiers.add(e.getStudentEmail());
        });

        if (studentIdentifiers.isEmpty()) {
            return List.of();
        }

        List<User> students = userRepository.findAll().stream()
                .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
                .filter(u -> studentIdentifiers.contains(u.getId()) || studentIdentifiers.contains(u.getEmail()))
                .toList();

        return students.stream().map(com.zoroacademy.dto.UserDto::fromEntity).toList();
    }

    @Transactional
    public Batch createBatch(Batch batch) {
        if (batch.getId() == null || batch.getId().isBlank()) {
            batch.setId("btc_" + UUID.randomUUID());
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
        final Batch targetBatch = getBatchById(id);
        String oldName = targetBatch.getName();

        if (updated.getName() != null) targetBatch.setName(updated.getName());
        if (updated.getDays() != null) targetBatch.setDays(updated.getDays());
        if (updated.getSession() != null) targetBatch.setSession(updated.getSession());
        if (updated.getStatus() != null) targetBatch.setStatus(updated.getStatus());

        // Update Course
        if (updated.getCourseId() != null && !updated.getCourseId().isBlank()) {
            targetBatch.setCourseId(updated.getCourseId());
            courseRepository.findById(updated.getCourseId()).ifPresent(c -> targetBatch.setCourseName(c.getTitle()));
        } else if (updated.getCourseName() != null && !updated.getCourseName().isBlank()) {
            targetBatch.setCourseName(updated.getCourseName());
            courseRepository.findByTitleIgnoreCase(updated.getCourseName()).ifPresent(c -> targetBatch.setCourseId(c.getId()));
        }

        // Update Trainer
        if (updated.getTrainerId() != null && !updated.getTrainerId().isBlank()) {
            targetBatch.setTrainerId(updated.getTrainerId());
            userRepository.findById(updated.getTrainerId()).ifPresent(u -> targetBatch.setTrainerName(u.getName()));
        } else if (updated.getTrainerName() != null) {
            targetBatch.setTrainerName(updated.getTrainerName());
            userRepository.findByNameIgnoreCase(updated.getTrainerName()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> targetBatch.setTrainerId(u.getId()));
        }

        Batch savedBatch = batchRepository.save(targetBatch);

        // Propagate renamed batch name to related records
        if (updated.getName() != null && !updated.getName().equalsIgnoreCase(oldName)) {
            String newName = updated.getName();
            String bId = savedBatch.getId();

            for (Enrollment e : enrollmentRepository.findByBatchId(bId)) {
                e.setBatchName(newName);
                enrollmentRepository.save(e);
            }
            for (StudentCourseBatch scb : studentCourseBatchRepository.findByBatchId(bId)) {
                scb.setBatchName(newName);
                studentCourseBatchRepository.save(scb);
            }
            for (StudentFee f : studentFeeRepository.findByBatchId(bId)) {
                f.setBatch(newName);
                studentFeeRepository.save(f);
            }
            for (Schedule s : scheduleRepository.findByBatchId(bId)) {
                s.setBatch(newName);
                scheduleRepository.save(s);
            }
            for (Assignment a : assignmentRepository.findByBatchId(bId)) {
                a.setBatch(newName);
                assignmentRepository.save(a);
            }
        }

        return savedBatch;
    }

    @Transactional
    public void deleteBatch(String id) {
        List<StudentCourseBatch> assignedStudents = studentCourseBatchRepository.findByBatchId(id);
        if (!assignedStudents.isEmpty()) {
            throw new ConflictException("Cannot delete batch with " + assignedStudents.size() + " active student assignments");
        }
        List<Enrollment> enrollments = enrollmentRepository.findByBatchId(id).stream()
                .filter(e -> "Active".equalsIgnoreCase(e.getStatus()))
                .toList();
        if (!enrollments.isEmpty()) {
            throw new ConflictException("Cannot delete batch with " + enrollments.size() + " active enrollments");
        }
        batchRepository.deleteById(id);
    }
}
