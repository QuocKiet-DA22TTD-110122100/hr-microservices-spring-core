package com.example.hrservice.controller;

import com.example.hrservice.entity.Employee;
import com.example.hrservice.repository.EmployeeRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/employees")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;

    @Value("${app.internal-secret}")
    private String internalSecret;

    public EmployeeController(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public List<Employee> getAll(HttpServletRequest request) {
        enforceGatewayAccess(request);
        return employeeRepository.findAll();
    }

    @PostMapping
    public Employee create(@RequestBody Employee employee, HttpServletRequest request) {
        enforceGatewayAccess(request);
        enforceAdminRole(request);
        return employeeRepository.save(employee);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, HttpServletRequest request) {
        enforceGatewayAccess(request);
        enforceAdminRole(request);
        employeeRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public Employee update(@PathVariable Long id, @RequestBody Employee newEmployee, HttpServletRequest request) {
        enforceGatewayAccess(request);
        enforceAdminRole(request);

        Employee employee = employeeRepository.findById(id).orElseThrow();

        employee.setName(newEmployee.getName());
        employee.setPosition(newEmployee.getPosition());

        return employeeRepository.save(employee);
    }

    @PostMapping("/internal/users/sync")
    public SyncUserResponse syncUserFromAuth(@RequestBody SyncUserRequest request, HttpServletRequest httpRequest) {
        enforceGatewayAccess(httpRequest);

        if (request == null || request.userId() == null || request.userId().isBlank() || request.username() == null || request.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId and username are required");
        }

        UUID.fromString(request.userId());

        Employee employee = employeeRepository.findByAuthUserId(request.userId())
            .or(() -> employeeRepository.findByUsernameIgnoreCase(request.username()))
            .orElseGet(Employee::new);

        employee.setAuthUserId(request.userId());
        employee.setUsername(request.username());

        if (employee.getName() == null || employee.getName().isBlank()) {
            employee.setName(request.username());
        }

        if (employee.getPosition() == null || employee.getPosition().isBlank()) {
            employee.setPosition(request.role() == null || request.role().isBlank() ? "USER" : request.role());
        }

        Employee saved = employeeRepository.save(employee);
        return new SyncUserResponse(saved.getId(), saved.getAuthUserId(), saved.getUsername(), "SYNCED");
    }

    private void enforceGatewayAccess(HttpServletRequest request) {
        String incomingSecret = request.getHeader("X-Internal-Secret");
        if (incomingSecret == null || !incomingSecret.equals(internalSecret)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Quyền hạng không hợp lệ hoặc thiếu header X-Internal-Secret");
        }
    }

    private void enforceAdminRole(HttpServletRequest request) {
        String role = normalize(request.getHeader("X-Auth-Role"));
        String roles = normalize(request.getHeader("X-Auth-Roles"));
        boolean isAdmin = "ADMIN".equals(role)
            || "ROLE_ADMIN".equals(role)
            || roles.contains("ADMIN")
            || roles.contains("ROLE_ADMIN");

        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Quyền hạng ADMIN là bắt buộc");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    public record SyncUserRequest(
        String eventId,
        String userId,
        String username,
        String role,
        int retryCount,
        String createdAt
    ) {
    }

    public record SyncUserResponse(Long employeeId, String authUserId, String username, String status) {
    }
}