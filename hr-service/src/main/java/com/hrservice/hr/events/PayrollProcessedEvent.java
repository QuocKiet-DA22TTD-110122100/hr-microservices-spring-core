package com.hrservice.hr.events;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class PayrollProcessedEvent implements Serializable {
    private String eventId;
    private String eventType;
    private Long payrollId;
    private Long employeeId;
    private BigDecimal grossPay;
    private BigDecimal netPay;
    private String processedBy;
    private LocalDateTime processedAt;

    public PayrollProcessedEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = "payroll.processed";
    }

    public PayrollProcessedEvent(Long payrollId, Long employeeId, BigDecimal grossPay, BigDecimal netPay,
                                 String processedBy, LocalDateTime processedAt) {
        this();
        this.payrollId = payrollId;
        this.employeeId = employeeId;
        this.grossPay = grossPay;
        this.netPay = netPay;
        this.processedBy = processedBy;
        this.processedAt = processedAt;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Long getPayrollId() {
        return payrollId;
    }

    public void setPayrollId(Long payrollId) {
        this.payrollId = payrollId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public BigDecimal getGrossPay() {
        return grossPay;
    }

    public void setGrossPay(BigDecimal grossPay) {
        this.grossPay = grossPay;
    }

    public BigDecimal getNetPay() {
        return netPay;
    }

    public void setNetPay(BigDecimal netPay) {
        this.netPay = netPay;
    }

    public String getProcessedBy() {
        return processedBy;
    }

    public void setProcessedBy(String processedBy) {
        this.processedBy = processedBy;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
}