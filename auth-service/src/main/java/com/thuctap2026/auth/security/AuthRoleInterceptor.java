package com.thuctap2026.auth.security;

import com.thuctap2026.auth.iam.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class AuthRoleInterceptor implements HandlerInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    public AuthRoleInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequiredRoles requiredRoles = handlerMethod.getMethodAnnotation(RequiredRoles.class);
        if (requiredRoles == null) {
            return true;
        }

        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            return deny(response, HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }

        String token = authorization.substring(BEARER_PREFIX.length());

        Map<String, Object> claims;
        try {
            claims = authService.verifyToken(token);
        } catch (RuntimeException ex) {
            return deny(response, HttpStatus.UNAUTHORIZED, "Invalid token");
        }

        List<String> userRoles = extractRoles(claims);
        boolean allowed = Arrays.stream(requiredRoles.value())
            .anyMatch(required -> userRoles.stream().anyMatch(role -> role.equalsIgnoreCase(required)));

        if (!allowed) {
            return deny(response, HttpStatus.FORBIDDEN, "Access denied");
        }

        return true;
    }

    private boolean deny(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.sendError(status.value(), message);
        return false;
    }

    private List<String> extractRoles(Map<String, Object> claims) {
        List<String> roles = extractRolesFromClaim(claims.get("roles"));
        if (!roles.isEmpty()) {
            return roles;
        }
        return extractSingleRole(claims.get("role"));
    }

    private List<String> extractRolesFromClaim(Object rolesClaim) {
        if (rolesClaim instanceof Collection<?> collection) {
            return normalizeCollectionRoles(collection);
        }
        if (rolesClaim instanceof String rolesText) {
            return normalizeCsvRoles(rolesText);
        }
        return List.of();
    }

    private List<String> normalizeCollectionRoles(Collection<?> collection) {
        List<String> roles = new ArrayList<>();
        for (Object role : collection) {
            String normalized = normalizeRole(role);
            if (normalized != null) {
                roles.add(normalized);
            }
        }
        return roles;
    }

    private List<String> normalizeCsvRoles(String rolesText) {
        if (rolesText.isBlank()) {
            return List.of();
        }
        return Arrays.stream(rolesText.split(","))
            .map(this::normalizeRole)
            .filter(Objects::nonNull)
            .toList();
    }

    private List<String> extractSingleRole(Object roleClaim) {
        String role = normalizeRole(roleClaim);
        if (role == null) {
            return List.of();
        }
        return List.of(role);
    }

    private String normalizeRole(Object role) {
        if (role == null) {
            return null;
        }
        String value = String.valueOf(role).trim();
        if (value.isBlank()) {
            return null;
        }
        return value;
    }
}
