# 📌 DEDUCTION-001 — Implement Tax Bracket & Deduction Configuration

**Module** : hr-service  
**Assigned to** : Backend Agent  
**Priority** : 🔴 Critical  
**Status** : [ ] To do  
**Depends on** : (No dependencies, can start in parallel)

---

## Context

Tax brackets + deduction types are **configuration** that payroll calculation depends on (BR-P2, BR-P3, BR-C1). This task implements CRUD for these master data with versioning (different rules per year/country).

---

## Specification

### Endpoint 1 — Create Tax Bracket
```
POST /api/khau-tru/khung-thue

Request:
{
  "year": 2026,
  "country": "VN",
  "brackets": [
    { "minBracket": 0, "maxBracket": 5000000, "taxRate": 10 },
    { "minBracket": 5000000, "maxBracket": 10000000, "taxRate": 15 },
    { "minBracket": 10000000, "maxBracket": null, "taxRate": 20 }
  ]
}

Response 201:
{
  "id": 1,
  "year": 2026,
  "country": "VN",
  "brackets": [...],
  "isActive": true,
  "createdAt": "2026-05-25T10:30:00Z"
}

Errors:
400 — Invalid year/country
409 — Tax bracket already exists for year/country (must deactivate old one first)
403 — Insufficient permission (ADMIN only)
```

### Endpoint 2 — List Deduction Types
```
GET /api/khau-tru/loai-khau-tru

Response 200:
{
  "content": [
    {
      "id": 1,
      "name": "Income Tax",
      "category": "TAX",
      "isPercentage": true,
      "defaultRate": 10.0,
      "isMandatory": true
    },
    {
      "id": 2,
      "name": "Social Insurance",
      "category": "INSURANCE",
      "isPercentage": true,
      "defaultRate": 8.0,
      "isMandatory": true
    }
  ]
}
```

### Endpoint 3 — Create Deduction Type
```
POST /api/khau-tru/loai-khau-tru

Request:
{
  "name": "Retirement 401K",
  "category": "VOLUNTARY",
  "isPercentage": true,
  "defaultRate": 3.0,
  "isMandatory": false
}

Response 201: (deduction type created)
```

---

## Implementation Checklist

### ⚙️ Backend — Models
- [ ] Create `TaxConfig` entity:
  - year (INT), country (VARCHAR), brackets (JSON array or separate table), isActive (BOOLEAN), createdAt
  - Natural key: (year, country) — only one ACTIVE per year/country

- [ ] Create `DeductionType` entity:
  - name, category (TAX, INSURANCE, VOLUNTARY), isPercentage (BOOLEAN), defaultRate, isMandatory, createdAt

### ⚙️ Backend — Services
- [ ] Implement `TaxConfigService.createTaxBracket(year, country, brackets)`:
  - Validate brackets are ordered (minBracket ascending)
  - Deactivate any existing active config for (year, country)
  - Create new TaxConfig (isActive=true)
  - Return created config

- [ ] Implement `DeductionTypeService.createDeductionType(...)`:
  - Validate rate <= 100% (if percentage)
  - Save to DB
  - Return created type

- [ ] Implement `DeductionTypeService.listDeductionTypes()`:
  - Return all active deduction types (paginated)

### 🗄️ Database
- [ ] Verify `tax_configs` table:
  - Columns: id, year, country, brackets (JSON), isActive, createdAt
  - Unique key: (year, country) with isActive=true (one active per year/country)
  - Index: (year, country, isActive)

- [ ] Verify `deduction_types` table:
  - Columns: id, name, category, isPercentage, defaultRate, isMandatory, createdAt

### ⚙️ Backend — Controller
- [ ] Implement `DeductionController.createTaxBracket(request)`:
  - Validate authorization (ADMIN only)
  - Call service
  - Return 201

- [ ] Implement `DeductionController.listDeductionTypes(page, size)`:
  - No special authorization (all users can see deduction types)
  - Return 200 + paginated list

### ❌ Validation
- [ ] Validate year is 4-digit (>= 2000, <= 2100)
- [ ] Validate country code (ISO 2-letter, e.g., VN, TH, SG)
- [ ] Validate brackets ordered (minBracket ascending, no gaps)
- [ ] Validate maxBracket can be null (top bracket, unlimited)
- [ ] Validate taxRate 0-100 (percentage)
- [ ] Validate deduction rate 0-100

### 📨 RabbitMQ Events
- [ ] Publish `tax_bracket.configured` on creation:
  ```json
  {
    "eventId": "uuid",
    "eventType": "tax_bracket.configured",
    "year": 2026,
    "country": "VN",
    "configuredBy": "admin@company.com",
    "configuredAt": "2026-05-25T10:30:00Z"
  }
  ```
  - Downstream: Invalidate tax bracket cache

### 🧪 Tests
- [ ] Create tax bracket → HTTP 201, brackets saved
- [ ] List deductions → HTTP 200, all types returned
- [ ] Verify progressive brackets (min/max validation)
- [ ] Permission check: Non-ADMIN cannot create bracket

### ✅ Acceptance Criteria
- [ ] Tax brackets retrievable by year/country
- [ ] Only one ACTIVE bracket per year/country
- [ ] Deduction types filterable by category (TAX, INSURANCE, VOLUNTARY)
- [ ] Cache invalidation on changes (payroll recalculation uses latest)
- [ ] All tests pass
