package com.hrservice.hr.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tax_config")
public class TaxConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tax_year", nullable = false)
    private Integer year;

    @Column(name = "min_bracket", precision = 12, scale = 2, nullable = false)
    private BigDecimal minBracket;

    @Column(name = "max_bracket", precision = 12, scale = 2)
    private BigDecimal maxBracket; // null means unlimited (top bracket)

    @Column(name = "tax_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal taxRate; // Percentage (e.g., 12.50)

    @Column(name = "country", length = 3, nullable = false)
    private String country; // ISO code: US, VN, etc

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_active")
    private Boolean isActive;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getMinBracket() {
        return minBracket;
    }

    public void setMinBracket(BigDecimal minBracket) {
        this.minBracket = minBracket;
    }

    public BigDecimal getMaxBracket() {
        return maxBracket;
    }

    public void setMaxBracket(BigDecimal maxBracket) {
        this.maxBracket = maxBracket;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(BigDecimal taxRate) {
        this.taxRate = taxRate;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
