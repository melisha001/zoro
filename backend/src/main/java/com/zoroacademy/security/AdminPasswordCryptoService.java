package com.zoroacademy.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Reversible AES-256-GCM encryption service for admin-visible user passwords.
 * Stores ciphertext with 12-byte random IV prepended.
 * Secret key configured via admin.password-key or ADMIN_PASSWORD_KEY env var.
 */
@Component
public class AdminPasswordCryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AdminPasswordCryptoService(
            @Value("${admin.password-key:${ADMIN_PASSWORD_KEY:zoroAcademyDevAdminPwdKey32B123}}") String rawKey) {
        byte[] keyBytes = derive32ByteKey(rawKey);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    private static byte[] derive32ByteKey(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            rawKey = "zoroAcademyDevAdminPwdKey32B123";
        }
        byte[] rawBytes = rawKey.getBytes(StandardCharsets.UTF_8);
        if (rawBytes.length == 32) {
            return rawBytes;
        }
        // Try Base64 decoding if configured as base64
        try {
            byte[] decoded = Base64.getDecoder().decode(rawKey.trim());
            if (decoded.length == 32) {
                return decoded;
            }
        } catch (Exception ignored) {}

        // Otherwise derive exactly 32 bytes using SHA-256 hash
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            return sha.digest(rawBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to derive AES-256 key", e);
        }
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Encryption of admin password failed", e);
        }
    }

    public String decrypt(String cipherTextBase64) {
        if (cipherTextBase64 == null || cipherTextBase64.isBlank()) {
            return null;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(cipherTextBase64);
            if (decoded.length < IV_LENGTH_BYTE) {
                throw new IllegalArgumentException("Invalid encrypted payload length");
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption of admin password failed", e);
        }
    }
}
