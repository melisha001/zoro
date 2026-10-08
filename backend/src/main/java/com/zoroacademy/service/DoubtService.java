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
    public DoubtService(DoubtRepository doubtRepository) {
        this.doubtRepository = doubtRepository;
    }


    @Transactional(readOnly = true)
    public List<Doubt> getAllDoubts() {
        return doubtRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Doubt> getDoubtsByTrainer(String trainer) {
        return doubtRepository.findByTrainerNameIgnoreCase(trainer);
    }

    @Transactional
    public Doubt createDoubt(Doubt doubt) {
        if (doubt.getId() == null || doubt.getId().isBlank()) {
            doubt.setId("dbt_" + System.currentTimeMillis());
        }
        if (doubt.getStatus() == null || doubt.getStatus().isBlank()) {
            doubt.setStatus("Pending");
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
