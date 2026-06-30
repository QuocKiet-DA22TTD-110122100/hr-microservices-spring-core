package com.hrservice.hr.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PayrollComplianceReportEntry(
        Long payrollId,
        Long employeeId,
        String employeeName,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal grossPay,
        BigDecimal taxDeduction,
        BigDecimal insuranceDeduction,
        BigDecimal otherDeduction,
        BigDecimal totalDeduction,
        BigDecimal netPay,
        String processedBy,
        LocalDateTime processedAt
) {
}
