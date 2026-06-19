package com.hrservice.hr.service;

import com.hrservice.hr.entity.Department;
import com.hrservice.hr.entity.Employee;
import com.hrservice.hr.entity.PayrollRun;
import com.hrservice.hr.events.PayrollRunRequestedEvent;
import com.hrservice.hr.repository.DepartmentRepository;
import com.hrservice.hr.repository.EmployeeRepository;
import com.hrservice.hr.repository.PayrollRunRepository;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@DataJpaTest
@Import({PayrollRunService.class, PayrollEventPublisher.class})
class PayrollRunServiceIntegrationTest {

    @Autowired
    private PayrollRunRepository payrollRunRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PayrollRunService payrollRunService;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @Test
    void createPayrollRun_persistsAndPublishesThroughMockBroker() {
        Department department = new Department();
        department.setName("Engineering");
        departmentRepository.save(department);

        Employee employee = new Employee();
        employee.setAuthUserId("auth-789");
        employee.setUsername("alice");
        employee.setName("Alice");
        employee.setPosition("Lead");
        employee.setBaseSalary(new BigDecimal("120000.00"));
        employee.setHireDate(LocalDate.of(2026, 1, 15));
        employee.setDepartment(department);
        employeeRepository.save(employee);

        PayrollRun payrollRun = payrollRunService.createPayrollRun(YearMonth.of(2026, 5), "HR_ADMIN", "api");

        assertNotNull(payrollRun.getId());
        assertEquals(LocalDate.of(2026, 5, 1), payrollRun.getPeriodStartDate());
        assertEquals(LocalDate.of(2026, 5, 31), payrollRun.getPeriodEndDate());

        verify(rabbitTemplate).convertAndSend(eq("payroll.run"), eq("payroll.run.requested"), org.mockito.ArgumentMatchers.any(PayrollRunRequestedEvent.class));
        assertEquals(1L, payrollRunRepository.count());
    }
}