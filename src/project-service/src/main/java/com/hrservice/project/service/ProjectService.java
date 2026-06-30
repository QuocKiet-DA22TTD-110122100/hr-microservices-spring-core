package com.hrservice.project.service;

import com.hrservice.project.entity.Project;
import com.hrservice.project.event.ProjectEventPublisher;
import com.hrservice.project.repository.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Slf4j
public class ProjectService {

    private static final String ID_MUST_NOT_BE_NULL = "id must not be null";
    private static final String PROJECT_MUST_NOT_BE_NULL = "project must not be null";
    private static final String PROJECT_UPDATES_MUST_NOT_BE_NULL = "projectUpdates must not be null";

    private final ProjectRepository projectRepository;
    private final Optional<ProjectEventPublisher> eventPublisher;

    public ProjectService(ProjectRepository projectRepository, Optional<ProjectEventPublisher> eventPublisher) {
        this.projectRepository = projectRepository;
        this.eventPublisher = eventPublisher;
    }

    @Cacheable(value = "projects", key = "'all'")
    public List<Project> getAllProjects() {
        log.info("[PROJECT-SERVICE] Cache MISS: fetching all projects from DB");
        return projectRepository.findAll();
    }

    @Cacheable(value = "project", key = "#id")
    public Optional<Project> getProjectById(Long id) {
        Long projectId = Objects.requireNonNull(id, ID_MUST_NOT_BE_NULL);
        log.info("[PROJECT-SERVICE] Cache MISS: fetching project {} from DB", id);
        return projectRepository.findById(projectId);
    }

    @Cacheable(value = "projectsByStatus", key = "#status.name()")
    public List<Project> getProjectsByStatus(Project.ProjectStatus status) {
        log.info("[PROJECT-SERVICE] Cache MISS: fetching projects with status {} from DB", status);
        return projectRepository.findByStatus(status);
    }

    @Cacheable(value = "projectsByLead", key = "#leadId")
    public List<Project> getProjectsByLead(Long leadId) {
        log.info("[PROJECT-SERVICE] Cache MISS: fetching projects for lead {} from DB", leadId);
        return projectRepository.findByLeadId(leadId);
    }

    @CacheEvict(value = {"projects", "projectsByStatus", "projectsByLead"}, allEntries = true)
    public Project createProject(Project project) {
        Project projectToSave = Objects.requireNonNull(project, PROJECT_MUST_NOT_BE_NULL);
        log.info("[PROJECT-SERVICE] Creating project - evicting all caches");
        Project saved = projectRepository.save(projectToSave);
        
        // Publish event if RabbitMQ is configured
        eventPublisher.ifPresent(p -> p.publishProjectCreatedEvent(
                saved.getId(),
                saved.getName(),
                saved.getDescription(),
                saved.getLeadId()
        ));
        
        return saved;
    }

    @CacheEvict(value = {"project", "projects", "projectsByStatus", "projectsByLead"}, allEntries = true)
    public Project updateProject(Long id, Project projectUpdates) {
        Long projectId = Objects.requireNonNull(id, ID_MUST_NOT_BE_NULL);
        Project updates = Objects.requireNonNull(projectUpdates, PROJECT_UPDATES_MUST_NOT_BE_NULL);
        log.info("[PROJECT-SERVICE] Updating project {} - evicting all caches", id);
        return projectRepository.findById(projectId)
                .map(existing -> {
                    Project.ProjectStatus oldStatus = existing.getStatus();
                    
                    existing.setName(updates.getName());
                    existing.setDescription(updates.getDescription());
                    existing.setStatus(updates.getStatus());
                    existing.setLeadId(updates.getLeadId());
                    
                    Project updated = projectRepository.save(existing);
                    
                    // Publish status change event if status changed
                    if (!oldStatus.equals(updates.getStatus())) {
                        eventPublisher.ifPresent(p -> p.publishProjectStatusChangedEvent(
                                updated.getId(),
                                oldStatus,
                                updated.getStatus(),
                                updated.getLeadId()
                        ));
                    }
                    
                    return updated;
                })
                .orElse(null);
    }

    @CacheEvict(value = {"project", "projects", "projectsByStatus", "projectsByLead"}, allEntries = true)
    public void deleteProject(Long id) {
        Long projectId = Objects.requireNonNull(id, ID_MUST_NOT_BE_NULL);
        log.info("[PROJECT-SERVICE] Deleting project {} - evicting all caches", id);
        projectRepository.deleteById(projectId);
    }
}
