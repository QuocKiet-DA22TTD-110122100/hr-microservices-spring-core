# PR: task-service project listeners + reconciliation + notifications

## Summary
This PR hardens cross-service event handling between `project-service` and `task-service` by:
- consuming project lifecycle events in `task-service`
- reconciling task status based on project status transitions
- adding audit history for task transitions
- introducing resilient notification adapters (Email/SNS)
- keeping event publishing resilient in `project-service`

## Main changes
### project-service
- `project-service/src/main/java/com/hrservice/project/event/ProjectEventPublisher.java`
  - Wraps `RabbitTemplate.convertAndSend(...)` in `try/catch`
  - Adds structured logging on publish failures
  - Prevents business flow from failing due to broker transient issues

### task-service
- Added project event DTOs:
  - `ProjectCreatedEvent`
  - `ProjectStatusChangedEvent`
- Added listener:
  - `ProjectEventListener`
  - Consumes:
    - `project.created.queue`
    - `project.status.queue`
- Reconciliation rules:
  - `COMPLETED`: open/in-progress tasks -> `COMPLETED`
  - `ARCHIVED`: non-completed tasks -> `CANCELLED`
  - `PAUSED`: open/in-progress tasks reassigned to project lead or default pool assignee
- Added audit:
  - `TaskHistory` entity + `TaskHistoryRepository`
- Event publication extensions:
  - `TaskAssignedEvent`
  - `TaskNotificationEvent`
  - publisher updates in `TaskEventPublisher`
- Notification abstraction:
  - `NotificationService` + `NotificationServiceImpl`
  - adapter-based notifications:
    - `EmailNotificationAdapter`
    - `SnsNotificationAdapter`
- Added assignee email resolution:
  - `AssigneeEmailResolver`
  - `ConfigurableAssigneeEmailResolver`

## Configuration
- Added/used:
  - `task.reassign.defaultPoolAssigneeId`
  - `task.notification.provider` (`log` | `email` | `sns`)
  - `task.notification.emailFrom`
  - `task.notification.assigneeDomain`
  - `task.notification.assigneeEmailMap`
  - `task.notification.snsRegion`
  - `task.notification.snsTopicArn`
- Related env vars are available in compose updates.

## Tests
- Unit tests added/updated for:
  - project listeners & reconciliation
  - task event publishing
  - email/SNS adapters
  - assignee email resolver
- Integration test added:
  - RabbitMQ Testcontainers for listener flow
  - marked `disabledWithoutDocker = true` to avoid local false negatives

## Verification (local)
- `./mvnw.cmd -pl project-service -am test` ✅
- `./mvnw.cmd -pl task-service -am test` ✅
  - Integration test auto-skips when Docker unavailable

## Risk and rollback
- Risk is mainly around asynchronous consistency and notification provider config.
- Rollback options:
  1. revert this PR
  2. set `task.notification.provider=log`
  3. ensure queues/bindings are healthy before re-enabling adapters

## Reviewer checklist
- [ ] Verify queue/exchange bindings in non-local env
- [ ] Validate `PAUSED` reassignment business expectation
- [ ] Validate `COMPLETED/ARCHIVED` reconciliation expectations
- [ ] Confirm email/SNS credentials and topic config
- [ ] Confirm observability/alerts for publish or listener errors
