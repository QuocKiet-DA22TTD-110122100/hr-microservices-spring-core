package com.hrservice.auth.iam.repository;

import com.hrservice.auth.iam.entity.RoleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleDefinitionRepository extends JpaRepository<RoleDefinition, String> {
}
