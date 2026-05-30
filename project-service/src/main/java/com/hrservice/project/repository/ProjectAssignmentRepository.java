package com.hrservice.project.repository;

import com.hrservice.project.entity.ProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {
    List<ProjectAssignment> findByProjectIdAndActiveTrueOrderByAssignedAtDesc(Long projectId);
    List<ProjectAssignment> findByEmployeeIdAndActiveTrueOrderByAssignedAtDesc(Long employeeId);
    Optional<ProjectAssignment> findByProjectIdAndEmployeeId(Long projectId, Long employeeId);
    boolean existsByProjectIdAndEmployeeIdAndActiveTrue(Long projectId, Long employeeId);
}
