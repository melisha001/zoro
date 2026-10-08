package com.zoroacademy.repository;

import com.zoroacademy.entity.Doubt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoubtRepository extends JpaRepository<Doubt, String> {
    List<Doubt> findByStudentId(String studentId);
    List<Doubt> findByCourseId(String courseId);
    List<Doubt> findByTrainerId(String trainerId);
    List<Doubt> findByTrainerNameIgnoreCase(String trainerName);
    List<Doubt> findByTrainerIdOrTrainerNameIgnoreCase(String trainerId, String trainerName);
    List<Doubt> findByStatusIgnoreCase(String status);
}
