# Branch skeleton: feature/PAYROLL-001-payroll-run

Commands to create and push the branch:

```powershell
git checkout -b feature/PAYROLL-001-payroll-run
git push -u origin feature/PAYROLL-001-payroll-run
```

Suggested initial files to add on the branch:
- `hr-service/src/main/java/.../controller/PayrollRunController.java`
- `hr-service/src/main/java/.../service/PayrollRunService.java`
- `hr-service/src/main/java/.../events/PayrollRunRequestedEvent.java`
- `hr-service/src/test/java/.../PayrollRunServiceTest.java`
- `hr-service/src/test/java/.../PayrollRunControllerTest.java`

PR checklist reminder:
- Link this issue `issues/PAYROLL-001.md` in PR description.
- Include migration / configuration changes for RabbitMQ if needed.
- Add run instructions to `RUNBOOK-MODULE-M06-MESSAGING.md`.
