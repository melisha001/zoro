package com.zoroacademy.repository;

import com.zoroacademy.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseModuleRepository extends JpaRepository<CourseModule, String> {
    List<CourseModule> findByCourseIdOrderByModuleOrderAsc(String courseId);

    @org.springframework.data.jpa.repository.Query("SELECT cm FROM CourseModule cm WHERE cm.notesFileUrl LIKE %:fileId% OR cm.worksheetFileUrl LIKE %:fileId% OR cm.assignmentFileUrl LIKE %:fileId% OR cm.thumbnailUrl LIKE %:fileId%")
    List<CourseModule> findByAnyFileUrlContaining(@org.springframework.data.repository.query.Param("fileId") String fileId);
}
