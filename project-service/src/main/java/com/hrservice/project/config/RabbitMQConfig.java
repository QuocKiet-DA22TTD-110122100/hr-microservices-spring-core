package com.hrservice.project.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
@ConditionalOnProperty(name = "spring.rabbitmq.host")
public class RabbitMQConfig {

    // Project Exchanges
    public static final String PROJECT_CREATED_EXCHANGE = "project.created";
    public static final String PROJECT_STATUS_EXCHANGE = "project.status";

    // Project Queues
    public static final String PROJECT_CREATED_QUEUE = "project.created.queue";
    public static final String PROJECT_STATUS_QUEUE = "project.status.queue";

    // Project Routing Keys
    public static final String PROJECT_CREATED_ROUTING_KEY = "project.created";
    public static final String PROJECT_STATUS_ROUTING_KEY = "project.status.*";

    // Project Exchanges
    @Bean
    public DirectExchange projectCreatedExchange() {
        return new DirectExchange(PROJECT_CREATED_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange projectStatusExchange() {
        return new TopicExchange(PROJECT_STATUS_EXCHANGE, true, false);
    }

    // Project Queues
    @Bean
    public Queue projectCreatedQueue() {
        return new Queue(PROJECT_CREATED_QUEUE, true);
    }

    @Bean
    public Queue projectStatusQueue() {
        return new Queue(PROJECT_STATUS_QUEUE, true);
    }

    // Project Bindings
    @Bean
    public Binding projectCreatedBinding(Queue projectCreatedQueue, DirectExchange projectCreatedExchange) {
        return BindingBuilder.bind(projectCreatedQueue)
                .to(projectCreatedExchange)
                .with(PROJECT_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding projectStatusBinding(Queue projectStatusQueue, TopicExchange projectStatusExchange) {
        return BindingBuilder.bind(projectStatusQueue)
                .to(projectStatusExchange)
                .with(PROJECT_STATUS_ROUTING_KEY);
    }
}
