package com.hrservice.hr.service;

import com.hrservice.hr.entity.PayrollRun;
import com.hrservice.hr.events.PayrollRunRequestedEvent;
import com.hrservice.hr.repository.PayrollRunRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PayrollRunServiceIntegrationTest {

    @Test
    void createPayrollRun_publishesThroughMockBroker() {
        PayrollRunRepository payrollRunRepository = mock(PayrollRunRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        PayrollEventPublisher payrollEventPublisher = new PayrollEventPublisher(rabbitTemplate);
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
        verify(rabbitTemplate).convertAndSend(eq("payroll.run"), eq("payroll.run.requested"), captor.capture());

        PayrollRunRequestedEvent event = captor.getValue();
        assertEquals(77L, event.getPayrollRunId());
        assertEquals(LocalDate.of(2026, 5, 1), event.getPeriodStart());
        assertEquals(LocalDate.of(2026, 5, 31), event.getPeriodEnd());
        assertEquals("HR_ADMIN", event.getMetadata().get("requestedBy"));
        assertEquals("api", event.getMetadata().get("source"));
    }
}