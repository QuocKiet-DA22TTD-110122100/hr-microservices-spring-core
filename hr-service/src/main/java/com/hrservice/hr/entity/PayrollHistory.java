package com.hrservice.hr.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_history")
public class PayrollHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_result_id", nullable = false)
    private PayrollResult payrollResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "event_type", length = 50, nullable = false)
    private String eventType; // CREATED, APPROVED, PROCESSED, REJECTED, MODIFIED

    @Column(name = "action_by", length = 100)
    private String actionBy; // HR admin who performed action

    @Column(name = "change_details", length = 1000)
    private String changeDetails; // JSON-like description of changes

    @Column(name = "previous_gross", precision = 12, scale = 2)
    private BigDecimal previousGross;

    @Column(name = "previous_net", precision = 12, scale = 2)
    private BigDecimal previousNet;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PayrollResult getPayrollResult() {
        return payrollResult;
    }

    public void setPayrollResult(PayrollResult payrollResult) {
        this.payrollResult = payrollResult;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getActionBy() {
        return actionBy;
    }

    public void setActionBy(String actionBy) {
        this.actionBy = actionBy;
    }

    public String getChangeDetails() {
        return changeDetails;
    }

    public void setChangeDetails(String changeDetails) {
        this.changeDetails = changeDetails;
    }

    public BigDecimal getPreviousGross() {
        return previousGross;
    }

    public void setPreviousGross(BigDecimal previousGross) {
        this.previousGross = previousGross;
    }

    public BigDecimal getPreviousNet() {
        return previousNet;
    }

    public void setPreviousNet(BigDecimal previousNet) {
        this.previousNet = previousNet;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
