package com.hrservice.hr.controller;

import com.hrservice.hr.entity.Department;
import com.hrservice.hr.entity.Employee;
import com.hrservice.hr.entity.ProcessedSyncEvent;
import com.hrservice.hr.events.EmployeeHiredEvent;
import com.hrservice.hr.mapper.HrDtoMapper;
import com.hrservice.hr.repository.DepartmentRepository;
import com.hrservice.hr.repository.EmployeeRepository;
import com.hrservice.hr.repository.ProcessedSyncEventRepository;
import com.hrservice.hr.service.EmployeeEventPublisher;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private ProcessedSyncEventRepository processedSyncEventRepository;

    @Mock
    private SecurityValidator securityValidator;

    @Mock
    private HrDtoMapper hrDtoMapper;

    @Mock
    private EmployeeEventPublisher employeeEventPublisher;

    @Mock
    private HttpServletRequest httpServletRequest;

    private EmployeeController employeeController;

    @BeforeEach
    void setUp() {
        employeeController = new EmployeeController(
            employeeRepository,
            departmentRepository,
            processedSyncEventRepository,
            securityValidator,
            hrDtoMapper,
            employeeEventPublisher
        );
    }

    @Test
    void createPublishesEmployeeHiredEvent() {
        Department department = new Department();
        department.setId(10L);
        department.setName("Engineering");

        Employee saved = new Employee();
        saved.setId(42L);
        saved.setAuthUserId("auth-123");
        saved.setName("John Doe");
        saved.setPosition("Senior Dev");
        saved.setBaseSalary(new BigDecimal("120000.00"));
        saved.setHireDate(LocalDate.of(2026, 1, 15));
        saved.setDepartment(department);

        when(departmentRepository.findById(10L)).thenReturn(Optional.of(department));
        when(employeeRepository.findByAuthUserId("auth-123")).thenReturn(Optional.empty());
        when(employeeRepository.save(any(Employee.class))).thenReturn(saved);
        when(hrDtoMapper.toResponse(saved)).thenReturn(new EmployeeController.EmployeeResponse(
            42L,
            "auth-123",
            null,
            null,
            "John Doe",
            "Senior Dev",
            new BigDecimal("120000.00"),
            LocalDate.of(2026, 1, 15),
            "ACTIVE",
            10L,
            "Engineering"
        ));

        EmployeeController.EmployeeCreateRequest request = new EmployeeController.EmployeeCreateRequest(
            "auth-123",
            "John Doe",
            "Senior Dev",
            new BigDecimal("120000.00"),
            LocalDate.of(2026, 1, 15),
            10L,
            null
        );

        EmployeeController.EmployeeResponse response = employeeController.create(request, httpServletRequest);

        assertNotNull(response);
        assertEquals(42L, response.id());

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        Employee persisted = employeeCaptor.getValue();
        assertEquals("auth-123", persisted.getAuthUserId());
        assertEquals(new BigDecimal("120000.00"), persisted.getBaseSalary());
        assertEquals(LocalDate.of(2026, 1, 15), persisted.getHireDate());

        ArgumentCaptor<EmployeeHiredEvent> eventCaptor = ArgumentCaptor.forClass(EmployeeHiredEvent.class);
        verify(employeeEventPublisher).publish(eventCaptor.capture());
        EmployeeHiredEvent event = eventCaptor.getValue();
        assertEquals(42L, event.getId());
        assertEquals("auth-123", event.getAuthUserId());
        assertEquals("John Doe", event.getName());
        assertEquals(10L, event.getDepartmentId());
    }

    @Test
    void createRejectsDuplicateAuthUserId() {
        Department department = new Department();
        department.setId(10L);
        department.setName("Engineering");

        Employee existing = new Employee();
        existing.setId(99L);
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(department));
        when(employeeRepository.findByAuthUserId("auth-123")).thenReturn(Optional.of(existing));

        EmployeeController.EmployeeCreateRequest request = new EmployeeController.EmployeeCreateRequest(
            "auth-123",
            "John Doe",
            "Senior Dev",
            new BigDecimal("120000.00"),
            LocalDate.of(2026, 1, 15),
            10L,
            null
        );

        assertThrows(ResponseStatusException.class, () -> employeeController.create(request, httpServletRequest));
        verify(employeeEventPublisher, never()).publish(any());
        verify(employeeRepository, never()).save(any(Employee.class));
    }
}
