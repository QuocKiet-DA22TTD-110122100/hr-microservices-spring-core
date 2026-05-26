# PAYROLL-001 — Implement payroll run kickoff

Summary
-------
Implement the backend work to start a payroll run once employee and deduction data are ready. This task depends on `DEDUCTION-001` and `EMPLOYEE-001` completing.

Dependencies
------------
- DEDUCTION-001: deduction calculation and events — must be `completed`
- EMPLOYEE-001: employee data provisioning — must be `completed`

Acceptance criteria
-------------------
- An API endpoint exists to create a payroll run request (POST `/api/payroll/runs`).
- The endpoint validates required data and publishes a `payroll.run.requested` event to RabbitMQ.
- Event contains payroll_run_id, period_start, period_end, and source metadata.
- Unit tests cover controller, service, and event publishing logic.
- Integration test (mock broker) verifies event is published.
- Documentation (README) explains the flow and how to trigger runs.

Checklist
---------
- [ ] Add controller endpoint `POST /api/payroll/runs`
- [ ] Implement `PayrollRunService` with validation and persistence
- [ ] Publish `payroll.run.requested` event via RabbitTemplate
- [ ] Add unit tests (service + controller)
- [ ] Add integration test (mock RabbitMQ)
- [ ] Update `RUNBOOK-MODULE-M06-MESSAGING.md` with event details
- [ ] Create PR with description and deployment notes

Estimate: 8 hours

Branch name
-----------
Use: `feature/PAYROLL-001-payroll-run` as the working branch.

Suggested PR title
------------------
`PAYROLL-001: Add payroll run kickoff API and publish payroll.run.requested event`

Notes
-----
Keep the RabbitMQ exchange as `payroll.run` (direct) and routing key `payroll.run.requested`.
