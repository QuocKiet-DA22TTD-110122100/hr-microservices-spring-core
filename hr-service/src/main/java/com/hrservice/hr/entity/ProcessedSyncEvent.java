package com.hrservice.hr.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "processed_sync_events")
public class ProcessedSyncEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true, length = 100)
    private String eventId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "auth_user_id", nullable = false, length = 36)
    private String authUserId;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "did", length = 255)
    private String did;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getEventId() {
        return eventId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getAuthUserId() {
        return authUserId;
    }

    public String getUsername() {
        return username;
    }

    public String getDid() {
        return did;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public void setAuthUserId(String authUserId) {
        this.authUserId = authUserId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setDid(String did) {
        this.did = did;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
