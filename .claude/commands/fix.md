---
description: Fix issues identified in a review or test report
argument-hint: [path to review/error report]
---

# Fix

Fix issues identified in a code review or test report.

## CRITICAL: You MUST Make Fixes

Your job is to IMPLEMENT solutions, not just analyze. If you complete without using Write or Edit tools, **you have failed**.

## Variables

REPORT_PATH: $ARGUMENTS

## Instructions

- If no REPORT_PATH is provided, STOP and ask for the report file path.
- Prioritize fixes: Blockers > High Risk > Medium > Low
- Fix each issue and verify before moving on
- Run validation after all fixes

## Quality Gates (MANDATORY)

Before completing:
1. Run `npm run build` - must pass
2. Run `npm run lint` - must pass
3. Run `git status` - must show changes

## Workflow

1. **Read the Report**
   - Parse issues by severity/priority
   - Note file paths and line numbers
   - Understand recommended solutions

2. **Fix Issues by Priority**
   - Start with Blockers/Critical
   - Then High Risk
   - Then Medium and Low

3. **For Each Issue**
   - Read the affected file
   - Implement the fix
   - Verify it resolves the issue

4. **Validate**
   - Run build commands
   - Run lint commands
   - Run tests if applicable

5. **Report**
   - Document all fixes applied
   - List any skipped issues with reasoning

## Report

```markdown
# Fix Report

**Source**: [REPORT_PATH]
**Status**: ✅ ALL FIXED | ⚠️ PARTIAL | ❌ BLOCKED

---

## Summary

[What was fixed]

---

## Fixes Applied

### [Issue #1]: [Title]

**Problem**: [What was wrong]
**Solution**: [What was changed]
**File**: `[path:line]`

---

## Skipped Issues

| Issue | Reason |
|-------|--------|
| [Description] | [Why skipped] |

---

## Validation

| Command | Result |
|---------|--------|
| `npm run build` | ✅/❌ |
| `npm run lint` | ✅/❌ |

---

## Files Changed

```
[git diff --stat]
```
```
