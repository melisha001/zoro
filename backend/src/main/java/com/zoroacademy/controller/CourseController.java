package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.CourseModule;
import com.zoroacademy.entity.CourseResource;
import com.zoroacademy.service.CourseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }


    @GetMapping
    public ApiResponse<List<Course>> getCourses(@RequestParam(required = false) String audience) {
        return ApiResponse.ok(courseService.getAllCourses(audience));
    }

    @GetMapping("/{id}")
    public ApiResponse<Course> getCourseById(@PathVariable String id) {
        return ApiResponse.ok(courseService.getCourseById(id));
    }

    @PostMapping
    public ApiResponse<Course> createCourse(@RequestBody Course course) {
        return ApiResponse.ok(courseService.createCourse(course), "Course created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<Course> updateCourse(@PathVariable String id, @RequestBody Course course) {
        return ApiResponse.ok(courseService.updateCourse(id, course), "Course updated successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteCourse(@PathVariable String id) {
        courseService.deleteCourse(id);
        return ApiResponse.ok(true, "Course deleted successfully");
    }

    @PostMapping("/{courseId}/modules")
    public ApiResponse<CourseModule> addModule(@PathVariable String courseId, @RequestBody CourseModule module) {
        return ApiResponse.ok(courseService.addModule(courseId, module), "Module added successfully");
    }

    @PutMapping("/{courseId}/modules/{moduleId}")
    public ApiResponse<CourseModule> updateModule(@PathVariable String courseId,
                                                 @PathVariable String moduleId,
                                                 @RequestBody CourseModule module) {
        return ApiResponse.ok(courseService.updateModule(courseId, moduleId, module), "Module updated successfully");
    }

    @DeleteMapping("/{courseId}/modules/{moduleId}")
    public ApiResponse<Boolean> deleteModule(@PathVariable String courseId, @PathVariable String moduleId) {
        courseService.deleteModule(courseId, moduleId);
        return ApiResponse.ok(true, "Module deleted successfully");
    }

    @PostMapping("/{courseId}/resources")
    public ApiResponse<CourseResource> addResource(@PathVariable String courseId, @RequestBody CourseResource resource) {
        return ApiResponse.ok(courseService.addResource(courseId, resource), "Resource added successfully");
    }

    @DeleteMapping("/{courseId}/resources/{resourceId}")
    public ApiResponse<Boolean> deleteResource(@PathVariable String courseId, @PathVariable String resourceId) {
        courseService.deleteResource(resourceId);
        return ApiResponse.ok(true, "Resource deleted successfully");
    }
}
