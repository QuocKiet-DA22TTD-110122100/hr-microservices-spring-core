package com.hrservice.task.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Component
@ConfigurationProperties(prefix = "task.reassign")
@Validated
public class TaskReassignProperties {

    /**
     * Default assignee id for tasks moved to the default pool. Must be >= 0.
     */
    @Min(0)
    private Long defaultPoolAssigneeId = 0L;

    public Long getDefaultPoolAssigneeId() {
        return defaultPoolAssigneeId;
    }

    public void setDefaultPoolAssigneeId(Long defaultPoolAssigneeId) {
        this.defaultPoolAssigneeId = defaultPoolAssigneeId;
    }
}
