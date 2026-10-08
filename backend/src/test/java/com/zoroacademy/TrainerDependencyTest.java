package com.zoroacademy;

import com.zoroacademy.dto.TrainerDependencyDto;
import com.zoroacademy.dto.TrainerReplacementRequest;
import com.zoroacademy.entity.Batch;
import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.Schedule;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class TrainerDependencyTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private EnrollmentRepository enrollmentRepository;
    private CourseRepository courseRepository;
    private BatchRepository batchRepository;
    private ScheduleRepository scheduleRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        courseRepository = mock(CourseRepository.class);
        batchRepository = mock(BatchRepository.class);
        scheduleRepository = mock(ScheduleRepository.class);

        userService = new UserService(userRepository, passwordEncoder, studentCourseBatchRepository,
                enrollmentRepository, courseRepository, batchRepository, scheduleRepository);
    }

    @Test
    void testGetTrainerDependenciesWithAssignedEntities() {
        User trainer = User.builder().id("trn_1").name("Trainer Alice").role("TRAINER").status("Active").build();
        when(userRepository.findById("trn_1")).thenReturn(Optional.of(trainer));

        Course c = new Course();
        c.setId("c_1");
        c.setTitle("Phonics Basic");
        c.setTrainerId("trn_1");
        when(courseRepository.findAll()).thenReturn(List.of(c));

        Batch b = new Batch();
        b.setId("b_1");
        b.setName("Batch Morning");
        b.setCourseName("Phonics Basic");
        b.setTrainerId("trn_1");
        when(batchRepository.findAll()).thenReturn(List.of(b));

        when(scheduleRepository.findAll()).thenReturn(Collections.emptyList());

        TrainerDependencyDto dto = userService.getTrainerDependencies("trn_1");

        assertNotNull(dto);
        assertTrue(dto.isHasDependencies());
        assertEquals(1, dto.getCourseCount());
        assertEquals(1, dto.getBatchCount());
        assertEquals(0, dto.getScheduleCount());
    }

    @Test
    void testReplaceTrainerAndInactivate() {
        User oldTrainer = User.builder().id("trn_1").name("Old Trainer").role("TRAINER").status("Active").build();
        User newTrainer = User.builder().id("trn_2").name("New Trainer").role("TRAINER").status("Active").build();

        when(userRepository.findById("trn_1")).thenReturn(Optional.of(oldTrainer));
        when(userRepository.findById("trn_2")).thenReturn(Optional.of(newTrainer));

        Course c = new Course();
        c.setId("c_1");
        c.setTrainerId("trn_1");
        c.setAssignedTrainer("Old Trainer");
        when(courseRepository.findAll()).thenReturn(List.of(c));

        Batch b = new Batch();
        b.setId("b_1");
        b.setTrainerId("trn_1");
        b.setTrainerName("Old Trainer");
        when(batchRepository.findAll()).thenReturn(List.of(b));

        when(scheduleRepository.findAll()).thenReturn(Collections.emptyList());

        TrainerReplacementRequest req = new TrainerReplacementRequest("trn_2", "INACTIVATE");
        boolean result = userService.replaceTrainer("trn_1", req);

        assertTrue(result);
        assertEquals("trn_2", c.getTrainerId());
        assertEquals("New Trainer", c.getAssignedTrainer());
        assertEquals("trn_2", b.getTrainerId());
        assertEquals("New Trainer", b.getTrainerName());
        assertEquals("Inactive", oldTrainer.getStatus());
        verify(courseRepository).save(c);
        verify(batchRepository).save(b);
        verify(userRepository).save(oldTrainer);
    }
}
