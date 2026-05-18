package com.hrservice.hr.entity;

import jakarta.persistence.*;

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

    public String getDid() {
        return did;
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

    public void setDid(String did) {
        this.did = did;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }
}