package com.hrservice.hr.controller;

import com.hrservice.hr.config.PayrollService;
import com.hrservice.hr.entity.PayrollResult;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollWorkflowControllerTest {

    @Mock
    private PayrollService payrollService;

    @Mock
    private SecurityValidator securityValidator;

    @Mock
    private HttpServletRequest request;

    private PayrollWorkflowController controller;

    @BeforeEach
    void setUp() {
        controller = new PayrollWorkflowController(payrollService, securityValidator);
    }

    @Test
    void approvePayrollUsesGatewayRoleGuardAndResolvedActor() throws Exception {
        PayrollResult result = payrollResult(55L, "APPROVED");
        result.setApprovedBy("payroll@example.com");
        result.setApprovedAt(LocalDateTime.of(2026, 5, 27, 9, 30));

        when(request.getHeader("X-Auth-Email")).thenReturn("payroll@example.com");
        when(payrollService.approvePayroll(55L, "payroll@example.com")).thenReturn(result);

        ResponseEntity<Map<String, Object>> response = controller.approvePayroll(55L, request);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(55L, response.getBody().get("payrollId"));
        assertEquals("APPROVED", response.getBody().get("status"));
        assertEquals("payroll@example.com", response.getBody().get("approvedBy"));
        verify(securityValidator).enforceGatewayAccess(request);
        verify(securityValidator).enforcePayrollOfficerOrAdmin(request);
        verify(payrollService).approvePayroll(55L, "payroll@example.com");
    }

    @Test
    void rejectPayrollDelegatesReasonAndActor() {
        PayrollResult result = payrollResult(55L, "DRAFT");
        result.setRemarks("Incorrect amount");

        when(request.getHeader("X-Auth-Email")).thenReturn(null);
        when(request.getHeader("X-Auth-User")).thenReturn("payroll-user");
        when(payrollService.rejectPayroll(55L, "Incorrect amount", "payroll-user")).thenReturn(result);

        ResponseEntity<Map<String, Object>> response = controller.rejectPayroll(
                55L,
                Map.of("reason", "Incorrect amount"),
                request
        );

        assertEquals(200, response.getStatusCode().value());
        assertEquals("DRAFT", response.getBody().get("status"));
        assertEquals("Incorrect amount", response.getBody().get("reason"));
        verify(securityValidator).enforceGatewayAccess(request);
        verify(securityValidator).enforcePayrollOfficerOrAdmin(request);
        verify(payrollService).rejectPayroll(55L, "Incorrect amount", "payroll-user");
    }

    @Test
    void processPayrollMapsInvalidStateToConflict() {
        when(request.getHeader("X-Auth-Email")).thenReturn("payroll@example.com");
        when(payrollService.processPayroll(55L, "payroll@example.com"))
                .thenThrow(new IllegalStateException("Payroll not in APPROVED status"));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                controller.processPayroll(55L, request)
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(securityValidator).enforceGatewayAccess(request);
        verify(securityValidator).enforcePayrollOfficerOrAdmin(request);
    }

    private PayrollResult payrollResult(Long id, String status) {
        PayrollResult result = new PayrollResult();
        result.setId(id);
        result.setStatus(status);
        return result;
    }
}
