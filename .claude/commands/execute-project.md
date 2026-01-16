---
description: Execute a folder of plans following an execution strategy (build, validate, fix, test per wave)
argument-hint: [path-to-plans-folder]
---

# Execute Project

Execute all plans in a project folder following the execution strategy, with build → validate → fix → test cycle per wave.

## CRITICAL: This is an Orchestration Command

**Your job is to COORDINATE subagents to build each plan.** You orchestrate the waves and handle failures.

Key responsibilities:
1. Parse the EXECUTION_STRATEGY.md to understand wave order and parallelism
2. Launch subagents to build plans (in parallel where allowed)
3. Run validation after each wave
4. Fix any issues before proceeding
5. Generate comprehensive project report

## Variables

PROJECT_FOLDER: $ARGUMENTS

## Instructions

- If no PROJECT_FOLDER is provided, STOP and ask for the folder path
- The folder MUST contain an `EXECUTION_STRATEGY.md` file
- Plans should be numbered (e.g., `01_feature.md`, `02_feature.md`)
- Reports are saved to `PROJECT_FOLDER/reports/`

## Folder Structure Expected

```
plans/project_name/
├── EXECUTION_STRATEGY.md    # Required - defines waves and parallelism
├── 01_first_feature.md
├── 02_second_feature.md
├── ...
└── reports/                 # Created by this command
    ├── wave_1_build.md
    ├── wave_1_validation.md
    ├── wave_2_build.md
    └── PROJECT_EXECUTION_REPORT.md
```

## Workflow

### Phase 1: Parse Execution Strategy

1. Read `PROJECT_FOLDER/EXECUTION_STRATEGY.md`
2. Extract wave definitions (which plans in each wave)
3. Identify parallelism opportunities
4. Create reports folder if not exists

### Phase 2: Execute Waves

For each wave in order:

#### Step 2.1: Build Plans in Wave

Launch subagents to build each plan in the wave. Use the Task tool with `subagent_type: "agfin-builder"`.

**CRITICAL SUBAGENT INSTRUCTIONS:**

For EACH plan in the wave, spawn a builder agent with this EXACT prompt format:

```
BUILD PLAN: [full path to plan file]

INSTRUCTIONS:
1. Read the plan file completely
2. Implement ALL steps in order - do not skip any
3. Use Write and Edit tools to modify files
4. Run validation commands after each phase
5. Fix any errors before proceeding to next phase

QUALITY GATES (MANDATORY):
- You MUST use Write or Edit tools to create/modify files
- You MUST run `npm run build` in affected directories
- You MUST run `npm run lint` if available
- You MUST run `git status` to confirm changes

OUTPUT: When complete, provide a summary of:
- Files created/modified
- Build status (pass/fail)
- Lint status (pass/fail)
- Any errors encountered

If you encounter errors you cannot fix, STOP and report them clearly.
```

**Parallelism Rules:**
- If wave allows parallel execution, launch ALL plan builders simultaneously using multiple Task tool calls in a SINGLE message
- If wave is sequential, wait for each builder to complete before starting next
- Maximum 4 parallel builders to avoid resource contention

#### Step 2.2: Collect Build Results

After all builders in the wave complete:
- Aggregate results from each builder
- Identify any failures or blocked plans
- Save wave build report to `PROJECT_FOLDER/reports/wave_N_build.md`

#### Step 2.3: Run Wave Validation

Run validation across all affected services:

```bash
# Frontend
cd client && npm run build && npm run lint

# Backend
cd server && npm run build && npm run lint

# AI Service (if modified)
cd ai-service && python -m pytest 2>/dev/null || echo "No tests"
```

Save validation report to `PROJECT_FOLDER/reports/wave_N_validation.md`

#### Step 2.4: Fix Any Issues

If validation fails:
1. Analyze error output
2. Spawn fix agent with `subagent_type: "agfin-builder"`:

```
FIX VALIDATION ERRORS

ERRORS:
[paste error output here]

INSTRUCTIONS:
1. Analyze each error
2. Locate the source file and line
3. Implement the fix using Edit tool
4. Re-run validation to confirm fix
5. Report what was fixed

QUALITY GATES:
- You MUST use Edit tool to fix files
- You MUST re-run the failing command to verify fix
- Do not proceed if errors remain
```

3. Re-run validation after fixes
4. If still failing after 3 fix attempts, mark wave as BLOCKED and stop

#### Step 2.5: Run Wave Tests (if applicable)

```bash
# Run tests for affected services
cd client && npm test 2>/dev/null || echo "No tests configured"
cd server && npm test 2>/dev/null || echo "No tests configured"
```

#### Step 2.6: Commit Wave (Optional)

If all validations pass:
```bash
git add -A
git commit -m "feat: [Project Name] Wave N complete - [features]"
```

### Phase 3: Generate Final Report

After all waves complete, generate comprehensive project report.

## Subagent Prompt Templates

### Builder Agent Prompt
```
BUILD PLAN: {plan_path}

You are building plan {plan_number} of {total_plans} in Wave {wave_number}.

CONTEXT:
- Project: {project_name}
- Wave: {wave_number} of {total_waves}
- Parallel with: {parallel_plans or "None - sequential"}

INSTRUCTIONS:
1. Read the plan file at {plan_path}
2. Implement ALL steps in the plan, in order
3. For each step:
   - Read any existing files mentioned
   - Create or modify files using Write/Edit tools
   - Run validation commands specified in the plan
   - Fix errors before proceeding

MANDATORY QUALITY GATES:
- Use Write or Edit tools (you MUST modify files)
- Run `npm run build` in affected directories
- Run `npm run lint` if available
- Run `git status` to confirm your changes

OUTPUT FORMAT:
Provide a structured report:
- Status: COMPLETE | PARTIAL | BLOCKED
- Files Changed: [list with action]
- Build Result: PASS | FAIL
- Lint Result: PASS | FAIL
- Errors: [any errors encountered]
- Notes: [additional context]

IMPORTANT: If blocked, explain WHY and WHAT would unblock it.
```

### Fix Agent Prompt
```
FIX ERRORS FROM WAVE {wave_number}

VALIDATION OUTPUT:
```
{error_output}
```

YOUR TASK:
1. Parse each error for file path and line number
2. Read the affected files
3. Implement fixes using Edit tool
4. Re-run the failing command to verify

PRIORITY:
1. Build errors (compilation failures)
2. Type errors (TypeScript issues)
3. Lint errors (code style)

DO NOT:
- Skip errors
- Mark as complete if errors remain
- Proceed without verification

OUTPUT:
- Fixes Applied: [list each fix]
- Verification: [command run and result]
- Remaining Issues: [any unfixed items]
```

### Validator Agent Prompt
```
VALIDATE WAVE {wave_number} CHANGES

COMMANDS TO RUN:
```bash
cd client && npm run build && npm run lint
cd server && npm run build && npm run lint
```

EXPECTED:
- All commands should exit with code 0
- No TypeScript errors
- No ESLint errors (warnings acceptable)

OUTPUT:
| Service | Build | Lint | Status |
|---------|-------|------|--------|
| client  | ✅/❌ | ✅/❌ | PASS/FAIL |
| server  | ✅/❌ | ✅/❌ | PASS/FAIL |

If any FAIL, include full error output.
```

## Reports Structure

### Wave Build Report (`wave_N_build.md`)
```markdown
# Wave N Build Report

**Project**: [project_name]
**Wave**: N of [total]
**Plans**: [list of plans in wave]
**Executed**: [timestamp]

---

## Plan Results

| Plan | Status | Files Changed | Duration |
|------|--------|---------------|----------|
| 01_xxx | ✅ COMPLETE | 5 | ~10min |
| 02_xxx | ✅ COMPLETE | 3 | ~8min |

---

## Details

### Plan: 01_xxx.md
[Builder output summary]

### Plan: 02_xxx.md
[Builder output summary]
```

### Wave Validation Report (`wave_N_validation.md`)
```markdown
# Wave N Validation Report

**Wave**: N
**Validated**: [timestamp]

---

## Results

| Service | Build | Lint | Tests |
|---------|-------|------|-------|
| client  | ✅    | ✅   | ⏭ N/A |
| server  | ✅    | ✅   | ⏭ N/A |

**Overall**: ✅ PASS

---

## Command Output

### Client Build
```
[output]
```

### Client Lint
```
[output]
```
```

### Project Execution Report (`PROJECT_EXECUTION_REPORT.md`)
```markdown
# Project Execution Report

**Project**: [project_name]
**Folder**: [PROJECT_FOLDER]
**Started**: [timestamp]
**Completed**: [timestamp]
**Duration**: [total time]

---

## Summary

| Wave | Plans | Status | Duration |
|------|-------|--------|----------|
| 1    | 01,02,03,04 | ✅ COMPLETE | 2h 15m |
| 2    | 05,06 | ✅ COMPLETE | 1h 45m |
| 3    | 07,08 | ⚠️ PARTIAL | 3h 00m |

**Overall Status**: ✅ COMPLETE | ⚠️ PARTIAL | ❌ BLOCKED

---

## Plans Executed

| # | Plan | Wave | Status | Notes |
|---|------|------|--------|-------|
| 01 | stop_regenerate_buttons | 1 | ✅ | |
| 02 | keyboard_shortcuts | 1 | ✅ | |
| 03 | wheat_gold_badges | 1 | ✅ | |
| ... | ... | ... | ... | ... |

---

## Files Changed (Total)

```
[aggregated git diff --stat]
```

---

## Validation Summary

| Wave | Build | Lint | Tests | Fixes |
|------|-------|------|-------|-------|
| 1 | ✅ | ✅ | ⏭ | 0 |
| 2 | ✅ | ⚠️ 2 warnings | ⏭ | 1 |
| 3 | ✅ | ✅ | ✅ | 0 |

---

## Issues Encountered

### Wave 2: Lint Warning
**File**: `client/src/xxx.tsx:45`
**Issue**: Unused variable
**Resolution**: Removed unused import

---

## Git History

```
[git log --oneline for project commits]
```

---

## Next Steps

- [ ] Run full E2E test suite: `npx playwright test`
- [ ] Manual QA review
- [ ] Deploy to staging
```

## Error Handling

### Build Failure
If a plan build fails:
1. Log the failure in wave report
2. Continue with other plans in wave (if parallel)
3. After wave, attempt to fix with Fix Agent
4. If unfixable, mark plan as BLOCKED
5. Continue to next wave (blocked plans noted)

### Validation Failure
If wave validation fails:
1. Spawn Fix Agent with error output
2. Allow up to 3 fix attempts
3. Re-run validation after each fix
4. If still failing, mark wave as BLOCKED
5. Ask user whether to continue or abort

### Circular Dependencies
If wave depends on blocked prior wave:
1. Skip the wave
2. Note in report why skipped
3. Continue with independent waves

## Execution Example

For a project with 10 plans in 5 waves:

```
[Reading EXECUTION_STRATEGY.md]
Found 5 waves with 10 total plans

=== WAVE 1 (Plans: 01, 02, 03, 04) ===
[Launching 4 builders in parallel...]
[Builder 01 complete: ✅]
[Builder 02 complete: ✅]
[Builder 03 complete: ✅]
[Builder 04 complete: ✅]
[Running validation...]
[Validation: ✅ PASS]
[Saving reports...]
[Committing wave 1...]

=== WAVE 2 (Plans: 05, 06) ===
[Launching 2 builders in parallel...]
...

=== PROJECT COMPLETE ===
[Generating final report...]
[Saved to: .claude/plans/project/reports/PROJECT_EXECUTION_REPORT.md]
```
