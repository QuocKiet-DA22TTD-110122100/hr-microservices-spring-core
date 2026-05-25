package com.hrservice.hr.controller;

import com.hrservice.hr.config.PayrollService;
import com.hrservice.hr.entity.PayrollResult;
import com.hrservice.hr.repository.EmployeeRepository;
import com.hrservice.hr.repository.PayrollResultRepository;
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

    public PayrollController(PayrollResultRepository payrollResultRepository,
                           EmployeeRepository employeeRepository,
                           SecurityValidator securityValidator,
                           PayrollService payrollService) {
        this.payrollResultRepository = payrollResultRepository;
        this.employeeRepository = employeeRepository;
        this.securityValidator = securityValidator;
        this.payrollService = payrollService;
    }

    @GetMapping("/{employeeId}/calculate")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<PayrollResult> calculatePayroll(
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
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/{employeeId}/current")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<PayrollResult> getCurrentPayroll(
            @PathVariable Long employeeId,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        return payrollResultRepository.findLatestByEmployeeId(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{employeeId}/history")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<PayrollResult>> getPayrollHistory(
            @PathVariable Long employeeId,
            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);

        List<PayrollResult> history = payrollResultRepository
                .findByEmployeeIdAndStatusOrderByPeriodStartDateDesc(employeeId, "PROCESSED");
        return ResponseEntity.ok(history);
    }

    @PostMapping("/{payrollId}/approve")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<PayrollResult> approvePayroll(
            @PathVariable Long payrollId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        securityValidator.enforceGatewayAccess(httpRequest);

        try {
            String approvedBy = request.getOrDefault("approvedBy", "SYSTEM");
            PayrollResult result = payrollService.approvePayroll(payrollId, approvedBy);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
