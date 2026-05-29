package com.hrservice.project.service;

import com.hrservice.project.entity.Project;
import com.hrservice.project.entity.ProjectAssignment;
import com.hrservice.project.repository.ProjectAssignmentRepository;
import com.hrservice.project.repository.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
@Slf4j
public class ProjectAssignmentService {

    private final ProjectRepository projectRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;

    public ProjectAssignmentService(ProjectRepository projectRepository,
                                    ProjectAssignmentRepository projectAssignmentRepository) {
        this.projectRepository = projectRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
    }

    @Cacheable(value = "projectAssignments", key = "#projectId")
    public List<ProjectAssignment> getAssignmentsByProject(Long projectId) {
        Long id = Objects.requireNonNull(projectId, "projectId must not be null");
        log.info("[PROJECT-ASSIGNMENT] Cache MISS: fetching assignments for project {}", id);
        return projectAssignmentRepository.findByProjectIdAndActiveTrueOrderByAssignedAtDesc(id);
    }

    @Cacheable(value = "projectAssignmentsByEmployee", key = "#employeeId")
    public List<ProjectAssignment> getAssignmentsByEmployee(Long employeeId) {
        Long id = Objects.requireNonNull(employeeId, "employeeId must not be null");
        log.info("[PROJECT-ASSIGNMENT] Cache MISS: fetching assignments for employee {}", id);
        return projectAssignmentRepository.findByEmployeeIdAndActiveTrueOrderByAssignedAtDesc(id);
    }

    public boolean isActiveProjectMember(Long projectId, Long employeeId) {
        Long checkedProjectId = Objects.requireNonNull(projectId, "projectId must not be null");
        Long checkedEmployeeId = Objects.requireNonNull(employeeId, "employeeId must not be null");
        return projectAssignmentRepository.existsByProjectIdAndEmployeeIdAndActiveTrue(checkedProjectId, checkedEmployeeId);
    }

    @Transactional
    @CacheEvict(value = {"projectAssignments", "projectAssignmentsByEmployee"}, allEntries = true)
    public ProjectAssignment addAssignment(Long projectId, Long employeeId, ProjectAssignment.ProjectRole role) {
        Long checkedProjectId = Objects.requireNonNull(projectId, "projectId must not be null");
        Long checkedEmployeeId = Objects.requireNonNull(employeeId, "employeeId must not be null");

        Project project = projectRepository.findById(checkedProjectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found: " + checkedProjectId));

        if (projectAssignmentRepository.existsByProjectIdAndEmployeeIdAndActiveTrue(checkedProjectId, checkedEmployeeId)) {
            throw new IllegalStateException("Employee is already assigned to project");
        }

        ProjectAssignment assignment = projectAssignmentRepository
                .findByProjectIdAndEmployeeId(checkedProjectId, checkedEmployeeId)
                .orElseGet(ProjectAssignment::new);

        assignment.setProject(project);
        assignment.setEmployeeId(checkedEmployeeId);
        assignment.setRole(role == null ? ProjectAssignment.ProjectRole.MEMBER : role);
        assignment.setActive(true);
        assignment.setAssignedAt(LocalDateTime.now());

        return projectAssignmentRepository.save(assignment);
    }

    @Transactional
    @CacheEvict(value = {"projectAssignments", "projectAssignmentsByEmployee"}, allEntries = true)
    public void removeAssignment(Long projectId, Long employeeId) {
        Long checkedProjectId = Objects.requireNonNull(projectId, "projectId must not be null");
        Long checkedEmployeeId = Objects.requireNonNull(employeeId, "employeeId must not be null");

        ProjectAssignment assignment = projectAssignmentRepository
                .findByProjectIdAndEmployeeId(checkedProjectId, checkedEmployeeId)
                .orElseThrow(() -> new NoSuchElementException("Project assignment not found"));

        assignment.setActive(false);
        projectAssignmentRepository.save(assignment);
    }
}
