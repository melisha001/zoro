package com.zoroacademy.repository;

import com.zoroacademy.entity.CourseResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseResourceRepository extends JpaRepository<CourseResource, String> {
    List<CourseResource> findByCourseId(String courseId);
    List<CourseResource> findByCourseIdAndTargetAudienceIgnoreCase(String courseId, String targetAudience);
}
