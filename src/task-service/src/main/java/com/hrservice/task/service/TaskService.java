package com.hrservice.task.service;

import com.hrservice.task.entity.Task;
import com.hrservice.task.event.TaskEventPublisher;
import com.hrservice.task.repository.TaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Slf4j
public class TaskService {

    private static final String ID_MUST_NOT_BE_NULL = "id must not be null";
    private static final String TASK_MUST_NOT_BE_NULL = "task must not be null";
    private static final String TASK_UPDATES_MUST_NOT_BE_NULL = "taskUpdates must not be null";

    private final TaskRepository taskRepository;
    private final Optional<TaskEventPublisher> eventPublisher;

    public TaskService(TaskRepository taskRepository, Optional<TaskEventPublisher> eventPublisher) {
        this.taskRepository = taskRepository;
        this.eventPublisher = eventPublisher;
    }

    @Cacheable(value = "tasks", key = "'all'")
    public List<Task> getAllTasks() {
        log.info("[TASK-SERVICE] Cache MISS: fetching all tasks from DB");
        return taskRepository.findAll();
    }

    @Cacheable(value = "task", key = "#id")
    public Optional<Task> getTaskById(Long id) {
        Long taskId = Objects.requireNonNull(id, ID_MUST_NOT_BE_NULL);
        log.info("[TASK-SERVICE] Cache MISS: fetching task {} from DB", id);
        return taskRepository.findById(taskId);
    }

    @Cacheable(value = "tasksByProject", key = "#projectId")
    public List<Task> getTasksByProject(Long projectId) {
        log.info("[TASK-SERVICE] Cache MISS: fetching tasks for project {} from DB", projectId);
        return taskRepository.findByProjectId(projectId);
    }

    @Cacheable(value = "tasksByAssignee", key = "#assigneeId")
    public List<Task> getTasksByAssignee(Long assigneeId) {
        log.info("[TASK-SERVICE] Cache MISS: fetching tasks for assignee {} from DB", assigneeId);
        return taskRepository.findByAssigneeId(assigneeId);
    }

    @Cacheable(value = "tasksByStatus", key = "#status.name()")
    public List<Task> getTasksByStatus(Task.TaskStatus status) {
        log.info("[TASK-SERVICE] Cache MISS: fetching tasks with status {} from DB", status);
        return taskRepository.findByStatus(status);
    }

    @CacheEvict(value = {"tasks", "tasksByProject", "tasksByAssignee", "tasksByStatus"}, allEntries = true)
    public Task createTask(Task task) {
        Task taskToSave = Objects.requireNonNull(task, TASK_MUST_NOT_BE_NULL);
        log.info("[TASK-SERVICE] Creating task - evicting all caches");
        Task saved = taskRepository.save(taskToSave);
        
        // Publish event if RabbitMQ is configured
        eventPublisher.ifPresent(p -> p.publishTaskCreatedEvent(
                saved.getId(),
                saved.getProjectId(),
                saved.getTitle(),
                saved.getDescription(),
                saved.getAssigneeId()
        ));
        
        return saved;
    }

    @CacheEvict(value = {"task", "tasks", "tasksByProject", "tasksByAssignee", "tasksByStatus"}, allEntries = true)
    public Task updateTask(Long id, Task taskUpdates) {
        Long taskId = Objects.requireNonNull(id, ID_MUST_NOT_BE_NULL);
        Task updates = Objects.requireNonNull(taskUpdates, TASK_UPDATES_MUST_NOT_BE_NULL);
        log.info("[TASK-SERVICE] Updating task {} - evicting all caches", id);
        return taskRepository.findById(taskId)
                .map(existing -> {
                    Task.TaskStatus oldStatus = existing.getStatus();
                    Task.TaskStatus newStatus = updates.getStatus();

                    existing.setTitle(updates.getTitle());
                    existing.setDescription(updates.getDescription());
                    existing.setStatus(newStatus);
                    existing.setPriority(updates.getPriority() == null ? existing.getPriority() : updates.getPriority());
                    existing.setAssigneeId(updates.getAssigneeId());
                    existing.setProjectId(updates.getProjectId());

                    Task updated = taskRepository.save(existing);

                    // Publish status change event only when newStatus is non-null and actually changed
                    if (newStatus != null && !newStatus.equals(oldStatus)) {
                        eventPublisher.ifPresent(p -> p.publishTaskStatusChangedEvent(
                                updated.getId(),
                                updated.getProjectId(),
                                oldStatus,
                                updated.getStatus(),
                                updated.getAssigneeId()
                        ));
                    }

                    return updated;
                })
                .orElse(null);
    }

    @CacheEvict(value = {"task", "tasks", "tasksByProject", "tasksByAssignee", "tasksByStatus"}, allEntries = true)
    public void deleteTask(Long id) {
        Long taskId = Objects.requireNonNull(id, ID_MUST_NOT_BE_NULL);
        log.info("[TASK-SERVICE] Deleting task {} - evicting all caches", id);
        taskRepository.deleteById(taskId);
    }
}
