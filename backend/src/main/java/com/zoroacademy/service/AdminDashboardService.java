package com.zoroacademy.service;

import com.zoroacademy.repository.*;
import com.zoroacademy.entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final BatchRepository batchRepository;
    private final StudentFeeRepository feeRepository;
    private final FeePaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final SalaryRecordRepository salaryRepository;
    private final CompetitionRegistrationRepository compRegRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final ActivityLogRepository activityLogRepository;

    public AdminDashboardService(
            UserRepository userRepository,
            CourseRepository courseRepository,
            BatchRepository batchRepository,
            StudentFeeRepository feeRepository,
            FeePaymentRepository paymentRepository,
            ExpenseRepository expenseRepository,
            SalaryRecordRepository salaryRepository,
            CompetitionRegistrationRepository compRegRepository,
            AttendanceRecordRepository attendanceRepository,
            ActivityLogRepository activityLogRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
        this.feeRepository = feeRepository;
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.salaryRepository = salaryRepository;
        this.compRegRepository = compRegRepository;
        this.attendanceRepository = attendanceRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = new HashMap<>();

        // 1. User & Course counts via COUNT(*)
        long studentCount = userRepository.countLearningStudents();
        long trainerCount = userRepository.countByRole("TRAINER");
        long courseCount = courseRepository.count();
        long batchCount = batchRepository.count();

        // 2. Financial Metrics via SUM(*) queries
        BigDecimal studentFeeIncome = feeRepository.sumTotalPaidAmount();
        BigDecimal pendingDues = feeRepository.sumTotalDueAmount();
        BigDecimal competitionIncome = compRegRepository.sumPaidCompetitionFees();

        BigDecimal totalIncome = studentFeeIncome.add(competitionIncome);

        BigDecimal manualExpenses = expenseRepository.sumTotalAmount();
        BigDecimal salaryExpenses = salaryRepository.sumPaidSalaries();

        BigDecimal totalExpenses = manualExpenses.add(salaryExpenses);
        BigDecimal netBalance = totalIncome.subtract(totalExpenses);

        // 3. Attendance via DB COUNT queries
        long presentCount = attendanceRepository.countByStatusIgnoreCase("Present") + attendanceRepository.countByStatusIgnoreCase("PRESENT");
        long totalAttendanceRecords = attendanceRepository.count();
        int attendanceRate = totalAttendanceRecords > 0
                ? (int) Math.round(((double) presentCount / totalAttendanceRecords) * 100)
                : 0;

        // 4. Monthly admissions & collections trends via real GROUP BY queries
        List<Map<String, Object>> monthlyAdmissions = new ArrayList<>();
        List<Object[]> admRows = userRepository.findMonthlyStudentRegistrations();
        for (Object[] row : admRows) {
            Map<String, Object> adm = new HashMap<>();
            adm.put("month", row[0] != null ? row[0].toString() : "Unknown");
            adm.put("students", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            monthlyAdmissions.add(adm);
        }

        List<Map<String, Object>> monthlyCollections = new ArrayList<>();
        List<Object[]> colRows = paymentRepository.findMonthlyCollections();
        for (Object[] row : colRows) {
            Map<String, Object> col = new HashMap<>();
            col.put("month", row[0] != null ? row[0].toString() : "Unknown");
            col.put("fees", row[1] != null ? row[1] : BigDecimal.ZERO);
            monthlyCollections.add(col);
        }

        data.put("studentCount", studentCount);
        data.put("trainerCount", trainerCount);
        data.put("courseCount", courseCount);
        data.put("batchCount", batchCount);
        data.put("studentFeeIncome", studentFeeIncome);
        data.put("pendingDues", pendingDues);
        data.put("competitionIncome", competitionIncome);
        data.put("totalIncome", totalIncome);
        data.put("totalExpenses", totalExpenses);
        data.put("manualExpenses", manualExpenses);
        data.put("salaryExpenses", salaryExpenses);
        data.put("netBalance", netBalance);
        data.put("attendancePresent", presentCount);
        data.put("attendanceTotal", totalAttendanceRecords > 0 ? totalAttendanceRecords : studentCount);
        data.put("attendanceRate", attendanceRate);
        data.put("monthlyAdmissions", monthlyAdmissions);
        data.put("monthlyCollections", monthlyCollections);

        return data;
    }
}
