package com.zoroacademy.service;

import com.zoroacademy.entity.Doubt;
import com.zoroacademy.repository.DoubtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DoubtService {

    private final DoubtRepository doubtRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;

    public DoubtService(DoubtRepository doubtRepository, com.zoroacademy.repository.UserRepository userRepository) {
        this.doubtRepository = doubtRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Doubt> getAllDoubts() {
        return doubtRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Doubt> getDoubtsByTrainer(String trainerIdOrName) {
        return doubtRepository.findByTrainerIdOrTrainerNameIgnoreCase(trainerIdOrName, trainerIdOrName);
    }

    @Transactional
    public Doubt createDoubt(Doubt doubt) {
        if (doubt.getId() == null || doubt.getId().isBlank()) {
            doubt.setId("dbt_" + java.util.UUID.randomUUID());
        }
        if (doubt.getStatus() == null || doubt.getStatus().isBlank()) {
            doubt.setStatus("Pending");
        }

        // Relational student resolution
        if (doubt.getStudentId() != null && doubt.getStudentId().contains("@")) {
            userRepository.findByEmailIgnoreCase(doubt.getStudentId()).ifPresent(u -> {
                doubt.setStudentId(u.getId());
                if (doubt.getStudentName() == null) doubt.setStudentName(u.getName());
            });
        } else if (doubt.getStudentId() != null && !doubt.getStudentId().isBlank()) {
            userRepository.findById(doubt.getStudentId()).ifPresent(u -> {
                if (doubt.getStudentName() == null) doubt.setStudentName(u.getName());
            });
        }

        // Relational trainer resolution
        if (doubt.getTrainerId() != null && !doubt.getTrainerId().isBlank()) {
            userRepository.findById(doubt.getTrainerId()).ifPresent(u -> doubt.setTrainerName(u.getName()));
        } else if (doubt.getTrainerName() != null && !doubt.getTrainerName().isBlank()) {
            userRepository.findByNameIgnoreCase(doubt.getTrainerName()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> doubt.setTrainerId(u.getId()));
        }

        return doubtRepository.save(doubt);
    }

    @Transactional
    public Doubt replyToDoubt(String id, String reply, String trainerName) {
        Doubt doubt = doubtRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doubt not found: " + id));

        doubt.setReply(reply);
        if (trainerName != null) doubt.setTrainerName(trainerName);
        doubt.setReplyDate(LocalDate.now().toString());
        return doubtRepository.save(doubt);
    }

    @Transactional
    public void deleteDoubt(String id) {
        doubtRepository.deleteById(id);
    }
}
