package com.hrservice.hr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "organization_units")
public class OrganizationUnit {

    public enum OrgLevel {
        CORPORATION,
        TOTAL_COMPANY,
        MEMBER_COMPANY,
        DEPARTMENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OrgLevel level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private OrganizationUnit parent;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCode() {
        return code;
    }

    public OrgLevel getLevel() {
        return level;
    }

    public OrganizationUnit getParent() {
        return parent;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setLevel(OrgLevel level) {
        this.level = level;
    }

    public void setParent(OrganizationUnit parent) {
        this.parent = parent;
    }
}
