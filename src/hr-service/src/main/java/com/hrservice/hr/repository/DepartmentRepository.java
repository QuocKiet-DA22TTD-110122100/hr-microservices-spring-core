package com.hrservice.hr.repository;

import com.hrservice.hr.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findByOrganizationUnitId(Long organizationUnitId);
}
