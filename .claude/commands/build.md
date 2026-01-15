---
description: Build the codebase based on a plan file
argument-hint: [path-to-plan]
---

# Build

Implement the plan into production-quality code.

## CRITICAL: You MUST Make File Changes

**Your primary job is to CREATE and MODIFY files.** This is not a research or analysis task.

If you complete this task without using Write or Edit tools to modify actual project files, **you have failed**.

Before you stop:
1. You MUST have used Write or Edit tools to modify files
2. You MUST run `git status` to confirm your changes appear
3. You MUST run validation commands from the plan

## Variables

PATH_TO_PLAN: $ARGUMENTS

## Instructions

- If no PATH_TO_PLAN is provided, STOP and ask the user for the plan file path.
- Implement the plan top to bottom, in order. Do not skip steps.
- Use existing patterns from the codebase - match code style exactly.
- Run validation commands after each phase.
- Fix any errors before proceeding to the next phase.

## Quality Gates (MANDATORY)

After completing implementation, you MUST pass:

1. **File changes check** - `git status` shows modified files
2. **Build check** - `npm run build` succeeds in affected directories
3. **Lint check** - `npm run lint` succeeds (if available)

## Workflow

1. **Read the Plan**
   - Parse all steps and dependencies
   - Identify files to create/modify
   - Note validation commands

2. **Implement Each Step**
   - Read existing related files for patterns
   - Create/modify files with Write or Edit
   - Match existing code style
   - Include proper types and error handling

3. **Validate Each Phase**
   - Run build commands
   - Run lint commands
   - Fix errors before proceeding

4. **Final Verification**
   - Run `git status` to confirm changes
   - Run full stack validation
   - Document what was built

## Report

```markdown
# Build Report

**Plan**: [PATH_TO_PLAN]
**Status**: ✅ COMPLETE | ⚠️ PARTIAL | ❌ BLOCKED

---

## Summary

[What was built]

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `path` | Created/Modified | [Brief] |

---

## Validation

| Command | Result |
|---------|--------|
| `npm run build` | ✅/❌ |
| `npm run lint` | ✅/❌ |

---

## Git Diff

```
[git diff --stat output]
```
```
