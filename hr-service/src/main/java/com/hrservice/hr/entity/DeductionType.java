package com.hrservice.hr.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "deduction_type")
public class DeductionType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name; // Health Insurance, 401k, FSA, etc

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "category", length = 50, nullable = false)
    private String category; // TAX, INSURANCE, RETIREMENT, VOLUNTARY

    @Column(name = "is_percentage")
    private Boolean isPercentage; // true if % of gross, false if fixed amount

    @Column(name = "default_rate", precision = 5, scale = 2)
    private BigDecimal defaultRate; // Default percentage or amount

    @Column(name = "employer_contribution_rate", precision = 5, scale = 2)
    private BigDecimal employerContributionRate; // Employer's matching %

    @Column(name = "is_mandatory")
    private Boolean isMandatory; // All employees or optional

    @Column(name = "is_active")
    private Boolean isActive;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getIsPercentage() {
        return isPercentage;
    }

    public void setIsPercentage(Boolean isPercentage) {
        this.isPercentage = isPercentage;
    }

    public BigDecimal getDefaultRate() {
        return defaultRate;
    }

    public void setDefaultRate(BigDecimal defaultRate) {
        this.defaultRate = defaultRate;
    }

    public BigDecimal getEmployerContributionRate() {
        return employerContributionRate;
    }

    public void setEmployerContributionRate(BigDecimal employerContributionRate) {
        this.employerContributionRate = employerContributionRate;
    }

    public Boolean getIsMandatory() {
        return isMandatory;
    }

    public void setIsMandatory(Boolean isMandatory) {
        this.isMandatory = isMandatory;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
