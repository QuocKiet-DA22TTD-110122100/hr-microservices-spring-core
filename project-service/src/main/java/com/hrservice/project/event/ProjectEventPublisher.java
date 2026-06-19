package com.hrservice.project.event;

import com.hrservice.project.config.RabbitMQConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
public class ProjectEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Autowired
    public ProjectEventPublisher(ObjectProvider<RabbitTemplate> rabbitTemplateProvider) {
        this.rabbitTemplate = rabbitTemplateProvider.getIfAvailable();
    }

    ProjectEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishProjectCreatedEvent(Long projectId, String name, String description, Long leadId) {
        ProjectCreatedEvent event = new ProjectCreatedEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setProjectId(projectId);
        event.setName(name);
        event.setDescription(description);
        event.setLeadId(leadId);
        event.setTimestamp(LocalDateTime.now());
        event.setEventType("PROJECT_CREATED");

        if (rabbitTemplate == null) {
            log.debug("[PROJECT-EVENT] RabbitMQ disabled; skipped ProjectCreatedEvent for projectId={}", projectId);
            return;
        }

        log.info("[PROJECT-EVENT] Publishing ProjectCreatedEvent: projectId={}, name={}", projectId, name);
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PROJECT_CREATED_EXCHANGE,
                    RabbitMQConfig.PROJECT_CREATED_ROUTING_KEY,
                    event
            );
        } catch (Exception ex) {
            log.warn("[PROJECT-EVENT] Failed to publish ProjectCreatedEvent for projectId={}. Continuing without failing the request.", projectId, ex);
        }
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
        if (rabbitTemplate == null) {
            log.debug("[PROJECT-EVENT] RabbitMQ disabled; skipped ProjectStatusChangedEvent for projectId={}", projectId);
            return;
        }

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PROJECT_STATUS_EXCHANGE,
                    "project.status." + newStatus.name().toLowerCase(),
                    event
            );
        } catch (Exception ex) {
            log.warn("[PROJECT-EVENT] Failed to publish ProjectStatusChangedEvent for projectId={} status={}->{}. Continuing.", projectId, oldStatus + "->" + newStatus, ex);
        }
    }
}
