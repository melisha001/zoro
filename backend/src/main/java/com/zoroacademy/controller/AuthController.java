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
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;
        LoginResponse response = authService.login(request, userAgent);
        return ApiResponse.ok(response, "Login successful");
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) java.util.Map<String, String> body,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String token = null;
        if (body != null && body.containsKey("refreshToken")) {
            token = body.get("refreshToken");
        } else if (body != null && body.containsKey("token")) {
            token = body.get("token");
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;
        LoginResponse response = authService.rotateRefreshToken(token, userAgent);
        return ApiResponse.ok(response, "Token refreshed successfully");
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestBody(required = false) java.util.Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String refreshToken = null;
        if (body != null && body.containsKey("refreshToken")) {
            refreshToken = body.get("refreshToken");
        } else if (body != null && body.containsKey("token")) {
            refreshToken = body.get("token");
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            refreshToken = authHeader.substring(7);
        }
        authService.logout(refreshToken);
        return ApiResponse.ok(null, "Logged out successfully");
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
