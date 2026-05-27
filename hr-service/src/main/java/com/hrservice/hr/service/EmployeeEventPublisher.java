package com.hrservice.hr.service;

import com.hrservice.hr.events.EmployeeHiredEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class EmployeeEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public EmployeeEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(EmployeeHiredEvent event) {
        rabbitTemplate.convertAndSend("hr_service.employee", "hired", event);
    }
}