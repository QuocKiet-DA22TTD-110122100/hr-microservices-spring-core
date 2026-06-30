package com.hrservice.hr.mapper;

import com.hrservice.hr.controller.DepartmentController.DepartmentResponse;
import com.hrservice.hr.controller.EmployeeController.EmployeeResponse;
import com.hrservice.hr.controller.EmployeeController.SyncUserResponse;
import com.hrservice.hr.controller.OrganizationUnitController.OrganizationUnitResponse;
import com.hrservice.hr.entity.Department;
import com.hrservice.hr.entity.Employee;
import com.hrservice.hr.entity.OrganizationUnit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface HrDtoMapper {

    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.name")
    EmployeeResponse toResponse(Employee employee);

    @Mapping(target = "organizationUnitId", source = "organizationUnit.id")
    @Mapping(target = "organizationUnitName", source = "organizationUnit.name")
    DepartmentResponse toResponse(Department department);

    @Mapping(target = "parentId", source = "parent.id")
    OrganizationUnitResponse toResponse(OrganizationUnit organizationUnit);

    SyncUserResponse toSyncResponse(Long employeeId, String authUserId, String username, String did, String status);
}
