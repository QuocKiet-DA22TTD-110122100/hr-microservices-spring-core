package com.hrservice.project.controller;

import com.hrservice.project.dto.ProjectAssignmentRequest;
import com.hrservice.project.entity.Project;
import com.hrservice.project.entity.ProjectAssignment;
import com.hrservice.project.service.ProjectAssignmentService;
import com.hrservice.project.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProjectControllerAssignmentTest {

    private final ProjectService projectService = mock(ProjectService.class);
    private final ProjectAssignmentService assignmentService = mock(ProjectAssignmentService.class);
    private final ProjectController controller = new ProjectController(projectService, assignmentService);

    @Test
    void addProjectAssignmentReturnsCreatedAssignment() {
        ProjectAssignment assignment = assignment(10L, 20L);
        when(assignmentService.addAssignment(10L, 20L, ProjectAssignment.ProjectRole.DEVELOPER)).thenReturn(assignment);

        ResponseEntity<ProjectAssignment> response = controller.addProjectAssignment(
                10L,
                new ProjectAssignmentRequest(20L, ProjectAssignment.ProjectRole.DEVELOPER)
        );

        assertEquals(201, response.getStatusCode().value());
        assertSame(assignment, response.getBody());
    }

    @Test
    void addProjectAssignmentReturnsNotFoundForMissingProject() {
        when(assignmentService.addAssignment(10L, 20L, ProjectAssignment.ProjectRole.MEMBER))
                .thenThrow(new NoSuchElementException("Project not found: 10"));

        ResponseEntity<ProjectAssignment> response = controller.addProjectAssignment(
                10L,
                new ProjectAssignmentRequest(20L, ProjectAssignment.ProjectRole.MEMBER)
        );

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void addProjectAssignmentReturnsConflictForDuplicateActiveMember() {
        when(assignmentService.addAssignment(10L, 20L, ProjectAssignment.ProjectRole.QA))
                .thenThrow(new IllegalStateException("Employee is already assigned to project"));

        ResponseEntity<ProjectAssignment> response = controller.addProjectAssignment(
                10L,
                new ProjectAssignmentRequest(20L, ProjectAssignment.ProjectRole.QA)
        );

        assertEquals(409, response.getStatusCode().value());
    }

    @Test
    void getProjectAssignmentsDelegatesToService() {
        ProjectAssignment assignment = assignment(10L, 20L);
        when(assignmentService.getAssignmentsByProject(10L)).thenReturn(List.of(assignment));

        ResponseEntity<List<ProjectAssignment>> response = controller.getProjectAssignments(10L);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(List.of(assignment), response.getBody());
    }

    @Test
    void removeProjectAssignmentReturnsNoContent() {
        ResponseEntity<Void> response = controller.removeProjectAssignment(10L, 20L);

        assertEquals(204, response.getStatusCode().value());
        verify(assignmentService).removeAssignment(10L, 20L);
    }

    @Test
    void removeProjectAssignmentReturnsNotFoundWhenMissing() {
        org.mockito.Mockito.doThrow(new NoSuchElementException("Project assignment not found"))
                .when(assignmentService).removeAssignment(10L, 20L);

        ResponseEntity<Void> response = controller.removeProjectAssignment(10L, 20L);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void existingProjectEndpointsStillUseProjectService() {
        Project project = new Project();
        project.setId(10L);
        project.setName("Core Platform");
        when(projectService.getProjectById(10L)).thenReturn(Optional.of(project));

        ResponseEntity<Project> response = controller.getProjectById(10L);

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().getName().contains("Core"));
    }

    private ProjectAssignment assignment(Long projectId, Long employeeId) {
        Project project = new Project();
        project.setId(projectId);

        ProjectAssignment assignment = new ProjectAssignment();
        assignment.setProject(project);
        assignment.setEmployeeId(employeeId);
        assignment.setRole(ProjectAssignment.ProjectRole.DEVELOPER);
        assignment.setActive(true);
        return assignment;
    }
}
