# Payroll Patterns Skill

## Overview

This skill teaches agents the payroll calculation patterns used in the HR service, including gross-to-net conversion, tax withholding, deduction logic, and compliance requirements.

## When to Use This Skill

- Implementing or modifying payroll calculation endpoints
- Debugging incorrect salary/bonus computations
- Adding new deduction types or tax brackets
- Reviewing payroll APIs for correctness

## Gross-to-Net Calculation

```java
// PayrollCalculator.java pattern
public PayrollResult calculatePayroll(Employee emp, PayPeriod period) {
  // 1. Calculate gross pay
  BigDecimal gross = emp.baseSalary()
    .add(calculateBonus(emp, period))
    .add(calculateOvertime(emp, period));
  
  // 2. Calculate tax withholding (federal + state)
  BigDecimal federalTax = gross.multiply(FEDERAL_TAX_RATE);
  BigDecimal stateTax = gross.multiply(getStateTaxRate(emp.state()));
  
  // 3. Apply deductions (benefits, retirement)
  BigDecimal benefits = calculateBenefits(emp);
  BigDecimal retirement = gross.multiply(RETIREMENT_RATE);
  
  // 4. Net = Gross - Taxes - Deductions
  BigDecimal net = gross
    .subtract(federalTax)
    .subtract(stateTax)
    .subtract(benefits)
    .subtract(retirement);
  
  return new PayrollResult(gross, net, federalTax, stateTax, benefits, retirement);
}
```

## Tax Bracket Logic

Different tax rates apply based on income thresholds:

```java
private BigDecimal calculateFederalTax(BigDecimal gross, TaxYear year) {
  // 2026 tax brackets (single filer example)
  if (gross.compareTo(BRACKET_10) <= 0) {
    return gross.multiply(new BigDecimal("0.10"));
  } else if (gross.compareTo(BRACKET_12) <= 0) {
    return BRACKET_10_TAX.add(gross.subtract(BRACKET_10).multiply(new BigDecimal("0.12")));
  } else if (gross.compareTo(BRACKET_22) <= 0) {
    return BRACKET_12_TAX.add(gross.subtract(BRACKET_12).multiply(new BigDecimal("0.22")));
  }
  // ... more brackets
  return accumulatedTax;
}
```

## Overtime Handling

```java
private BigDecimal calculateOvertime(Employee emp, PayPeriod period) {
  BigDecimal hoursWorked = period.totalHours();
  BigDecimal hourlyRate = emp.baseSalary().divide(new BigDecimal("2080")); // Standard work year
  
  if (hoursWorked.compareTo(new BigDecimal("40")) > 0) {
    BigDecimal regularHours = new BigDecimal("40");
    BigDecimal overtimeHours = hoursWorked.subtract(regularHours);
    // Overtime is 1.5x regular rate
    return overtimeHours.multiply(hourlyRate).multiply(new BigDecimal("1.5"));
  }
  return BigDecimal.ZERO;
}
```

## Deduction Validation

Before applying deductions, validate they're:
1. **Authorized** — Employee signed up for benefit
2. **Current** — Not expired or cancelled
3. **Correct amount** — Matches employee's election

```java
private void validateDeductions(Employee emp, List<Deduction> deductions) {
  for (Deduction d : deductions) {
    if (!emp.activeDeductions().contains(d.id())) {
      throw new DeductionNotAuthorizedException(d.id());
    }
    if (d.endDate().isBefore(LocalDate.now())) {
      throw new DeductionExpiredException(d.id());
    }
    if (!d.amount().equals(emp.deductionAmount(d.id()))) {
      throw new DeductionMismatchException(d.id());
    }
  }
}
```

## Common Anti-Patterns

❌ **DO NOT**: Hard-code tax rates — they change annually
❌ **DO NOT**: Round monetary values with `.doubleValue()` — use `BigDecimal`
❌ **DO NOT**: Skip deduction validation — leads to compliance violations
❌ **DO NOT**: Calculate overtime without verifying hours worked

## Audit Trail

Every payroll calculation must be logged:

```java
private void auditPayrollCalculation(Employee emp, PayrollResult result) {
  auditLog.record(new AuditEvent()
    .employee(emp.id())
    .event("PAYROLL_CALCULATED")
    .timestamp(now())
    .gross(result.gross)
    .net(result.net)
    .calculatedBy(currentUser())
  );
}
```

## Testing Payroll Logic

```java
@Test
void testOvertimeCalculation() {
  Employee emp = Employee.builder()
    .baseSalary(new BigDecimal("50000"))
    .build();
  
  PayPeriod period = PayPeriod.builder()
    .hours(new BigDecimal("45")) // 5 hours overtime
    .build();
  
  BigDecimal ot = payrollCalc.calculateOvertime(emp, period);
  // 5 hours * (50000/2080) * 1.5
  assertEquals(new BigDecimal("180.29"), ot);
}
```

## References

- [IRS Tax Brackets](https://www.irs.gov/) (2026)
- [FLSA Overtime Rules](https://www.dol.gov/)
- HR Service: `com.example.hr.service.PayrollService`
- HR Service: `com.example.hr.model.PayrollResult`
