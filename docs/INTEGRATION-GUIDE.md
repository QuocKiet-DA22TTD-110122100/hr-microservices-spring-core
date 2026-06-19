# HR Microservices - ECC + CodeGraph Integration

**Agent Harness Performance System + Semantic Code Intelligence for HR Microservices**

## Quick Start

```bash
# One-time setup
npm run integration:setup

# Initialize CodeGraph on all services
npm run codegraph:init

# Verify integration
npm run integration:verify

# Sync CodeGraph index (after code changes)
npm run codegraph:sync
```

## Services Indexed

- **auth-service** — Authentication & JWT token management
- **hr-service** — Core HR business logic (employees, payroll, benefits)
- **project-service** — Project management & timesheets
- **task-service** — Task tracking & workflow
- **api-gateway** — API routing, rate limiting, request aggregation
- **eureka-server** — Service discovery & registration

## Tools Available to Agents

### CodeGraph Tools
- `codegraph_context(symbol)` — Get entry points & related code for a symbol (0 file reads)
- `codegraph_explore(query)` — Full-text search across codebase
- `codegraph_impact(symbol)` — Trace callers/callees before making changes

### ECC Tools
- `/ecc` — Agent configuration & diagnostics
- `/harness-audit` — Audit agent compatibility
- `/continuous-learning` — Auto-extract skills from session outputs
- `/security-scan` — AgentShield integration

## Agents & Skills

### Domain Agents
- **hr-domain-expert** — HR workflows, payroll, employee lifecycle
- **spring-reviewer** — Spring Boot patterns, dependency injection, security
- **database-expert** — Query optimization, schema design, transactions

### Skills
- `payroll-patterns` — Salary calculations, tax, deductions
- `employee-lifecycle` — Onboarding, offboarding, promotions
- `compliance-audit` — Labor laws, data protection (GDPR, CCPA)
- `springboot-patterns` — Spring best practices & security

## Configuration Files

- `.mcp.json` — MCP server config (ECC + CodeGraph endpoints)
- `.codegraph/index.db` — SQLite knowledge graph (auto-created)
- `CLAUDE.md` — Claude Code agent instructions
- `.cursor/rules/ecc.mdc` — Cursor IDE integration
- `ECC_PROFILE` env var — Hook profile (minimal/standard/strict)

## Performance Benefits

| Metric | Baseline | With CodeGraph |
|--------|----------|-----------------|
| Tool Calls | ~50 per query | ~15 (70% fewer) |
| Tokens | 1.4M | ~400k (71% fewer) |
| Time | 2m 25s | 1m 0s (59% faster) |
| Cost | $0.62 | $0.41 (35% cheaper) |

*Based on CodeGraph benchmarks across 7 open-source codebases*

## Troubleshooting

**CodeGraph not indexing?**
```bash
rm -rf .codegraph && npm run codegraph:init
```

**ECC commands not available?**
```bash
npm run ecc:install -- --yes
```

**File watcher missing changes?**
```bash
npm run codegraph:sync
```

## Files & Directories

```
.
├── .mcp.json                    # MCP server config
├── .codegraph/                  # CodeGraph index (per-project, auto-created)
├── .claude/                     # Claude Code configs
├── .cursor/                     # Cursor IDE configs
├── agents/                      # HR-specific agents (TBD)
├── skills/                      # HR domain skills (TBD)
├── hooks/                       # Auto-learning hooks (TBD)
├── package.json                 # Node deps & integration scripts
└── scripts/
    ├── ecc-setup.js            # Install & configure ECC
    ├── codegraph-init.js       # Initialize CodeGraph on all services
    └── verify-integration.js   # Test both systems
```

## References

- [ECC Documentation](https://github.com/affaan-m/ECC)
- [CodeGraph GitHub](https://github.com/colbymchenry/codegraph)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Spring Boot Integration Guide](#) (TBD)

## Next Steps

1. ✓ Create `.mcp.json` + `package.json`
2. ⏳ Add ECC setup script
3. ⏳ Add CodeGraph initialization
4. ⏳ Create HR domain agents
5. ⏳ Add HR-specific skills
6. ⏳ Test with agents (Claude Code, Cursor)
7. ⏳ Document best practices

---

**Goal**: Enable agents to answer HR architecture questions in **<1 min with 70% fewer tool calls**
