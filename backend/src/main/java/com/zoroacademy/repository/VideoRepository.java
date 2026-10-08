package com.zoroacademy.repository;

import com.zoroacademy.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoRepository extends JpaRepository<Video, String> {
    Optional<Video> findByBunnyVideoId(String bunnyVideoId);
    List<Video> findByCourseId(String courseId);
    List<Video> findByModuleId(String moduleId);
}
