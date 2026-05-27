package com.hrservice.hr.controller;

import com.hrservice.hr.config.PayrollService;
import com.hrservice.hr.entity.PayrollResult;
import com.hrservice.hr.repository.EmployeeRepository;
import com.hrservice.hr.repository.PayrollResultRepository;
import com.hrservice.hr.service.PayrollRunService;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollControllerTest {

    @Mock
    private PayrollResultRepository payrollResultRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private SecurityValidator securityValidator;

    @Mock
    private PayrollService payrollService;

    @Mock
    private PayrollRunService payrollRunService;

    @Mock
    private HttpServletRequest httpServletRequest;

    private PayrollController payrollController;

    @BeforeEach
    void setUp() {
        payrollController = new PayrollController(
                payrollResultRepository,
                employeeRepository,
                securityValidator,
                payrollService,
                payrollRunService
        );
    }

    @Test
    void createPayrollRunDelegatesToService() {
        com.hrservice.hr.entity.PayrollRun payrollRun = new com.hrservice.hr.entity.PayrollRun();
        payrollRun.setId(88L);
        payrollRun.setPeriodStartDate(LocalDate.of(2026, 5, 1));
        payrollRun.setPeriodEndDate(LocalDate.of(2026, 5, 31));

        when(payrollRunService.createPayrollRun(eq(YearMonth.of(2026, 5)), eq("HR_ADMIN"), eq("api")))
                .thenReturn(payrollRun);

        Map<String, Object> response = payrollController.createPayrollRun(
                Map.of("yearMonth", "2026-05", "requestedBy", "HR_ADMIN", "source", "api"),
                httpServletRequest
        ).getBody();

        assertEquals(88L, response.get("payrollRunId"));
        assertEquals("2026-05", response.get("yearMonth"));
        assertEquals("2026-05-01", response.get("periodStart"));
        assertEquals("2026-05-31", response.get("periodEnd"));

        verify(payrollRunService).createPayrollRun(eq(YearMonth.of(2026, 5)), eq("HR_ADMIN"), eq("api"));
    }
}