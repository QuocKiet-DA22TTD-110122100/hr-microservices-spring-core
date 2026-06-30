package com.hrservice.task.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
// Đây là lớp thực thể đại diện cho một Task trong hệ thống, chứa các thông tin cơ bản về Task như tiêu đề, mô tả, trạng thái, người được giao, và dự án liên quan
@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.OPEN;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(nullable = false)
    private Long assigneeId;

    @Column(nullable = false)
    private Long projectId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Task(Long id, String title, String description, TaskStatus status, Long assigneeId, Long projectId,
                LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, title, description, status, TaskPriority.MEDIUM, assigneeId, projectId, createdAt, updatedAt);
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum TaskStatus {
        OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    }

    public enum TaskPriority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
