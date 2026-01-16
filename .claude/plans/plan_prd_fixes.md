# Implementation Plan: PRD Validation Fixes

**Scope**: Fix M1 form blank page and add missing ARIA labels for accessibility compliance
**Services Affected**: client
**Estimated Steps**: 8

---

## Overview

This plan addresses two PRD validation issues identified in Playwright tests:
1. The `/test/m1-form` route is referenced in CLAUDE.md and PRD tests but does not exist, causing a blank dark screen
2. Several interactive elements (buttons, links) lack proper `aria-label` attributes required for screen reader accessibility per PRD Section 7.12

---

## Prerequisites

- [ ] Frontend dev server running (`npm run dev` in client/)
- [ ] Review of existing test page patterns (M2FormTest, M3FormTest)

---

## Implementation Steps

### Phase 1: Create M1 Form Test Page

**Step 1.1**: Create M1FormTest.tsx test page component

- File: `C:\Users\timca\Business\agfin_app\client\src\test\M1FormTest.tsx`
- Pattern: Follow existing M2FormTest.tsx and M3FormTest.tsx patterns
- Changes: Create new test page that imports and renders M1IdentityForm with mock data

```tsx
import { useState } from 'react';
import M1IdentityForm from '../application/modules/M1IdentityForm';
import type { M1FormData, FieldMetadata } from '../application/modules/M1IdentityForm';

export function M1FormTest() {
  // State and handlers similar to M2FormTest/M3FormTest
  // Mock metadata with ai_extracted source for demonstration
}
```

**Step 1.2**: Add route for `/test/m1-form` in App.tsx

- File: `C:\Users\timca\Business\agfin_app\client\src\App.tsx`
- Changes:
  - Add lazy import for M1FormTest
  - Add Route element for `/test/m1-form`

```tsx
// Add after line 20 (after M3FormTest import)
const M1FormTest = lazyWithRetry(() => import('./test/M1FormTest').then(m => ({ default: m.M1FormTest })), 'M1FormTest');

// Add after line 61 (after /test/m3-form route)
<Route path="/test/m1-form" element={<M1FormTest />} />
```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

### Phase 2: Fix Missing ARIA Labels

The Playwright test output showed interactive elements without ARIA labels:
```
Interactive elements with ARIA: [
  { tag: 'A', role: null, ariaLabel: null },
  { tag: 'BUTTON', role: null, ariaLabel: null }
]
```

Review of codebase shows these components need ARIA labels:

**Step 2.1**: Add ARIA label to New Conversation button in ConversationSidebar

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ConversationSidebar.tsx`
- Line: 57-64
- Changes: Add `aria-label="Start new conversation"` to the New Conversation button

```tsx
<button
  onClick={onNewConversation}
  aria-label="Start new conversation"
  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#30714C] hover:bg-[#3d8a5f] text-white font-medium rounded-lg transition-colors"
>
```

**Step 2.2**: Add ARIA labels to conversation session buttons in ConversationSidebar

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ConversationSidebar.tsx`
- Line: 77-104
- Changes: Add `aria-label` with session title for each conversation button

```tsx
<button
  key={session.id}
  onClick={() => onSelectSession?.(session.id)}
  aria-label={`Open conversation: ${session.title}`}
  className={...}
>
```

**Step 2.3**: Add ARIA label to chat textarea in ChatCenter

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\ChatCenter.tsx`
- Line: 137-159
- Changes: Add `aria-label="Message input"` to the textarea

```tsx
<textarea
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Ask me anything about farm financing..."
  aria-label="Message input"
  className={...}
```

**Step 2.4**: Add ARIA labels to SignInPage buttons

- File: `C:\Users\timca\Business\agfin_app\client\src\auth\sign-in\SignInPage.tsx`
- Changes: Add aria-labels to submit buttons for better screen reader context

Line 159 (email submit button):
```tsx
<button
  type="submit"
  disabled={isLoading || !email}
  aria-label={isLoading ? "Sending verification code" : "Continue with email to sign in"}
  className={...}
>
```

Line 208 (OTP submit button):
```tsx
<button
  type="submit"
  disabled={isLoading || otp.length !== 6}
  aria-label={isLoading ? "Verifying code" : "Verify code and sign in"}
  className={...}
>
```

Line 226 (back button):
```tsx
<button
  type="button"
  onClick={handleBackToEmail}
  disabled={isLoading}
  aria-label="Go back to email input"
  className={...}
>
```

**Step 2.5**: Add ARIA label to M1IdentityForm SSN toggle button

- File: `C:\Users\timca\Business\agfin_app\client\src\application\modules\M1IdentityForm.tsx`
- Line: 285-291
- Changes: Add aria-label to the Show/Hide SSN toggle button

```tsx
<button
  type="button"
  onClick={() => setShowSsn(!showSsn)}
  aria-label={showSsn ? "Hide Social Security Number" : "Show Social Security Number"}
  className="ml-auto text-xs text-blue-600 hover:text-blue-800"
>
```

**Step 2.6**: Add ARIA label to M1IdentityForm entity type select

- File: `C:\Users\timca\Business\agfin_app\client\src\application\modules\M1IdentityForm.tsx`
- Line: 353-370
- Changes: Add aria-label to the entity type select element

```tsx
<select
  id="entity_type"
  value={formData.entity_type || ''}
  onChange={(e) => handleFieldChange('entity_type', e.target.value)}
  onBlur={() => handleBlur('entity_type')}
  disabled={readOnly}
  aria-label="Select business entity type"
  className={...}
>
```

**Step 2.7**: Add ARIA label to M1IdentityForm submit button

- File: `C:\Users\timca\Business\agfin_app\client\src\application\modules\M1IdentityForm.tsx`
- Line: 396-400
- Changes: Add aria-label to the submit button

```tsx
<button
  type="submit"
  aria-label="Save form and continue to next step"
  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
>
```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

### Phase 3: Add ARIA Labels to SkipLinks

**Step 3.1**: Add ARIA label to skip link anchors

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\accessibility\SkipLinks.tsx`
- Line: 41-49
- Changes: Add role and aria-label for better screen reader support

```tsx
<a
  key={link.id}
  href={`#${link.id}`}
  className="skip-link"
  onClick={(e) => handleClick(e, link.id)}
  role="link"
  aria-label={link.label}
>
```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

## Acceptance Criteria

- [ ] `/test/m1-form` route renders the M1IdentityForm component with test controls
- [ ] M1 form test page displays form sections: Applicant Information, Address, Business Entity Type
- [ ] All buttons have descriptive `aria-label` attributes
- [ ] All links have descriptive `aria-label` attributes
- [ ] Form inputs have appropriate labels (existing `htmlFor`/`id` pairs are sufficient)
- [ ] Screen readers can navigate all interactive elements with clear announcements
- [ ] Playwright PRD validation tests pass for M1 form route
- [ ] Accessibility check shows ARIA labels on interactive elements

---

## Final Validation

```bash
# Build all client code
cd client && npm run build

# Run linting
cd client && npm run lint

# Run type checking
cd client && npx tsc --noEmit

# Run Playwright PRD tests
npx playwright test e2e/prd-validation.spec.ts
```

---

## Notes

1. **Existing ARIA Support**: The codebase already has good ARIA helper utilities in `client/src/shared/accessibility/ariaHelpers.ts` - these should be used when building new components.

2. **ChatCenter already has some ARIA labels**: The Send button (aria-label="Send message") and Attach button (aria-label="Attach file") already have proper labels.

3. **ConversationSidebar collapse button**: Already has `aria-label="Collapse sidebar"`.

4. **Pattern Consistency**: The M1FormTest should follow the exact same pattern as M2FormTest and M3FormTest for consistency in the test suite.

5. **PRD Reference**: Section 7.12 specifies "ARIA labels and roles on all interactive elements" - this fix ensures compliance.

6. **Focus Rings**: The existing button component (`shared/ui/button.tsx`) already has `focus-visible:ring-2` for keyboard navigation visibility.
