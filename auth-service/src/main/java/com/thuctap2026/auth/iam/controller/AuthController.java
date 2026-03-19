package com.thuctap2026.auth.iam.controller;

import com.thuctap2026.auth.iam.service.AuthService;
import com.thuctap2026.auth.iam.service.AccountLockedException;
import com.thuctap2026.auth.iam.service.PasswordExpiredException;
import com.thuctap2026.auth.iam.entity.User;
import com.thuctap2026.auth.security.RequiredRoles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/iam")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            User savedUser = authService.register(request.username(), request.password(), request.role());
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse(savedUser.getId().toString(), savedUser.getUsername(), savedUser.getRole()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            String token = authService.login(request.username(), request.password());
            return ResponseEntity.ok(new LoginResponse(token));
        } catch (AccountLockedException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password", ex);
        } catch (PasswordExpiredException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password", ex);
        }
    }

    @RequiredRoles({"USER", "ADMIN"})
    @PostMapping("/change-password")
    public ResponseEntity<ChangePasswordResponse> changePassword(@RequestBody ChangePasswordRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            authService.changePassword(request.username(), request.oldPassword(), request.newPassword());
            return ResponseEntity.ok(new ChangePasswordResponse("Password changed successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials", ex);
        }
    }

    @RequiredRoles({"USER", "ADMIN"})
    @PostMapping("/verify")
    public ResponseEntity<VerifyTokenResponse> verify(@RequestBody VerifyTokenRequest request) {
        if (request == null || request.token() == null || request.token().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token is required");
        }

        try {
            Map<String, Object> claims = authService.verifyToken(request.token());
            return ResponseEntity.ok(new VerifyTokenResponse(true, claims));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }

    public record LoginRequest(String username, String password) {
    }

    public record RegisterRequest(String username, String password, String role) {
    }

    public record RegisterResponse(String userId, String username, String role) {
    }

    public record LoginResponse(String token) {
    }

    public record ChangePasswordRequest(String username, String oldPassword, String newPassword) {
    }

    public record ChangePasswordResponse(String message) {
    }

    public record VerifyTokenRequest(String token) {
    }

    public record VerifyTokenResponse(boolean valid, Map<String, Object> claims) {
    }
}
