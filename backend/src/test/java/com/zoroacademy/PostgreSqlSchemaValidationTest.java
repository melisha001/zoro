package com.zoroacademy;

import com.zoroacademy.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.net.Socket;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5433/zoro_academy",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.datasource.username=postgres",
    "spring.datasource.password=postgres",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=true"
})
@EnabledIf("isPostgreSqlAvailable")
class PostgreSqlSchemaValidationTest {

    static boolean isPostgreSqlAvailable() {
        try (Socket socket = new Socket("localhost", 5433)) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Verify Spring context loads against PostgreSQL with Flyway and Hibernate validate mode")
    void testContextAgainstPostgreSqlSchema() {
        assertNotNull(userRepository);
        assertNotNull(userRepository.findMonthlyStudentRegistrations());
    }
}
