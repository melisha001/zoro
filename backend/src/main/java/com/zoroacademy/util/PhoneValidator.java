package com.zoroacademy.util;

import java.util.regex.Pattern;

public final class PhoneValidator {

    private static final Pattern INDIAN_PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");

    private PhoneValidator() {}

    /**
     * Cleans phone number by removing whitespace, hyphens, and leading +91 / 91 / 0 if it results in 10 digits.
     */
    public static String sanitize(String phone) {
        if (phone == null) return "";
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.length() == 12 && cleaned.startsWith("91")) {
            cleaned = cleaned.substring(2);
        } else if (cleaned.length() == 11 && cleaned.startsWith("0")) {
            cleaned = cleaned.substring(1);
        }
        return cleaned;
    }

    /**
     * Validates whether string is a valid Indian 10-digit mobile number (starts with 6, 7, 8, or 9).
     */
    public static boolean isValid(String phone) {
        if (phone == null || phone.isBlank()) return false;
        String sanitized = sanitize(phone);
        return INDIAN_PHONE_PATTERN.matcher(sanitized).matches();
    }
}
