package com.hrservice.hr.controller;

import com.hrservice.hr.entity.Department;
import com.hrservice.hr.entity.OrganizationUnit;
import com.hrservice.hr.mapper.HrDtoMapper;
import com.hrservice.hr.repository.DepartmentRepository;
import com.hrservice.hr.repository.OrganizationUnitRepository;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/phong-ban")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final OrganizationUnitRepository organizationUnitRepository;
    private final SecurityValidator securityValidator;
    private final HrDtoMapper hrDtoMapper;

    public DepartmentController(DepartmentRepository departmentRepository,
                                OrganizationUnitRepository organizationUnitRepository,
                                SecurityValidator securityValidator,
                                HrDtoMapper hrDtoMapper) {
        this.departmentRepository = departmentRepository;
        this.organizationUnitRepository = organizationUnitRepository;
        this.securityValidator = securityValidator;
        this.hrDtoMapper = hrDtoMapper;
    }

    @GetMapping
    public List<DepartmentResponse> getAll(@RequestParam(name = "organizationUnitId", required = false) Long organizationUnitId,
                                           HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        List<Department> departments;
        if (organizationUnitId == null) {
            departments = departmentRepository.findAll();
        } else {
            departments = departmentRepository.findByOrganizationUnitId(organizationUnitId);
        }

        return departments.stream().map(hrDtoMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public DepartmentResponse getById(@PathVariable long id, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        return hrDtoMapper.toResponse(department);
    }

    @PostMapping
    @SuppressWarnings("null")
    public DepartmentResponse create(@RequestBody DepartmentUpsertRequest requestBody, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        Department department = new Department();
        applyUpsertPayload(requestBody, department);

        return hrDtoMapper.toResponse(departmentRepository.save(department));
    }

    @PutMapping("/{id}")
    @SuppressWarnings("null")
    public DepartmentResponse update(@PathVariable long id,
                                     @RequestBody DepartmentUpsertRequest requestBody,
                                     HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        applyUpsertPayload(requestBody, department);
        Department savedDepartment = departmentRepository.save(department);
        return hrDtoMapper.toResponse(savedDepartment);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        if (!departmentRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found");
        }

        departmentRepository.deleteById(id);
    }

    private void applyUpsertPayload(DepartmentUpsertRequest requestBody, Department department) {
        if (requestBody == null || requestBody.name() == null || requestBody.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }

        department.setName(requestBody.name().trim());
        department.setCode(requestBody.code() == null || requestBody.code().isBlank() ? null : requestBody.code().trim());

        if (requestBody.organizationUnitId() == null) {
            department.setOrganizationUnit(null);
            return;
        }

        long organizationUnitId = requestBody.organizationUnitId();
        OrganizationUnit organizationUnit = organizationUnitRepository.findById(organizationUnitId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "organizationUnitId does not exist"));
        department.setOrganizationUnit(organizationUnit);
    }

    public record DepartmentUpsertRequest(String name, String code, Long organizationUnitId) {
    }

    public record DepartmentResponse(Long id, String name, String code, Long organizationUnitId, String organizationUnitName) {
    }
}
