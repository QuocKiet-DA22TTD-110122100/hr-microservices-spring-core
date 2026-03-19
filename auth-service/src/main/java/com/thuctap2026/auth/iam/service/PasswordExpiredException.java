package com.thuctap2026.auth.iam.service;

public class PasswordExpiredException extends RuntimeException {

    public PasswordExpiredException(String message) {
        super(message);
    }
}
