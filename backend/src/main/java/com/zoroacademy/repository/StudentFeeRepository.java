package com.zoroacademy.repository;

import com.zoroacademy.entity.StudentFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentFeeRepository extends JpaRepository<StudentFee, String> {
    List<StudentFee> findByStudentId(String studentId);
    List<StudentFee> findByCourseId(String courseId);
    List<StudentFee> findByBatchId(String batchId);
    List<StudentFee> findByStatusIgnoreCase(String status);
    Optional<StudentFee> findByStudentIdAndCourseId(String studentId, String courseId);
    Optional<StudentFee> findByStudentIdAndCourseIgnoreCase(String studentId, String course);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(f.paidAmount), 0) FROM StudentFee f")
    java.math.BigDecimal sumTotalPaidAmount();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(f.dueAmount), 0) FROM StudentFee f")
    java.math.BigDecimal sumTotalDueAmount();

    long countByStatusIgnoreCase(String status);
}
