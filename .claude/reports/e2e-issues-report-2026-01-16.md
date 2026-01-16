# E2E Testing Issues Report

**Generated**: 2026-01-16T03:50:00Z
**Branch**: feature/ui-ux-improvements
**Test Suite**: Playwright PRD Validation

---

## Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Playwright Tests | 14/14 passed | ✅ |
| Lint Errors | 228 | ⚠️ Medium |
| Environment Issues | 3 | 🔴 High |
| API Issues | 2 | 🔴 High |
| New Code Issues | 1 | 🟡 Low |
| Infrastructure | 1 | 🟡 Low |

---

## 🔴 Critical Issues (Must Fix)

### 1. AI Service Environment Variables Missing

**File**: `ai-service/.env`
**Issue**: The AI service health check fails because `SUPABASE_KEY` is expected but only `SUPABASE_SERVICE_ROLE_KEY` is defined.

```json
{
  "memory": {"status": "error", "message": "Missing environment variables: SUPABASE_KEY"},
  "environment": {"missing": ["SUPABASE_KEY"]}
}
```

**Fix**: Either:
- Add `SUPABASE_KEY` alias in `.env`
- Or update the AI service to use `SUPABASE_SERVICE_ROLE_KEY`

---

### 2. Database Tables May Not Exist

**Issue**: AI service reports "Database connected but bot tables not found (migrations may not be run)"

**Impact**:
- Sessions won't persist (`agfin_ai_bot_sessions`)
- Messages won't save (`agfin_ai_bot_messages`)
- Memory won't work (`agfin_ai_bot_memories`)

**Fix**: Run Supabase migrations:
```bash
cd supabase && npx supabase db push
```

---

### 3. CORS Origin Mismatch

**File**: `server/.env` or config
**Issue**: Backend server CORS is configured for `localhost:5174` but frontend runs on `localhost:5173`

```
🔐 CORS origin: http://localhost:5174  # Should be 5173
```

**Impact**: API calls from frontend may be blocked.

**Fix**: Update `server/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

---

## 🟡 Medium Issues (Should Fix)

### 4. ESLint Errors in Codebase

**Count**: 228 errors, 11 warnings across the client codebase

**Top Error Types**:
| Error | Count | Files Affected |
|-------|-------|----------------|
| `@typescript-eslint/no-explicit-any` | ~80 | Multiple |
| `react-hooks/purity` | ~15 | App.tsx, tests |
| `@typescript-eslint/no-unused-vars` | ~30 | Multiple |
| `react-hooks/set-state-in-effect` | ~10 | JustificationModal, tests |

**High-Priority Files to Fix**:
- `client/src/App.tsx` - Date.now() in render (purity issue)
- `client/src/application/audit/JustificationModal.tsx` - setState in effect
- `client/src/application/audit/DualPaneReview.tsx` - Unused variables
- `client/src/application/audit/ExtractedFieldList.tsx` - any types

---

### 5. New ProgressPanel Unused Variable

**File**: `client/src/application/shell/ProgressPanel.tsx:152`
**Issue**: `_applicationId` parameter is declared but never used

```typescript
export function ProgressPanel({
  applicationId: _applicationId,  // ← Unused
  ...
})
```

**Fix**: Either use the variable or prefix properly in implementation.

---

### 6. Supabase Studio Unhealthy

**Status**: Container `agfin-supabase-studio` shows `unhealthy`

**Impact**: Can't access Supabase Studio UI at `localhost:54323`

**Fix**: Restart the container:
```bash
docker-compose restart supabase-studio
```

---

## ✅ Passed Validations

### Playwright Tests (14/14)

| Test | Status |
|------|--------|
| Chat interface landing after login | ✅ |
| Chat input with auto-resize | ✅ |
| Dark theme primary | ✅ |
| Agrellus brand colors | ✅ |
| Three-column layout desktop | ✅ |
| Responsive tablet | ✅ |
| Responsive mobile | ✅ |
| Command palette Cmd+K | ✅ |
| Keyboard navigation | ✅ |
| Sign-in page for unauth | ✅ |
| Mock auth flow dev mode | ✅ |
| Full page screenshot | ✅ |
| ARIA labels accessibility | ✅ |
| Visual regression screens | ✅ |

### Service Health

| Service | Port | Status |
|---------|------|--------|
| Frontend (Vite) | 5173 | ✅ Running |
| Backend (Express) | 3001 | ✅ Running |
| AI Service (FastAPI) | 8000 | ⚠️ Running with errors |
| Supabase DB | 54322 | ✅ Healthy |
| Supabase API | 54321 | ✅ Healthy |
| Docling OCR | 5001 | ✅ Healthy |

### Build Status

| Command | Result |
|---------|--------|
| `npm run build` (client) | ✅ Success |
| `npm run build` (server) | ✅ Success |
| TypeScript compilation | ✅ No errors |

---

## Recommended Fix Order

1. **Immediate** (Blocking functionality):
   - [ ] Fix CORS origin mismatch (5173 vs 5174)
   - [ ] Run database migrations for bot tables
   - [ ] Add `SUPABASE_KEY` to AI service env

2. **Short-term** (Code quality):
   - [ ] Fix unused `_applicationId` in ProgressPanel
   - [ ] Restart Supabase Studio container

3. **Technical Debt** (Can defer):
   - [ ] Address 228 lint errors across codebase
   - [ ] Add `lint` script to server package.json

---

## Test Commands Reference

```bash
# Run E2E tests
npx playwright test

# Run specific test
npx playwright test --grep "chat"

# Run with UI
npx playwright test --ui

# Check service health
curl http://localhost:3001/health
curl http://localhost:8000/api/health

# Run lint
cd client && npm run lint

# Check Docker status
docker-compose ps
```

---

## Files Changed in This Session

| File | Status | Notes |
|------|--------|-------|
| `client/src/App.tsx` | Modified | Routes updated for IntegratedChatPage |
| `client/src/application/IntegratedChatPage.tsx` | Created | New main chat page |
| `client/src/application/useApplicationState.ts` | Created | State management |
| `client/src/application/shell/WelcomeArtifactPanel.tsx` | Created | Welcome state |
| `client/src/application/shell/ProgressPanel.tsx` | Created | Progress tracking |
| `client/src/application/conversation/WelcomeChatScreen.tsx` | Created | Chat welcome |

---

*Report generated by Claude Code E2E validation*
