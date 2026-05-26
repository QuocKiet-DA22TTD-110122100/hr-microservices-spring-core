#!/usr/bin/env node

/**
 * ECC Setup Script (fixed)
 * Use this script instead of ecc-setup.js if template literals cause syntax errors.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const eccDir = path.join(projectRoot, '.claude');

console.log('🚀 Setting up ECC for HR Microservices (fixed)...\n');

if (!fs.existsSync(eccDir)) {
  fs.mkdirSync(eccDir, { recursive: true });
  console.log('✓ Created .claude/ directory');
}

// CLAUDE.md
const claudeLines = [
  '# Claude Code Agent Instructions — HR Microservices',
  '',
  '## Context',
  'This is an HR microservices architecture with Spring Boot backend (Java 21) + Node.js tooling:',
  '- **auth-service**: JWT, OAuth 2.0, RBAC',
  '- **hr-service**: Payroll, employee lifecycle, benefits',
  '- **project-service**: Project allocation, timesheets',
  '- **task-service**: Task tracking, workflow',
  '- **api-gateway**: Request routing, rate limiting',
  '- **eureka-server**: Service discovery',
  '',
  '## Available Tools',
  '- **codegraph_context(symbol)** — Get code structure for any class/function without file reads',
  '- **codegraph_explore(query)** — Full-text search across all services',
  '- **codegraph_impact(symbol)** — Trace callers/dependencies before changes',
  '',
  '## Workflow Rules',
  '1. **Always start with CodeGraph** — Use `codegraph_context` to map architecture',
  '2. **Avoid file scanning** — Don\'t spawn Explore sub-agents; query the graph instead',
  '3. **Trace impact** — Before modifying a service, run `codegraph_impact` to see side-effects',
  '4. **Spring patterns** — Reference `/springboot-patterns` skill for design decisions',
  '5. **Security first** — RBAC validation on all endpoints; check auth-service for token flows',
  '',
  '## Skills Available',
  '- `payroll-patterns` — Salary calculations, tax, deductions',
  '- `employee-lifecycle` — Hire, transfer, offboard flows',
  '- `compliance-audit` — GDPR/CCPA compliance checks',
  '- `springboot-patterns` — Spring best practices',
  '- `continuous-learning` — Auto-extract insights from sessions',
  '',
  '## Performance Targets',
  '- **Tool calls**: <15 per query (vs. 50+ without CodeGraph)',
  '- **Time**: <1m for architecture questions (vs. 2m+ without)',
  '- **Tokens**: <400k per query (vs. 1.4M without)',
  '',
  '## Examples',
  '',
  '### Query: "How does employee promotion flow work?"',
  '1. `codegraph_context("EmployeeService")` → Find main entry point',
  '2. `codegraph_explore("promotion")` → Search all related code',
  '3. Reference `employee-lifecycle` skill → Understand business rules',
  '4. Trace impact → See HR reporting + audit logs affected',
  '',
  '### Query: "What\'s the auth flow for the payroll module?"',
  '1. `codegraph_context("PayrollController")` → Entry point',
  '2. `codegraph_explore("@RequiresPermission")` → Find RBAC annotations',
  '3. Check `codegraph_impact("JwtTokenProvider")` → See auth dependencies',
  '',
  '## No-No\'s',
  '- ❌ Don\'t use Grep/Find for exploration; use CodeGraph instead',
  '- ❌ Don\'t read random files; query the graph first',
  '- ❌ Don\'t assume Spring patterns; check /springboot-patterns skill',
  '- ❌ Don\'t modify auth/payroll without compliance review'
];

fs.writeFileSync(path.join(eccDir, 'CLAUDE.md'), claudeLines.join('\n'));
console.log('✓ Created CLAUDE.md (agent instructions)');

// Hooks directory
const hooksDir = path.join(projectRoot, 'hooks');
if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

const hookLines = [
  '#!/usr/bin/env node',
  '/**',
  ' * Continuous Learning Hook',
  ' * Runs after each session to extract patterns into reusable skills',
  ' */',
  '',
  "const fs = require('fs');",
  "const path = require('path');",
  '',
  'function extractPatterns(sessionLog) {',
  "  // Placeholder: Parse session output and extract recurring patterns",
  "  console.log('📚 Analyzing session for learnable patterns...');",
  '  return [];',
  '}',
  '',
  "async function saveSkill(skillName, pattern) {",
  "  const skillDir = path.join(process.cwd(), 'skills', skillName);",
  "  console.log('\u2713 Saved skill: ' + skillName);",
  '}',
  '',
  "if (require.main === module) {",
  "  const sessionLog = process.env.SESSION_LOG || '';",
  '  const patterns = extractPatterns(sessionLog);',
  '  patterns.forEach(p => saveSkill(p.name, p));',
  '}',
];

fs.writeFileSync(path.join(hooksDir, 'continuous-learning.js'), hookLines.join('\n'), { mode: 0o755 });
console.log('✓ Created hooks/continuous-learning.js');

// Agent YAML
const agentLines = [
  '# Agent Configuration for HR Microservices',
  '',
  'agents:',
  '  - name: hr-domain-expert',
  '    description: Expert on HR business workflows',
  '    language: java',
  '    targets: [hr-service, auth-service]',
  '    skills: [payroll-patterns, employee-lifecycle, compliance-audit]',
  '',
  '  - name: spring-reviewer',
  '    description: Spring Boot code reviewer',
  '    language: java',
  '    targets: [auth-service, hr-service, project-service, task-service, api-gateway]',
  '    skills: [springboot-patterns]',
  '',
  '  - name: database-expert',
  '    description: Database design & query optimization',
  '    language: sql',
  '    targets: [hr-service]',
  '    skills: [query-optimization, schema-design]',
  '',
  'skills:',
  '  - id: payroll-patterns',
  '    name: Payroll Pattern Recognition',
  '    path: skills/payroll-patterns/',
  '',
  '  - id: employee-lifecycle',
  '    name: Employee Lifecycle Management',
  '    path: skills/employee-lifecycle/',
  '',
  '  - id: compliance-audit',
  '    name: Compliance Auditing',
  '    path: skills/compliance-audit/',
  '',
  '  - id: springboot-patterns',
  '    name: Spring Boot Best Practices',
  '    path: skills/springboot-patterns/',
];

fs.writeFileSync(path.join(projectRoot, 'agent.yaml'), agentLines.join('\n'));
console.log('✓ Created agent.yaml');

// Cursor rules
const cursorDir = path.join(projectRoot, '.cursor', 'rules');
if (!fs.existsSync(cursorDir)) fs.mkdirSync(cursorDir, { recursive: true });

const cursorLines = [
  '# Cursor IDE Rules for HR Microservices',
  '',
  '```',
  'Use CodeGraph instead of file scanning.',
  'Apply Spring Boot best practices from /springboot-patterns skill.',
  'Always trace auth flows through auth-service.',
  'Check payroll calculations against /payroll-patterns skill.',
  '```',
];

fs.writeFileSync(path.join(cursorDir, 'ecc.mdc'), cursorLines.join('\n'));
console.log('✓ Created .cursor/rules/ecc.mdc');

console.log('\n✅ ECC Setup Complete!\n');
console.log('Next steps:');
console.log('  1. npm run codegraph:init   — Index all services');
console.log('  2. npm run integration:verify — Test the integration');
console.log('  3. Restart your agent (Claude Code / Cursor)\n');
console.log('Documentation: INTEGRATION-GUIDE.md\n');