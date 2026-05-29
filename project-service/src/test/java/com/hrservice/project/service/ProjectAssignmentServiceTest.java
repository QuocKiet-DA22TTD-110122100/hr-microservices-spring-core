package com.hrservice.project.service;

import com.hrservice.project.entity.Project;
import com.hrservice.project.entity.ProjectAssignment;
import com.hrservice.project.repository.ProjectAssignmentRepository;
import com.hrservice.project.repository.ProjectRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProjectAssignmentServiceTest {

    private final ProjectRepository projectRepository = mock(ProjectRepository.class);
    private final ProjectAssignmentRepository projectAssignmentRepository = mock(ProjectAssignmentRepository.class);
    private final ProjectAssignmentService service = new ProjectAssignmentService(projectRepository, projectAssignmentRepository);

    @Test
    void addAssignmentCreatesActiveProjectMember() {
        Project project = project(10L);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(projectAssignmentRepository.existsByProjectIdAndEmployeeIdAndActiveTrue(10L, 20L)).thenReturn(false);
        when(projectAssignmentRepository.findByProjectIdAndEmployeeId(10L, 20L)).thenReturn(Optional.empty());
        when(projectAssignmentRepository.save(any(ProjectAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectAssignment assignment = service.addAssignment(10L, 20L, ProjectAssignment.ProjectRole.DEVELOPER);

        assertEquals(project, assignment.getProject());
        assertEquals(20L, assignment.getEmployeeId());
        assertEquals(ProjectAssignment.ProjectRole.DEVELOPER, assignment.getRole());
        assertTrue(assignment.isActive());
        assertNotNull(assignment.getAssignedAt());
        verify(projectAssignmentRepository).save(any(ProjectAssignment.class));
    }

    @Test
    void addAssignmentReactivatesInactiveMemberWithNewTimestamp() {
        Project project = project(10L);
        ProjectAssignment inactiveAssignment = new ProjectAssignment();
        inactiveAssignment.setProject(project);
        inactiveAssignment.setEmployeeId(20L);
        inactiveAssignment.setRole(ProjectAssignment.ProjectRole.MEMBER);
        inactiveAssignment.setActive(false);
        inactiveAssignment.setAssignedAt(LocalDateTime.of(2026, 5, 1, 9, 0));

        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(projectAssignmentRepository.existsByProjectIdAndEmployeeIdAndActiveTrue(10L, 20L)).thenReturn(false);
        when(projectAssignmentRepository.findByProjectIdAndEmployeeId(10L, 20L)).thenReturn(Optional.of(inactiveAssignment));
        when(projectAssignmentRepository.save(any(ProjectAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectAssignment assignment = service.addAssignment(10L, 20L, ProjectAssignment.ProjectRole.QA);

        assertTrue(assignment.isActive());
        assertEquals(ProjectAssignment.ProjectRole.QA, assignment.getRole());
        assertTrue(assignment.getAssignedAt().isAfter(LocalDateTime.of(2026, 5, 1, 9, 0)));
    }

    @Test
    void addAssignmentRejectsDuplicateActiveMember() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project(10L)));
        when(projectAssignmentRepository.existsByProjectIdAndEmployeeIdAndActiveTrue(10L, 20L)).thenReturn(true);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                service.addAssignment(10L, 20L, ProjectAssignment.ProjectRole.QA)
        );

        assertEquals("Employee is already assigned to project", exception.getMessage());
        verify(projectAssignmentRepository, never()).save(any());
    }

    @Test
    void addAssignmentRequiresExistingProject() {
        when(projectRepository.findById(10L)).thenReturn(Optional.empty());

        NoSuchElementException exception = assertThrows(NoSuchElementException.class, () ->
                service.addAssignment(10L, 20L, ProjectAssignment.ProjectRole.MEMBER)
        );

        assertEquals("Project not found: 10", exception.getMessage());
    }

    @Test
    void removeAssignmentMarksAssignmentInactive() {
        ProjectAssignment assignment = new ProjectAssignment();
        assignment.setProject(project(10L));
        assignment.setEmployeeId(20L);
        assignment.setActive(true);
        when(projectAssignmentRepository.findByProjectIdAndEmployeeId(10L, 20L)).thenReturn(Optional.of(assignment));

        service.removeAssignment(10L, 20L);

        assertFalse(assignment.isActive());
        verify(projectAssignmentRepository).save(assignment);
    }

    private Project project(Long id) {
        Project project = new Project();
        project.setId(id);
        project.setName("Core Platform");
        project.setLeadId(1L);
        project.setStatus(Project.ProjectStatus.ACTIVE);
        return project;
    }
}
