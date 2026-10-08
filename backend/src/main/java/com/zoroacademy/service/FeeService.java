package com.zoroacademy.service;

import com.zoroacademy.entity.FeePayment;
import com.zoroacademy.entity.StudentFee;
import com.zoroacademy.repository.FeePaymentRepository;
import com.zoroacademy.repository.StudentFeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FeeService {

    private final StudentFeeRepository feeRepository;
    private final FeePaymentRepository paymentRepository;
    public FeeService(StudentFeeRepository feeRepository, FeePaymentRepository paymentRepository) {
        this.feeRepository = feeRepository;
        this.paymentRepository = paymentRepository;
    }


    @Transactional(readOnly = true)
    public List<StudentFee> getAllFeeRecords() {
        return feeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public StudentFee getFeeById(String id) {
        return feeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fee record not found: " + id));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFeeStats() {
        List<StudentFee> all = feeRepository.findAll();
        BigDecimal totalCollections = all.stream()
                .map(StudentFee::getPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingDues = all.stream()
                .map(StudentFee::getDueAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long paidCount = all.stream().filter(f -> "Paid".equalsIgnoreCase(f.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCollections", totalCollections);
        stats.put("pendingDues", pendingDues);
        stats.put("paidCount", paidCount);
        stats.put("totalRecords", all.size());
        return stats;
    }

    @Transactional
    public StudentFee createFeeRecord(StudentFee fee) {
        if (fee.getId() == null || fee.getId().isBlank()) {
            fee.setId("fee_" + System.currentTimeMillis());
        }
        if (fee.getStudentId() == null || fee.getStudentId().isBlank()) {
            fee.setStudentId(fee.getStudentName() != null 
                ? "std_" + fee.getStudentName().replaceAll("\\s+", "").toLowerCase() 
                : "std_" + System.currentTimeMillis());
        }
        if (fee.getCourse() == null || fee.getCourse().isBlank()) {
            fee.setCourse("English Communication");
        }
        if (fee.getDate() == null || fee.getDate().isBlank()) {
            fee.setDate(LocalDate.now().toString());
        }
        if (fee.getDueAmount() == null) {
            BigDecimal total = fee.getTotalFee() != null ? fee.getTotalFee() : BigDecimal.ZERO;
            BigDecimal paid = fee.getPaidAmount() != null ? fee.getPaidAmount() : BigDecimal.ZERO;
            fee.setDueAmount(total.subtract(paid).max(BigDecimal.ZERO));
        }
        if (fee.getDueAmount().compareTo(BigDecimal.ZERO) == 0) {
            fee.setStatus("Paid");
        } else {
            fee.setStatus("Pending");
        }
        return feeRepository.save(fee);
    }

    @Transactional
    public StudentFee recordPayment(String feeIdOrStudentId, BigDecimal amount, String method, String ref, String notes) {
        StudentFee fee = feeRepository.findById(feeIdOrStudentId)
                .or(() -> feeRepository.findByStudentId(feeIdOrStudentId).stream().findFirst())
                .orElseThrow(() -> new IllegalArgumentException("Fee record not found: " + feeIdOrStudentId));

        BigDecimal currentPaid = fee.getPaidAmount() != null ? fee.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal newPaid = currentPaid.add(amount);
        BigDecimal total = fee.getTotalFee() != null ? fee.getTotalFee() : BigDecimal.ZERO;
        BigDecimal newDue = total.subtract(newPaid).max(BigDecimal.ZERO);

        fee.setPaidAmount(newPaid);
        fee.setDueAmount(newDue);
        fee.setStatus(newDue.compareTo(BigDecimal.ZERO) == 0 ? "Paid" : "Pending");
        fee = feeRepository.save(fee);

        FeePayment payment = FeePayment.builder()
                .id("pay_" + System.currentTimeMillis())
                .fee(fee)
                .amount(amount)
                .paymentMethod(method != null ? method : "Online")
                .transactionRef(ref)
                .paymentDate(LocalDate.now().toString())
                .notes(notes)
                .build();
        paymentRepository.save(payment);

        return fee;
    }

    @Transactional
    public void deleteFeeRecord(String id) {
        if (!feeRepository.existsById(id)) {
            throw new IllegalArgumentException("Fee record not found: " + id);
        }
        feeRepository.deleteById(id);
    }

    @Transactional
    public StudentFee deletePayment(String paymentId) {
        FeePayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found: " + paymentId));
        StudentFee fee = payment.getFee();
        if (fee != null) {
            fee.getPayments().remove(payment);
            paymentRepository.delete(payment);

            // Recalculate fee totals from remaining payments
            BigDecimal totalPaid = fee.getPayments().stream()
                    .map(FeePayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalFee = fee.getTotalFee() != null ? fee.getTotalFee() : BigDecimal.ZERO;
            BigDecimal due = totalFee.subtract(totalPaid).max(BigDecimal.ZERO);

            fee.setPaidAmount(totalPaid);
            fee.setDueAmount(due);
            if (due.compareTo(BigDecimal.ZERO) == 0) {
                fee.setStatus("Paid");
            } else {
                fee.setStatus("Pending");
            }
            return feeRepository.save(fee);
        } else {
            paymentRepository.delete(payment);
            return null;
        }
    }
}
