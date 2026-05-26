package com.hrservice.task.controller;

import com.hrservice.task.dto.TaskRequest;
import com.hrservice.task.entity.Task;
import com.hrservice.task.security.RequireRoles;
import com.hrservice.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<List<Task>> getAllTasks() {
        log.info("[TASK-CONTROLLER] GET /api/tasks");
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/{id}")
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        log.info("[TASK-CONTROLLER] GET /api/tasks/{}", id);
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequireRoles({"ADMIN"})
    public ResponseEntity<Task> createTask(@Valid @RequestBody TaskRequest request) {
        log.info("[TASK-CONTROLLER] POST /api/tasks - title: {}", request.title());
        Task task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status() == null ? Task.TaskStatus.OPEN : request.status());
        task.setAssigneeId(request.assigneeId());
        task.setProjectId(request.projectId());
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(task));
    }

    @PutMapping("/{id}")
    @RequireRoles({"ADMIN"})
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        log.info("[TASK-CONTROLLER] PUT /api/tasks/{}", id);
        Task task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setAssigneeId(request.assigneeId());
        task.setProjectId(request.projectId());
        task.setUpdatedAt(LocalDateTime.now());
        Task updated = taskService.updateTask(id, task);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @RequireRoles({"ADMIN"})
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        log.info("[TASK-CONTROLLER] DELETE /api/tasks/{}", id);
        if (taskService.getTaskById(id).isPresent()) {
            taskService.deleteTask(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/project/{projectId}")
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable Long projectId) {
        log.info("[TASK-CONTROLLER] GET /api/tasks/project/{}", projectId);
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @GetMapping("/assignee/{assigneeId}")
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<List<Task>> getTasksByAssignee(@PathVariable Long assigneeId) {
        log.info("[TASK-CONTROLLER] GET /api/tasks/assignee/{}", assigneeId);
        return ResponseEntity.ok(taskService.getTasksByAssignee(assigneeId));
    }

    @GetMapping("/status/{status}")
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<List<Task>> getTasksByStatus(@PathVariable Task.TaskStatus status) {
        log.info("[TASK-CONTROLLER] GET /api/tasks/status/{}", status);
        return ResponseEntity.ok(taskService.getTasksByStatus(status));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Task Service is healthy");
    }
}
