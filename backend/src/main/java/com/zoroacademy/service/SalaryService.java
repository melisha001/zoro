package com.zoroacademy.service;

import com.zoroacademy.entity.Notification;
import com.zoroacademy.entity.SalaryRecord;
import com.zoroacademy.repository.NotificationRepository;
import com.zoroacademy.repository.SalaryRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SalaryService {

    private final SalaryRecordRepository salaryRepository;
    private final NotificationRepository notificationRepository;

    @Autowired
    public SalaryService(SalaryRecordRepository salaryRepository,
                         @Autowired(required = false) NotificationRepository notificationRepository) {
        this.salaryRepository = salaryRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<SalaryRecord> getAllSalaryRecords() {
        return salaryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<SalaryRecord> getTrainerSalaryRecords(String trainerId) {
        return salaryRepository.findByTrainerId(trainerId);
    }

    @Transactional
    public SalaryRecord createSalaryRecord(SalaryRecord record) {
        if (record.getId() == null || record.getId().isBlank()) {
            record.setId("sal_" + UUID.randomUUID().toString());
        }
        if (record.getStatus() == null || record.getStatus().isBlank()) {
            record.setStatus("Paid");
        }
        SalaryRecord saved = salaryRepository.save(record);

        // Notify the trainer when payment is recorded
        if (notificationRepository != null && "Paid".equalsIgnoreCase(saved.getStatus()) && saved.getTrainerId() != null) {
            String month = saved.getMonth() != null ? saved.getMonth() : "the current cycle";
            Notification notif = Notification.builder()
                    .id("notif_" + UUID.randomUUID().toString())
                    .recipientRole("TRAINER")
                    .recipientId(saved.getTrainerId())
                    .title("Salary Credited")
                    .message("Your salary for " + month + " has been credited")
                    .readStatus(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        }

        return saved;
    }

    @Transactional
    public SalaryRecord updateSalaryRecord(String id, SalaryRecord updated) {
        SalaryRecord existing = salaryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Salary record not found: " + id));
        if (updated.getAmount() != null) existing.setAmount(updated.getAmount());
        if (updated.getMonth() != null) existing.setMonth(updated.getMonth());
        if (updated.getPaymentDate() != null) existing.setPaymentDate(updated.getPaymentDate());
        if (updated.getPaymentMethod() != null) existing.setPaymentMethod(updated.getPaymentMethod());
        if (updated.getTransactionId() != null) existing.setTransactionId(updated.getTransactionId());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        return salaryRepository.save(existing);
    }

    @Transactional
    public void deleteSalaryRecord(String id) {
        salaryRepository.deleteById(id);
    }
}
