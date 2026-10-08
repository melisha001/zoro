package com.zoroacademy.config;

import com.zoroacademy.entity.User;
import com.zoroacademy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AdminUserInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public AdminUserInitializer(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        String adminEmail = environment.getProperty("ADMIN_EMAIL");
        if (adminEmail == null || adminEmail.isBlank()) {
            adminEmail = environment.getProperty("admin.email");
        }
        String adminPassword = environment.getProperty("ADMIN_PASSWORD");
        if (adminPassword == null || adminPassword.isBlank()) {
            adminPassword = environment.getProperty("admin.password");
        }

        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            List<User> existingAdmins = userRepository.findByRoleIgnoreCase("ADMIN");
            if (!existingAdmins.isEmpty()) {
                log.warn("ADMIN_EMAIL and/or ADMIN_PASSWORD environment variables are not set. Skipping administrator bootstrap because existing administrator account(s) already exist.");
                return;
            }
            throw new IllegalStateException("FATAL: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required to bootstrap the initial administrator account.");
        }

        String finalEmail = adminEmail.trim().toLowerCase();
        String finalPassword = adminPassword;

        // Find existing admin account by email, ID or role
        User admin = userRepository.findByEmailIgnoreCase(finalEmail)
                .or(() -> userRepository.findById("usr-admin-1"))
                .or(() -> {
                    List<User> admins = userRepository.findByRoleIgnoreCase("ADMIN");
                    return admins.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(admins.get(0));
                })
                .orElseGet(() -> User.builder()
                        .id("usr-admin-1")
                        .name("System Administrator")
                        .username("admin")
                        .role("ADMIN")
                        .status("Active")
                        .build()
                );

        admin.setEmail(finalEmail);
        if (admin.getUsername() == null || admin.getUsername().isBlank()) {
            admin.setUsername("admin");
        }
        admin.setRole("ADMIN");
        admin.setStatus("Active");
        if (admin.getName() == null || admin.getName().isBlank()) {
            admin.setName("System Administrator");
        }
        admin.setPassword(passwordEncoder.encode(finalPassword));

        userRepository.save(admin);
        log.info("Administrator account verified and synchronized for email: {}", finalEmail);
    }
}
