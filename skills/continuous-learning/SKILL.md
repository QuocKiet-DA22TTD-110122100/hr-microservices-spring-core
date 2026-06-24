# Continuous Learning Skill

## Overview

Auto-extracts and persists insights from coding sessions: patterns discovered, bugs fixed, architectural decisions, and lessons learned — so future sessions start smarter.

## When to Use This Skill

- After resolving a non-obvious bug
- After a design decision is made and validated
- When a recurring pattern is noticed across multiple services
- After a compliance or security finding is resolved

---

## How It Works

At the end of each significant session, the agent extracts:

1. **What changed** — files, methods, configuration
2. **Why it changed** — root cause, business requirement, compliance driver
3. **The lesson** — generalizable rule or pattern for future sessions
4. **Impact scope** — which services are affected

These are stored as memory entries, not in code, so they don't pollute the codebase.

---

## Extraction Template

When wrapping up a session that produced a non-obvious insight, use this structure:

```
INSIGHT:     <one sentence summary>
CONTEXT:     <what problem was being solved>
ROOT CAUSE:  <why the problem existed>
FIX:         <what was changed and where>
LESSON:      <generalizable rule for future sessions>
SERVICES:    <which services are affected>
DATE:        <YYYY-MM-DD>
```

### Example — Eureka Registration Bug (2026-06-22)

```
INSIGHT:     project-service defaulted Eureka registration to false, hiding it from Gateway.
CONTEXT:     Gateway returned 503 on all /api/projects/** calls despite container being healthy.
ROOT CAUSE:  application.yaml has EUREKA_CLIENT_ENABLED default: false. compose.business.yml
             set the URL but forgot the 3 enable flags (unlike task-service which had them).
FIX:         Added EUREKA_CLIENT_ENABLED/REGISTER_WITH_EUREKA/FETCH_REGISTRY: "true" to
             project-service env in compose.business.yml.
LESSON:      When a service is healthy in Docker but missing from Eureka, check the 3 enable
             flags in compose. Always diff against a working service (task-service) in the
             same compose file.
SERVICES:    project-service, api-gateway
DATE:        2026-06-22
```

---

## Pattern Categories

### Infrastructure Patterns

Recurring Docker/compose/startup issues:

```
- Services with EUREKA_CLIENT_ENABLED default false need 3 explicit env vars
- Redis health check timeout during startup is transient — not a config bug
- project-service starts slow (>600s) first run due to JPA schema creation;
  subsequent starts are ~100s once schema exists
```

### Code Patterns

Spring Boot / Java patterns validated in this codebase:

```
- @Transactional(propagation = REQUIRES_NEW) on AuditService prevents audit loss
  when the calling transaction rolls back
- @EntityGraph is preferred over JOIN FETCH for reusable repository methods
- BigDecimal for all monetary values — validated in payroll calculations
- Constructor injection enforced; Lombok @RequiredArgsConstructor is the standard
```

### Security Patterns

Auth and RBAC findings:

```
- JWT validation happens in api-gateway filter, not in each service
- @PreAuthorize must be on each method, not only at class level
- KMS JWKS URI is the single source of truth for public key rotation
- Health endpoints (/actuator/health) are public — do not add internal data there
```

### Business Rule Patterns

Domain logic validated with HR team:

```
- Overtime = 1.5x hourly rate beyond 40h/week (FLSA mandatory)
- Salary changes trigger payroll tax recalculation next pay run
- GDPR deletion allowed only 2+ years post-termination
- Promotion requires manager + HR approval before salary change takes effect
```

---

## Storage Convention

Insights are stored in Claude's memory system under `project` type memories with:
- `name`: kebab-case slug (e.g. `eureka-registration-default-false`)
- `description`: one-line summary for MEMORY.md index
- `body`: full INSIGHT template above

This way, future sessions load relevant lessons without re-reading all source files.

---

## Anti-Patterns to Remember

| Anti-Pattern | Detected | Resolution |
|---|---|---|
| Hard-coded tax rates | payroll-patterns | Load from `taxConfigRepository` |
| Docker container healthy ≠ Eureka registered | 2026-06-22 | Check 3 Eureka env flags |
| `@Transactional` on private method | springboot-patterns | Spring AOP skips private |
| N+1 in employee list API | query-optimization | `@EntityGraph` on repository |
| Monetary values as `double` | payroll-patterns | Always `BigDecimal` |
| Long TX + SMTP call | transaction-tuning | Commit TX first, notify after |

---

## Session End Checklist

After completing any non-trivial coding session:

- [ ] Did I find a root cause that wasn't obvious? → Save as memory
- [ ] Did I make a design decision that could recur? → Save as feedback memory
- [ ] Did I confirm a pattern from a skill file? → Update skill if needed
- [ ] Did a compose/infra config cause a bug? → Note in project memory

## References

- Memory system: `C:\Users\quock\.claude\projects\...\memory\`
- CLAUDE.md: `continuous-learning` skill listed under Available Skills
