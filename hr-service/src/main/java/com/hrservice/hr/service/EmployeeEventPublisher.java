package com.hrservice.hr.service;

import com.hrservice.hr.events.EmployeeHiredEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class EmployeeEventPublisher {
    private static final Logger logger = LoggerFactory.getLogger(EmployeeEventPublisher.class);
    private final RabbitTemplate rabbitTemplate;

    @Autowired
    public EmployeeEventPublisher(ObjectProvider<RabbitTemplate> rabbitTemplateProvider) {
        this(rabbitTemplateProvider.getIfAvailable());
    }

    public EmployeeEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(EmployeeHiredEvent event) {
        if (rabbitTemplate == null) {
            logger.debug("RabbitTemplate is not available; skipping EmployeeHiredEvent publish");
            return;
        }

        rabbitTemplate.convertAndSend("hr_service.employee", "hired", event);
    }
}
