package com.thuctap2026.auth.iam.controller;

import com.thuctap2026.auth.iam.service.AuthService;
import com.thuctap2026.auth.iam.service.AccountLockedException;
import com.thuctap2026.auth.iam.service.PasswordExpiredException;
import com.thuctap2026.auth.iam.entity.User;
import com.thuctap2026.auth.security.RequiredRoles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

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

    @GetMapping("/sync-status/{userId}")
    public ResponseEntity<SyncStatusResponse> syncStatus(@PathVariable String userId) {
        try {
            UUID parsed = UUID.fromString(userId);
            var status = authService.getUserSyncStatus(parsed);
            return ResponseEntity.ok(
                new SyncStatusResponse(
                    status.userId().toString(),
                    status.status(),
                    status.retryCount(),
                    status.lastError(),
                    status.updatedAt() == null ? null : status.updatedAt().toString()
                )
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is invalid", ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/sync-retry/{userId}")
    public ResponseEntity<SyncStatusResponse> retrySync(@PathVariable String userId) {
        try {
            UUID parsed = UUID.fromString(userId);
            var status = authService.retryUserSync(parsed);
            return ResponseEntity.ok(
                new SyncStatusResponse(
                    status.userId().toString(),
                    status.status(),
                    status.retryCount(),
                    status.lastError(),
                    status.updatedAt() == null ? null : status.updatedAt().toString()
                )
            );
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

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(@RequestBody LogoutRequest request) {
        if (request == null || request.token() == null || request.token().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token is required");
        }

        try {
            authService.revokeToken(request.token());
            return ResponseEntity.ok(new LogoutResponse("Token revoked successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/admin/lock-account")
    public ResponseEntity<AdminResponse> lockAccount(@RequestBody AdminAccountRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }

        try {
            authService.lockAccount(request.username());
            return ResponseEntity.ok(new AdminResponse("Account locked successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/admin/unlock-account")
    public ResponseEntity<AdminResponse> unlockAccount(@RequestBody AdminAccountRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }

        try {
            authService.unlockAccount(request.username());
            return ResponseEntity.ok(new AdminResponse("Account unlocked successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    public record LoginRequest(String username, String password) {
    }

    public record RegisterRequest(String username, String password, String role) {
    }

    public record RegisterResponse(String userId, String username, String role) {
    }

    public record SyncStatusResponse(String userId, String status, int retryCount, String lastError, String updatedAt) {
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

    public record LogoutRequest(String token) {
    }

    public record LogoutResponse(String message) {
    }

    public record AdminAccountRequest(String username) {
    }

    public record AdminResponse(String message) {
    }
}
