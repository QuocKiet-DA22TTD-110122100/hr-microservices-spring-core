package com.hrservice.hr.controller;

import com.hrservice.hr.dto.PayrollComplianceReport;
import com.hrservice.hr.service.PayrollComplianceReportService;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollComplianceControllerTest {

    @Mock
    private PayrollComplianceReportService payrollComplianceReportService;

    @Mock
    private SecurityValidator securityValidator;

    @Mock
    private HttpServletRequest request;

    private PayrollComplianceController controller;

    @BeforeEach
    void setUp() {
        controller = new PayrollComplianceController(payrollComplianceReportService, securityValidator);
    }

    @Test
    void getTaxReportUsesGatewayAndComplianceGuards() {
        PayrollComplianceReport report = new PayrollComplianceReport(
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 5, 31),
                LocalDateTime.of(2026, 5, 27, 12, 0),
                0,
                0,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                List.of()
        );

        when(payrollComplianceReportService.generateTaxReport(
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 5, 31))
        ).thenReturn(report);

        ResponseEntity<PayrollComplianceReport> response = controller.getTaxReport("2026-05-01", "2026-05-31", request);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(report, response.getBody());
        verify(securityValidator).enforceGatewayAccess(request);
        verify(securityValidator).enforceComplianceOfficerOrAdmin(request);
    }

    @Test
    void getTaxReportMapsInvalidDateToBadRequest() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                controller.getTaxReport("not-a-date", "2026-05-31", request)
        );

        assertEquals(400, exception.getStatusCode().value());
        verify(securityValidator).enforceGatewayAccess(request);
        verify(securityValidator).enforceComplianceOfficerOrAdmin(request);
    }
}
