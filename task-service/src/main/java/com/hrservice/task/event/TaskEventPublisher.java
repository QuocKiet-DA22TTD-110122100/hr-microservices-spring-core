package com.hrservice.task.event;

import com.hrservice.task.config.RabbitMQConfig;
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
public class TaskEventPublisher {

    private final RabbitTemplate rabbitTemplate;
// Phương thức để publish sự kiện khi tạo task
    public void publishTaskCreatedEvent(Long taskId, Long projectId, String title, String description, Long assigneeId) {
        TaskCreatedEvent event = new TaskCreatedEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setTaskId(taskId);
        event.setProjectId(projectId);
        event.setTitle(title);
        event.setDescription(description);
        event.setAssigneeId(assigneeId);
        event.setTimestamp(LocalDateTime.now());
        event.setEventType("TASK_CREATED");

        log.info("[TASK-EVENT] Publishing TaskCreatedEvent: taskId={}, projectId={}", taskId, projectId);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TASK_CREATED_EXCHANGE,
                RabbitMQConfig.TASK_CREATED_ROUTING_KEY,
                event
        );
    }
// thêm các phương thức publish khác như publishTaskUpdatedEvent, publishTaskDeletedEvent, publishTaskStatusChangedEvent tương tự
    public void publishTaskStatusChangedEvent(Long taskId, Long projectId, 
                                             com.hrservice.task.entity.Task.TaskStatus oldStatus, 
                                             com.hrservice.task.entity.Task.TaskStatus newStatus, 
                                             Long assigneeId) {
        TaskStatusChangedEvent event = new TaskStatusChangedEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setTaskId(taskId);
        event.setProjectId(projectId);
        event.setOldStatus(oldStatus);
        event.setNewStatus(newStatus);
        event.setAssigneeId(assigneeId);
        event.setTimestamp(LocalDateTime.now());
        event.setEventType("TASK_STATUS_CHANGED");

        log.info("[TASK-EVENT] Publishing TaskStatusChangedEvent: taskId={}, status={}->{}", 
                taskId, oldStatus, newStatus);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TASK_STATUS_EXCHANGE,
                "task.status." + newStatus.name().toLowerCase(),
                event
        );
    }

    public void publishTaskAssignedEvent(Long taskId, Long projectId, Long previousAssignee, Long newAssignee) {
        TaskAssignedEvent event = new TaskAssignedEvent();
        event.setEventId(java.util.UUID.randomUUID().toString());
        event.setTaskId(taskId);
        event.setProjectId(projectId);
        event.setPreviousAssignee(previousAssignee);
        event.setNewAssignee(newAssignee);
        event.setTimestamp(java.time.LocalDateTime.now());
        event.setEventType("TASK_ASSIGNED");

        log.info("[TASK-EVENT] Publishing TaskAssignedEvent: taskId={}, from={} to={}", taskId, previousAssignee, newAssignee);
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.TASK_STATUS_EXCHANGE,
                    "task.assigned",
                    event
            );
        } catch (Exception ex) {
            log.warn("[TASK-EVENT] Failed to publish TaskAssignedEvent for taskId={}", taskId, ex);
        }
    }
}
