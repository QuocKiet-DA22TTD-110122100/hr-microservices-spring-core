package com.hrservice.hr.controller;

import com.hrservice.hr.config.PayrollService;
import com.hrservice.hr.entity.PayrollResult;
import com.hrservice.hr.repository.EmployeeRepository;
import com.hrservice.hr.repository.PayrollResultRepository;
import com.hrservice.hr.service.PayrollRunService;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollResultRepository payrollResultRepository;
    private final EmployeeRepository employeeRepository;
    private final SecurityValidator securityValidator;
    private final PayrollService payrollService;
    private final PayrollRunService payrollRunService;

    public PayrollController(PayrollResultRepository payrollResultRepository,
                           EmployeeRepository employeeRepository,
                           SecurityValidator securityValidator,
                           PayrollService payrollService,
                           PayrollRunService payrollRunService) {
        this.payrollResultRepository = payrollResultRepository;
        this.employeeRepository = employeeRepository;
        this.securityValidator = securityValidator;
        this.payrollService = payrollService;
        this.payrollRunService = payrollRunService;
    }

    @GetMapping("/{employeeId}/calculate")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> calculatePayroll(
            @PathVariable Long employeeId,
            @RequestParam String yearMonth,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found"));

        try {
            YearMonth ym = YearMonth.parse(yearMonth);
            PayrollResult result = payrollService.calculatePayroll(employeeId, ym);
            return ResponseEntity.ok(toPayrollResponse(result));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/{employeeId}/current")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getCurrentPayroll(
            @PathVariable Long employeeId,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        return payrollResultRepository.findLatestByEmployeeId(employeeId)
                .map(result -> ResponseEntity.ok(toPayrollResponse(result)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{employeeId}/history")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPayrollHistory(
            @PathVariable Long employeeId,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        List<PayrollResult> history = payrollResultRepository
                .findByEmployeeIdAndStatusOrderByPeriodStartDateDesc(employeeId, "PROCESSED");
        return ResponseEntity.ok(history.stream().map(this::toPayrollResponse).toList());
    }

    @PostMapping("/{payrollId}/approve")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> approvePayroll(
            @PathVariable Long payrollId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        securityValidator.enforceGatewayAccess(httpRequest);

        try {
            String approvedBy = request.getOrDefault("approvedBy", "SYSTEM");
            PayrollResult result = payrollService.approvePayroll(payrollId, approvedBy);
            return ResponseEntity.ok(toPayrollResponse(result));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/runs")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> createPayrollRun(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        try {
            String yearMonth = body.get("yearMonth");
            if (yearMonth == null) {
                throw new IllegalArgumentException("Missing yearMonth in body");
            }
            String requestedBy = body.getOrDefault("requestedBy", "SYSTEM");
            String source = body.getOrDefault("source", "api");
            YearMonth ym = YearMonth.parse(yearMonth);

            com.hrservice.hr.entity.PayrollRun saved = payrollRunService.createPayrollRun(ym, requestedBy, source);

            Map<String, Object> resp = Map.of(
                    "status", "requested",
                    "payrollRunId", saved.getId(),
                    "yearMonth", yearMonth,
                    "periodStart", saved.getPeriodStartDate().toString(),
                    "periodEnd", saved.getPeriodEndDate().toString()
            );
            return ResponseEntity.accepted().body(resp);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    private Map<String, Object> toPayrollResponse(PayrollResult result) {
        Map<String, Object> employee = new java.util.LinkedHashMap<>();
        employee.put("id", result.getEmployee().getId());
        employee.put("username", result.getEmployee().getUsername());
        employee.put("name", result.getEmployee().getName());
        employee.put("position", result.getEmployee().getPosition());

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("id", result.getId());
        response.put("employeeId", result.getEmployee().getId());
        response.put("employee", employee);
        response.put("periodStartDate", result.getPeriodStartDate());
        response.put("periodEndDate", result.getPeriodEndDate());
        response.put("grossPay", result.getGrossPay());
        response.put("taxDeduction", result.getTaxDeduction());
        response.put("insuranceDeduction", result.getInsuranceDeduction());
        response.put("otherDeduction", result.getOtherDeduction());
        response.put("totalDeduction", result.getTotalDeduction());
        response.put("netPay", result.getNetPay());
        response.put("status", result.getStatus());
        response.put("approvedBy", result.getApprovedBy());
        response.put("approvedAt", result.getApprovedAt());
        response.put("processedBy", result.getProcessedBy());
        response.put("processedAt", result.getProcessedAt());
        response.put("remarks", result.getRemarks());
        return response;
    }
}
// PR: included in feature/PAYROLL-001-payroll-run
