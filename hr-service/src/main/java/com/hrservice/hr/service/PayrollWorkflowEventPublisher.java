package com.hrservice.hr.service;

import com.hrservice.hr.events.PayrollApprovedEvent;
import com.hrservice.hr.events.PayrollProcessedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class PayrollWorkflowEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public PayrollWorkflowEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishApproved(PayrollApprovedEvent event) {
        rabbitTemplate.convertAndSend("payroll.workflow", "payroll.approved", event);
    }

    public void publishProcessed(PayrollProcessedEvent event) {
        rabbitTemplate.convertAndSend("payroll.workflow", "payroll.processed", event);
    }
}