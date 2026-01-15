---
allowed-tools: Read, Write, Edit, Glob, Grep
description: Update AgFin expertise file with new learnings from the codebase
---

# Purpose

Analyze the AgFin codebase and update the expertise.yaml file with new patterns, files, and domain knowledge discovered. This keeps the expertise context current and accurate.

## Variables

EXPERTISE_FILE: .claude/commands/experts/agfin/expertise.yaml

## Instructions

- Scan the codebase for new patterns or files not in expertise.yaml
- Identify outdated information that needs updating
- Add new critical files discovered during development
- Update architecture details if changed

## Workflow

1. **Read Current Expertise**
   - Load EXPERTISE_FILE
   - Note what's currently documented

2. **Scan Codebase**
   - Use Glob to find all important files
   - Use Grep to identify patterns
   - Look for new directories or structures

3. **Identify Gaps**
   - Compare codebase to expertise file
   - Find undocumented patterns
   - Find new critical files
   - Find outdated information

4. **Update Expertise**
   - Add new patterns discovered
   - Add new critical files
   - Update outdated information
   - Preserve existing accurate content

## Report

```markdown
# Expertise Update Report

## Changes Made

### Added
- [New patterns or files added]

### Updated
- [Information that was corrected]

### Removed
- [Outdated information removed]

## Current State

The expertise file now accurately reflects:
- [Summary of current knowledge]
```
