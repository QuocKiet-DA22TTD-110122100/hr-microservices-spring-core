package com.hrservice.task.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
// Đây là lớp thực thể đại diện cho một Task trong hệ thống, chứa các thông tin cơ bản về Task như tiêu đề, mô tả, trạng thái, người được giao, và dự án liên quan
@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {

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

    @Column(nullable = false)
    private Long assigneeId;

    @Column(nullable = false)
    private Long projectId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum TaskStatus {
        OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    }
}
