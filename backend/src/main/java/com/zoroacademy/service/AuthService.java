package com.zoroacademy.service;

import com.zoroacademy.dto.LoginRequest;
import com.zoroacademy.dto.LoginResponse;
import com.zoroacademy.dto.RegisterRequest;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.security.JwtTokenProvider;
import com.zoroacademy.util.PhoneValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String identifier = request.getEmail() != null && !request.getEmail().isBlank() 
                ? request.getEmail().trim() 
                : request.getUsername();

        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Email or username is required");
        }

        User user = userRepository.findByEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .or(() -> userRepository.findById(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Invalid email/username or password"));

        // Strictly verify password via BCrypt. No hardcoded or plaintext fallbacks.
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email/username or password");
        }

        String token = tokenProvider.generateTokenFromUsername(
                user.getEmail(), user.getId(), user.getRole(), user.getName());

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Transactional
    public UserDto register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String cleanEmail = request.getEmail().toLowerCase().trim();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + cleanEmail);
        }

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ConflictException("Email is already registered: " + cleanEmail);
        }

        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }

        String cleanUsername = request.getUsername() != null && !request.getUsername().isBlank()
                ? request.getUsername().trim()
                : cleanEmail;
        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new ConflictException("Username is already taken: " + cleanUsername);
        }

        String phone = request.getPhone();
        if (phone != null && !phone.isBlank()) {
            PhoneValidator.validate(phone);
            phone = PhoneValidator.sanitize(phone);
        }

        // Public registration always assigns role STUDENT
        String id = "std_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        User user = User.builder()
                .id(id)
                .email(cleanEmail)
                .username(cleanUsername)
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName() != null ? request.getName().trim() : "Student")
                .role("STUDENT")
                .phone(phone)
                .address(request.getAddress())
                .status("Active")
                .build();

        user = userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String emailOrId) {
        User user = userRepository.findByEmailIgnoreCase(emailOrId)
                .or(() -> userRepository.findById(emailOrId))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + emailOrId));
        return UserDto.fromEntity(user);
    }
}
