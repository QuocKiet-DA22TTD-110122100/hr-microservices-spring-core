package com.hrservice.project.event;

import com.hrservice.project.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.rabbitmq.host")
public class ProjectEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishProjectCreatedEvent(Long projectId, String name, String description, Long leadId) {
        ProjectCreatedEvent event = new ProjectCreatedEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setProjectId(projectId);
        event.setName(name);
        event.setDescription(description);
        event.setLeadId(leadId);
        event.setTimestamp(LocalDateTime.now());
        event.setEventType("PROJECT_CREATED");

        log.info("[PROJECT-EVENT] Publishing ProjectCreatedEvent: projectId={}, name={}", projectId, name);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PROJECT_CREATED_EXCHANGE,
                RabbitMQConfig.PROJECT_CREATED_ROUTING_KEY,
                event
        );
    }

    public void publishProjectStatusChangedEvent(Long projectId, 
                                                 com.hrservice.project.entity.Project.ProjectStatus oldStatus, 
                                                 com.hrservice.project.entity.Project.ProjectStatus newStatus, 
                                                 Long leadId) {
        ProjectStatusChangedEvent event = new ProjectStatusChangedEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setProjectId(projectId);
        event.setOldStatus(oldStatus);
        event.setNewStatus(newStatus);
        event.setLeadId(leadId);
        event.setTimestamp(LocalDateTime.now());
        event.setEventType("PROJECT_STATUS_CHANGED");

        log.info("[PROJECT-EVENT] Publishing ProjectStatusChangedEvent: projectId={}, status={}->{}", 
                projectId, oldStatus, newStatus);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PROJECT_STATUS_EXCHANGE,
                "project.status." + newStatus.name().toLowerCase(),
                event
        );
    }
}
