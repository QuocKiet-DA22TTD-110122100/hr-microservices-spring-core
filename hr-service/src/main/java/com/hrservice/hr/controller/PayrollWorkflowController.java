package com.hrservice.hr.controller;

import com.hrservice.hr.config.PayrollService;
import com.hrservice.hr.entity.PayrollResult;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/chi-tra")
public class PayrollWorkflowController {

    private final PayrollService payrollService;
    private final SecurityValidator securityValidator;

    public PayrollWorkflowController(PayrollService payrollService, SecurityValidator securityValidator) {
        this.payrollService = payrollService;
        this.securityValidator = securityValidator;
    }

    @PutMapping("/{payrollId}/phe-duyet")
    @PreAuthorize("hasAnyRole('PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> approvePayroll(
            @PathVariable Long payrollId,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforcePayrollOfficerOrAdmin(request);

        try {
            String actor = resolveActor(request);
            PayrollResult result = payrollService.approvePayroll(payrollId, actor);
            return ResponseEntity.ok(buildApprovalResponse(result));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/{payrollId}/tu-choi")
    @PreAuthorize("hasAnyRole('PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> rejectPayroll(
            @PathVariable Long payrollId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforcePayrollOfficerOrAdmin(request);

        try {
            String reason = body.get("reason");
            String actor = resolveActor(request);
            PayrollResult result = payrollService.rejectPayroll(payrollId, reason, actor);
            return ResponseEntity.ok(Map.of(
                    "payrollId", result.getId(),
                    "status", result.getStatus(),
                    "rejectedBy", actor,
                    "rejectedAt", LocalDateTime.now().toString(),
                    "reason", result.getRemarks(),
                    "message", "Payroll returned to DRAFT status. Recalculate if needed."
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @PutMapping("/{payrollId}/xu-ly")
    @PreAuthorize("hasAnyRole('PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> processPayroll(
            @PathVariable Long payrollId,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforcePayrollOfficerOrAdmin(request);

        try {
            String actor = resolveActor(request);
            PayrollResult result = payrollService.processPayroll(payrollId, actor);
            return ResponseEntity.ok(Map.of(
                    "payrollId", result.getId(),
                    "status", result.getStatus(),
                    "processedBy", actor,
                    "processedAt", result.getProcessedAt().toString(),
                    "message", "Payroll finalized. Immutable. Event published to downstream systems."
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    private Map<String, Object> buildApprovalResponse(PayrollResult result) {
        return Map.of(
                "payrollId", result.getId(),
                "status", result.getStatus(),
                "approvedBy", result.getApprovedBy(),
                "approvedAt", result.getApprovedAt().toString(),
                "message", "Payroll approved. Cannot be edited. Ready for processing."
        );
    }

    private String resolveActor(HttpServletRequest request) {
        String actor = request.getHeader("X-Auth-Email");
        if (actor == null || actor.isBlank()) {
            actor = request.getHeader("X-Auth-User");
        }
        if (actor == null || actor.isBlank()) {
            actor = request.getHeader("X-Auth-Principal");
        }
        return actor == null || actor.isBlank() ? "SYSTEM" : actor.trim();
    }
}