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
    void testInvalidJwtReturnsTokenExpiredCode() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid-jwt-token");
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

        when(userRepository.findByEmailIgnoreCase("active@zoro.com")).thenReturn(Optional.of(activeUser));

        filter.doFilter(request, response, filterChain);

        assertEquals(200, response.getStatus());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
