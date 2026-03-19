package com.thuctap2026.auth.security;

import com.thuctap2026.auth.iam.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.Map;

@Component
public class AuthRoleInterceptor implements HandlerInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    public AuthRoleInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequiredRoles requiredRoles = handlerMethod.getMethodAnnotation(RequiredRoles.class);
        if (requiredRoles == null) {
            return true;
        }

        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing or invalid Authorization header");
            return false;
        }

        String token = authorization.substring(BEARER_PREFIX.length());

        Map<String, Object> claims;
        try {
            claims = authService.verifyToken(token);
        } catch (RuntimeException ex) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid token");
            return false;
        }

        Object roleObj = claims.get("role");
        String role = roleObj == null ? "" : String.valueOf(roleObj);
        boolean allowed = Arrays.stream(requiredRoles.value()).anyMatch(allowedRole -> allowedRole.equals(role));

        if (!allowed) {
            response.sendError(HttpStatus.FORBIDDEN.value(), "Access denied");
            return false;
        }

        return true;
    }
}
