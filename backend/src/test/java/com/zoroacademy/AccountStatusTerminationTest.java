package com.zoroacademy;

import com.zoroacademy.entity.User;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.security.JwtAuthenticationFilter;
import com.zoroacademy.security.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AccountStatusTerminationTest {

    private JwtTokenProvider tokenProvider;
    private UserRepository userRepository;
    private JwtAuthenticationFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();

        tokenProvider = new JwtTokenProvider();
        java.lang.reflect.Field secretField = JwtTokenProvider.class.getDeclaredField("jwtSecret");
        secretField.setAccessible(true);
        secretField.set(tokenProvider, "Wmd2Wk9ST1NFQ1VSRUpXVFNFQ1JFVEtFWTIwMjZaT1JPQUM=");

        java.lang.reflect.Field expField = JwtTokenProvider.class.getDeclaredField("jwtExpirationMs");
        expField.setAccessible(true);
        expField.set(tokenProvider, 86400000L);

        tokenProvider.init();

        userRepository = mock(UserRepository.class);
        filter = new JwtAuthenticationFilter(tokenProvider, userRepository);
        filterChain = mock(FilterChain.class);
    }

    @Test
    void testInvalidJwtReturnsTokenInvalidCode() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid-jwt-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"code\":\"TOKEN_INVALID\""));
        assertTrue(response.getContentAsString().contains("\"message\":\"Invalid token signature or format\""));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testExpiredJwtReturnsTokenExpiredCode() throws Exception {
        java.util.Date now = new java.util.Date(System.currentTimeMillis() - 20000);
        java.util.Date expiryDate = new java.util.Date(System.currentTimeMillis() - 10000);
        String expiredToken = io.jsonwebtoken.Jwts.builder()
                .subject("usr-exp")
                .claim("userId", "usr-exp")
                .claim("email", "expired@zoro.com")
                .claim("role", "STUDENT")
                .claim("name", "Expired Student")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(io.jsonwebtoken.io.Decoders.BASE64.decode("Wmd2Wk9ST1NFQ1VSRUpXVFNFQ1JFVEtFWTIwMjZaT1JPQUM=")), io.jsonwebtoken.Jwts.SIG.HS256)
                .compact();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + expiredToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"code\":\"TOKEN_EXPIRED\""));
        assertTrue(response.getContentAsString().contains("\"message\":\"Token expired or invalid\""));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testDeletedUserReturnsAccountRemovedCode() throws Exception {
        String token = tokenProvider.generateTokenFromUsername("deleted@zoro.com", "usr-del", "STUDENT", "Deleted Student");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(userRepository.findByEmailIgnoreCase("deleted@zoro.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("deleted@zoro.com")).thenReturn(Optional.empty());
        when(userRepository.findById("deleted@zoro.com")).thenReturn(Optional.empty());

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"code\":\"ACCOUNT_REMOVED\""));
        assertTrue(response.getContentAsString().contains("\"message\":\"Account has been removed\""));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testDisabledUserReturnsAccountDisabledCode() throws Exception {
        String token = tokenProvider.generateTokenFromUsername("disabled@zoro.com", "usr-dis", "STUDENT", "Disabled Student");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        User disabledUser = User.builder()
                .id("usr-dis")
                .email("disabled@zoro.com")
                .name("Disabled Student")
                .role("STUDENT")
                .password("pass")
                .status("Inactive")
                .build();

        when(userRepository.findByEmailIgnoreCase("disabled@zoro.com")).thenReturn(Optional.of(disabledUser));

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"code\":\"ACCOUNT_DISABLED\""));
        assertTrue(response.getContentAsString().contains("\"message\":\"Account has been deactivated\""));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testActiveUserProceedsToChain() throws Exception {
        String token = tokenProvider.generateTokenFromUsername("active@zoro.com", "usr-act", "STUDENT", "Active Student");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        User activeUser = User.builder()
                .id("usr-act")
                .email("active@zoro.com")
                .name("Active Student")
                .role("STUDENT")
                .password("pass")
                .status("Active")
                .build();

        when(userRepository.findById("usr-act")).thenReturn(Optional.of(activeUser));
        when(userRepository.findByEmailIgnoreCase("active@zoro.com")).thenReturn(Optional.of(activeUser));

        filter.doFilter(request, response, filterChain);

        assertEquals(200, response.getStatus());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testPublicRouteAllowsAnonymousPassThroughWithInvalidJwt() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/courses");
        request.addHeader("Authorization", "Bearer invalid-or-expired-jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertEquals(200, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
