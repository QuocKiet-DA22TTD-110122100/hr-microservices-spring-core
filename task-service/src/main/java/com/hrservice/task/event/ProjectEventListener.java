package com.hrservice.task.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.amqp.rabbit.annotation.RabbitListener;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.rabbitmq.host")
public class ProjectEventListener {

    // Currently keep handlers lightweight: log and leave room for reconciliation logic.

    @RabbitListener(queues = "project.created.queue")
    public void onProjectCreated(ProjectCreatedEvent event) {
        log.info("[PROJECT-LISTENER] Received ProjectCreatedEvent: projectId={}, name={}, leadId={}",
                event.getProjectId(), event.getName(), event.getLeadId());

        // TODO: reconcile tasks/assignments for the new project if needed
    }

    @RabbitListener(queues = "project.status.queue")
    public void onProjectStatusChanged(ProjectStatusChangedEvent event) {
        log.info("[PROJECT-LISTENER] Received ProjectStatusChangedEvent: projectId={}, status={}->{}, leadId={}",
                event.getProjectId(), event.getOldStatus(), event.getNewStatus(), event.getLeadId());

        // TODO: if project closed -> mark related tasks; if reopened -> reassign
    }
}
