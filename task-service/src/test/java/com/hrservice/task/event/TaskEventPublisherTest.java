package com.hrservice.task.event;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.hrservice.task.config.RabbitMQConfig;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

public class TaskEventPublisherTest {

    @Test
    void publishTaskCreatedEvent_sendsMessage() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        TaskEventPublisher publisher = new TaskEventPublisher(rabbitTemplate);

        publisher.publishTaskCreatedEvent(1L, 10L, "Title", "Desc", 5L);

        ArgumentCaptor<TaskCreatedEvent> captor = ArgumentCaptor.forClass(TaskCreatedEvent.class);
        verify(rabbitTemplate, times(1)).convertAndSend(eq(RabbitMQConfig.TASK_CREATED_EXCHANGE), eq(RabbitMQConfig.TASK_CREATED_ROUTING_KEY), captor.capture());

        TaskCreatedEvent event = captor.getValue();
        assertThat(event).isNotNull();
        assertThat(event.getTaskId()).isEqualTo(1L);
        assertThat(event.getProjectId()).isEqualTo(10L);
        assertThat(event.getTitle()).isEqualTo("Title");
        assertThat(event.getDescription()).isEqualTo("Desc");
        assertThat(event.getAssigneeId()).isEqualTo(5L);
        assertThat(event.getEventType()).isEqualTo("TASK_CREATED");
    }

    @Test
    void publishTaskStatusChangedEvent_sendsMessageWithCorrectRoutingKey() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        TaskEventPublisher publisher = new TaskEventPublisher(rabbitTemplate);

        publisher.publishTaskStatusChangedEvent(2L, 20L, com.hrservice.task.entity.Task.TaskStatus.OPEN, com.hrservice.task.entity.Task.TaskStatus.COMPLETED, 3L);

        ArgumentCaptor<TaskStatusChangedEvent> captor = ArgumentCaptor.forClass(TaskStatusChangedEvent.class);
        String expectedRoutingKey = "task.status." + com.hrservice.task.entity.Task.TaskStatus.COMPLETED.name().toLowerCase();
        verify(rabbitTemplate, times(1)).convertAndSend(eq(RabbitMQConfig.TASK_STATUS_EXCHANGE), eq(expectedRoutingKey), captor.capture());

        TaskStatusChangedEvent event = captor.getValue();
        assertThat(event.getTaskId()).isEqualTo(2L);
        assertThat(event.getOldStatus()).isEqualTo(com.hrservice.task.entity.Task.TaskStatus.OPEN);
        assertThat(event.getNewStatus()).isEqualTo(com.hrservice.task.entity.Task.TaskStatus.COMPLETED);
        assertThat(event.getEventType()).isEqualTo("TASK_STATUS_CHANGED");
    }
}
