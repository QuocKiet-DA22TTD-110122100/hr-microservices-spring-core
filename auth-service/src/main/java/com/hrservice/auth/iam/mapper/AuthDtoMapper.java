package com.hrservice.auth.iam.mapper;

import com.hrservice.auth.iam.controller.AuthController.RegisterResponse;
import com.hrservice.auth.iam.controller.AuthController.SyncStatusResponse;
import com.hrservice.auth.iam.entity.User;
import com.hrservice.auth.iam.service.AuthService;
import com.hrservice.auth.iam.sync.UserSyncService;
import org.springframework.stereotype.Component;

@Component
public class AuthDtoMapper {

    public RegisterResponse toRegisterResponse(User user) {
        return new RegisterResponse(user.getId().toString(), user.getUsername(), user.getRole());
    }

    public SyncStatusResponse toSyncStatusResponse(UserSyncService.SyncStatusView status) {
        return new SyncStatusResponse(
            status.userId().toString(),
            status.status(),
            status.retryCount(),
            status.lastError(),
            status.updatedAt() == null ? null : status.updatedAt().toString()
        );
    }

    public com.hrservice.auth.iam.controller.AuthController.LoginResponse toLoginResponse(AuthService.LoginResult result) {
        return new com.hrservice.auth.iam.controller.AuthController.LoginResponse(
            result.accessToken(),
            result.tokenType(),
            result.expiresIn(),
            result.scope(),
            result.mfaRequired(),
            result.mfaMethod(),
            result.accessToken()
        );
    }

    public com.hrservice.auth.iam.controller.AuthController.OAuth2TokenResponse toOAuth2TokenResponse(AuthService.LoginResult result) {
        return new com.hrservice.auth.iam.controller.AuthController.OAuth2TokenResponse(
            result.accessToken(),
            result.tokenType(),
            result.expiresIn(),
            result.scope()
        );
    }

    public com.hrservice.auth.iam.controller.AuthController.ChangePasswordResponse toChangePasswordResponse(String message) {
        return new com.hrservice.auth.iam.controller.AuthController.ChangePasswordResponse(message);
    }

    public com.hrservice.auth.iam.controller.AuthController.VerifyTokenResponse toVerifyTokenResponse(boolean valid, java.util.Map<String, Object> claims) {
        return new com.hrservice.auth.iam.controller.AuthController.VerifyTokenResponse(valid, claims);
    }

    public com.hrservice.auth.iam.controller.AuthController.LogoutResponse toLogoutResponse(String message) {
        return new com.hrservice.auth.iam.controller.AuthController.LogoutResponse(message);
    }

    public com.hrservice.auth.iam.controller.AuthController.AdminResponse toAdminResponse(String message) {
        return new com.hrservice.auth.iam.controller.AuthController.AdminResponse(message);
    }
}
