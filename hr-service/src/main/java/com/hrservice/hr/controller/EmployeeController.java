package com.hrservice.hr.controller;

import com.hrservice.hr.entity.Department;
import com.hrservice.hr.entity.Employee;
import com.hrservice.hr.entity.ProcessedSyncEvent;
import com.hrservice.hr.events.EmployeeHiredEvent;
import com.hrservice.hr.mapper.HrDtoMapper;
import com.hrservice.hr.repository.DepartmentRepository;
import com.hrservice.hr.repository.EmployeeRepository;
import com.hrservice.hr.repository.ProcessedSyncEventRepository;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/nhan-vien")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final ProcessedSyncEventRepository processedSyncEventRepository;
    private final SecurityValidator securityValidator;
    private final HrDtoMapper hrDtoMapper;
    private final com.hrservice.hr.service.EmployeeEventPublisher employeeEventPublisher;

    public EmployeeController(EmployeeRepository employeeRepository,
                              DepartmentRepository departmentRepository,
                              ProcessedSyncEventRepository processedSyncEventRepository,
                              SecurityValidator securityValidator,
                              HrDtoMapper hrDtoMapper,
                              com.hrservice.hr.service.EmployeeEventPublisher employeeEventPublisher) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.processedSyncEventRepository = processedSyncEventRepository;
        this.securityValidator = securityValidator;
        this.hrDtoMapper = hrDtoMapper;
        this.employeeEventPublisher = employeeEventPublisher;
    }

    @GetMapping
    public List<EmployeeResponse> getAll(@RequestParam(name = "departmentId", required = false) Long departmentId,
                                         HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        List<Employee> employees = departmentId == null
            ? employeeRepository.findAll()
            : employeeRepository.findByDepartmentId(departmentId);

        return employees.stream().map(hrDtoMapper::toResponse).toList();
    }

    @PostMapping
    public EmployeeResponse create(@RequestBody EmployeeCreateRequest requestBody, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        Employee employee = new Employee();
        applyCreatePayload(requestBody, employee);
        ensureAuthUserIdUnique(employee.getAuthUserId(), null);

        Employee saved = employeeRepository.save(employee);
        publishEmployeeHiredEvent(saved);

        return hrDtoMapper.toResponse(saved);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        if (!employeeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found");
        }

        employeeRepository.deleteById(id);
    }
    @PutMapping("/{id}")
    public EmployeeResponse update(@PathVariable long id,
                                   @RequestBody EmployeeUpsertRequest requestBody,
                                   HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        applyUpsertPayload(requestBody, employee);
        ensureDidUnique(employee.getDid(), employee.getId());

        return hrDtoMapper.toResponse(employeeRepository.save(employee));
    }

    @PostMapping("/internal/users/sync")
    @Transactional
    public SyncUserResponse syncUserFromAuth(@RequestBody SyncUserRequest request, HttpServletRequest httpRequest) {
        securityValidator.enforceGatewayAccess(httpRequest);

        SyncUserValidatedRequest validatedRequest = validateSyncUserRequest(request);
        String eventId = validatedRequest.eventId();
        String userId = validatedRequest.userId();
        String username = validatedRequest.username();
        String did = validatedRequest.did();

        ProcessedSyncEvent existingEvent = processedSyncEventRepository.findByEventId(eventId).orElse(null);
        if (existingEvent != null) {
            return hrDtoMapper.toSyncResponse(
                existingEvent.getEmployeeId(),
                existingEvent.getAuthUserId(),
                existingEvent.getUsername(),
                existingEvent.getDid(),
                "DUPLICATE_IGNORED"
            );
        }

        try {
            UUID.fromString(userId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId must be a valid UUID");
        }

        Employee employee = employeeRepository.findByAuthUserId(userId)
            .or(() -> employeeRepository.findByUsernameIgnoreCase(username))
            .or(() -> did == null || did.isBlank()
                ? java.util.Optional.empty()
                : employeeRepository.findByDidIgnoreCase(did))
            .orElseGet(Employee::new);

        employee.setAuthUserId(userId);
        employee.setUsername(username);
        if (did != null && !did.isBlank()) {
            employee.setDid(did);
        }
        ensureDidUnique(employee.getDid(), employee.getId());

        if (employee.getName() == null || employee.getName().isBlank()) {
            employee.setName(username);
        }

        if (employee.getPosition() == null || employee.getPosition().isBlank()) {
            employee.setPosition(request.role() == null || request.role().isBlank() ? "USER" : request.role());
        }

        Employee saved = employeeRepository.save(employee);

        ProcessedSyncEvent processed = new ProcessedSyncEvent();
        processed.setEventId(eventId);
        processed.setEmployeeId(saved.getId());
        processed.setAuthUserId(saved.getAuthUserId());
        processed.setUsername(saved.getUsername());
        processed.setDid(saved.getDid());

        try {
            processedSyncEventRepository.save(processed);
        } catch (DataIntegrityViolationException ex) {
            ProcessedSyncEvent duplicated = processedSyncEventRepository.findByEventId(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "eventId already processed"));

            return hrDtoMapper.toSyncResponse(
                duplicated.getEmployeeId(),
                duplicated.getAuthUserId(),
                duplicated.getUsername(),
                duplicated.getDid(),
                "DUPLICATE_IGNORED"
            );
        }

        return hrDtoMapper.toSyncResponse(saved.getId(), saved.getAuthUserId(), saved.getUsername(), saved.getDid(), "SYNCED");
    }

    private SyncUserValidatedRequest validateSyncUserRequest(SyncUserRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }

        String eventId = requireNotBlank(request.eventId(), "eventId");
        String userId = requireNotBlank(request.userId(), "userId");
        String username = requireNotBlank(request.username(), "username");
        String did = request.did() == null ? null : request.did().trim();

        return new SyncUserValidatedRequest(eventId, userId, username, did);
    }

    private String requireNotBlank(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }
        return value.trim();
    }

    private void applyUpsertPayload(EmployeeUpsertRequest requestBody, Employee employee) {
        if (requestBody == null || requestBody.name() == null || requestBody.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }

        employee.setName(requestBody.name().trim());
        employee.setPosition(requestBody.position() == null ? null : requestBody.position().trim());
        employee.setDid(requestBody.did() == null || requestBody.did().isBlank() ? null : requestBody.did().trim());

        if (requestBody.departmentId() == null) {
            employee.setDepartment(null);
            return;
        }

        long departmentId = requestBody.departmentId();
        Department department = departmentRepository.findById(departmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "departmentId does not exist"));
        employee.setDepartment(department);
    }

    private void applyCreatePayload(EmployeeCreateRequest requestBody, Employee employee) {
        if (requestBody == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        if (requestBody.authUserId() == null || requestBody.authUserId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authUserId is required");
        }
        if (requestBody.name() == null || requestBody.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (requestBody.baseSalary() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "baseSalary is required");
        }
        if (requestBody.hireDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "hireDate is required");
        }

        employee.setAuthUserId(requestBody.authUserId().trim());
        employee.setName(requestBody.name().trim());
        employee.setPosition(requestBody.position() == null ? null : requestBody.position().trim());
        employee.setBaseSalary(requestBody.baseSalary());
        employee.setHireDate(requestBody.hireDate());
        employee.setDid(requestBody.did() == null || requestBody.did().isBlank() ? null : requestBody.did().trim());

        if (requestBody.departmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "departmentId is required");
        }

        Department department = departmentRepository.findById(requestBody.departmentId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "departmentId does not exist"));
        employee.setDepartment(department);
    }

    private void ensureAuthUserIdUnique(String authUserId, Long currentEmployeeId) {
        if (authUserId == null || authUserId.isBlank()) {
            return;
        }

        employeeRepository.findByAuthUserId(authUserId)
            .filter(existing -> currentEmployeeId == null || !existing.getId().equals(currentEmployeeId))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "authUserId already exists");
            });
    }

    private void publishEmployeeHiredEvent(Employee employee) {
        Long departmentId = employee.getDepartment() == null ? null : employee.getDepartment().getId();
        employeeEventPublisher.publish(new EmployeeHiredEvent(
            employee.getId(),
            employee.getAuthUserId(),
            employee.getName(),
            employee.getPosition(),
            employee.getBaseSalary(),
            employee.getHireDate(),
            departmentId,
            Map.of("source", "employee.create")
        ));
    }

    private void ensureDidUnique(String did, Long currentEmployeeId) {
        if (did == null || did.isBlank()) {
            return;
        }

        employeeRepository.findByDidIgnoreCase(did)
            .filter(existing -> currentEmployeeId == null || !existing.getId().equals(currentEmployeeId))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "did already exists");
            });
    }

    public record SyncUserRequest(
        String eventId,
        String userId,
        String username,
        String did,
        String role,
        int retryCount,
        String createdAt
    ) {
    }

    public record SyncUserResponse(Long employeeId, String authUserId, String username, String did, String status) {
    }

    private record SyncUserValidatedRequest(String eventId, String userId, String username, String did) {
    }

    public record EmployeeUpsertRequest(String name, String position, String did, Long departmentId) {
    }

    public record EmployeeCreateRequest(String authUserId,
                                        String name,
                                        String position,
                                        BigDecimal baseSalary,
                                        LocalDate hireDate,
                                        Long departmentId,
                                        String did) {
    }

    public record EmployeeResponse(Long id,
                                   String authUserId,
                                   String username,
                                   String did,
                                   String name,
                                   String position,
                                   Long departmentId,
                                   String departmentName) {
    }
}