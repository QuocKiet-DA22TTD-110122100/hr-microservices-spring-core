# Payroll Patterns Skill

## Overview

Teaches agents the payroll calculation patterns used in the HR service: gross-to-net conversion, tax withholding, deduction logic, and compliance requirements.

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
  BigDecimal federalTax = calculateFederalTax(gross, TaxYear.current());
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

```java
private BigDecimal calculateFederalTax(BigDecimal gross, TaxYear year) {
  // Tax brackets must be loaded from config, never hard-coded
  List<TaxBracket> brackets = taxConfigRepository.findByYear(year);

  BigDecimal tax = BigDecimal.ZERO;
  BigDecimal remaining = gross;

  for (TaxBracket bracket : brackets) {
    if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
    BigDecimal taxableInBracket = remaining.min(bracket.width());
    tax = tax.add(taxableInBracket.multiply(bracket.rate()));
    remaining = remaining.subtract(taxableInBracket);
  }
  return tax.setScale(2, RoundingMode.HALF_UP);
}
```

## Overtime Handling

```java
private BigDecimal calculateOvertime(Employee emp, PayPeriod period) {
  BigDecimal hoursWorked = period.totalHours();
  BigDecimal hourlyRate = emp.baseSalary()
    .divide(new BigDecimal("2080"), 10, RoundingMode.HALF_UP);

  if (hoursWorked.compareTo(new BigDecimal("40")) > 0) {
    BigDecimal overtimeHours = hoursWorked.subtract(new BigDecimal("40"));
    // Overtime = 1.5x regular rate (FLSA requirement)
    return overtimeHours.multiply(hourlyRate)
      .multiply(new BigDecimal("1.5"))
      .setScale(2, RoundingMode.HALF_UP);
  }
  return BigDecimal.ZERO;
}
```

## Deduction Validation

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

## Audit Trail

```java
private void auditPayrollCalculation(Employee emp, PayrollResult result) {
  auditLog.record(new AuditEvent()
    .employee(emp.id())
    .event("PAYROLL_CALCULATED")
    .timestamp(Instant.now())
    .gross(result.gross())
    .net(result.net())
    .calculatedBy(SecurityContextHolder.getContext().getAuthentication().getName())
  );
}
```

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|---|---|
| `double salary = 50000.00` | `BigDecimal salary = new BigDecimal("50000.00")` |
| Hard-coded `taxRate = 0.22` | Load from `taxConfigRepository.findByYear(year)` |
| Skip deduction validation | Always call `validateDeductions()` before applying |
| Round with `.doubleValue()` | Use `BigDecimal.setScale(2, RoundingMode.HALF_UP)` |

## Testing Pattern

```java
@Test
void testOvertimeCalculation() {
  Employee emp = Employee.builder()
    .baseSalary(new BigDecimal("50000"))
    .build();

  PayPeriod period = PayPeriod.builder()
    .totalHours(new BigDecimal("45")) // 5 hours overtime
    .build();

  BigDecimal ot = payrollCalc.calculateOvertime(emp, period);
  // 5h * (50000/2080) * 1.5 = 180.29
  assertEquals(new BigDecimal("180.29"), ot);
}
```

## References

- HR Service: `com.hrservice.hr.service.PayrollService`
- HR Service: `com.hrservice.hr.model.PayrollResult`
- [FLSA Overtime Rules](https://www.dol.gov/)
