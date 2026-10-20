package com.zoroacademy.repository;

import com.zoroacademy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsernameIgnoreCase(String username);
    List<User> findByRoleIgnoreCase(String role);
    List<User> findByNameIgnoreCase(String name);
    long countByRoleIgnoreCase(String role);
    long countByRole(String role);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);

    @org.springframework.data.jpa.repository.Query("SELECT SUBSTRING(u.joinedOn, 1, 7) AS month, COUNT(u) AS total FROM User u WHERE UPPER(u.role) = 'STUDENT' AND u.joinedOn IS NOT NULL GROUP BY SUBSTRING(u.joinedOn, 1, 7) ORDER BY SUBSTRING(u.joinedOn, 1, 7) ASC")
    List<Object[]> findMonthlyStudentRegistrations();

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u JOIN StudentCourseBatch scb ON scb.studentId = u.id WHERE scb.batchId = :batchId AND UPPER(u.role) = 'STUDENT'")
    List<User> findStudentsByBatchId(@org.springframework.data.repository.query.Param("batchId") String batchId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u JOIN StudentCourseBatch scb ON scb.studentId = u.id WHERE scb.batchId = :batchId AND UPPER(u.role) = 'STUDENT'")
    long countStudentsByBatchId(@org.springframework.data.repository.query.Param("batchId") String batchId);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE UPPER(u.role) = 'STUDENT' AND (u.origin IS NULL OR u.origin != 'COMPETITION' OR EXISTS (SELECT e FROM Enrollment e WHERE e.studentId = u.id AND UPPER(e.status) = 'ACTIVE'))")
    List<User> findLearningStudents();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u WHERE UPPER(u.role) = 'STUDENT' AND (u.origin IS NULL OR u.origin != 'COMPETITION' OR EXISTS (SELECT e FROM Enrollment e WHERE e.studentId = u.id AND UPPER(e.status) = 'ACTIVE'))")
    long countLearningStudents();
}
