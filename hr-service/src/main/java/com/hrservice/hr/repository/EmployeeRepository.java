package com.hrservice.hr.repository;

import com.hrservice.hr.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

	Optional<Employee> findByAuthUserId(String authUserId);

	Optional<Employee> findByUsernameIgnoreCase(String username);

	Optional<Employee> findByDidIgnoreCase(String did);

	List<Employee> findByDepartmentId(Long departmentId);

	long countByDepartmentId(Long departmentId);

}
