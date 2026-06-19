package com.hrservice.task.dto;

import com.hrservice.task.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TaskRequest(
        @NotBlank(message = "title is required")
        @Size(max = 255, message = "title must not exceed 255 characters")
        String title,

        @Size(max = 2000, message = "description must not exceed 2000 characters")
        String description,

        Task.TaskStatus status,

        Task.TaskPriority priority,

        @NotNull(message = "assigneeId is required")
        Long assigneeId,

        @NotNull(message = "projectId is required")
        Long projectId
) {}
