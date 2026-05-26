package com.hrservice.hr.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SecurityValidator {

    @Value("${app.internal-secret}")
    private String internalSecret;

    public void enforceGatewayAccess(HttpServletRequest request) {
        String incomingSecret = request.getHeader("X-Internal-Secret");
        if (incomingSecret == null || !incomingSecret.equals(internalSecret)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid credentials or missing X-Internal-Secret header");
        }
    }

    public void enforceAdminRole(HttpServletRequest request) {
        String role = normalize(request.getHeader("X-Auth-Role"));
        String roles = request.getHeader("X-Auth-Roles");
        boolean isAdmin = "ADMIN".equals(role)
            || "ROLE_ADMIN".equals(role)
            || containsRole(roles, "ADMIN")
            || containsRole(roles, "ROLE_ADMIN");

        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role is required");
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private boolean containsRole(String roles, String targetRole) {
        if (roles == null || roles.isBlank()) {
            return false;
        }
        String[] rolesArray = roles.split("[,;\\s]+");
        String normalized = targetRole.trim().toUpperCase();
        for (String role : rolesArray) {
            if (compare(role.trim(), normalized)) {
                return true;
            }
        }
        return false;
    }

    private boolean compare(String a, String b) {
        return a.equalsIgnoreCase(b);
    }
}
