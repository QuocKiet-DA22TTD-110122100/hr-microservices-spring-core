package com.hrservice.hr.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PayrollComplianceReport(
        LocalDate periodStart,
        LocalDate periodEnd,
        LocalDateTime generatedAt,
        int payrollCount,
        int employeeCount,
        BigDecimal totalGrossPay,
        BigDecimal totalTaxDeduction,
        BigDecimal totalInsuranceDeduction,
        BigDecimal totalOtherDeduction,
        BigDecimal totalDeductions,
        BigDecimal totalNetPay,
        List<PayrollComplianceReportEntry> entries
) {
}
