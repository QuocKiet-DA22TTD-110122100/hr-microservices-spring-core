package com.hrservice.hr.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auth_user_id", unique = true, length = 36)
    private String authUserId;

    @Column(name = "username", unique = true, length = 100)
    private String username;

    @Column(name = "did", unique = true, length = 255)
    private String did;

    private String name;
    private String position;

    private BigDecimal baseSalary;
    private String currency;
    private String jobLevel;
    private LocalDate hireDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getAuthUserId() {
        return authUserId;
    }

    public String getUsername() {
        return username;
    }

    public String getPosition() {
        return position;
    }

    public BigDecimal getBaseSalary() {
        return baseSalary;
    }

    public String getCurrency() {
        return currency;
    }

    public String getDid() {
        return did;
    }

    public String getJobLevel() {
        return jobLevel;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public Department getDepartment() {
        return department;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAuthUserId(String authUserId) {
        this.authUserId = authUserId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public void setBaseSalary(BigDecimal baseSalary) {
        this.baseSalary = baseSalary;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public void setDid(String did) {
        this.did = did;
    }

    public void setJobLevel(String jobLevel) {
        this.jobLevel = jobLevel;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }
}