package com.hrservice.hr.service;

import com.hrservice.hr.dto.PayrollComplianceReport;
import com.hrservice.hr.entity.Employee;
import com.hrservice.hr.entity.PayrollResult;
import com.hrservice.hr.repository.PayrollResultRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PayrollComplianceReportServiceTest {

    private final PayrollResultRepository payrollResultRepository = mock(PayrollResultRepository.class);
    private final PayrollComplianceReportService service = new PayrollComplianceReportService(payrollResultRepository);

    @Test
    void generateTaxReportSummarizesProcessedPayrolls() {
        LocalDate start = LocalDate.of(2026, 5, 1);
        LocalDate end = LocalDate.of(2026, 5, 31);

        when(payrollResultRepository.findByStatusAndPeriodStartDateBetweenOrderByPeriodStartDateAsc("PROCESSED", start, end))
                .thenReturn(List.of(
                        payroll(1L, employee(10L, "Mai"), "10000.00", "1000.00", "500.00", "100.00", "1600.00", "8400.00"),
                        payroll(2L, employee(11L, "An"), "8000.00", "800.00", "400.00", "0.00", "1200.00", "6800.00")
                ));

        PayrollComplianceReport report = service.generateTaxReport(start, end);

        assertEquals(2, report.payrollCount());
        assertEquals(2, report.employeeCount());
        assertEquals(0, new BigDecimal("18000.00").compareTo(report.totalGrossPay()));
        assertEquals(0, new BigDecimal("1800.00").compareTo(report.totalTaxDeduction()));
        assertEquals(0, new BigDecimal("900.00").compareTo(report.totalInsuranceDeduction()));
        assertEquals(0, new BigDecimal("100.00").compareTo(report.totalOtherDeduction()));
        assertEquals(0, new BigDecimal("2800.00").compareTo(report.totalDeductions()));
        assertEquals(0, new BigDecimal("15200.00").compareTo(report.totalNetPay()));
        assertEquals("Mai", report.entries().get(0).employeeName());
    }

    @Test
    void generateTaxReportRejectsInvalidPeriod() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                service.generateTaxReport(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 5, 31))
        );

        assertEquals("periodStart must be on or before periodEnd", exception.getMessage());
    }

    private PayrollResult payroll(Long id, Employee employee, String gross, String tax, String insurance,
                                  String other, String totalDeduction, String net) {
        PayrollResult payroll = new PayrollResult();
        payroll.setId(id);
        payroll.setEmployee(employee);
        payroll.setPeriodStartDate(LocalDate.of(2026, 5, 1));
        payroll.setPeriodEndDate(LocalDate.of(2026, 5, 31));
        payroll.setGrossPay(new BigDecimal(gross));
        payroll.setTaxDeduction(new BigDecimal(tax));
        payroll.setInsuranceDeduction(new BigDecimal(insurance));
        payroll.setOtherDeduction(new BigDecimal(other));
        payroll.setTotalDeduction(new BigDecimal(totalDeduction));
        payroll.setNetPay(new BigDecimal(net));
        payroll.setStatus("PROCESSED");
        payroll.setProcessedBy("payroll@example.com");
        payroll.setProcessedAt(LocalDateTime.of(2026, 5, 27, 10, 0));
        return payroll;
    }

    private Employee employee(Long id, String name) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        return employee;
    }
}
