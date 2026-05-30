package com.hrservice.hr.service;

import com.hrservice.hr.dto.PayrollComplianceReport;
import com.hrservice.hr.dto.PayrollComplianceReportEntry;
import com.hrservice.hr.entity.Employee;
import com.hrservice.hr.entity.PayrollResult;
import com.hrservice.hr.repository.PayrollResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class PayrollComplianceReportService {

    private static final String PROCESSED_STATUS = "PROCESSED";

    private final PayrollResultRepository payrollResultRepository;

    public PayrollComplianceReportService(PayrollResultRepository payrollResultRepository) {
        this.payrollResultRepository = payrollResultRepository;
    }

    @Transactional(readOnly = true)
    public PayrollComplianceReport generateTaxReport(LocalDate periodStart, LocalDate periodEnd) {
        if (periodStart == null || periodEnd == null) {
            throw new IllegalArgumentException("periodStart and periodEnd are required");
        }
        if (periodStart.isAfter(periodEnd)) {
            throw new IllegalArgumentException("periodStart must be on or before periodEnd");
        }

        List<PayrollResult> payrolls = payrollResultRepository
                .findByStatusAndPeriodStartDateBetweenOrderByPeriodStartDateAsc(PROCESSED_STATUS, periodStart, periodEnd);

        List<PayrollComplianceReportEntry> entries = payrolls.stream()
                .map(this::toEntry)
                .toList();

        Set<Long> employeeIds = new LinkedHashSet<>();
        BigDecimal totalGrossPay = BigDecimal.ZERO;
        BigDecimal totalTaxDeduction = BigDecimal.ZERO;
        BigDecimal totalInsuranceDeduction = BigDecimal.ZERO;
        BigDecimal totalOtherDeduction = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNetPay = BigDecimal.ZERO;

        for (PayrollComplianceReportEntry entry : entries) {
            employeeIds.add(entry.employeeId());
            totalGrossPay = totalGrossPay.add(entry.grossPay());
            totalTaxDeduction = totalTaxDeduction.add(entry.taxDeduction());
            totalInsuranceDeduction = totalInsuranceDeduction.add(entry.insuranceDeduction());
            totalOtherDeduction = totalOtherDeduction.add(entry.otherDeduction());
            totalDeductions = totalDeductions.add(entry.totalDeduction());
            totalNetPay = totalNetPay.add(entry.netPay());
        }

        return new PayrollComplianceReport(
                periodStart,
                periodEnd,
                LocalDateTime.now(),
                entries.size(),
                employeeIds.size(),
                totalGrossPay,
                totalTaxDeduction,
                totalInsuranceDeduction,
                totalOtherDeduction,
                totalDeductions,
                totalNetPay,
                entries
        );
    }

    private PayrollComplianceReportEntry toEntry(PayrollResult payroll) {
        Employee employee = payroll.getEmployee();
        Long employeeId = employee == null ? null : employee.getId();
        String employeeName = employee == null ? null : employee.getName();

        return new PayrollComplianceReportEntry(
                payroll.getId(),
                employeeId,
                employeeName,
                payroll.getPeriodStartDate(),
                payroll.getPeriodEndDate(),
                valueOrZero(payroll.getGrossPay()),
                valueOrZero(payroll.getTaxDeduction()),
                valueOrZero(payroll.getInsuranceDeduction()),
                valueOrZero(payroll.getOtherDeduction()),
                valueOrZero(payroll.getTotalDeduction()),
                valueOrZero(payroll.getNetPay()),
                payroll.getProcessedBy(),
                payroll.getProcessedAt()
        );
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
