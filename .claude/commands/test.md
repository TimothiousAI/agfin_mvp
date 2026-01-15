---
description: Run tests and validation across all AgFin services
argument-hint: [optional: client|server|ai-service|all]
---

# Test

Run tests and validation across AgFin services.

## Variables

TARGET: $ARGUMENTS

## Instructions

- If TARGET is empty, run tests for ALL services
- If TARGET is specified, run tests only for that service
- Always run build checks before tests
- Report all failures with file and line numbers

## Service Commands

### Client (Frontend)
```bash
cd client
npm run build         # TypeScript check
npm run lint          # ESLint
npm test              # Vitest (if configured)
```

### Server (Backend)
```bash
cd server
npm run build         # TypeScript check
npm run lint          # ESLint
npm test              # Jest
```

### AI Service (Python)
```bash
cd ai-service
python -m pytest -v   # pytest
python -m mypy src    # Type checking
```

## Workflow

1. **Determine Target**
   - Parse TARGET to identify which services to test
   - Default to all if not specified

2. **Run Build Checks**
   - TypeScript compilation for Node services
   - Python syntax check for AI service

3. **Run Linting**
   - ESLint for TypeScript
   - Ruff/flake8 for Python (if configured)

4. **Run Tests**
   - Execute test suites
   - Capture pass/fail counts

5. **Report Results**
   - Summary table of all results
   - Details for any failures

## Report

```markdown
# Test Report

**Target**: [TARGET or "all"]
**Generated**: [ISO timestamp]

---

## Summary

| Service | Build | Lint | Tests |
|---------|-------|------|-------|
| client | ✅/❌ | ✅/❌ | ✅/❌ |
| server | ✅/❌ | ✅/❌ | ✅/❌ |
| ai-service | ✅/❌ | ✅/❌ | ✅/❌ |

**Overall**: ✅ ALL PASS | ❌ FAILURES

---

## Failures (if any)

### [Service]: [Test/Check Name]

**Location**: `file:line`
**Error**:
```
[error output]
```
**Suggested Fix**: [recommendation]

---

## Next Steps

- [Action items to resolve failures]
```
