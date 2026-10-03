package com.carrental.common.exception;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ===== Xử lý AppException (custom exception) =====
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(
            AppException ex, HttpServletRequest request) {

        String traceId = UUID.randomUUID().toString();
        ErrorCode errorCode = ex.getErrorCode();

        log.error("[{}] AppException at {} - Code: {} - Message: {}",
                traceId, request.getRequestURI(), errorCode.getCode(), ex.getMessage());

        ApiResponse<Object> response = ApiResponse.error(
                errorCode.getCode(),
                ex.getMessage(),
                request.getRequestURI(),
                traceId
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // ===== Xử lý validation error (@Valid) =====
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        String traceId = UUID.randomUUID().toString();
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.error("[{}] Validation error at {} - Details: {}",
                traceId, request.getRequestURI(), errors);

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .code(ErrorCode.VALIDATION_ERROR.getCode())
                .message(ErrorCode.VALIDATION_ERROR.getMessage())
                .data(errors)
                .path(request.getRequestURI())
                .traceId(traceId)
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    // ===== Xử lý AccessDeniedException (Spring Security @PreAuthorize) =====
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {

        String traceId = UUID.randomUUID().toString();

        log.warn("[{}] Access denied at {} - Message: {}",
                traceId, request.getRequestURI(), ex.getMessage());

        ApiResponse<Object> response = ApiResponse.error(
                ErrorCode.PERMISSION_DENIED.getCode(),
                ErrorCode.PERMISSION_DENIED.getMessage(),
                request.getRequestURI(),
                traceId
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // ===== Xử lý tất cả exception còn lại =====
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(
            Exception ex, HttpServletRequest request) {

        String traceId = UUID.randomUUID().toString();

        log.error("[{}] Uncategorized exception at {} - Message: {}",
                traceId, request.getRequestURI(), ex.getMessage(), ex);

        ApiResponse<Object> response = ApiResponse.error(
                ErrorCode.UNCATEGORIZED_EXCEPTION.getCode(),
                ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage(),
                request.getRequestURI(),
                traceId
        );

        return ResponseEntity.internalServerError().body(response);
    }
}