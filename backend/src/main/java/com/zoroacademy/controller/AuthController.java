package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.dto.LoginRequest;
import com.zoroacademy.dto.LoginResponse;
import com.zoroacademy.dto.RegisterRequest;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.service.AuthService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.ok(response, "Login successful");
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (body != null && body.containsKey("token")) {
            token = body.get("token");
        }
        LoginResponse response = authService.refreshToken(token);
        return ApiResponse.ok(response, "Token refreshed successfully");
    }

    @PostMapping("/register")
    public ApiResponse<UserDto> register(@RequestBody RegisterRequest request) {
        UserDto response = authService.register(request);
        return ApiResponse.ok(response, "Registration successful");
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ApiResponse.error("Unauthenticated");
        }
        UserDto user = authService.getCurrentUser(userDetails.getUsername());
        return ApiResponse.ok(user);
    }
}
