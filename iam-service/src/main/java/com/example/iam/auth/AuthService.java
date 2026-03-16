package com.example.iam.auth;

import com.example.iam.config.SecurityProperties;
import com.example.iam.dto.AuthResponse;
import com.example.iam.dto.LoginRequest;
import com.example.iam.dto.RefreshTokenRequest;
import com.example.iam.dto.RegisterRequest;
import com.example.iam.entity.UserAccount;
import com.example.iam.entity.UserRole;
import com.example.iam.exception.AuthException;
import com.example.iam.repository.UserAccountRepository;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final SecurityProperties properties;
    private final AesGcmService aesGcmService;
    private final IpSecurityService ipSecurityService;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new AuthException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new AuthException(HttpStatus.CONFLICT, "Email already exists");
        }

        UserAccount user = new UserAccount();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPasswordChangedAt(Instant.now());
        user.setRole(UserRole.USER);
        user.setEnabled(true);

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhoneEncrypted(aesGcmService.encrypt(request.getPhone().trim()));
        }

        userRepository.save(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        ipSecurityService.assertIpNotLocked(ipAddress);

        UserAccount user = userRepository.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> invalidCredentials(ipAddress));

        assertUserCanLogin(user);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            onUserFailedAttempt(user);
            ipSecurityService.onFailedAuth(ipAddress);
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        resetFailedAttempts(user);
        ipSecurityService.onSuccessAuth(ipAddress);

        return AuthResponse.builder()
                .accessToken(jwtTokenService.issueAccessToken(user))
                .refreshToken(jwtTokenService.issueRefreshToken(user))
                .expiresInSeconds(jwtTokenService.accessTokenTtlSeconds())
                .tokenType("Bearer")
                .build();
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        JWTClaimsSet claims = jwtTokenService.verify(request.getRefreshToken());
        String type = stringClaim(claims, "type");
        if (!"refresh".equals(type)) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        String username = claims.getSubject();
        UserAccount user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "User not found"));

        assertUserCanLogin(user);

        return AuthResponse.builder()
                .accessToken(jwtTokenService.issueAccessToken(user))
                .refreshToken(jwtTokenService.issueRefreshToken(user))
                .expiresInSeconds(jwtTokenService.accessTokenTtlSeconds())
                .tokenType("Bearer")
                .build();
    }

    private String stringClaim(JWTClaimsSet claims, String key) {
        Object value = claims.getClaim(key);
        return value == null ? null : String.valueOf(value);
    }

    private AuthException invalidCredentials(String ipAddress) {
        ipSecurityService.onFailedAuth(ipAddress);
        return new AuthException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }

    private void assertUserCanLogin(UserAccount user) {
        if (!user.isEnabled()) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Account is disabled");
        }
        if (user.getAccountExpiresAt() != null && user.getAccountExpiresAt().isBefore(Instant.now())) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Account is expired");
        }
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw new AuthException(HttpStatus.LOCKED, "Account is temporarily locked");
        }
        if (isPasswordExpired(user)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Password expired. Please reset password.");
        }
    }

    private boolean isPasswordExpired(UserAccount user) {
        Instant limit = user.getPasswordChangedAt().plusSeconds(properties.getPassword().getExpiryDays() * 86400L);
        return limit.isBefore(Instant.now());
    }

    private void onUserFailedAttempt(UserAccount user) {
        int failed = user.getFailedAttempts() + 1;
        user.setFailedAttempts(failed);
        if (failed >= properties.getLock().getUserMaxAttempts()) {
            user.setLockedUntil(Instant.now().plusSeconds(properties.getLock().getUserLockMinutes() * 60L));
            user.setFailedAttempts(0);
        }
        user.markUpdated();
        userRepository.save(user);
    }

    private void resetFailedAttempts(UserAccount user) {
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.markUpdated();
        userRepository.save(user);
    }
}
