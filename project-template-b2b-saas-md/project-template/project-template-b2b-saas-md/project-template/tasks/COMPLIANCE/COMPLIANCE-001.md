# 📌 COMPLIANCE-001 — Implement Tax Reconciliation Report

**Module** : hr-service  
**Assigned to** : Backend Agent  
**Priority** : 🟠 High  
**Status** : [ ] To do  
**Depends on** : PAYROLL-002

---

## Context

Annual tax reconciliation is **mandatory** for compliance (BR-C3, BR-C4). Report must export all processed payroll data with tax accuracy, signed by PAYROLL_OFFICER, ready for tax filing.

---

## Specification

### Endpoint — Generate Tax Reconciliation Report
```
GET /api/chi-tra/bao-cao/hoa-dong-thue?year=2026&format=CSV

Request:
- year: INT (4-digit year)
- format: STRING (CSV or PDF)
- Authorization: Bearer {JWT}
- X-Auth-Role: PAYROLL_OFFICER or ADMIN

Response 200 (CSV):
Header: Employee ID, Name, Tax ID, Gross Salary, Tax Withheld, Social Insurance, Health Insurance, Net Pay
Data rows: (one per employee, yearly totals)
1,Nguyen Van A,0123456789,36000000,3600000,2880000,540000,28980000
2,Tran Thi B,0123456790,24000000,2200000,1920000,360000,19520000

Metadata:
- Generated: 2026-05-25 15:30:00
- Signed by: payroll_officer@company.com
- Digital Signature: (SHA256 hash of report)
- Retention: 7 years
```

---

## Implementation Checklist

### ⚙️ Backend
- [ ] Create `PayrollReportService.generateTaxReconciliation(year, format)`:
  - Query all PROCESSED payroll for year
  - Sum gross, tax, deductions by employee
  - Format as CSV or PDF (use jasper-reports or itext for PDF)
  - Sign with PAYROLL_OFFICER certificate
  - Return file stream

- [ ] Implement `PayrollController.generateTaxReport(year, format)`:
  - Validate authorization (PAYROLL_OFFICER or ADMIN)
  - Call service
  - Return file (CSV/PDF) with appropriate MIME type
  - Log: "Tax report generated for year {year} by {email}"

### 📋 Audit Logging
- [ ] Log report generation: who generated, when, year, format
- [ ] Store in DB: tax_reports table (id, year, generatedBy, generatedAt, fileHash, signatureHash)

### 🧪 Tests
- [ ] Generate report for year with data → HTTP 200, valid CSV
- [ ] Generate report with no payroll data → HTTP 200, empty CSV (headers only)
- [ ] Verify signature (tamper detection)
- [ ] Permission check: HR_MANAGER cannot generate

### ✅ Acceptance Criteria
- [ ] Report includes all required fields (employee, gross, tax, deductions, net)
- [ ] Yearly totals correct (sum all PROCESSED payroll for year)
- [ ] Digitally signed (verifiable signature)
- [ ] Format valid (CSV parseable, PDF readable)
- [ ] Audit logged (generation event immutable)
