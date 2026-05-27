package com.hrservice.hr.events;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public class EmployeeHiredEvent implements Serializable {
    private Long id;
    private String authUserId;
    private String name;
    private String position;
    private BigDecimal baseSalary;
    private LocalDate hireDate;
    private Long departmentId;
    private Map<String, Object> metadata;

    public EmployeeHiredEvent() {}

    public EmployeeHiredEvent(Long id,
                              String authUserId,
                              String name,
                              String position,
                              BigDecimal baseSalary,
                              LocalDate hireDate,
                              Long departmentId,
                              Map<String, Object> metadata) {
        this.id = id;
        this.authUserId = authUserId;
        this.name = name;
        this.position = position;
        this.baseSalary = baseSalary;
        this.hireDate = hireDate;
        this.departmentId = departmentId;
        this.metadata = metadata;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAuthUserId() {
        return authUserId;
    }

    public void setAuthUserId(String authUserId) {
        this.authUserId = authUserId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public BigDecimal getBaseSalary() {
        return baseSalary;
    }

    public void setBaseSalary(BigDecimal baseSalary) {
        this.baseSalary = baseSalary;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}