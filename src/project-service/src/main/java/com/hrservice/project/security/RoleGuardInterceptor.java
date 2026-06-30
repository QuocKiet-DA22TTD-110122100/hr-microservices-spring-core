package com.hrservice.project.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.List;

@Component
public class RoleGuardInterceptor implements HandlerInterceptor {

    private static final String X_AUTH_ROLES = "X-Auth-Roles";

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod method)) return true;

        RequireRoles annotation = method.getMethodAnnotation(RequireRoles.class);
        if (annotation == null) return true;

        String rolesHeader = request.getHeader(X_AUTH_ROLES);
        if (rolesHeader == null || rolesHeader.isBlank()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing X-Auth-Roles header");
            return false;
        }

        List<String> userRoles = Arrays.stream(rolesHeader.split(","))
                .map(String::trim).toList();

        boolean allowed = Arrays.stream(annotation.value())
                .anyMatch(r -> userRoles.stream().anyMatch(r::equalsIgnoreCase));

        if (!allowed) {
            response.sendError(HttpStatus.FORBIDDEN.value(), "Access denied");
            return false;
        }
        return true;
    }
}
