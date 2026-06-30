package com.hrservice.eureka.exception;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice(basePackages = "com.hrservice.eureka.controller")
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        log.warn("IllegalArgumentException: {} at {}", ex.getMessage(), request.getDescription(false));
        String path = request.getDescription(false);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.BAD_REQUEST, ex.getMessage(), path);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        log.warn("ResourceNotFoundException: {} at {}", ex.getMessage(), request.getDescription(false));
        String path = request.getDescription(false);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.NOT_FOUND, ex.getMessage(), path);
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<ErrorResponse> handleValidationExceptions(Exception ex, WebRequest request) {
        String path = request.getDescription(false);
        List<String> errors = ((MethodArgumentNotValidException) ex).getBindingResult()
                .getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());
        log.warn("Validation error at {}: {}", path, errors);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.BAD_REQUEST, "Validation failed", path, errors);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException ex, WebRequest request) {
        String path = request.getDescription(false);
        List<String> errors = ex.getConstraintViolations().stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(Collectors.toList());
        log.warn("Constraint violation at {}: {}", path, errors);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.BAD_REQUEST, "Constraint violation", path, errors);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        log.error("Unhandled exception at {}: {}", request.getDescription(false), ex.getMessage(), ex);
        String path = request.getDescription(false);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", path);
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Handle specific Spring exceptions
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, WebRequest request) {
        log.warn("HTTP method not supported at {}", request.getDescription(false));
        String path = request.getDescription(false);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), path);
        return new ResponseEntity<>(errorResponse, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, WebRequest request) {
        log.warn("Type mismatch at {}", request.getDescription(false));
        String path = request.getDescription(false);
        String message = String.format("Invalid type for parameter '%s': %s", ex.getName(), ex.getRequiredType());
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.BAD_REQUEST, message, path);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}
