Module M01 — Orchestration (Full-stack compose + runbook)

Overview
Provide a single-command way to start the full stack for local dev/test by composing the existing layered compose files: compose.infra.yml, compose.iam.yml, compose.hr.yml, compose.edge.yml.

What I added
`run-full-stack.ps1`: PowerShell helper to start/stop the full stack and optionally rebuild images.

Quick Start (PowerShell)
Start (no rebuild):

```powershell
.\run-full-stack.ps1
```

Start with rebuild:

```powershell
.\run-full-stack.ps1 -Build
```

The helper now starts the layers in order and waits for health before moving on:
`infra -> messaging -> iam -> hr -> business -> edge`.

Stop and remove containers:

```powershell
.\run-full-stack.ps1 -Down
```

Diagnostics & health checks
Follow logs:

```powershell
docker compose -f compose.infra.yml -f compose.iam.yml -f compose.hr.yml -f compose.edge.yml logs -f --tail=200
```

Useful endpoints to check (adjust ports if compose maps differently):
Eureka: http://localhost:8761/
API Gateway: http://localhost:8080/
Auth service health: http://localhost:8081/actuator/health
KMS JWKS: http://localhost:9000/.well-known/jwks.json
HR service health: http://localhost:8082/actuator/health

Run order tips
If DB-backed services fail on boot, start infra first:

```powershell
docker compose -f compose.infra.yml up -d
docker compose -f compose.iam.yml -f compose.hr.yml -f compose.edge.yml up -d
```

Troubleshooting
If KMS or Auth are slow on first run, increase `start_period` in the corresponding `healthcheck` entries.
Check database migrations and credentials in environment variables in module `application-*.yml` files.

Next tasks
Add a healthcheck-wait helper that polls HTTP health endpoints and returns non-zero when services remain unhealthy (Module M01.1).
After orchestration is verified, proceed to Module M02 (gateway hardening) and Module M03 (E2E smoke tests).
