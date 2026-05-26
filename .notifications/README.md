Drop JSON notification files here to have the auto-monitor script pick them up.

Expected format (JSON):
{
  "taskId": "DEDUCTION-001",
  "status": "completed",
  "agentId": "agent-xyz",
  "timestamp": "2026-05-25T12:34:56Z",
  "details": "Optional human-readable details"
}

The watcher `scripts/auto_monitor_agents.ps1` will process new `*.json` files, update
`.todo_state.json`, append a line to `TODO_LOG.md`, and (if status is `completed`) append a
note into `RUNBOOK-MODULE-M06-MESSAGING.md`.
