package com.zoroacademy.service;

import com.zoroacademy.entity.SalaryRecord;
import com.zoroacademy.repository.SalaryRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SalaryService {

    private final SalaryRecordRepository salaryRepository;
    public SalaryService(SalaryRecordRepository salaryRepository) {
        this.salaryRepository = salaryRepository;
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
            record.setId("sal_" + System.currentTimeMillis());
        }
        if (record.getStatus() == null || record.getStatus().isBlank()) {
            record.setStatus("Paid");
        }
        return salaryRepository.save(record);
    }

    @Transactional
    public SalaryRecord updateSalaryRecord(String id, SalaryRecord updated) {
        SalaryRecord existing = salaryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Salary record not found: " + id));
        if (updated.getAmount() != null) existing.setAmount(updated.getAmount());
        if (updated.getMonth() != null) existing.setMonth(updated.getMonth());
        if (updated.getPaymentDate() != null) existing.setPaymentDate(updated.getPaymentDate());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        return salaryRepository.save(existing);
    }

    @Transactional
    public void deleteSalaryRecord(String id) {
        salaryRepository.deleteById(id);
    }
}
