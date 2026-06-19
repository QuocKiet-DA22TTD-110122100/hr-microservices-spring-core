package com.hrservice.auth.iam.controller;

import com.hrservice.auth.iam.service.AuthService;
import com.hrservice.auth.iam.service.AccountLockedException;
import com.hrservice.auth.iam.service.PasswordExpiredException;
import com.hrservice.auth.iam.service.RoleManagementService;
import com.hrservice.auth.iam.entity.User;
import com.hrservice.auth.security.RequiredRoles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/xac-thuc")
public class AuthController {

    private final AuthService authService;
    private final RoleManagementService roleManagementService;
    private final com.hrservice.auth.iam.mapper.AuthDtoMapper authDtoMapper;

    public AuthController(AuthService authService, RoleManagementService roleManagementService, com.hrservice.auth.iam.mapper.AuthDtoMapper authDtoMapper) {
        this.authService = authService;
        this.roleManagementService = roleManagementService;
        this.authDtoMapper = authDtoMapper;
    }

    @PostMapping({"/dang-ky", "/user/register"})
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            User savedUser = authService.register(request.username(), request.password(), request.role());
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(authDtoMapper.toRegisterResponse(savedUser));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @GetMapping("/trang-thai-dong-bo/{userId}")
    public ResponseEntity<SyncStatusResponse> syncStatus(@PathVariable String userId) {
        try {
            UUID parsed = UUID.fromString(userId);
            var status = authService.getUserSyncStatus(parsed);
            return ResponseEntity.ok(authDtoMapper.toSyncStatusResponse(status));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is invalid", ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/thu-lai-dong-bo/{userId}")
    public ResponseEntity<SyncStatusResponse> retrySync(@PathVariable String userId) {
        try {
            UUID parsed = UUID.fromString(userId);
            var status = authService.retryUserSync(parsed);
            return ResponseEntity.ok(authDtoMapper.toSyncStatusResponse(status));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @GetMapping("/quan-tri/tai-khoan")
    public ResponseEntity<List<UserDto>> listUsers() {
        return ResponseEntity.ok(authDtoMapper.toUserDtoList(authService.listUsers()));
    }

    @RequiredRoles({"ADMIN"})
    @PutMapping("/quan-tri/tai-khoan/{userId}")
    public ResponseEntity<UserDto> updateUser(@PathVariable String userId, @RequestBody UpdateUserRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            UUID parsed = UUID.fromString(userId);
            User updatedUser = authService.updateUser(parsed, request.role(), request.locked());
            return ResponseEntity.ok(authDtoMapper.toUserDto(updatedUser));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @DeleteMapping("/quan-tri/tai-khoan/{userId}")
    public ResponseEntity<AdminResponse> deleteUser(@PathVariable String userId) {
        try {
            UUID parsed = UUID.fromString(userId);
            authService.deleteUser(parsed);
            return ResponseEntity.ok(authDtoMapper.toAdminResponse("User deleted successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @GetMapping("/quan-tri/vai-tro")
    public ResponseEntity<List<RoleDto>> getRoles() {
        return ResponseEntity.ok(roleManagementService.listRoles().stream()
            .map(role -> new RoleDto(role.name(), role.description(), role.permissions(), role.userCount()))
            .toList());
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/quan-tri/vai-tro")
    public ResponseEntity<RoleDto> createRole(@RequestBody RoleRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            RoleManagementService.RoleView role = roleManagementService.createRole(
                request.name(),
                request.description(),
                request.permissions()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RoleDto(role.name(), role.description(), role.permissions(), role.userCount()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @PutMapping("/quan-tri/vai-tro/{roleName}")
    public ResponseEntity<RoleDto> updateRole(@PathVariable String roleName, @RequestBody RoleRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            RoleManagementService.RoleView role = roleManagementService.updateRole(
                roleName,
                request.description(),
                request.permissions()
            );
            return ResponseEntity.ok(new RoleDto(role.name(), role.description(), role.permissions(), role.userCount()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @DeleteMapping("/quan-tri/vai-tro/{roleName}")
    public ResponseEntity<AdminResponse> deleteRole(@PathVariable String roleName) {
        try {
            roleManagementService.deleteRole(roleName);
            return ResponseEntity.ok(authDtoMapper.toAdminResponse("Role deleted successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/dang-nhap")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            AuthService.LoginResult result = authService.login(request.username(), request.password(), request.otp());
            if (result.mfaRequired()) {
                return ResponseEntity.status(HttpStatus.ACCEPTED).body(authDtoMapper.toLoginResponse(result));
            }
            return ResponseEntity.ok(authDtoMapper.toLoginResponse(result));
        } catch (AccountLockedException | SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        } catch (PasswordExpiredException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/oauth2/token")
    public ResponseEntity<OAuth2TokenResponse> oauth2Token(@RequestBody OAuth2TokenRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        if (request.grantType() == null || !"password".equalsIgnoreCase(request.grantType().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported grant_type");
        }

        try {
            AuthService.LoginResult result = authService.login(request.username(), request.password(), request.otp());
            if (result.mfaRequired()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "mfa_required");
            }
            return ResponseEntity.ok(authDtoMapper.toOAuth2TokenResponse(result));
        } catch (AccountLockedException | SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        } catch (PasswordExpiredException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/2fa/khoi-tao")
    public ResponseEntity<TwoFactorInitResponse> initTwoFactor(@RequestBody TwoFactorCredentialRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            AuthService.TwoFactorEnrollment enrollment = authService.initTwoFactor(request.username(), request.password());
            return ResponseEntity.ok(new TwoFactorInitResponse(enrollment.secret(), enrollment.otpAuthUri()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (AccountLockedException | SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }

    @PostMapping("/2fa/xac-nhan")
    public ResponseEntity<AdminResponse> confirmTwoFactor(@RequestBody TwoFactorConfirmRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            authService.confirmTwoFactor(request.username(), request.password(), request.otp());
            return ResponseEntity.ok(authDtoMapper.toAdminResponse("2FA enabled successfully"));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (AccountLockedException | SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }

    @PostMapping("/2fa/tat")
    public ResponseEntity<AdminResponse> disableTwoFactor(@RequestBody TwoFactorConfirmRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            authService.disableTwoFactor(request.username(), request.password(), request.otp());
            return ResponseEntity.ok(authDtoMapper.toAdminResponse("2FA disabled successfully"));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (AccountLockedException | SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"USER", "EMPLOYEE", "MANAGER", "DEPARTMENT_HEAD", "HR_MANAGER", "PAYROLL_OFFICER", "ADMIN"})
    @PostMapping("/doi-mat-khau")
    public ResponseEntity<ChangePasswordResponse> changePassword(@RequestBody ChangePasswordRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        try {
            authService.changePassword(request.username(), request.oldPassword(), request.newPassword());
            return ResponseEntity.ok(authDtoMapper.toChangePasswordResponse("Password changed successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials", ex);
        }
    }

    @RequiredRoles({"USER", "EMPLOYEE", "MANAGER", "DEPARTMENT_HEAD", "HR_MANAGER", "PAYROLL_OFFICER", "ADMIN"})
    @PostMapping("/kiem-tra")
    public ResponseEntity<VerifyTokenResponse> verify(@RequestBody VerifyTokenRequest request) {
        if (request == null || request.token() == null || request.token().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token is required");
        }

        try {
            Map<String, Object> claims = authService.verifyToken(request.token());
            return ResponseEntity.ok(authDtoMapper.toVerifyTokenResponse(true, claims));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }

    @PostMapping("/dang-xuat")
    public ResponseEntity<LogoutResponse> logout(@RequestBody LogoutRequest request) {
        if (request == null || request.token() == null || request.token().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token is required");
        }

        try {
            authService.revokeToken(request.token());
            return ResponseEntity.ok(authDtoMapper.toLogoutResponse("Token revoked successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/quan-tri/khoa-tai-khoan")
    public ResponseEntity<AdminResponse> lockAccount(@RequestBody AdminAccountRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }

        try {
            authService.lockAccount(request.username());
            return ResponseEntity.ok(authDtoMapper.toAdminResponse("Account locked successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @RequiredRoles({"ADMIN"})
    @PostMapping("/quan-tri/mo-tai-khoan")
    public ResponseEntity<AdminResponse> unlockAccount(@RequestBody AdminAccountRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }

        try {
            authService.unlockAccount(request.username());
            return ResponseEntity.ok(authDtoMapper.toAdminResponse("Account unlocked successfully"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    public record LoginRequest(String username, String password, String otp) {
    }

    public record RegisterRequest(String username, String password, String role) {
    }

    public record RegisterResponse(String userId, String username, String role) {
    }

    public record SyncStatusResponse(String userId, String status, int retryCount, String lastError, String updatedAt) {
    }

    public record LoginResponse(
        String access_token,
        String token_type,
        long expires_in,
        String scope,
        boolean mfa_required,
        String mfa_method,
        String token
    ) {
    }

    public record OAuth2TokenRequest(String grantType, String username, String password, String scope, String otp) {
    }

    public record OAuth2TokenResponse(String access_token, String token_type, long expires_in, String scope) {
    }

    public record TwoFactorCredentialRequest(String username, String password) {
    }

    public record TwoFactorConfirmRequest(String username, String password, String otp) {
    }

    public record TwoFactorInitResponse(String secret, String otpAuthUri) {
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

    public record UserDto(String id, String username, String role, boolean locked, String createdAt) {
    }

    public record UpdateUserRequest(String role, Boolean locked) {
    }

    public record RoleDto(String name, String description, List<String> permissions, int userCount) {
    }

    public record RoleRequest(String name, String description, List<String> permissions) {
    }

    public record AdminResponse(String message) {
    }
}
