package com.hrservice.task.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.transaction.annotation.Transactional;

import com.hrservice.task.repository.TaskRepository;
import com.hrservice.task.repository.TaskHistoryRepository;
import com.hrservice.task.entity.Task;
import com.hrservice.task.config.TaskReassignProperties;
import com.hrservice.task.service.NotificationService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.rabbitmq.host")
public class ProjectEventListener {

    private final TaskRepository taskRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskEventPublisher taskEventPublisher;
    private final NotificationService notificationService;
    private final TaskReassignProperties reassignProperties;

    // Currently keep handlers lightweight: log and perform minimal reconciliation.

    @RabbitListener(queues = "project.created.queue")
    public void onProjectCreated(ProjectCreatedEvent event) {
        log.info("[PROJECT-LISTENER] Received ProjectCreatedEvent: projectId={}, name={}, leadId={}",
                event.getProjectId(), event.getName(), event.getLeadId());

        // No immediate reconciliation on creation for now.
    }

    @RabbitListener(queues = "project.status.queue")
    @Transactional
    public void onProjectStatusChanged(ProjectStatusChangedEvent event) {
        log.info("[PROJECT-LISTENER] Received ProjectStatusChangedEvent: projectId={}, status={}->{}, leadId={}",
                event.getProjectId(), event.getOldStatus(), event.getNewStatus(), event.getLeadId());

        if (event.getNewStatus() == null) return;

        String newStatus = event.getNewStatus().toString();

        try {
            Long projectId = event.getProjectId();
            if (projectId == null) return;

            List<Task> tasks = taskRepository.findByProjectId(projectId);

            if ("COMPLETED".equalsIgnoreCase(newStatus)) {
                // mark OPEN or IN_PROGRESS tasks as COMPLETED
                tasks.stream()
                        .filter(t -> t.getStatus() == Task.TaskStatus.OPEN || t.getStatus() == Task.TaskStatus.IN_PROGRESS)
                        .forEach(t -> {
                            Task.TaskStatus prev = t.getStatus();
                            t.setStatus(Task.TaskStatus.COMPLETED);
                            // audit entry
                            var hist = new com.hrservice.task.entity.TaskHistory(null, t.getId(), projectId, prev.name(), Task.TaskStatus.COMPLETED.name(), "Project completed, auto-complete tasks", java.time.LocalDateTime.now(), null);
                            taskHistoryRepository.save(hist);
                            // publish task status change event
                            taskEventPublisher.publishTaskStatusChangedEvent(t.getId(), projectId, prev, Task.TaskStatus.COMPLETED, t.getAssigneeId());
                        });
                taskRepository.saveAll(tasks);
                log.info("[PROJECT-LISTENER] Marked tasks as COMPLETED for projectId={}", projectId);
            } else if ("ARCHIVED".equalsIgnoreCase(newStatus)) {
                // mark remaining active tasks as CANCELLED
                tasks.stream()
                        .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED && t.getStatus() != Task.TaskStatus.CANCELLED)
                        .forEach(t -> {
                            Task.TaskStatus prev = t.getStatus();
                            t.setStatus(Task.TaskStatus.CANCELLED);
                            var hist = new com.hrservice.task.entity.TaskHistory(null, t.getId(), projectId, prev.name(), Task.TaskStatus.CANCELLED.name(), "Project archived, auto-cancel tasks", java.time.LocalDateTime.now(), null);
                            taskHistoryRepository.save(hist);
                            taskEventPublisher.publishTaskStatusChangedEvent(t.getId(), projectId, prev, Task.TaskStatus.CANCELLED, t.getAssigneeId());
                        });
                taskRepository.saveAll(tasks);
                log.info("[PROJECT-LISTENER] Marked tasks as CANCELLED for projectId={}", projectId);
            } else if ("PAUSED".equalsIgnoreCase(newStatus)) {
                // Reassign tasks to project lead or to default pool
                Long leadId = event.getLeadId();
                Long defaultPool = reassignProperties != null && reassignProperties.getDefaultPoolAssigneeId() != null
                    ? reassignProperties.getDefaultPoolAssigneeId() : 0L; // configurable default pool
                List<Task> toReassign = taskRepository.findByProjectId(projectId);
                toReassign.stream()
                        .filter(t -> t.getStatus() == Task.TaskStatus.OPEN || t.getStatus() == Task.TaskStatus.IN_PROGRESS)
                        .forEach(t -> {
                            Long prevAssignee = t.getAssigneeId();
                            Long newAssignee = (leadId != null && leadId > 0) ? leadId : defaultPool;
                            t.setAssigneeId(newAssignee);
                            var hist = new com.hrservice.task.entity.TaskHistory(null, t.getId(), projectId, String.valueOf(prevAssignee), String.valueOf(newAssignee), "Project paused, auto-reassign", java.time.LocalDateTime.now(), null);
                            taskHistoryRepository.save(hist);
                            taskEventPublisher.publishTaskAssignedEvent(t.getId(), projectId, prevAssignee, newAssignee);
                            notificationService.notifyAssigneeChange(t.getId(), prevAssignee, newAssignee, "Project paused — task reassigned");
                        });
                taskRepository.saveAll(toReassign);
                log.info("[PROJECT-LISTENER] Reassigned tasks for projectId={} due to PAUSED", projectId);
            }
        } catch (Exception ex) {
            log.warn("[PROJECT-LISTENER] Error reconciling tasks for project status change: {}", ex.getMessage(), ex);
        }
    }
}
