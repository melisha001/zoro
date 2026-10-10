package com.zoroacademy.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:${jwt.expiration:3600000}}")
    private long jwtExpirationMs;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: 'jwt.secret' configuration property is missing. A valid Base64-encoded secret of at least 32 bytes (256 bits) is required.");
        }
        try {
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
            if (keyBytes.length < 32) {
                throw new IllegalStateException("FATAL: 'jwt.secret' decodes to " + keyBytes.length + " bytes. JWT HMAC-SHA256 requires at least 32 bytes (256 bits).");
            }
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("FATAL: 'jwt.secret' must be a valid Base64-encoded string: " + e.getMessage(), e);
        }
    }

    private SecretKey getSigningKey() {
        if (this.signingKey == null) {
            init();
        }
        return this.signingKey;
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return generateToken(userPrincipal.getId(), userPrincipal.getEmail(), userPrincipal.getRole(), userPrincipal.getName());
    }

    public String generateToken(String userId, String email, String role, String name) {
        Date now = new Date();
        long duration = jwtExpirationMs > 0 ? jwtExpirationMs : 3600000L;
        Date expiryDate = new Date(now.getTime() + duration);

        return Jwts.builder()
                .subject(userId)
                .claim("userId", userId)
                .claim("email", email)
                .claim("role", role)
                .claim("name", name)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String generateTokenFromUsername(String email, String userId, String role, String name) {
        return generateToken(userId, email, role, name);
    }

    public Claims getClaimsFromJwt(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims getClaimsEvenIfExpired(String token) {
        try {
            return getClaimsFromJwt(token);
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    public String getUserIdFromJwt(String token) {
        Claims claims = getClaimsEvenIfExpired(token);
        String subject = claims.getSubject();
        String userId = claims.get("userId", String.class);
        return (userId != null && !userId.isBlank()) ? userId : subject;
    }

    public String getUsernameFromJwt(String token) {
        Claims claims = getClaimsEvenIfExpired(token);
        String email = claims.get("email", String.class);
        return (email != null && !email.isBlank()) ? email : claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.warn("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }
}
