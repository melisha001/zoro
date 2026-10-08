package com.zoroacademy.repository;

import com.zoroacademy.entity.SalaryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryRecordRepository extends JpaRepository<SalaryRecord, String> {
    List<SalaryRecord> findByTrainerId(String trainerId);
    List<SalaryRecord> findByMonthIgnoreCase(String month);
}
