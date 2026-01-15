---
name: AgFin Report
description: Structured report format for AgFin development tasks
---

## AgFin Report Format

All reports should follow this structure for consistency across AgFin development.

### Header Section

```markdown
# [Report Type]: [Subject]

**Generated**: [ISO timestamp]
**Status**: ✅ SUCCESS | ⚠️ PARTIAL | ❌ FAILED
**Services Affected**: [client | server | ai-service | supabase]
```

### Summary Section

Always start with a 2-3 sentence executive summary. Busy stakeholders read this first.

### Details Section

Use tables for structured data:

| Item | Status | Notes |
|------|--------|-------|
| ... | ✅/❌ | ... |

### Code References

Always include file paths with line numbers:

**File**: `client/src/application/shell/ChatCenter.tsx:42`

```typescript
// Relevant code snippet
```

### Validation Section

Include command outputs:

```bash
npm run build  # ✅ PASS
npm run lint   # ✅ PASS
```

### Action Items

End with clear next steps:

- [ ] First action
- [ ] Second action

### Status Indicators

Use consistent emoji indicators:
- ✅ Success/Pass/Complete
- ❌ Failed/Error/Blocked
- ⚠️ Warning/Partial/Needs Attention
- 🚨 Critical/Blocker
- 💡 Suggestion/Tip
