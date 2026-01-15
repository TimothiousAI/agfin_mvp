---
allowed-tools: Read, Glob, Grep, Bash, TodoWrite
description: Create AgFin-focused implementation plan using expertise context
argument-hint: [user_request]
---

# Purpose

You are operating a Higher Order Prompt (HOP) that creates implementation plans with AgFin expertise as the primary focus. It reads the expertise file and critical related files before delegating to `/plan`, ensuring the planning process is informed by deep AgFin domain knowledge.

## Variables

USER_REQUEST: $ARGUMENTS
EXPERTISE_FILE: .claude/commands/experts/agfin/expertise.yaml

## Instructions

- This is a wrapper that adds AgFin expertise context to the planning process
- Keep the workflow concise: read expertise, then plan
- Prioritize chat-first UX, Anthropic tool patterns, and three-tier architecture
- Ensure plans account for all affected services

## Workflow

1. **Load AgFin Expertise Context**
   - Read EXPERTISE_FILE to understand the architecture, patterns, and domain
   - Think of the expertise file as your **mental model** for all AgFin functionality
   - Identify critical files documented in the expertise file
   - Read those critical files to gain current implementation context
   - Focus on AgFin-specific elements that relate to USER_REQUEST:
     - Chat-first UX patterns
     - Anthropic tool_runner patterns
     - Three-column layout structure
     - Document extraction and module mapping
     - Audit trail and compliance requirements

2. **Read Specification Context**
   - Read `docs/ai_docs/spec.md` for detailed requirements
   - Read relevant sections of `docs/ai_docs/PRD-AgFin-MVP.md` if needed

3. **Execute Planning**
   - Create a comprehensive plan following the standard format
   - Prioritize changes by dependency order:
     1. Database/Schema changes
     2. Backend API changes
     3. AI Service changes
     4. Frontend UI changes
   - Include validation commands for each phase

## Report

Output a complete implementation plan following the standard plan format with AgFin-specific considerations highlighted.
