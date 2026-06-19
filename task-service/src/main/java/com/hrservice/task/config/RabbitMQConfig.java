package com.hrservice.task.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Objects;

@Configuration
@EnableRabbit
@ConditionalOnProperty(name = "messaging.enabled", havingValue = "true")
// Đây là lớp cấu hình RabbitMQ cho Task Service, định nghĩa các exchange, queue và binding cần thiết để gửi và nhận các sự kiện liên quan đến Task. Nó sử dụng DirectExchange cho sự kiện tạo Task và TopicExchange cho sự kiện thay đổi trạng thái Task, cho phép linh hoạt trong việc định tuyến các sự kiện dựa trên routing key.
public class RabbitMQConfig {

    // Task Exchanges
    public static final String TASK_EXCHANGE = "task.events";
    public static final String TASK_CREATED_EXCHANGE = "task.created";
    public static final String TASK_STATUS_EXCHANGE = "task.status";

    // Task Queues
    public static final String TASK_CREATED_QUEUE = "task.created.queue";
    public static final String TASK_STATUS_QUEUE = "task.status.queue";

    // Task Routing Keys
    public static final String TASK_CREATED_ROUTING_KEY = "task.created";
    public static final String TASK_STATUS_ROUTING_KEY = "task.status.*";

    // Task Exchange
    @Bean
    public DirectExchange taskCreatedExchange() {
        return new DirectExchange(TASK_CREATED_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange taskStatusExchange() {
        return new TopicExchange(TASK_STATUS_EXCHANGE, true, false);
    }

    // Task Queues
    @Bean
    public Queue taskCreatedQueue() {
        return new Queue(TASK_CREATED_QUEUE, true);
    }

    @Bean
    public Queue taskStatusQueue() {
        return new Queue(TASK_STATUS_QUEUE, true);
    }

    // Task Bindings
    @Bean
    public Binding taskCreatedBinding(Queue taskCreatedQueue, DirectExchange taskCreatedExchange) {
        return BindingBuilder.bind(taskCreatedQueue)
                .to(taskCreatedExchange)
                .with(TASK_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding taskStatusBinding(Queue taskStatusQueue, TopicExchange taskStatusExchange) {
        return BindingBuilder.bind(taskStatusQueue)
                .to(taskStatusExchange)
                .with(TASK_STATUS_ROUTING_KEY);
    }

    // Use Jackson JSON converter for Rabbit messages so payloads are serialized/deserialized as JSON
    @Bean
    public MessageConverter jackson2MessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(Objects.requireNonNull(objectMapper, "objectMapper must not be null"));
    }

    // Ensure RabbitTemplate uses the JSON converter when sending messages
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(Objects.requireNonNull(connectionFactory, "connectionFactory must not be null"));
        template.setMessageConverter(Objects.requireNonNull(converter, "converter must not be null"));
        return template;
    }
}
