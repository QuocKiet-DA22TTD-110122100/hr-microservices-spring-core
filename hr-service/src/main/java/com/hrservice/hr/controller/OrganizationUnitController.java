package com.hrservice.hr.controller;

import com.hrservice.hr.entity.OrganizationUnit;
import com.hrservice.hr.mapper.HrDtoMapper;
import com.hrservice.hr.repository.OrganizationUnitRepository;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/don-vi-to-chuc")
public class OrganizationUnitController {

    private final OrganizationUnitRepository organizationUnitRepository;
    private final SecurityValidator securityValidator;
    private final HrDtoMapper hrDtoMapper;

    public OrganizationUnitController(OrganizationUnitRepository organizationUnitRepository,
                                      SecurityValidator securityValidator,
                                      HrDtoMapper hrDtoMapper) {
        this.organizationUnitRepository = organizationUnitRepository;
        this.securityValidator = securityValidator;
        this.hrDtoMapper = hrDtoMapper;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<OrganizationUnitResponse> getAll(HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        return organizationUnitRepository.findAll().stream().map(hrDtoMapper::toResponse).toList();
    }

    @GetMapping("/tree")
    @Transactional(readOnly = true)
    public List<OrganizationUnitTreeNode> getTree(HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        return organizationUnitRepository.findByParentIsNull().stream().map(this::toTreeNode).toList();
    }

    @PostMapping
    @SuppressWarnings("null")
    public OrganizationUnitResponse create(@RequestBody OrganizationUnitUpsertRequest requestBody, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        OrganizationUnit organizationUnit = new OrganizationUnit();
        applyUpsertPayload(requestBody, organizationUnit);

        return hrDtoMapper.toResponse(organizationUnitRepository.save(organizationUnit));
    }

    @PutMapping("/{id}")
    @SuppressWarnings("null")
    public OrganizationUnitResponse update(@PathVariable long id,
                                           @RequestBody OrganizationUnitUpsertRequest requestBody,
                                           HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        OrganizationUnit organizationUnit = organizationUnitRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization unit not found"));

        applyUpsertPayload(requestBody, organizationUnit);
        OrganizationUnit savedOrganizationUnit = organizationUnitRepository.save(organizationUnit);
        return hrDtoMapper.toResponse(savedOrganizationUnit);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceAdminRole(request);

        if (!organizationUnitRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization unit not found");
        }

        organizationUnitRepository.deleteById(id);
    }

    private void applyUpsertPayload(OrganizationUnitUpsertRequest requestBody, OrganizationUnit organizationUnit) {
        if (requestBody == null || requestBody.name() == null || requestBody.name().isBlank() || requestBody.level() == null || requestBody.level().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name and level are required");
        }

        organizationUnit.setName(requestBody.name().trim());
        organizationUnit.setCode(requestBody.code() == null || requestBody.code().isBlank() ? null : requestBody.code().trim());

        try {
            organizationUnit.setLevel(OrganizationUnit.OrgLevel.valueOf(requestBody.level().trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid organization level");
        }

        if (requestBody.parentId() != null) {
            long parentId = requestBody.parentId();
            OrganizationUnit parent = organizationUnitRepository.findById(parentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "parentId does not exist"));
            organizationUnit.setParent(parent);
        } else {
            organizationUnit.setParent(null);
        }
    }

    private OrganizationUnitTreeNode toTreeNode(OrganizationUnit organizationUnit) {
        List<OrganizationUnitTreeNode> children = organizationUnitRepository.findByParentId(organizationUnit.getId())
            .stream()
            .map(this::toTreeNode)
            .toList();

        return new OrganizationUnitTreeNode(
            organizationUnit.getId(),
            organizationUnit.getName(),
            organizationUnit.getCode(),
            organizationUnit.getLevel() == null ? null : organizationUnit.getLevel().name(),
            organizationUnit.getParent() == null ? null : organizationUnit.getParent().getId(),
            children
        );
    }

    public record OrganizationUnitUpsertRequest(String name, String code, String level, Long parentId) {
    }

    public record OrganizationUnitResponse(Long id, String name, String code, String level, Long parentId) {
    }

    public record OrganizationUnitTreeNode(Long id,
                                           String name,
                                           String code,
                                           String level,
                                           Long parentId,
                                           List<OrganizationUnitTreeNode> children) {
    }
}
