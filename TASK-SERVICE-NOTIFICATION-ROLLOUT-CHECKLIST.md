# Task-Service Notification Rollout Checklist

## 1) Environment variables
Set these values in the target environment:

- `TASK_REASSIGN_DEFAULT_POOL_ASSIGNEE_ID`
- `TASK_NOTIFICATION_PROVIDER` (`log` / `email` / `sns`)
- `TASK_NOTIFICATION_EMAIL_FROM`
- `TASK_NOTIFICATION_SNS_REGION`
- `TASK_NOTIFICATION_SNS_TOPIC_ARN`

Optional (if needed):
- `TASK_NOTIFICATION_ASSIGNEE_DOMAIN`
- `TASK_NOTIFICATION_ASSIGNEE_EMAIL_MAP` (or equivalent config server mapping)

## 2) Provider-specific requirements
### Email provider
- SMTP host/port configured in Spring Mail settings
- SMTP credentials available via secret store
- `TASK_NOTIFICATION_EMAIL_FROM` is a valid sender

### SNS provider
- AWS credentials/role attached to runtime
- IAM permissions include `sns:Publish` to target topic
- Topic ARN exists and is reachable in `TASK_NOTIFICATION_SNS_REGION`

## 3) Messaging readiness
- RabbitMQ reachable from `task-service`
- `project.created.queue` exists and is bound correctly
- `project.status.queue` exists and is bound correctly
- Dead-letter strategy configured (recommended)

## 4) Functional validation
- Publish `project.status.COMPLETED` and verify tasks move to `COMPLETED`
- Publish `project.status.ARCHIVED` and verify tasks move to `CANCELLED`
- Publish `project.status.PAUSED` and verify assignee reassignment fallback works
- Confirm `TaskHistory` rows are created
- Confirm notification adapter emits message (Email/SNS or logs)

## 5) Observability
- Track listener error logs and publish error logs
- Add alerting for sustained listener failures
- Add dashboard counters for reconciliation outcomes (completed/cancelled/reassigned)

## 6) Safe rollback switches
- Set `TASK_NOTIFICATION_PROVIDER=log` to disable external adapter dependencies quickly
- Revert deployment to previous image if reconciliation behavior is not desired
