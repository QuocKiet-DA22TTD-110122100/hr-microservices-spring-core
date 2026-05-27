                                                
# Module M06 - Event-Driven Messaging (RabbitMQ)

## Overview

RabbitMQ-based event-driven architecture implemented for Task and Project microservices to enable asynchronous communication and event publishing.

## Event-Driven Architecture

```
┌─────────────────────────────────────────┐
│ Task Service (8083)                     │
│ ├─ Creates Task                         │
│ ├─ Publishes: task.created event       │
│ └─ Publishes: task.status.* events     │
└─────────────────────────────────────────┘
           ↓ (RabbitMQ)
┌─────────────────────────────────────────┐
│ RabbitMQ Message Broker (5672)          │
│ ├─ task.events exchange                 │
│ ├─ project.events exchange              │
│ ├─ task.created.queue                  │
│ ├─ task.status.queue                   │
│ └─ project.*.queue                     │
└─────────────────────────────────────────┘
           ↓ (Event Consumer)
┌─────────────────────────────────────────┐
│ Other Services / Event Processors        │
│ ├─ Update related data                  │
│ ├─ Send notifications                   │
│ └─ Trigger workflows                    │
└─────────────────────────────────────────┘
```

## Events Implemented

### Task Service Events

#### 1. TaskCreatedEvent
Published when new task is created
- **Exchange**: `task.created` (Direct)
- **Routing Key**: `task.created`
- **Queue**: `task.created.queue`
- **Payload**:
  ```json
  {
    "event_id": "uuid",
    "task_id": 1,
    "project_id": 1,
    "title": "Implementation",
    "description": "Add feature X",
    "assignee_id": 5,
    "timestamp": "2024-05-06T10:30:00",
    "event_type": "TASK_CREATED"
  }
  ```

#### 2. TaskStatusChangedEvent
Published when task status changes (OPEN → IN_PROGRESS → COMPLETED)
- **Exchange**: `task.status` (Topic)
- **Routing Key**: `task.status.{status}` (e.g., `task.status.in_progress`)
- **Queue**: `task.status.queue`
- **Payload**:
  ```json
  {
    "event_id": "uuid",
    "task_id": 1,
    "project_id": 1,
    "old_status": "OPEN",
    "new_status": "IN_PROGRESS",
    "assignee_id": 5,
    "timestamp": "2024-05-06T10:45:00",
    "event_type": "TASK_STATUS_CHANGED"
  }
  ```

### Project Service Events

#### 1. ProjectCreatedEvent
Published when new project is created
- **Exchange**: `project.created` (Direct)
- **Routing Key**: `project.created`
- **Queue**: `project.created.queue`
- **Payload**:
  ```json
  {
    "event_id": "uuid",
    "project_id": 1,
    "name": "Q2 Development",
    "description": "Q2 feature development",
    "lead_id": 3,
    "timestamp": "2024-05-06T10:30:00",
    "event_type": "PROJECT_CREATED"
  }
  ```

#### 2. ProjectStatusChangedEvent
Published when project status changes (ACTIVE → PAUSED → COMPLETED)
- **Exchange**: `project.status` (Topic)
- **Routing Key**: `project.status.{status}` (e.g., `project.status.completed`)
- **Queue**: `project.status.queue`
- **Payload**:
  ```json
  {
    "event_id": "uuid",
    "project_id": 1,
    "old_status": "ACTIVE",
    "new_status": "COMPLETED",
    "lead_id": 3,
    "timestamp": "2024-05-06T11:00:00",
    "event_type": "PROJECT_STATUS_CHANGED"
  }
  ```

## RabbitMQ Configuration

### Connection Settings (All Services)

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    virtual-host: /
    connection-timeout: 10000
```

### Exchanges & Queues

**Task Service:**
- Direct Exchange: `task.created`
- Topic Exchange: `task.status`
- Queues: `task.created.queue`, `task.status.queue`

**Project Service:**
- Direct Exchange: `project.created`
- Topic Exchange: `project.status`
- Queues: `project.created.queue`, `project.status.queue`

### Queue Binding

**Task Created**:
```
Queue: task.created.queue
  → Exchange: task.created (Direct)
    → Routing Key: task.created
```

**Task Status**:
```
Queue: task.status.queue
  → Exchange: task.status (Topic)
    → Routing Key: task.status.* (wildcard)
```

Similar pattern for project events.

### Payroll Service Events

#### PayrollRunRequestedEvent
Published when an operator requests a payroll run.
- **Exchange**: `payroll.run` (Direct)
- **Routing Key**: `payroll.run.requested`
- **Queue**: downstream payroll workers or schedulers
- **Payload**:
  ```json
  {
    "payrollRunId": 123,
    "periodStart": "2026-05-01",
    "periodEnd": "2026-05-31",
    "metadata": {
      "source": "api",
      "requestedBy": "HR_ADMIN"
    }
  }
  ```

#### Triggering a payroll run

Call the payroll API:

```bash
POST /api/payroll/runs
Content-Type: application/json

{
  "yearMonth": "2026-05",
  "requestedBy": "HR_ADMIN",
  "source": "api"
}
```

The service persists the run request, then publishes `payroll.run.requested`.

## Implementation Details

### Event Publisher (TaskEventPublisher)

```java
@Service
public class TaskEventPublisher {
    
    private final RabbitTemplate rabbitTemplate;
    
    public void publishTaskCreatedEvent(Long taskId, Long projectId, ...) {
        TaskCreatedEvent event = new TaskCreatedEvent();
        // ... populate event ...
        rabbitTemplate.convertAndSend(
            "task.created",              // exchange
            "task.created",              // routing key
            event                        // payload
        );
    }
    
    public void publishTaskStatusChangedEvent(...) {
        TaskStatusChangedEvent event = new TaskStatusChangedEvent();
        // ... populate event ...
        rabbitTemplate.convertAndSend(
            "task.status",                          // exchange
            "task.status." + status.name().toLowerCase(),  // dynamic routing key
            event
        );
    }
}
```

### Event Classes

All events are JSON serializable with `@JsonProperty` annotations for RabbitMQ serialization.

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskCreatedEvent extends TaskEvent {
    @JsonProperty("title")
    private String title;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("assignee_id")
    private Long assigneeId;
}
```

### Service Integration

Task/Project services now call event publisher on create/update:

```java
@CacheEvict(value = {...})
public Task createTask(Task task) {
    Task saved = taskRepository.save(task);
    
    // Publish event
    eventPublisher.publishTaskCreatedEvent(
        saved.getId(),
        saved.getProjectId(),
        saved.getTitle(),
        saved.getDescription(),
        saved.getAssigneeId()
    );
    
    return saved;
}
```

## Logging

Events are logged at INFO level with event metadata:

```
[TASK-EVENT] Publishing TaskCreatedEvent: taskId=1, projectId=1
[TASK-EVENT] Publishing TaskStatusChangedEvent: taskId=1, status=OPEN->IN_PROGRESS
[PROJECT-EVENT] Publishing ProjectCreatedEvent: projectId=1, name=Q2 Development
[PROJECT-EVENT] Publishing ProjectStatusChangedEvent: projectId=1, status=ACTIVE->COMPLETED
```

## Testing Event Publishing

### Test 1: Publish Task Created Event

```bash
# Create a task
curl -X POST http://localhost:8083/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature",
    "description": "Add new API endpoint",
    "status": "OPEN",
    "projectId": 1,
    "assigneeId": 5
  }'

# Expected RabbitMQ log:
# [TASK-EVENT] Publishing TaskCreatedEvent: taskId=1, projectId=1
```

### Test 2: Publish Task Status Changed Event

```bash
# Update task status
curl -X PUT http://localhost:8083/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature",
    "status": "IN_PROGRESS",
    "projectId": 1,
    "assigneeId": 5
  }'

# Expected RabbitMQ log:
# [TASK-EVENT] Publishing TaskStatusChangedEvent: taskId=1, status=OPEN->IN_PROGRESS
```

### Test 3: Monitor RabbitMQ Management

Access RabbitMQ Management UI:
```
http://localhost:15672

Credentials: guest / guest

Navigate to:
- Exchanges tab → View task.created, task.status, project.* exchanges
- Queues tab → View task.created.queue, task.status.queue, etc.
- Messages → Count of unprocessed events
```

## RabbitMQ Monitoring

### Docker Commands

```bash
# Connect to RabbitMQ
docker exec -it rabbitmq bash

# List exchanges
rabbitmqctl list_exchanges

# List queues
rabbitmqctl list_queues

# List queue bindings
rabbitmqctl list_bindings

# Check queue message count
rabbitmqctl list_queues name messages consumers

# Purge queue (delete all messages)
rabbitmqctl purge_queue task.created.queue
```

### RabbitMQ CLI

```bash
# Access RabbitMQ CLI from container
docker exec -it rabbitmq rabbitmq-diagnostics status

# Check memory usage
docker exec -it rabbitmq rabbitmq-diagnostics memory_breakdown

# Monitor connections
docker exec -it rabbitmq rabbitmqctl list_connections
```

## Scaling: Multiple Consumers

For high-traffic scenarios, add dedicated event consumer service:

```java
@Component
public class TaskEventListener {
    
    @RabbitListener(queues = "task.created.queue")
    public void handleTaskCreated(TaskCreatedEvent event) {
        log.info("Processing TaskCreatedEvent: {}", event.getTaskId());
        // Update related services, send notifications, etc.
    }
    
    @RabbitListener(queues = "task.status.queue")
    public void handleTaskStatusChanged(TaskStatusChangedEvent event) {
        log.info("Processing TaskStatusChanged: {} -> {}", 
                event.getOldStatus(), event.getNewStatus());
        // Update project metrics, notify assignee, etc.
    }
}
```

## Troubleshooting

### RabbitMQ Connection Issues

**Symptom**: Connection refused to localhost:5672

**Solution**:
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check RabbitMQ logs
docker logs rabbitmq

# Verify port is open
netstat -ano | findstr :5672
```

### Messages Not Publishing

**Symptom**: No events appear in RabbitMQ Management UI

**Solution**:
```bash
# 1. Check service logs for errors
docker logs task-service | grep TASK-EVENT

# 2. Verify RabbitMQ connectivity
docker exec -it task-service ping rabbitmq

# 3. Check exchange/queue configuration
docker exec -it rabbitmq rabbitmqctl list_queues

# 4. Manual test: Publish to queue
docker exec -it rabbitmq rabbitmq-perftest --queue-name task.created.queue
```

### Dead Letter Queue (DLQ)

For production, implement DLQ for failed messages:

```java
@Bean
public DirectExchange deadLetterExchange() {
    return new DirectExchange("task.dlx", true, false);
}

@Bean
public Queue deadLetterQueue() {
    return new Queue("task.dlq", true);
}

@Bean
public Binding deadLetterBinding(Queue deadLetterQueue, DirectExchange deadLetterExchange) {
    return BindingBuilder.bind(deadLetterQueue)
            .to(deadLetterExchange)
            .with("task.dead.letter");
}
```

## Dependencies Added

All services updated with:
- `spring-boot-starter-amqp` - AMQP (RabbitMQ) support
- `spring-rabbit` - Spring RabbitMQ client

## Production Configuration

### Recommended Settings

```yaml
spring:
  rabbitmq:
    host: rabbitmq.production.local
    port: 5672
    username: ${RABBITMQ_USER}
    password: ${RABBITMQ_PASSWORD}
    virtual-host: /production
    connection-timeout: 30000
    requested-heartbeat: 30
    listener:
      simple:
        concurrency: 5
        max-concurrency: 10
        prefetch: 10
        retry:
          enabled: true
          max-attempts: 3
          initial-interval: 1000
```

## Next Steps

1. Implement event listeners in services to handle published events
2. Add Dead Letter Queue (DLQ) for failed messages
3. Implement message persistence for durability
4. Add monitoring and alerting for queue depth
5. Implement event replay for disaster recovery
6. Add correlation IDs for distributed tracing

---

*Module M06: Event-Driven Messaging (RabbitMQ) Complete*
*Event publishing active for Task and Project services*
*RabbitMQ infrastructure integrated into deployment*
