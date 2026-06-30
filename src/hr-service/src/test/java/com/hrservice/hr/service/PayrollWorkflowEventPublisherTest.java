package com.hrservice.hr.service;

import com.hrservice.hr.events.PayrollApprovedEvent;
import com.hrservice.hr.events.PayrollProcessedEvent;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class PayrollWorkflowEventPublisherTest {

    @Test
    void publishApprovedSendsWorkflowEvent() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        PayrollWorkflowEventPublisher publisher = new PayrollWorkflowEventPublisher(rabbitTemplate);
        LocalDateTime approvedAt = LocalDateTime.of(2026, 5, 27, 9, 30);

        publisher.publishApproved(new PayrollApprovedEvent(10L, "payroll@example.com", approvedAt));

        ArgumentCaptor<PayrollApprovedEvent> captor = ArgumentCaptor.forClass(PayrollApprovedEvent.class);
        verify(rabbitTemplate).convertAndSend(eq("payroll.workflow"), eq("payroll.approved"), captor.capture());

        PayrollApprovedEvent event = captor.getValue();
        assertEquals("payroll.approved", event.getEventType());
        assertEquals(10L, event.getPayrollId());
        assertEquals("payroll@example.com", event.getApprovedBy());
        assertEquals(approvedAt, event.getApprovedAt());
    }

    @Test
    void publishProcessedSendsWorkflowEvent() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        PayrollWorkflowEventPublisher publisher = new PayrollWorkflowEventPublisher(rabbitTemplate);
        LocalDateTime processedAt = LocalDateTime.of(2026, 5, 27, 10, 0);

        publisher.publishProcessed(new PayrollProcessedEvent(
                10L,
                20L,
                new BigDecimal("10000.00"),
                new BigDecimal("8500.00"),
                "payroll@example.com",
                processedAt
        ));

        ArgumentCaptor<PayrollProcessedEvent> captor = ArgumentCaptor.forClass(PayrollProcessedEvent.class);
        verify(rabbitTemplate).convertAndSend(eq("payroll.workflow"), eq("payroll.processed"), captor.capture());

        PayrollProcessedEvent event = captor.getValue();
        assertEquals("payroll.processed", event.getEventType());
        assertEquals(10L, event.getPayrollId());
        assertEquals(20L, event.getEmployeeId());
        assertEquals(0, new BigDecimal("10000.00").compareTo(event.getGrossPay()));
        assertEquals(0, new BigDecimal("8500.00").compareTo(event.getNetPay()));
        assertEquals("payroll@example.com", event.getProcessedBy());
        assertEquals(processedAt, event.getProcessedAt());
    }
}
