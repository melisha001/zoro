package com.zoroacademy.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                if (!tokenProvider.validateToken(jwt)) {
                    sendErrorResponse(response, "TOKEN_EXPIRED", "Token expired or invalid");
                    return;
                }

                String username = tokenProvider.getUsernameFromJwt(jwt);
                Optional<User> userOpt = userRepository.findByEmailIgnoreCase(username)
                        .or(() -> userRepository.findByUsernameIgnoreCase(username))
                        .or(() -> userRepository.findById(username));

                if (userOpt.isEmpty()) {
                    sendErrorResponse(response, "ACCOUNT_REMOVED", "Account has been removed");
                    return;
                }

                User user = userOpt.get();
                if (user.getStatus() != null && !"Active".equalsIgnoreCase(user.getStatus().trim())) {
                    sendErrorResponse(response, "ACCOUNT_DISABLED", "Account has been deactivated");
                    return;
                }

                UserPrincipal userPrincipal = UserPrincipal.create(user);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userPrincipal, null, userPrincipal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, String code, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("code", code);
        body.put("message", message);

        objectMapper.writeValue(response.getWriter(), body);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

