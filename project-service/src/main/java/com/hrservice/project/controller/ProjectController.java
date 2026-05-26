package com.hrservice.project.controller;

import com.hrservice.project.dto.ProjectRequest;
import com.hrservice.project.entity.Project;
import com.hrservice.project.security.RequireRoles;
import com.hrservice.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;

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

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Project Service is healthy");
    }
}
