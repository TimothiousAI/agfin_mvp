---
allowed-tools: Read, Glob, Grep, WebFetch
description: Answer questions about the AgFin codebase with expertise context
argument-hint: [question about AgFin]
---

# Purpose

Answer questions about the AgFin Crop Finance MVP with deep domain knowledge. Load expertise context before researching to ensure accurate, contextual answers.

## Variables

USER_QUESTION: $ARGUMENTS
EXPERTISE_FILE: .claude/commands/experts/agfin/expertise.yaml

## Instructions

- Load AgFin expertise before researching
- Search the codebase to find accurate answers
- Reference specific files and line numbers
- Provide code examples when relevant

## Workflow

1. **Load Expertise Context**
   - Read EXPERTISE_FILE to understand architecture and patterns
   - Identify which areas of the codebase relate to the question

2. **Research the Codebase**
   - Use Grep to search for relevant code
   - Use Glob to find related files
   - Read specific files for detailed understanding

3. **Formulate Answer**
   - Provide accurate, specific answer
   - Reference file paths and line numbers
   - Include code snippets when helpful
   - Explain how it relates to AgFin patterns

## Report

```markdown
## Answer

[Direct answer to the question]

## Details

[Explanation with context]

## Code Reference

**File**: `[path:line]`
```[language]
[relevant code snippet]
```

## Related Files

- `[path]` - [description]
```
