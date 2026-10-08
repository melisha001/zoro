package com.zoroacademy.repository;

import com.zoroacademy.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeePaymentRepository extends JpaRepository<FeePayment, String> {
    List<FeePayment> findByFeeId(String feeId);

    @org.springframework.data.jpa.repository.Query("SELECT SUBSTRING(p.paymentDate, 1, 7) AS month, SUM(p.amount) AS total FROM FeePayment p GROUP BY SUBSTRING(p.paymentDate, 1, 7) ORDER BY SUBSTRING(p.paymentDate, 1, 7) ASC")
    List<Object[]> findMonthlyCollections();
}
