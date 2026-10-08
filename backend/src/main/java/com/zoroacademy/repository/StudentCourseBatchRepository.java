package com.zoroacademy.repository;

import com.zoroacademy.entity.StudentCourseBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentCourseBatchRepository extends JpaRepository<StudentCourseBatch, Long> {
    List<StudentCourseBatch> findByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
