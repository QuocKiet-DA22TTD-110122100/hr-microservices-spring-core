package com.hrservice.task.service.adapter;

import com.hrservice.task.config.TaskNotificationProperties;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ConfigurableAssigneeEmailResolverTest {

    @Test
    void shouldUseMappedEmailWhenPresent() {
        TaskNotificationProperties props = new TaskNotificationProperties();
        props.setAssigneeEmailMap(Map.of("42", "employee42@company.com"));
        props.setAssigneeDomain("hr.local");

        ConfigurableAssigneeEmailResolver resolver = new ConfigurableAssigneeEmailResolver(props);

        assertThat(resolver.resolve(42L)).isEqualTo("employee42@company.com");
    }

    @Test
    void shouldFallbackToDomainPatternWhenNoMapping() {
        TaskNotificationProperties props = new TaskNotificationProperties();
        props.setAssigneeDomain("corp.local");

        ConfigurableAssigneeEmailResolver resolver = new ConfigurableAssigneeEmailResolver(props);

        assertThat(resolver.resolve(77L)).isEqualTo("77@corp.local");
    }
}
