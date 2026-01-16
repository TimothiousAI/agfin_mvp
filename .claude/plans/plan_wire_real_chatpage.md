# Implementation Plan: Wire Up Real ChatPage with Refined Agricultural Aesthetics

**Request**: Wire up real API connections to ChatPage, showing actual application/document/progress tracking per PRD
**Generated**: 2026-01-16T01:45:00Z
**Services Affected**: client (primary)
**Skill**: frontend-design:frontend-design

---

## Design Direction

### Purpose
Command center for loan analysts to interact with AI assistant, manage crop loan applications, upload documents, and track progress. Professional tool for agricultural finance.

### Aesthetic Tone: **Refined Agricultural Professional**
- **Not generic fintech** - Grounded, earthy, trustworthy
- **Dark theme** (#061623) evokes fertile soil, night sky over farmland
- **Primary green** (#30714C) represents growth, crops, prosperity
- **Wheat gold** (#DDC66F) adds warmth, harvest abundance, premium feel
- **Typography**: Professional but warm - Lato for body, consider a distinctive display font for headers

### Differentiation
- Progress panel feels **alive** with real completion data
- Chat feels like talking to a **knowledgeable agricultural expert**
- Three-column layout = **analyst command center**
- Subtle agricultural motifs without being kitschy

### Visual Details
- Subtle grain texture on dark backgrounds (soil/earth feel)
- Progress bars with organic, growing animation
- Document slots with status indicators that pulse when processing
- Wheat gold accents for attention states and CTAs

---

## Overview

Replace mock `ChatPage` with `IntegratedChatPage` that:

1. **Real Sessions** - `useSessionsApi` for Supabase sessions
2. **Real Chat** - `useChatApi` + SSE streaming for AI conversations
3. **Real Applications** - `useApplications` for loan apps
4. **Real Progress** - `ProgressPanel` with documents, modules, completion %
5. **Welcome States** - Thoughtfully designed empty states

---

## Prerequisites

- [x] AI Service running (port 8000)
- [x] Backend running (port 3001)
- [x] Frontend running (port 5173)
- [x] Supabase running (port 54321)

---

## Implementation Steps

### Phase 1: IntegratedChatPage Component

**Step 1.1**: Create main integrated page component

- File: `client/src/application/IntegratedChatPage.tsx`
- Design Notes:
  - Clean, professional layout
  - Seamless data flow from APIs to UI
  - Loading states with skeleton animations
  - Error boundaries with friendly agricultural messaging

```tsx
// Structure
export function IntegratedChatPage() {
  // Real API hooks
  const { data: sessions } = useSessions();
  const { data: applications } = useApplications();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);

  // Derived state
  const activeApplication = applications?.find(a => a.id === activeApplicationId);

  return (
    <AppLayout
      sidebar={<SessionSidebar sessions={sessions} />}
      artifactPanel={<ApplicationProgressPanel application={activeApplication} />}
    >
      <ChatCenter sessionId={activeSessionId} />
    </AppLayout>
  );
}
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 2: Application State Hook

**Step 2.1**: Create useApplicationState for context management

- File: `client/src/application/useApplicationState.ts`
- Purpose: Single source of truth for current app/session context

```tsx
interface ApplicationState {
  currentSessionId: string | null;
  currentApplicationId: string | null;
  activeArtifact: { type: 'progress' | 'document' | 'module'; id?: string } | null;
  setCurrentSession: (id: string | null) => void;
  setCurrentApplication: (id: string | null) => void;
  showDocument: (documentId: string) => void;
  showModule: (moduleNumber: number) => void;
  showProgress: () => void;
}
```

**Validation**: `cd client && npx tsc --noEmit`

---

### Phase 3: Welcome States

**Step 3.1**: Create WelcomeArtifactPanel

- File: `client/src/application/shell/WelcomeArtifactPanel.tsx`
- Design Notes:
  - Warm, inviting empty state
  - Clear call-to-action to create first application
  - Feature highlights with agricultural iconography
  - Subtle wheat/crop patterns in background

```tsx
// Visual structure
<div className="h-full bg-gradient-to-b from-[#0D2233] to-[#061623] p-6">
  <div className="text-center space-y-6">
    <div className="w-16 h-16 mx-auto bg-[#30714C]/20 rounded-full flex items-center justify-center">
      <Sprout className="w-8 h-8 text-[#30714C]" />
    </div>
    <h2 className="text-xl font-semibold text-white">Ready to Start</h2>
    <p className="text-gray-400">Create your first loan application or ask the assistant for help.</p>

    <div className="grid gap-4 mt-8">
      <FeatureCard icon={FileText} title="Document Upload" description="9 document types supported" />
      <FeatureCard icon={CheckCircle} title="Progress Tracking" description="Real-time completion status" />
      <FeatureCard icon={Shield} title="Audit Ready" description="Full compliance trail" />
    </div>
  </div>
</div>
```

**Step 3.2**: Create WelcomeChatScreen

- File: `client/src/application/conversation/WelcomeChatScreen.tsx`
- Design Notes:
  - Friendly greeting with time-of-day awareness
  - Suggested prompts as clickable cards
  - Subtle animation on load

```tsx
// Suggested prompts
const suggestions = [
  { icon: Plus, text: "Start a new loan application", prompt: "I want to start a new crop loan application" },
  { icon: Upload, text: "Upload a document", prompt: "I need to upload a document" },
  { icon: Search, text: "Check application status", prompt: "What's the status of my applications?" },
];
```

**Validation**: `cd client && npm run build`

---

### Phase 4: Wire Real Sessions

**Step 4.1**: Update ConversationSidebar to use real data

- File: `client/src/application/shell/ConversationSidebar.tsx`
- Changes:
  - Accept sessions from `useSessions()` hook
  - Handle loading/error states
  - Wire up `useCreateSession()` for new conversations

**Step 4.2**: Connect session selection to chat history

- Changes in IntegratedChatPage:
  - When session selected, call `useChatHistory(sessionId)`
  - Pass messages to ChatCenter
  - Handle session switching gracefully

**Validation**: `cd client && npm run build`

---

### Phase 5: Wire Real Chat API

**Step 5.1**: Connect ChatCenter to real message sending

- File: `client/src/application/shell/ChatCenter.tsx`
- Changes:
  - Use `useSendMessage()` mutation
  - Wire up SSE streaming via `useMessageStream()`
  - Show typing indicator during AI response
  - Handle stop generation

**Step 5.2**: Handle AI tool calls in UI

- When AI calls tools (create_application, upload_document, etc.)
- Update local state to reflect changes
- Show appropriate artifacts in panel

**Validation**: `cd client && npm run build`

---

### Phase 6: Wire Real Applications & Progress

**Step 6.1**: Connect ProgressPanel to real application data

- File: `client/src/application/IntegratedChatPage.tsx`
- Changes:
  ```tsx
  const { data: appData } = useApplicationWithDetails(activeApplicationId);

  const artifactPanel = activeApplicationId ? (
    <ProgressPanel
      applicationId={activeApplicationId}
      documents={appData?.documents}
      modules={appData?.module_completion}
      overallPercentage={appData?.completion_stats?.completion_percentage}
      blockers={getBlockers(appData)}
      onDocumentClick={handleShowDocument}
      onModuleClick={handleShowModule}
    />
  ) : (
    <WelcomeArtifactPanel onCreateApplication={handleCreateApp} />
  );
  ```

**Step 6.2**: Create document/module artifact views

- When user clicks document in progress → show DocumentViewer
- When user clicks module in progress → show ModuleForm
- Smooth transitions between artifact types

**Validation**: `cd client && npm run build`

---

### Phase 7: Update App.tsx Routes

**Step 7.1**: Replace ChatPage with IntegratedChatPage

- File: `client/src/App.tsx`
- Changes:
  ```tsx
  // Main route uses integrated page
  <Route path="/chat" element={
    <ProtectedRoute>
      <TourProvider>
        <IntegratedChatPage />
      </TourProvider>
    </ProtectedRoute>
  } />

  // Keep demo route for development
  <Route path="/demo" element={<DemoChatPage />} />
  ```

**Validation**:
```bash
cd client && npm run build && npm run lint
```

---

## Acceptance Criteria

- [ ] Sessions load from Supabase database
- [ ] Creating new conversation persists to database
- [ ] Messages sent to AI service, responses streamed back
- [ ] Applications list shows real data from backend
- [ ] Progress panel shows real document/module completion percentages
- [ ] Clicking document shows document preview/extraction
- [ ] Clicking module shows module form
- [ ] Welcome state displays when no application active
- [ ] All existing functionality preserved
- [ ] E2E tests pass

---

## Final Validation

```bash
# Full stack validation
cd client && npm run build && npm run lint
npx playwright test

# Manual verification
# 1. Sign in at localhost:5173
# 2. Should see real sessions (or empty state)
# 3. Create new session → persists
# 4. Send message → AI responds
# 5. Create application via chat
# 6. See progress panel update
# 7. Upload document → extraction runs
# 8. Progress percentage updates
```

---

## Visual Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│ [AgFin Logo]  Sessions                      │ Chat │ Progress Panel │
├─────────────────────────────────────────────┼──────┼────────────────┤
│ ┌─────────────────────────────────────────┐ │      │ ┌────────────┐ │
│ │ + New Conversation                      │ │      │ │ 67% Done   │ │
│ ├─────────────────────────────────────────┤ │      │ │ ████████░░ │ │
│ │ 🌾 John Smith Farm Loan                 │ │      │ └────────────┘ │
│ │    "What documents do I need?"          │ │      │                │
│ │    2 hours ago                          │ │      │ Documents (5/9)│
│ ├─────────────────────────────────────────┤ │      │ ┌────────────┐ │
│ │ 🌾 Equipment Financing                  │ │      │ │ ✓ License  │ │
│ │    "Tell me about rates"                │ │      │ │ ✓ Tax Ret  │ │
│ │    Yesterday                            │ │      │ │ ○ Balance  │ │
│ └─────────────────────────────────────────┘ │      │ │ ...        │ │
│                                             │      │ └────────────┘ │
│                                             │      │                │
│                                             │      │ Modules (3/5)  │
│                                             │      │ ┌────────────┐ │
│                                             │      │ │ ✓ Identity │ │
│                                             │      │ │ ✓ Lands    │ │
│                                             │      │ │ ◐ Financial│ │
│                                             │      │ │ ○ Ops      │ │
│                                             │      │ │ ○ Summary  │ │
│                                             │      │ └────────────┘ │
└─────────────────────────────────────────────┴──────┴────────────────┘
```
