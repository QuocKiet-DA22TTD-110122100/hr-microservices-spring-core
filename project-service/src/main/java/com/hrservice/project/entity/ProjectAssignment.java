package com.hrservice.project.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "project_assignments",
        uniqueConstraints = @UniqueConstraint(name = "uk_project_employee", columnNames = {"project_id", "employee_id"})
)
@Data
@EqualsAndHashCode(exclude = "project")
@ToString(exclude = "project")
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "role", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ProjectRole role = ProjectRole.MEMBER;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt = LocalDateTime.now();

    @JsonProperty("projectId")
    public Long getProjectId() {
        return project == null ? null : project.getId();
    }

    public enum ProjectRole {
        MEMBER, DEVELOPER, QA, MANAGER
    }
}
