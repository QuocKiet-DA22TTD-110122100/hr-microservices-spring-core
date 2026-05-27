package com.hrservice.hr.service;

import com.hrservice.hr.events.PayrollRunRequestedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class PayrollEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public PayrollEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(PayrollRunRequestedEvent event) {
        // Exchange and routing key chosen to match existing convention
        rabbitTemplate.convertAndSend("payroll.run", "payroll.run.requested", event);
    }
}
