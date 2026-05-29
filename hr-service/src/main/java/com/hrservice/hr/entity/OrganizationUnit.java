package com.hrservice.hr.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Objects;

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
    @NotNull
    @Size(max = 200)
    private String name;

    @Column(unique = true)
    @Size(max = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @NotNull
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrganizationUnit that = (OrganizationUnit) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
