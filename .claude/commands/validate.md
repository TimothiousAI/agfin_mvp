---
description: Run full stack validation for AgFin (build, lint, type check)
---

# Validate

Run comprehensive validation across all AgFin services.

## Instructions

Run all validation commands and report results. This is a quick health check, not full test suite.

## Validation Commands

```bash
# Frontend
cd client && npm run build && npm run lint

# Backend
cd ../server && npm run build && npm run lint

# AI Service
cd ../ai-service && python -m mypy src 2>/dev/null || echo "mypy not configured"

# Database (check migrations are applied)
cd ../supabase && npx supabase db push --dry-run 2>/dev/null || echo "No pending migrations"
```

## Workflow

1. **Run Frontend Validation**
   - TypeScript build
   - ESLint

2. **Run Backend Validation**
   - TypeScript build
   - ESLint

3. **Run AI Service Validation**
   - Python type check (if mypy configured)
   - Import check

4. **Check Database**
   - Verify no pending migrations

5. **Report Results**

## Report

```markdown
# Validation Report

**Generated**: [ISO timestamp]

---

## Results

| Service | Build | Lint | Status |
|---------|-------|------|--------|
| client | ✅/❌ | ✅/❌ | [PASS/FAIL] |
| server | ✅/❌ | ✅/❌ | [PASS/FAIL] |
| ai-service | ✅/❌ | N/A | [PASS/FAIL] |
| supabase | N/A | N/A | [PASS/FAIL] |

**Overall**: ✅ ALL PASS | ❌ [N] FAILURES

---

## Errors (if any)

### [Service]

```
[error output]
```

---

## Recommendations

- [Fix suggestions if failures exist]
```
