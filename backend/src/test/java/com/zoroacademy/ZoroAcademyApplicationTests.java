package com.zoroacademy;

import com.zoroacademy.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class ZoroAcademyApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentFeeRepository studentFeeRepository;

    @Autowired
    private SalaryRecordRepository salaryRecordRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private CompetitionRegistrationRepository competitionRegistrationRepository;

    @Autowired
    private FeePaymentRepository feePaymentRepository;

    @Test
    @DisplayName("Context loads successfully and validates JPA repository query derivations")
    void contextLoads() {
        assertNotNull(userRepository);
    }

    @Test
    @DisplayName("Verify findMonthlyStudentRegistrations executes without entity attribute errors")
    void testFindMonthlyStudentRegistrations() {
        assertNotNull(userRepository.findMonthlyStudentRegistrations());
    }

    @Test
    @DisplayName("Verify all custom @Query JPQL queries execute successfully against the schema")
    void testAllCustomRepositoryQueries() {
        assertNotNull(userRepository.findMonthlyStudentRegistrations());
        assertNotNull(studentFeeRepository.sumTotalPaidAmount());
        assertNotNull(studentFeeRepository.sumTotalDueAmount());
        assertNotNull(salaryRecordRepository.sumPaidSalaries());
        assertNotNull(expenseRepository.sumTotalAmount());
        assertNotNull(competitionRegistrationRepository.sumPaidCompetitionFees());
        assertNotNull(feePaymentRepository.findMonthlyCollections());
    }
}
