package com.hrservice.auth.iam.service;

import com.hrservice.auth.iam.entity.RoleDefinition;
import com.hrservice.auth.iam.repository.RoleDefinitionRepository;
import com.hrservice.auth.iam.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class RoleManagementService {

    private static final Pattern ROLE_NAME_PATTERN = Pattern.compile("^[A-Z0-9_]{2,50}$");
    private static final Set<String> KNOWN_PERMISSIONS = Set.of(
        "ALL",
        "READ_EMPLOYEE",
        "WRITE_EMPLOYEE",
        "DELETE_EMPLOYEE",
        "READ_DEPARTMENT",
        "WRITE_DEPARTMENT",
        "DELETE_DEPARTMENT",
        "READ_ORGANIZATION",
        "WRITE_ORGANIZATION",
        "DELETE_ORGANIZATION",
        "READ_PROJECT",
        "WRITE_PROJECT",
        "DELETE_PROJECT",
        "READ_TASK",
        "WRITE_TASK",
        "DELETE_TASK",
        "READ_PAYROLL",
        "WRITE_PAYROLL",
        "READ_ROLE",
        "WRITE_ROLE",
        "DELETE_ROLE",
        "READ_USER",
        "WRITE_USER",
        "DELETE_USER"
    );

    private final RoleDefinitionRepository roleDefinitionRepository;
    private final UserRepository userRepository;

    public RoleManagementService(RoleDefinitionRepository roleDefinitionRepository, UserRepository userRepository) {
        this.roleDefinitionRepository = roleDefinitionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleView> listRoles() {
        return roleDefinitionRepository.findAll().stream()
            .map(this::toView)
            .sorted((first, second) -> first.name().compareToIgnoreCase(second.name()))
            .toList();
    }

    @Transactional
    public RoleView createRole(String name, String description, List<String> permissions) {
        String normalizedName = normalizeRoleName(name);
        if (roleDefinitionRepository.existsById(normalizedName)) {
            throw new IllegalArgumentException("Role already exists");
        }

        RoleDefinition role = new RoleDefinition();
        role.setName(normalizedName);
        role.setDescription(validateDescription(description));
        role.setPermissions(String.join(",", validatePermissions(permissions)));
        role.setSystemRole(false);

        return toView(roleDefinitionRepository.save(role));
    }

    @Transactional
    public RoleView updateRole(String name, String description, List<String> permissions) {
        String normalizedName = normalizeRoleName(name);
        RoleDefinition role = roleDefinitionRepository.findById(normalizedName)
            .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        role.setDescription(validateDescription(description));
        role.setPermissions(String.join(",", validatePermissions(permissions)));

        return toView(roleDefinitionRepository.save(role));
    }

    @Transactional
    public void deleteRole(String name) {
        String normalizedName = normalizeRoleName(name);
        RoleDefinition role = roleDefinitionRepository.findById(normalizedName)
            .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        if (role.isSystemRole()) {
            throw new IllegalArgumentException("System role cannot be deleted");
        }

        long userCount = userRepository.countByRoleIgnoreCase(normalizedName);
        if (userCount > 0) {
            throw new IllegalArgumentException("Role is still assigned to users");
        }

        roleDefinitionRepository.delete(role);
    }

    private RoleView toView(RoleDefinition role) {
        return new RoleView(
            role.getName(),
            role.getDescription(),
            parsePermissions(role.getPermissions()),
            Math.toIntExact(userRepository.countByRoleIgnoreCase(role.getName()))
        );
    }

    private String normalizeRoleName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Role name is required");
        }

        String normalized = name.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
        if (!ROLE_NAME_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Role name must be 2-50 characters and contain only A-Z, 0-9, underscore");
        }

        return normalized;
    }

    private String validateDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Role description is required");
        }

        String normalized = description.trim();
        if (normalized.length() < 10 || normalized.length() > 500) {
            throw new IllegalArgumentException("Role description must be 10-500 characters");
        }

        return normalized;
    }

    private List<String> validatePermissions(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            throw new IllegalArgumentException("At least one permission is required");
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String permission : permissions) {
            if (permission == null || permission.isBlank()) {
                continue;
            }

            String value = permission.trim().toUpperCase(Locale.ROOT);
            if (!KNOWN_PERMISSIONS.contains(value)) {
                throw new IllegalArgumentException("Unknown permission: " + value);
            }
            normalized.add(value);
        }

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("At least one permission is required");
        }

        return List.copyOf(normalized);
    }

    private List<String> parsePermissions(String permissions) {
        if (permissions == null || permissions.isBlank()) {
            return List.of();
        }

        return Arrays.stream(permissions.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .toList();
    }

    public record RoleView(String name, String description, List<String> permissions, int userCount) {
    }
}
