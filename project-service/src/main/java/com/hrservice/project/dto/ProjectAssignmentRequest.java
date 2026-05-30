package com.hrservice.project.dto;

import com.hrservice.project.entity.ProjectAssignment;
import jakarta.validation.constraints.NotNull;

public record ProjectAssignmentRequest(
        @NotNull(message = "employeeId is required")
        Long employeeId,

        ProjectAssignment.ProjectRole role
) {
}
