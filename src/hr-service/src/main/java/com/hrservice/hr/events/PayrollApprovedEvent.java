package com.hrservice.hr.events;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

public class PayrollApprovedEvent implements Serializable {
    private String eventId;
    private String eventType;
    private Long payrollId;
    private String approvedBy;
    private LocalDateTime approvedAt;

    public PayrollApprovedEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = "payroll.approved";
    }

    public PayrollApprovedEvent(Long payrollId, String approvedBy, LocalDateTime approvedAt) {
        this();
        this.payrollId = payrollId;
        this.approvedBy = approvedBy;
        this.approvedAt = approvedAt;
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

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
}