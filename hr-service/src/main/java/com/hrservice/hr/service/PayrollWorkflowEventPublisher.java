package com.hrservice.hr.service;

import com.hrservice.hr.events.PayrollApprovedEvent;
import com.hrservice.hr.events.PayrollProcessedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PayrollWorkflowEventPublisher {
    private static final Logger logger = LoggerFactory.getLogger(PayrollWorkflowEventPublisher.class);
    private final RabbitTemplate rabbitTemplate;

    public PayrollWorkflowEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishApproved(PayrollApprovedEvent event) {
        try {
            rabbitTemplate.convertAndSend("payroll.workflow", "payroll.approved", event);
        } catch (Exception ex) {
            logger.warn("Failed to publish payroll.approved event", ex);
        }
    }

    public void publishProcessed(PayrollProcessedEvent event) {
        try {
            rabbitTemplate.convertAndSend("payroll.workflow", "payroll.processed", event);
        } catch (Exception ex) {
            logger.warn("Failed to publish payroll.processed event", ex);
        }
    }
}