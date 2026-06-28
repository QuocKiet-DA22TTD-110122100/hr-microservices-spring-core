package com.hrservice.task.integration;

import com.hrservice.task.entity.Task;
import com.hrservice.task.event.ProjectStatusChangedEvent;
import com.hrservice.task.repository.TaskHistoryRepository;
import com.hrservice.task.repository.TaskRepository;
import com.hrservice.task.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;

import static org.awaitility.Awaitility.await;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:task-it;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.data.redis.host=localhost",
        "eureka.client.enabled=false",
        "task.reassign.defaultPoolAssigneeId=777",
        "messaging.enabled=true"
})
@Testcontainers(disabledWithoutDocker = true)
class ProjectEventListenerIntegrationTest {

    @Container
    static RabbitMQContainer rabbitMQContainer = new RabbitMQContainer("rabbitmq:3.13-management-alpine");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", rabbitMQContainer::getHost);
        registry.add("spring.rabbitmq.port", rabbitMQContainer::getAmqpPort);
        registry.add("spring.rabbitmq.username", rabbitMQContainer::getAdminUsername);
        registry.add("spring.rabbitmq.password", rabbitMQContainer::getAdminPassword);
    }

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @SpyBean
    private NotificationService notificationService;

    @AfterEach
    void clean() {
        taskHistoryRepository.deleteAll();
        taskRepository.deleteAll();
    }

    @Test
    void shouldConsumeProjectPausedEvent_reassignToConfiguredPool_andNotify() {
        Task t1 = new Task(null, "Task A", "desc", Task.TaskStatus.OPEN, 5L, 500L, LocalDateTime.now(), LocalDateTime.now());
        Task t2 = new Task(null, "Task B", "desc", Task.TaskStatus.IN_PROGRESS, 6L, 500L, LocalDateTime.now(), LocalDateTime.now());
        taskRepository.saveAll(List.of(t1, t2));

        ProjectStatusChangedEvent event = new ProjectStatusChangedEvent();
        event.setProjectId(500L);
        event.setOldStatus("ACTIVE");
        event.setNewStatus("PAUSED");
        event.setLeadId(null);

        rabbitTemplate.convertAndSend("project.status", "project.status.paused", event);

        await().untilAsserted(() -> {
            List<Task> tasks = taskRepository.findByProjectId(500L);
            assertThat(tasks).hasSize(2);
            assertThat(tasks).allMatch(t -> t.getAssigneeId() == 777L);
            assertThat(taskHistoryRepository.findAll()).hasSizeGreaterThanOrEqualTo(2);
            verify(notificationService, atLeastOnce()).notifyAssigneeChange(anyLong(), anyLong(), anyLong(), anyString());
        });
    }
}
