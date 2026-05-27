package com.hrservice.hr.events;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Map;

public class PayrollRunRequestedEvent implements Serializable {
    private Long payrollRunId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Map<String, Object> metadata;

    public PayrollRunRequestedEvent() {}

    public PayrollRunRequestedEvent(Long payrollRunId, LocalDate periodStart, LocalDate periodEnd, Map<String, Object> metadata) {
        this.payrollRunId = payrollRunId;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.metadata = metadata;
    }

    public Long getPayrollRunId() { return payrollRunId; }
    public void setPayrollRunId(Long payrollRunId) { this.payrollRunId = payrollRunId; }

    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }

    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
// PR: included in feature/PAYROLL-001-payroll-run
