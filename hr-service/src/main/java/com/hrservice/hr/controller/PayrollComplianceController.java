package com.hrservice.hr.controller;

import com.hrservice.hr.dto.PayrollComplianceReport;
import com.hrservice.hr.service.PayrollComplianceReportService;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api/payroll/compliance")
public class PayrollComplianceController {

    private final PayrollComplianceReportService payrollComplianceReportService;
    private final SecurityValidator securityValidator;

    public PayrollComplianceController(PayrollComplianceReportService payrollComplianceReportService,
                                       SecurityValidator securityValidator) {
        this.payrollComplianceReportService = payrollComplianceReportService;
        this.securityValidator = securityValidator;
    }

    @GetMapping("/tax-report")
    @PreAuthorize("hasAnyRole('COMPLIANCE_OFFICER', 'ADMIN')")
    public ResponseEntity<PayrollComplianceReport> getTaxReport(
            @RequestParam String periodStart,
            @RequestParam String periodEnd,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        securityValidator.enforceComplianceOfficerOrAdmin(request);

        try {
            PayrollComplianceReport report = payrollComplianceReportService.generateTaxReport(
                    LocalDate.parse(periodStart),
                    LocalDate.parse(periodEnd)
            );
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "periodStart and periodEnd must use ISO date format yyyy-MM-dd");
        }
    }
}
