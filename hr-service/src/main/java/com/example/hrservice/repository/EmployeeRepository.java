package com.example.hrservice.repository;

import com.example.hrservice.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

	Optional<Employee> findByAuthUserId(String authUserId);

	Optional<Employee> findByUsernameIgnoreCase(String username);

}