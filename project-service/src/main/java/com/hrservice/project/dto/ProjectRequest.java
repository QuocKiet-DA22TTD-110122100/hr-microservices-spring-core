package com.hrservice.project.dto;

import com.hrservice.project.entity.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank(message = "name is required")
        @Size(max = 255, message = "name must not exceed 255 characters")
        String name,

        @Size(max = 2000, message = "description must not exceed 2000 characters")
        String description,

        Project.ProjectStatus status,

        @NotNull(message = "leadId is required")
        Long leadId
) {}
