package com.hrservice.hr.service;

import com.hrservice.hr.events.PayrollRunRequestedEvent;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class PayrollEventPublisherTest {

    @Test
    void publish_sendsPayrollRunRequestedEvent() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        PayrollEventPublisher publisher = new PayrollEventPublisher(rabbitTemplate);

        PayrollRunRequestedEvent event = new PayrollRunRequestedEvent(
            123L,
            LocalDate.of(2026, 5, 1),
            LocalDate.of(2026, 5, 31),
                Map.of("source", "unit-test")
        );

        publisher.publish(event);

        ArgumentCaptor<PayrollRunRequestedEvent> captor = ArgumentCaptor.forClass(PayrollRunRequestedEvent.class);
        verify(rabbitTemplate, times(1)).convertAndSend(eq("payroll.run"), eq("payroll.run.requested"), captor.capture());

        PayrollRunRequestedEvent captured = captor.getValue();
        assertNotNull(captured);
        assertEquals(123L, captured.getPayrollRunId());
        assertEquals(LocalDate.of(2026, 5, 1), captured.getPeriodStart());
        assertEquals(LocalDate.of(2026, 5, 31), captured.getPeriodEnd());
        assertEquals("unit-test", captured.getMetadata().get("source"));
    }
}
