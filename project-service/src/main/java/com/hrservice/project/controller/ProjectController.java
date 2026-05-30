package com.hrservice.project.controller;

import com.hrservice.project.dto.ProjectRequest;
import com.hrservice.project.dto.ProjectAssignmentRequest;
import com.hrservice.project.entity.Project;
import com.hrservice.project.entity.ProjectAssignment;
import com.hrservice.project.security.RequireRoles;
import com.hrservice.project.service.ProjectAssignmentService;
import com.hrservice.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectAssignmentService projectAssignmentService;

    @GetMapping
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<List<Project>> getAllProjects() {
        log.info("[PROJECT-CONTROLLER] GET /api/projects");
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        log.info("[PROJECT-CONTROLLER] GET /api/projects/{}", id);
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequireRoles({"ADMIN"})
    public ResponseEntity<Project> createProject(@Valid @RequestBody ProjectRequest request) {
        log.info("[PROJECT-CONTROLLER] POST /api/projects - name: {}", request.name());
        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setStatus(request.status() == null ? Project.ProjectStatus.ACTIVE : request.status());
        project.setLeadId(request.leadId());
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(project));
    }

    @PutMapping("/{id}")
    @RequireRoles({"ADMIN"})
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        log.info("[PROJECT-CONTROLLER] PUT /api/projects/{}", id);
        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setStatus(request.status());
        project.setLeadId(request.leadId());
        project.setUpdatedAt(LocalDateTime.now());
        Project updated = projectService.updateProject(id, project);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @RequireRoles({"ADMIN"})
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        log.info("[PROJECT-CONTROLLER] DELETE /api/projects/{}", id);
        if (projectService.getProjectById(id).isPresent()) {
            projectService.deleteProject(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/status/{status}")
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<List<Project>> getProjectsByStatus(@PathVariable Project.ProjectStatus status) {
        log.info("[PROJECT-CONTROLLER] GET /api/projects/status/{}", status);
        return ResponseEntity.ok(projectService.getProjectsByStatus(status));
    }

    @GetMapping("/lead/{leadId}")
    @RequireRoles({"USER", "ADMIN"})
    public ResponseEntity<List<Project>> getProjectsByLead(@PathVariable Long leadId) {
        log.info("[PROJECT-CONTROLLER] GET /api/projects/lead/{}", leadId);
        return ResponseEntity.ok(projectService.getProjectsByLead(leadId));
    }

    @PostMapping("/{projectId}/assignments")
    @RequireRoles({"ADMIN", "MANAGER"})
    public ResponseEntity<ProjectAssignment> addProjectAssignment(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectAssignmentRequest request) {
        log.info("[PROJECT-CONTROLLER] POST /api/projects/{}/assignments - employeeId: {}", projectId, request.employeeId());
        try {
            ProjectAssignment assignment = projectAssignmentService.addAssignment(projectId, request.employeeId(), request.role());
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @GetMapping("/{projectId}/assignments")
    @RequireRoles({"USER", "ADMIN", "MANAGER"})
    public ResponseEntity<List<ProjectAssignment>> getProjectAssignments(@PathVariable Long projectId) {
        log.info("[PROJECT-CONTROLLER] GET /api/projects/{}/assignments", projectId);
        return ResponseEntity.ok(projectAssignmentService.getAssignmentsByProject(projectId));
    }

    @DeleteMapping("/{projectId}/assignments/{employeeId}")
    @RequireRoles({"ADMIN", "MANAGER"})
    public ResponseEntity<Void> removeProjectAssignment(@PathVariable Long projectId, @PathVariable Long employeeId) {
        log.info("[PROJECT-CONTROLLER] DELETE /api/projects/{}/assignments/{}", projectId, employeeId);
        try {
            projectAssignmentService.removeAssignment(projectId, employeeId);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/employees/{employeeId}/assignments")
    @RequireRoles({"USER", "ADMIN", "MANAGER"})
    public ResponseEntity<List<ProjectAssignment>> getEmployeeProjectAssignments(@PathVariable Long employeeId) {
        log.info("[PROJECT-CONTROLLER] GET /api/projects/employees/{}/assignments", employeeId);
        return ResponseEntity.ok(projectAssignmentService.getAssignmentsByEmployee(employeeId));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Project Service is healthy");
    }
}
