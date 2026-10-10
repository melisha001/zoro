package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.exception.GlobalExceptionHandler;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void testHandleMaxUploadSizeExceeded() {
        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(5000000);
        ResponseEntity<ApiResponse<Void>> response = handler.handleMaxUploadSizeExceeded(ex);

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("PAYLOAD_TOO_LARGE", response.getBody().getErrorCode());
        assertTrue(response.getBody().getMessage().contains("maximum permitted size limit"));
    }

    @Test
    void testHandleGeneralExceptionGeneratesCorrelationId() {
        RuntimeException ex = new RuntimeException("Unexpected DB connection drop");
        ResponseEntity<ApiResponse<Void>> response = handler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getErrorCode());
        assertNotNull(response.getBody().getCorrelationId());
        assertFalse(response.getBody().getCorrelationId().isEmpty());
        assertTrue(response.getBody().getMessage().contains(response.getBody().getCorrelationId()));
    }

    @Test
    void testHandleValidationException() {
        BindingResult bindingResult = Mockito.mock(BindingResult.class);
        FieldError fieldError = new FieldError("userDto", "email", "must not be blank");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        MethodParameter methodParam = Mockito.mock(MethodParameter.class);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(methodParam, bindingResult);

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidationException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("VALIDATION_FAILED", response.getBody().getErrorCode());
        assertTrue(response.getBody().getMessage().contains("email: must not be blank"));
    }

    @Test
    void testHandleConstraintViolation() {
        ConstraintViolation<?> violation = Mockito.mock(ConstraintViolation.class);
        Path path = Mockito.mock(Path.class);
        when(path.toString()).thenReturn("phone");
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn("Invalid phone format");

        ConstraintViolationException ex = new ConstraintViolationException(Set.of(violation));
        ResponseEntity<ApiResponse<Void>> response = handler.handleConstraintViolation(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("VALIDATION_FAILED", response.getBody().getErrorCode());
        assertTrue(response.getBody().getMessage().contains("phone: Invalid phone format"));
    }
}
