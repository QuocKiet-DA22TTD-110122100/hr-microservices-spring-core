# show payload for sanity
$payload | Out-File pr_payload.json -Encoding utf8
Write-Host 'Sending request (verbose)...'

try {
  Invoke-RestMethod -Method Post `
    -Uri 'https://api.github.com/repos/QuocKiet-DA22TTD-110122100/hr-microservices-spring-core/pulls' `
    -Headers @{ Authorization = "token $env:GITHUB_TOKEN"; 'User-Agent' = 'VSCode-Agent' } `
    -Body (Get-Content -Raw pr_payload.json) -ContentType 'application/json' -Verbose -ErrorAction Stop
} catch {
  Write-Host 'REQUEST_FAILED'
  if ($_.Exception.Response) {
    Write-Host 'Status:' ([int]$_.Exception.Response.StatusCode)
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host 'Body:'
    Write-Host ($reader.ReadToEnd())
  } else {
    Write-Host $_.Exception.Message
  }
}Title: PAYROLL-001: Add payroll run kickoff API and publish payroll.run.requested event

Body:
Implement the backend endpoint and event to trigger payroll runs.

Summary
-------
This PR adds a new API endpoint to request a payroll run and publishes a `payroll.run.requested` event to RabbitMQ. It depends on DEDUCTION-001 and EMPLOYEE-001 being completed.

What this change includes
------------------------
- Controller: `POST /api/payroll/runs` to create payroll run requests.
- Service: `PayrollRunService` for validation and persistence.
- Event: `PayrollRunRequestedEvent` and publishing via `RabbitTemplate` to exchange `payroll.run` with routing key `payroll.run.requested`.
- Tests: unit tests for controller and service; integration test for event publishing (mock broker).
- Documentation: updates to `RUNBOOK-MODULE-M06-MESSAGING.md` and `issues/PAYROLL-001.md`.

Checklist
---------
- [ ] Link issue `issues/PAYROLL-001.md` in PR description
- [ ] Ensure unit and integration tests pass
- [ ] Add runbook entry and deployment notes

Branch
------
`feature/PAYROLL-001-payroll-run`

Notes
-----
Estimate: 8 hours

----

To open a PR prefilled for this branch, visit:
https://github.com/QuocKiet-DA22TTD-110122100/hr-microservices-spring-core/pull/new/feature/PAYROLL-001-payroll-run
