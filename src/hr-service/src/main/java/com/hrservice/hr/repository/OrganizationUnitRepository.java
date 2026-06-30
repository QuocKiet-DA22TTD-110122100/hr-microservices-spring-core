package com.hrservice.hr.repository;

import com.hrservice.hr.entity.OrganizationUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizationUnitRepository extends JpaRepository<OrganizationUnit, Long> {

    List<OrganizationUnit> findByParentIsNull();

    List<OrganizationUnit> findByParentId(Long parentId);
}
