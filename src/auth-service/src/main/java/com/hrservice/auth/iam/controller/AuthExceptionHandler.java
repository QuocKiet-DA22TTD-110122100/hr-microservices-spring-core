package com.hrservice.auth.iam.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatusCode statusCode = ex.getStatusCode();
        String reason = ex.getReason();
        String message = reason == null || reason.isBlank()
            ? resolveDefaultMessage(statusCode)
            : reason;

        return ResponseEntity.status(statusCode)
            .body(new ErrorResponse(
                Instant.now().toString(),
                statusCode.value(),
                resolveError(statusCode),
                message,
                resolveCode(statusCode, message)
            ));
    }

    private String resolveDefaultMessage(HttpStatusCode statusCode) {
        HttpStatus status = HttpStatus.resolve(statusCode.value());
        return status == null ? "Request failed" : status.getReasonPhrase();
    }

    private String resolveError(HttpStatusCode statusCode) {
        HttpStatus status = HttpStatus.resolve(statusCode.value());
        return status == null ? "Error" : status.getReasonPhrase();
    }

    private String resolveCode(HttpStatusCode statusCode, String message) {
        String normalizedMessage = message.toLowerCase();
        if (statusCode.value() == HttpStatus.LOCKED.value()) {
            return "ACCOUNT_LOCKED";
        }
        if (normalizedMessage.contains("password expired")) {
            return "PASSWORD_EXPIRED";
        }
        if (normalizedMessage.contains("invalid credentials")) {
            return "INVALID_CREDENTIALS";
        }
        return "AUTH_ERROR";
    }

    public record ErrorResponse(
        String timestamp,
        int status,
        String error,
        String message,
        String code
    ) {
    }
}
