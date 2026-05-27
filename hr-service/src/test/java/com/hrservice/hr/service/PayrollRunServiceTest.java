package com.hrservice.hr.service;

import com.hrservice.hr.entity.PayrollRun;
import com.hrservice.hr.events.PayrollRunRequestedEvent;
import com.hrservice.hr.repository.PayrollRunRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PayrollRunServiceTest {

    @Test
    void createPayrollRun_persistsAndPublishesEvent() {
        PayrollRunRepository payrollRunRepository = mock(PayrollRunRepository.class);
        PayrollEventPublisher payrollEventPublisher = mock(PayrollEventPublisher.class);
        PayrollRunService payrollRunService = new PayrollRunService(payrollRunRepository, payrollEventPublisher);

        when(payrollRunRepository.findByPeriodStartDateAndPeriodEndDate(LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31)))
                .thenReturn(Optional.empty());

        PayrollRun saved = new PayrollRun();
        saved.setId(77L);
        saved.setPeriodStartDate(LocalDate.of(2026, 5, 1));
        saved.setPeriodEndDate(LocalDate.of(2026, 5, 31));
        saved.setRequestedBy("HR_ADMIN");
        saved.setSourceSystem("api");

        when(payrollRunRepository.save(any(PayrollRun.class))).thenReturn(saved);

        PayrollRun result = payrollRunService.createPayrollRun(YearMonth.of(2026, 5), "HR_ADMIN", "api");

        assertNotNull(result);
        assertEquals(77L, result.getId());

        ArgumentCaptor<PayrollRunRequestedEvent> captor = ArgumentCaptor.forClass(PayrollRunRequestedEvent.class);
        verify(payrollEventPublisher).publish(captor.capture());
        PayrollRunRequestedEvent captured = captor.getValue();
        assertEquals(77L, captured.getPayrollRunId());
        assertEquals(LocalDate.of(2026, 5, 1), captured.getPeriodStart());
        assertEquals(LocalDate.of(2026, 5, 31), captured.getPeriodEnd());
        assertEquals("HR_ADMIN", captured.getMetadata().get("requestedBy"));
        assertEquals("api", captured.getMetadata().get("source"));
    }

    @Test
    void createPayrollRun_rejectsDuplicatePeriod() {
        PayrollRunRepository payrollRunRepository = mock(PayrollRunRepository.class);
        PayrollEventPublisher payrollEventPublisher = mock(PayrollEventPublisher.class);
        PayrollRunService payrollRunService = new PayrollRunService(payrollRunRepository, payrollEventPublisher);

        when(payrollRunRepository.findByPeriodStartDateAndPeriodEndDate(LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31)))
                .thenReturn(Optional.of(new PayrollRun()));

        assertThrows(IllegalStateException.class, () ->
                payrollRunService.createPayrollRun(YearMonth.of(2026, 5), "HR_ADMIN", "api"));

        verify(payrollRunRepository, never()).save(any(PayrollRun.class));
        verify(payrollEventPublisher, never()).publish(any());
    }
}