#!/usr/bin/env node

/**
 * Integration Verification Script
 * Tests that both ECC + CodeGraph are properly configured
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const checks = [];

function check(name, condition, hint) {
  const status = condition ? '✓' : '✗';
  const color = condition ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log(`${color}${status}${reset} ${name}`);
  if (!condition && hint) console.log(`  → ${hint}`);
  
  checks.push({ name, condition, hint });
}

console.log('🔎 Verifying ECC + CodeGraph Integration...\n');

// 1. Check configuration files exist
const mcpConfigExists = fs.existsSync(path.join(projectRoot, '.mcp.json'));
check('MCP Config (.mcp.json)', mcpConfigExists, 'Run: npm run ecc:setup');

const claudeExists = fs.existsSync(path.join(projectRoot, '.claude', 'CLAUDE.md'));
check('Claude Instructions (.claude/CLAUDE.md)', claudeExists, 'Run: npm run ecc:setup');

const agentYamlExists = fs.existsSync(path.join(projectRoot, 'agent.yaml'));
check('Agent Config (agent.yaml)', agentYamlExists, 'Run: npm run ecc:setup');

// 2. Check CodeGraph is initialized on services
console.log('\nCodeGraph Service Indexes:');
const services = [
  'eureka-server',
  'auth-service',
  'hr-service',
  'project-service',
  'task-service',
  'api-gateway'
];

services.forEach(service => {
  const codegraphDir = path.join(projectRoot, service, '.codegraph');
  const indexExists = fs.existsSync(codegraphDir);
  check(`  ${service}`, indexExists, `Run: npm run codegraph:init`);
});

// 3. Check scripts exist
console.log('\nSetup Scripts:');
const scripts = [
  'scripts/ecc-setup.js',
  'scripts/codegraph-init.js',
  'scripts/verify-integration.js'
];

scripts.forEach(script => {
  const exists = fs.existsSync(path.join(projectRoot, script));
  check(`  ${script}`, exists);
});

// 4. Summary
console.log('\n' + '='.repeat(50));
const allPass = checks.every(c => c.condition);
if (allPass) {
  console.log('✅ Integration Verified! Ready to use.\n');
  console.log('Quick test:\n');
  console.log('  1. Open Claude Code / Cursor in this directory');
  console.log('  2. Ask: "What\'s the payroll calculation flow?"');
  console.log('  3. Agent should use codegraph_context + codegraph_explore\n');
} else {
  const failed = checks.filter(c => !c.condition);
  console.log(`❌ ${failed.length} checks failed. Run setup scripts above.\n`);
  process.exit(1);
}
