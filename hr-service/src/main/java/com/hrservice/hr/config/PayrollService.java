package com.hrservice.hr.config;

import com.hrservice.hr.entity.*;
import com.hrservice.hr.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@Transactional
public class PayrollService {

    private static final Logger logger = LoggerFactory.getLogger(PayrollService.class);
    private static final int SCALE = 2;

    private final PayrollResultRepository payrollResultRepository;
    private final PayrollHistoryRepository payrollHistoryRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final DeductionTypeRepository deductionTypeRepository;
    private final DeductionInstanceRepository deductionInstanceRepository;
    private final EmployeeRepository employeeRepository;

    public PayrollService(PayrollResultRepository payrollResultRepository,
                         PayrollHistoryRepository payrollHistoryRepository,
                         TaxConfigRepository taxConfigRepository,
                         DeductionTypeRepository deductionTypeRepository,
                         DeductionInstanceRepository deductionInstanceRepository,
                         EmployeeRepository employeeRepository) {
        this.payrollResultRepository = payrollResultRepository;
        this.payrollHistoryRepository = payrollHistoryRepository;
        this.taxConfigRepository = taxConfigRepository;
        this.deductionTypeRepository = deductionTypeRepository;
        this.deductionInstanceRepository = deductionInstanceRepository;
        this.employeeRepository = employeeRepository;
    }

    /**
     * Calculate payroll for a given employee and month
     */
    public PayrollResult calculatePayroll(Long employeeId, YearMonth yearMonth) throws Exception {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        if (employee.getBaseSalary() == null) {
            throw new IllegalArgumentException("Employee has no base salary configured");
        }

        LocalDate periodStart = yearMonth.atDay(1);
        LocalDate periodEnd = yearMonth.atEndOfMonth();

        // Calculate gross pay
        BigDecimal grossPay = calculateGrossPay(employee, yearMonth);

        // Calculate tax deduction
        BigDecimal taxDeduction = calculateTaxDeduction(grossPay, employee.getCurrency() != null ? employee.getCurrency() : "USD");

        // Calculate other deductions (insurance, retirement, etc)
        Map<String, BigDecimal> deductions = calculateDeductions(employeeId, grossPay, yearMonth);

        BigDecimal insuranceDeduction = deductions.getOrDefault("insurance", BigDecimal.ZERO);
        BigDecimal otherDeduction = deductions.getOrDefault("other", BigDecimal.ZERO);

        BigDecimal totalDeduction = taxDeduction.add(insuranceDeduction).add(otherDeduction);
        BigDecimal netPay = grossPay.subtract(totalDeduction);

        // Create payroll result
        PayrollResult result = new PayrollResult();
        result.setEmployee(employee);
        result.setPeriodStartDate(periodStart);
        result.setPeriodEndDate(periodEnd);
        result.setGrossPay(grossPay);
        result.setTaxDeduction(taxDeduction);
        result.setInsuranceDeduction(insuranceDeduction);
        result.setOtherDeduction(otherDeduction);
        result.setTotalDeduction(totalDeduction);
        result.setNetPay(netPay);
        result.setStatus("DRAFT");

        // Save result
        PayrollResult saved = payrollResultRepository.save(result);
        logger.info("Payroll calculated for employee {} for period {}", employeeId, yearMonth);

        return saved;
    }

    /**
     * Calculate gross pay (base salary / 12 for monthly)
     */
    private BigDecimal calculateGrossPay(Employee employee, YearMonth yearMonth) {
        if (employee.getBaseSalary() == null) {
            return BigDecimal.ZERO;
        }
        return employee.getBaseSalary()
                .divide(new BigDecimal(12), SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Calculate tax based on gross pay and tax brackets
     */
    private BigDecimal calculateTaxDeduction(BigDecimal grossPay, String country) {
        LocalDate now = LocalDate.now();
        List<TaxConfig> taxBrackets = taxConfigRepository
                .findByYearAndCountryAndIsActiveTrue(now.getYear(), country);

        if (taxBrackets.isEmpty()) {
            logger.warn("No active tax config for {} {}", now.getYear(), country);
            return BigDecimal.ZERO;
        }

        taxBrackets.sort(Comparator.comparing(TaxConfig::getMinBracket));

        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal remainingIncome = grossPay;

        for (TaxConfig bracket : taxBrackets) {
            if (remainingIncome.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal bracketMin = bracket.getMinBracket();
            BigDecimal bracketMax = bracket.getMaxBracket();

            BigDecimal taxableInThisBracket;
            if (bracketMax == null) {
                taxableInThisBracket = remainingIncome;
            } else {
                taxableInThisBracket = remainingIncome.min(bracketMax.subtract(bracketMin));
            }

            BigDecimal taxOnBracket = taxableInThisBracket
                    .multiply(bracket.getTaxRate())
                    .divide(new BigDecimal(100), SCALE, RoundingMode.HALF_UP);

            totalTax = totalTax.add(taxOnBracket);
            remainingIncome = remainingIncome.subtract(taxableInThisBracket);
        }

        return totalTax;
    }

    /**
     * Calculate all deductions (insurance, retirement, etc)
     */
    private Map<String, BigDecimal> calculateDeductions(Long employeeId, BigDecimal grossPay, YearMonth yearMonth) {
        LocalDate periodStart = yearMonth.atDay(1);
        LocalDate periodEnd = yearMonth.atEndOfMonth();

        List<DeductionInstance> deductions = deductionInstanceRepository
                .findByEmployeeIdAndIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByDeductionTypeNameAsc(
                        employeeId, periodStart, periodEnd);

        Map<String, BigDecimal> result = new HashMap<>();
        BigDecimal insurance = BigDecimal.ZERO;
        BigDecimal other = BigDecimal.ZERO;

        for (DeductionInstance deduction : deductions) {
            BigDecimal amount;
            if (deduction.getDeductionType().getIsPercentage()) {
                amount = grossPay.multiply(deduction.getRate())
                        .divide(new BigDecimal(100), SCALE, RoundingMode.HALF_UP);
            } else {
                amount = deduction.getRate();
            }

            String category = deduction.getDeductionType().getCategory();
            if ("INSURANCE".equals(category)) {
                insurance = insurance.add(amount);
            } else {
                other = other.add(amount);
            }
        }

        result.put("insurance", insurance);
        result.put("other", other);
        return result;
    }

    /**
     * Approve payroll (mark as APPROVED)
     */
    public PayrollResult approvePayroll(Long payrollId, String approvedBy) throws Exception {
        PayrollResult payroll = payrollResultRepository.findById(payrollId)
                .orElseThrow(() -> new IllegalArgumentException("Payroll not found: " + payrollId));

        validatePayrollCompliance(payroll);

        payroll.setStatus("APPROVED");
        PayrollResult updated = payrollResultRepository.save(payroll);

        recordPayrollHistory(payroll, "APPROVED", approvedBy, "Payroll approved for processing");

        logger.info("Payroll {} approved by {}", payrollId, approvedBy);
        return updated;
    }

    /**
     * Validate payroll compliance
     */
    public void validatePayrollCompliance(PayrollResult payroll) throws Exception {
        BigDecimal netPay = payroll.getNetPay();
        BigDecimal grossPay = payroll.getGrossPay();

        if (netPay.compareTo(grossPay) > 0) {
            throw new IllegalArgumentException("Net pay cannot exceed gross pay");
        }

        BigDecimal minNetPay = grossPay.multiply(new BigDecimal("0.50"));
        if (netPay.compareTo(minNetPay) < 0) {
            logger.warn("Warning: Net pay < 50% of gross. Payroll ID: {}", payroll.getId());
        }

        if (payroll.getTaxDeduction().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Tax deduction cannot be negative");
        }

        BigDecimal maxTax = grossPay.multiply(new BigDecimal("0.40"));
        if (payroll.getTaxDeduction().compareTo(maxTax) > 0) {
            logger.warn("Warning: Tax > 40% of gross. Payroll ID: {}", payroll.getId());
        }

        logger.info("Payroll {} passed compliance validation", payroll.getId());
    }

    /**
     * Record payroll history event
     */
    private void recordPayrollHistory(PayrollResult payroll, String eventType, String actionBy, String details) {
        PayrollHistory history = new PayrollHistory();
        history.setPayrollResult(payroll);
        history.setEmployee(payroll.getEmployee());
        history.setEventType(eventType);
        history.setActionBy(actionBy);
        history.setChangeDetails(details);

        payrollHistoryRepository.save(history);
        logger.info("Recorded history: {} for payroll {}", eventType, payroll.getId());
    }

    /**
     * Get payroll history for employee
     */
    public List<PayrollResult> getEmployeePayrollHistory(Long employeeId) {
        return payrollResultRepository.findByEmployeeIdAndStatusOrderByPeriodStartDateDesc(
                employeeId, "PROCESSED");
    }

    /**
     * Get latest payroll for employee
     */
    public Optional<PayrollResult> getLatestPayroll(Long employeeId) {
        return payrollResultRepository.findLatestByEmployeeId(employeeId);
    }
}
