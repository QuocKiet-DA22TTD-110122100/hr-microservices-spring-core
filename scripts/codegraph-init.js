#!/usr/bin/env node

/**
 * CodeGraph Initialization Script
 * Initializes CodeGraph indexing on all HR microservices
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const services = [
  'eureka-server',
  'auth-service',
  'hr-service',
  'project-service',
  'task-service',
  'api-gateway'
];

console.log('🔍 Initializing CodeGraph for HR Microservices...\n');

services.forEach(service => {
  const servicePath = path.join(projectRoot, service);
  
  if (!fs.existsSync(servicePath)) {
    console.log(`⚠️  Skipped ${service} (not found)`);
    return;
  }

  console.log(`📦 Indexing ${service}...`);
  
  // Create .codegraph directory
  const codegraphDir = path.join(servicePath, '.codegraph');
  if (!fs.existsSync(codegraphDir)) {
    fs.mkdirSync(codegraphDir, { recursive: true });
  }

  // Run codegraph init using npx (more reliable)
  try {
    execSync('npx @colbymchenry/codegraph init --yes', {
      cwd: servicePath,
      stdio: 'pipe',
      shell: '/bin/bash'
    });
    console.log(`✓ Indexed ${service}\n`);
  } catch (e) {
    console.log(`⚠️  Failed to index ${service}\n`);
  }
});

// Create project-level .codegraph/config.json
const projectCodegraphDir = path.join(projectRoot, '.codegraph');
if (!fs.existsSync(projectCodegraphDir)) {
  fs.mkdirSync(projectCodegraphDir, { recursive: true });
}

const config = {
  version: '0.9.4',
  indexPath: '.codegraph/index.db',
  projectRoot: projectRoot,
  services: services,
  autoSync: {
    enabled: true,
    debounceMs: 2000,
    watchPaths: [
      'auth-service/src/**/*.java',
      'hr-service/src/**/*.java',
      'project-service/src/**/*.java',
      'task-service/src/**/*.java',
      'api-gateway/src/**/*.java'
    ]
  },
  languages: ['java', 'typescript', 'javascript'],
  frameworks: ['spring-boot', 'express', 'nestjs']
};

fs.writeFileSync(
  path.join(projectCodegraphDir, 'config.json'),
  JSON.stringify(config, null, 2)
);

console.log('✅ CodeGraph Initialization Complete!\n');
console.log('Created:');
console.log('  .codegraph/config.json — Project-level CodeGraph config');
console.log('  <service>/.codegraph/   — Per-service indexes\n');
console.log('To rebuild index: npm run codegraph:sync\n');
