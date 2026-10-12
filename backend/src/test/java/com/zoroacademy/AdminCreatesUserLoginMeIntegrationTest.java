package com.zoroacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoroacademy.dto.LoginRequest;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/zoro_academy",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.datasource.username=postgres",
    "spring.datasource.password=password",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=true"
})
@EnabledIf("isPostgreSqlAvailable")
class AdminCreatesUserLoginMeIntegrationTest {

    static boolean isPostgreSqlAvailable() {
        try (Socket socket = new Socket("localhost", 5432)) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private final List<String> createdUserIds = new ArrayList<>();

    @AfterEach
    void tearDown() {
        for (String id : createdUserIds) {
            try {
                userService.deleteUser(id, true);
            } catch (Exception ignored) {
            }
        }
        createdUserIds.clear();
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoint returns 401 AUTH_REQUIRED, not TOKEN_EXPIRED")
    void testUnauthenticatedReturnsAuthRequired() throws Exception {
        mockMvc.perform(get("/api/me/courses"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("AUTH_REQUIRED")))
                .andExpect(jsonPath("$.message", is("Please log in")));

        mockMvc.perform(get("/api/trainers"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("AUTH_REQUIRED")))
                .andExpect(jsonPath("$.message", is("Please log in")));
    }

    @Test
    @DisplayName("Invalid JWT token returns 401 TOKEN_INVALID")
    void testInvalidTokenReturnsTokenInvalid() throws Exception {
        mockMvc.perform(get("/api/me/courses")
                        .header("Authorization", "Bearer invalid.malformed.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("TOKEN_INVALID")));
    }

    @Test
    @DisplayName("End-to-End: Admin creates student & trainer -> Login -> /auth/me -> /me/* dashboards succeed without 401/403")
    void testAdminCreatesUserLoginAndMeEndpoints() throws Exception {
        String studentEmail = "integ_student_" + UUID.randomUUID().toString().substring(0, 8) + "@zoro.com";
        String trainerEmail = "integ_trainer_" + UUID.randomUUID().toString().substring(0, 8) + "@zoro.com";
        String studentPass = "Student@123";
        String trainerPass = "Trainer@123";

        // 1. Admin creates student
        UserDto studentDto = UserDto.builder()
                .name("Integration Student")
                .email(studentEmail)
                .username("integ_std_" + UUID.randomUUID().toString().substring(0, 8))
                .password(studentPass)
                .status("Active")
                .role("STUDENT")
                .build();
        UserDto createdStudent = userService.saveStudent(studentDto);
        assertNotNull(createdStudent.getId());
        createdUserIds.add(createdStudent.getId());

        // 2. Admin creates trainer
        UserDto trainerDto = UserDto.builder()
                .name("Integration Trainer")
                .email(trainerEmail)
                .username("integ_trn_" + UUID.randomUUID().toString().substring(0, 8))
                .password(trainerPass)
                .status("Active")
                .role("TRAINER")
                .build();
        UserDto createdTrainer = userService.saveTrainer(trainerDto);
        assertNotNull(createdTrainer.getId());
        createdUserIds.add(createdTrainer.getId());

        // 3. Student Login
        LoginRequest studentLogin = LoginRequest.builder().email(studentEmail).password(studentPass).build();
        MvcResult studentLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.user.role", is("STUDENT")))
                .andReturn();

        Map<?, ?> studentResBody = objectMapper.readValue(studentLoginRes.getResponse().getContentAsString(), Map.class);
        Map<?, ?> studentData = (Map<?, ?>) studentResBody.get("data");
        String studentToken = (String) studentData.get("token");
        assertNotNull(studentToken);

        // 4. Student calls /auth/me and /me/*
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email", is(studentEmail)));

        mockMvc.perform(get("/api/me/courses")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/batches")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/schedules")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/notifications")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/enquiries")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 5. Student calling admin-only endpoint /api/trainers returns 403 FORBIDDEN (not 401)
        mockMvc.perform(get("/api/trainers")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")))
                .andExpect(jsonPath("$.message", is("Access denied: insufficient permissions")));

        // 6. Trainer Login
        LoginRequest trainerLogin = LoginRequest.builder().email(trainerEmail).password(trainerPass).build();
        MvcResult trainerLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(trainerLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.user.role", is("TRAINER")))
                .andReturn();

        Map<?, ?> trainerResBody = objectMapper.readValue(trainerLoginRes.getResponse().getContentAsString(), Map.class);
        Map<?, ?> trainerData = (Map<?, ?>) trainerResBody.get("data");
        String trainerToken = (String) trainerData.get("token");
        assertNotNull(trainerToken);

        // 7. Trainer calls /auth/me and /me/*
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + trainerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email", is(trainerEmail)));

        mockMvc.perform(get("/api/me/courses")
                        .header("Authorization", "Bearer " + trainerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/batches")
                        .header("Authorization", "Bearer " + trainerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/schedules")
                        .header("Authorization", "Bearer " + trainerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/students")
                        .header("Authorization", "Bearer " + trainerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/me/notifications")
                        .header("Authorization", "Bearer " + trainerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
