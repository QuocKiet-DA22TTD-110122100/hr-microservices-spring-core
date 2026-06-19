# HR Domain Skills

## Skill Structure

Each skill in this directory follows the ECC pattern:

```
skills/<skill-id>/
  ├── README.md         # Skill description & usage
  ├── skill.yaml        # Metadata (categories, languages, versions)
  └── examples/         # Test cases & examples
```

## Available Skills

### 1. payroll-patterns
**File**: `payroll-patterns/README.md`

Patterns for salary calculations, tax withholding, deductions:
- Gross-to-net calculation (taxes, insurance, retirement)
- Overtime & bonus handling
- Tax bracket logic
- Deduction validation
- Payroll cycle management

Usage: When implementing payroll APIs or salary updates, reference this skill for correct business logic.

### 2. employee-lifecycle
**File**: `employee-lifecycle/README.md`

Employee workflows from hire to separation:
- Onboarding (setup access, benefits eligibility)
- Role transfers & promotions
- Leave management (PTO, sick, unpaid)
- Offboarding (exit interview, access revocation)
- Compliance checkpoints (I-9, tax forms)

### 3. compliance-audit
**File**: `compliance-audit/README.md`

Regulatory compliance for HR data:
- GDPR: Right to be forgotten, data portability
- CCPA: Consumer privacy rights
- HIPAA: Health information protection
- Labor laws: Minimum wage, overtime, discrimination
- Audit trails for HR changes

### 4. springboot-patterns
**File**: `springboot-patterns/README.md`

Spring Boot best practices used across all services:
- Dependency injection & component scanning
- Security: @EnableWebSecurity, RBAC, JWT
- Transaction management (@Transactional)
- Exception handling & global error handlers
- API versioning & backward compatibility

## Creating New Skills

1. Create directory: `skills/<skill-id>/`
2. Write `README.md` with:
   - **What** this skill teaches
   - **When** to use it
   - **Examples** (code snippets)
   - **Anti-patterns** (what NOT to do)
3. Create `skill.yaml`:
   ```yaml
   id: <skill-id>
   name: <Skill Display Name>
   description: <One-line description>
   categories: [category1, category2]
   languages: [java, typescript]
   versions:
     - version: 1.0.0
       date: 2026-05-23
       changes: Initial release
   ```
4. Add examples in `examples/` (code files + expected output)

## Auto-Learning from Sessions

The `hooks/continuous-learning.js` hook automatically extracts recurring patterns from session outputs and suggests new skills to be formalized into this directory.

To invoke:
```bash
ECC_PROFILE=standard npm run ecc:setup
```

This enables the hook to run after each session and capture learnable moments.
