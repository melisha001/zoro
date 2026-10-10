package com.zoroacademy.config;

import com.zoroacademy.security.JwtAuthenticationEntryPoint;
import com.zoroacademy.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
    }

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        // 1. Strictly Public Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register", "/api/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/enquiries", "/api/enquiries/").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/website-settings/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/competitions/{id}/registrations").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/competitions", "/api/competitions/", "/api/competitions/{id}", "/api/competitions/{id}/modules").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/webhooks/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // 2. ADMIN Role Specific Endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/dashboard/**").hasRole("ADMIN")
                        .requestMatchers("/api/activity-logs/**").hasRole("ADMIN")
                        .requestMatchers("/api/fees/**").hasRole("ADMIN")
                        .requestMatchers("/api/expenses/**").hasRole("ADMIN")
                        .requestMatchers("/api/salary/**").hasRole("ADMIN")
                        .requestMatchers("/api/settings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/enquiries/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/enquiries/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/enquiries/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/website-settings/**").hasRole("ADMIN")
                        .requestMatchers("/api/enrollments/requests/**").hasRole("ADMIN")
                        .requestMatchers("/api/trainers/{id}/replace").hasRole("ADMIN")
                        .requestMatchers("/api/trainers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/courses/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/courses/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/courses/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/batches/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/batches/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/batches/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/competitions").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/competitions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/competitions/**").hasRole("ADMIN")
                        .requestMatchers("/api/competitions/registrations", "/api/competitions/registrations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/competitions/{id}/registrations").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/students", "/api/users/trainers").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users/students", "/api/users/trainers").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/students/**", "/api/users/trainers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")

                        // 3. TRAINER or ADMIN Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/batches/**").hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers("/api/schedules/**").hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers("/api/attendance/**").hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers(HttpMethod.POST, "/api/assignments").hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers(HttpMethod.PUT, "/api/assignments/**").hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers(HttpMethod.DELETE, "/api/assignments/**").hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers("/api/submissions/review/**").hasAnyRole("ADMIN", "TRAINER")

                        // 4. Any other authenticated request (e.g. /api/auth/me, /api/users/password, student progress, playback)
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
