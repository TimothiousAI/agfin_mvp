---
description: Create a detailed implementation plan for an AgFin feature or task
argument-hint: [feature or task description]
---

# Plan

Create a comprehensive implementation plan for the AgFin Crop Finance MVP.

## Variables

USER_REQUEST: $ARGUMENTS

## Instructions

- If no USER_REQUEST is provided, STOP and ask the user what they want to plan.
- Consider the three-tier architecture: React frontend, Express backend, Python AI service
- Account for the chat-first UX paradigm
- Include database migrations if schema changes are needed
- Plan for proper error handling and validation
- Always include validation commands for each phase

## Workflow

1. **Analyze the Request**
   - Parse USER_REQUEST for scope and requirements
   - Identify which services are affected (client, server, ai-service, supabase)
   - Determine complexity and dependencies

2. **Research the Codebase**
   - Read docs/ai_docs/spec.md for architectural context
   - Read relevant existing code in affected directories
   - Identify patterns to follow
   - Find integration points

3. **Create the Plan**
   - Break into discrete, testable steps
   - Order by dependency (database → API → UI)
   - Include specific file paths and changes
   - Add validation commands after each phase

4. **Write Plan File**
   - Save to `.claude/plans/plan_<timestamp>.md`
   - Use the standard plan format

## Report

Output a complete implementation plan with:

```markdown
# Implementation Plan: [Feature Name]

**Request**: [USER_REQUEST]
**Generated**: [ISO timestamp]
**Services Affected**: [client | server | ai-service | supabase]

---

## Overview

[Summary of what will be built]

---

## Prerequisites

- [ ] [Dependencies or setup needed]

---

## Implementation Steps

### Phase 1: [Name]

**Step 1.1**: [Description]
- File: `[path]`
- Changes: [What to modify]

**Validation**: `[command]`

[Continue for all phases...]

---

## Acceptance Criteria

- [ ] [Testable behavior]

---

## Final Validation

```bash
[Full stack validation commands]
```
```
