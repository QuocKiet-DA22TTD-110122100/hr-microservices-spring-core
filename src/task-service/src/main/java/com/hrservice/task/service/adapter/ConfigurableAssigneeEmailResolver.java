package com.hrservice.task.service.adapter;

import com.hrservice.task.config.TaskNotificationProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConfigurableAssigneeEmailResolver implements AssigneeEmailResolver {

    private final TaskNotificationProperties properties;

    @Override
    public String resolve(Long assigneeId) {
        if (assigneeId == null) return null;

        String key = String.valueOf(assigneeId);
        String mapped = properties.getAssigneeEmailMap() == null ? null : properties.getAssigneeEmailMap().get(key);
        if (mapped != null && !mapped.isBlank()) return mapped;

        String domain = properties.getAssigneeDomain() == null || properties.getAssigneeDomain().isBlank()
                ? "hr.local"
                : properties.getAssigneeDomain();
        return assigneeId + "@" + domain;
    }
}
