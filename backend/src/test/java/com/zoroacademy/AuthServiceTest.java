package com.zoroacademy;

import com.zoroacademy.dto.LoginRequest;
import com.zoroacademy.dto.LoginResponse;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.security.JwtTokenProvider;
import com.zoroacademy.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {

    private AuthService authService;

    @BeforeEach
    void setUp() {
        UserRepository fakeRepo = new FakeUserRepository();
        PasswordEncoder fakeEncoder = new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return "encoded_" + rawPassword;
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                return rawPassword.toString().equals("password123") || ("encoded_" + rawPassword).equals(encodedPassword);
            }
        };

        JwtTokenProvider tokenProvider = new JwtTokenProvider() {
            @Override
            public String generateTokenFromUsername(String email, String userId, String role, String name) {
                return "mock-jwt-token-for-" + email;
            }

            @Override
            public String generateToken(String userId, String email, String role, String name) {
                return generateTokenFromUsername(email, userId, role, name);
            }
        };

        authService = new AuthService(fakeRepo, fakeEncoder, tokenProvider);
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("arjun@student.com")
                .password("password123")
                .build();

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token-for-arjun@student.com", response.getToken());
        assertEquals("arjun@student.com", response.getUser().getEmail());
        assertEquals("STUDENT", response.getUser().getRole());
    }

    @Test
    void testLoginRejectsInactiveUser() {
        LoginRequest request = LoginRequest.builder()
                .email("inactive@student.com")
                .password("password123")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().contains("inactive"), "Exception message should indicate inactive account");
    }

    private static class FakeUserRepository implements UserRepository {
        private final User user = User.builder()
                .id("std-1")
                .email("arjun@student.com")
                .username("arjun123")
                .password("encoded_password123")
                .name("Arjun M")
                .role("STUDENT")
                .build();

        private final User inactiveUser = User.builder()
                .id("std-inactive")
                .email("inactive@student.com")
                .username("inactive123")
                .password("encoded_password123")
                .name("Inactive Student")
                .role("STUDENT")
                .status("Inactive")
                .build();

        @Override
        public Optional<User> findByEmailIgnoreCase(String email) {
            if ("arjun@student.com".equalsIgnoreCase(email)) return Optional.of(user);
            if ("inactive@student.com".equalsIgnoreCase(email)) return Optional.of(inactiveUser);
            return Optional.empty();
        }

        @Override
        public Optional<User> findByUsernameIgnoreCase(String username) {
            if ("arjun123".equalsIgnoreCase(username)) return Optional.of(user);
            return Optional.empty();
        }

        @Override
        public List<User> findByRoleIgnoreCase(String role) {
            return Collections.singletonList(user);
        }

        @Override
        public List<User> findByNameIgnoreCase(String name) {
            if ("Arjun M".equalsIgnoreCase(name)) return Collections.singletonList(user);
            return Collections.emptyList();
        }

        @Override
        public boolean existsByEmailIgnoreCase(String email) {
            return "arjun@student.com".equalsIgnoreCase(email);
        }

        @Override
        public boolean existsByUsernameIgnoreCase(String username) {
            return "arjun123".equalsIgnoreCase(username);
        }

        @Override
        public long countByRoleIgnoreCase(String role) {
            return "STUDENT".equalsIgnoreCase(role) ? 1 : 0;
        }

        @Override
        public long countByRole(String role) {
            return "STUDENT".equalsIgnoreCase(role) ? 1 : 0;
        }

        @Override
        public List<Object[]> findMonthlyStudentRegistrations() {
            return Collections.emptyList();
        }

        @Override
        public List<User> findStudentsByBatchId(String batchId) {
            return Collections.emptyList();
        }

        @Override
        public long countStudentsByBatchId(String batchId) {
            return 0L;
        }

        @Override
        public List<User> findLearningStudents() {
            return Collections.singletonList(user);
        }

        @Override
        public long countLearningStudents() {
            return 1L;
        }

        @Override public void flush() {}
        @Override public <S extends User> S saveAndFlush(S entity) { return entity; }
        @Override public <S extends User> List<S> saveAllAndFlush(Iterable<S> entities) { return Collections.emptyList(); }
        @Override public void deleteAllInBatch(Iterable<User> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<String> strings) {}
        @Override public void deleteAllInBatch() {}
        @Override public User getOne(String s) { return user; }
        @Override public User getById(String s) { return user; }
        @Override public User getReferenceById(String s) { return user; }
        @Override public <S extends User> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends User> List<S> findAll(Example<S> example) { return Collections.emptyList(); }
        @Override public <S extends User> List<S> findAll(Example<S> example, Sort sort) { return Collections.emptyList(); }
        @Override public <S extends User> Page<S> findAll(Example<S> example, Pageable pageable) { return Page.empty(); }
        @Override public <S extends User> long count(Example<S> example) { return 0; }
        @Override public <S extends User> boolean exists(Example<S> example) { return false; }
        @Override public <S extends User, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public <S extends User> S save(S entity) { return entity; }
        @Override public <S extends User> List<S> saveAll(Iterable<S> entities) { return Collections.emptyList(); }
        @Override public Optional<User> findById(String s) { return s.equals(user.getId()) ? Optional.of(user) : Optional.empty(); }
        @Override public boolean existsById(String s) { return s.equals(user.getId()); }
        @Override public List<User> findAll() { return Collections.singletonList(user); }
        @Override public List<User> findAllById(Iterable<String> strings) { return Collections.singletonList(user); }
        @Override public long count() { return 1; }
        @Override public void deleteById(String s) {}
        @Override public void delete(User entity) {}
        @Override public void deleteAllById(Iterable<? extends String> strings) {}
        @Override public void deleteAll(Iterable<? extends User> entities) {}
        @Override public void deleteAll() {}
        @Override public List<User> findAll(Sort sort) { return Collections.singletonList(user); }
        @Override public Page<User> findAll(Pageable pageable) { return Page.empty(); }
    }
}
