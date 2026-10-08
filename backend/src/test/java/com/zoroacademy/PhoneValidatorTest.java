package com.zoroacademy;

import com.zoroacademy.util.PhoneValidator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class PhoneValidatorTest {

    @Test
    void testValidIndianPhoneNumbers() {
        assertTrue(PhoneValidator.isValid("9876543210"));
        assertTrue(PhoneValidator.isValid("8765432109"));
        assertTrue(PhoneValidator.isValid("7654321098"));
        assertTrue(PhoneValidator.isValid("6543210987"));
        assertTrue(PhoneValidator.isValid("+91 98765 43210"));
        assertTrue(PhoneValidator.isValid("+91-9876543210"));
        assertTrue(PhoneValidator.isValid("09876543210"));
    }

    @Test
    void testInvalidPhoneNumbers() {
        assertFalse(PhoneValidator.isValid(null));
        assertFalse(PhoneValidator.isValid(""));
        assertFalse(PhoneValidator.isValid("1234567890")); // starts with 1
        assertFalse(PhoneValidator.isValid("5556667777")); // starts with 5
        assertFalse(PhoneValidator.isValid("98765")); // too short
        assertFalse(PhoneValidator.isValid("9876543210123")); // too long
        assertFalse(PhoneValidator.isValid("abcdefghij")); // alphabetical
    }

    @Test
    void testSanitizePhone() {
        assertEquals("9876543210", PhoneValidator.sanitize("+91 98765 43210"));
        assertEquals("9876543210", PhoneValidator.sanitize("09876543210"));
        assertEquals("9876543210", PhoneValidator.sanitize("98765-43210"));
    }
}
