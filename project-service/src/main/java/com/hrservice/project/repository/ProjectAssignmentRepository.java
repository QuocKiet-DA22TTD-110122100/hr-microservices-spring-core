package com.hrservice.project.repository;

import com.hrservice.project.entity.ProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {
    @Query("select pa from ProjectAssignment pa where pa.project.id = :projectId and pa.active = true order by pa.assignedAt desc")
    List<ProjectAssignment> findByProjectIdAndActiveTrueOrderByAssignedAtDesc(@Param("projectId") Long projectId);

    List<ProjectAssignment> findByProject_IdAndActiveTrueOrderByAssignedAtDesc(Long projectId);
    List<ProjectAssignment> findByEmployeeIdAndActiveTrueOrderByAssignedAtDesc(Long employeeId);

    @Query("select pa from ProjectAssignment pa where pa.project.id = :projectId and pa.employeeId = :employeeId")
    Optional<ProjectAssignment> findByProjectIdAndEmployeeId(@Param("projectId") Long projectId, @Param("employeeId") Long employeeId);

    Optional<ProjectAssignment> findByProject_IdAndEmployeeId(Long projectId, Long employeeId);

    @Query("select count(pa) > 0 from ProjectAssignment pa where pa.project.id = :projectId and pa.employeeId = :employeeId and pa.active = true")
    boolean existsByProjectIdAndEmployeeIdAndActiveTrue(@Param("projectId") Long projectId, @Param("employeeId") Long employeeId);

    boolean existsByProject_IdAndEmployeeIdAndActiveTrue(Long projectId, Long employeeId);
}
