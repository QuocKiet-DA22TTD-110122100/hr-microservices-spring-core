package com.hrservice.hr.service;

import com.hrservice.hr.events.PayrollRunRequestedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PayrollEventPublisher {
    private static final Logger logger = LoggerFactory.getLogger(PayrollEventPublisher.class);
    private final RabbitTemplate rabbitTemplate;

    @Autowired
    public PayrollEventPublisher(ObjectProvider<RabbitTemplate> rabbitTemplateProvider) {
        this(rabbitTemplateProvider.getIfAvailable());
    }

    public PayrollEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(PayrollRunRequestedEvent event) {
        // Exchange and routing key chosen to match existing convention
        try {
            if (rabbitTemplate == null) {
                logger.debug("RabbitTemplate is not available; skipping PayrollRunRequestedEvent publish");
                return;
            }

            rabbitTemplate.convertAndSend("payroll.run", "payroll.run.requested", event);
        } catch (Exception ex) {
            logger.warn("Failed to publish PayrollRunRequestedEvent, continuing", ex);
        }
    }
}
// PR: included in feature/PAYROLL-001-payroll-run
