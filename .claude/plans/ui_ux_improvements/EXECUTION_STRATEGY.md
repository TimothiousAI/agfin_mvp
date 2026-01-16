# UI/UX Improvements Execution Strategy

**Project Name**: ui_ux_improvements
**Created**: 2026-01-15
**Total Plans**: 10
**Total Waves**: 5
**Reports Folder**: reports/

## Wave Definitions

```yaml
waves:
  - id: 1
    name: "Foundation"
    plans: [01, 02, 03, 04]
    parallel: true
    max_parallel: 4

  - id: 2
    name: "Enhanced Navigation"
    plans: [05, 06]
    parallel: true
    max_parallel: 2
    depends_on: [1]

  - id: 3
    name: "AI Service Integration"
    plans: [07, 08]
    parallel: true
    max_parallel: 2
    depends_on: [1]

  - id: 4
    name: "Complex Features"
    plans: [09]
    parallel: false
    depends_on: [2, 3]

  - id: 5
    name: "Polish & Onboarding"
    plans: [10]
    parallel: false
    depends_on: [4]
```

---

## Dependency Analysis

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY GRAPH                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  WAVE 1 (Independent - Run in Parallel)                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ 01_stop  │ │ 02_keys  │ │ 03_wheat │ │ 04_rename│                   │
│  │ regen    │ │ shortcuts│ │ gold     │ │ inline   │                   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘                   │
│       │            │            │                                       │
│       │            │            │                                       │
│  WAVE 2 (Light Dependencies)   │                                        │
│       │      ┌─────┴─────┐     │                                        │
│       │      │ 05_cmd    │     │                                        │
│       │      │ palette   │     │                                        │
│       │      └───────────┘     │                                        │
│       │                  ┌─────┴─────┐                                  │
│       │                  │ 06_proxy  │                                  │
│       │                  │ indicators│                                  │
│       │                  └───────────┘                                  │
│       │                                                                 │
│  WAVE 3 (AI Service Changes)                                            │
│       │      ┌───────────┐ ┌───────────┐                               │
│       └─────►│ 08_msg    │ │ 07_title  │◄── Can run in parallel        │
│              │ editing   │ │ autogen   │                                │
│              └───────────┘ └───────────┘                                │
│                                                                         │
│  WAVE 4 (Complex/Large)                                                 │
│              ┌───────────┐                                              │
│              │ 09_artifact│                                             │
│              │ panel     │                                              │
│              └───────────┘                                              │
│                                                                         │
│  WAVE 5 (Polish - Last)                                                 │
│              ┌───────────┐                                              │
│              │ 10_onboard│                                              │
│              │ tour      │                                              │
│              └───────────┘                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Wave Breakdown

### Wave 1: Foundation (Parallel Execution)

**Plans**: 01, 02, 03, 04
**Parallelism**: All 4 can run simultaneously
**Risk**: Low - No overlapping files

| Plan | Files Modified | Conflict Risk |
|------|----------------|---------------|
| 01_stop_regenerate | ChatCenter, useChatStore, ChatInput | None |
| 02_keyboard_shortcuts | AppLayout, navigationShortcuts | None |
| 03_wheat_gold_badges | badge.tsx, WarningBadges, forms | None |
| 04_inline_session_rename | SessionList, SessionGroups | None |

**Validation After Wave 1**:
```bash
cd client && npm run build && npm run lint
```

**Expected Duration**: 2-3 hours (parallel)

---

### Wave 2: Enhanced Navigation (Sequential or Parallel)

**Plans**: 05, 06
**Parallelism**: Can run in parallel (different component trees)

| Plan | Depends On | Reason |
|------|------------|--------|
| 05_command_palette | 02 (soft) | Uses same shortcut infrastructure |
| 06_proxy_indicators | 03 (soft) | Uses similar badge patterns |

**Why Wave 2?**
- Command palette benefits from keyboard shortcut foundation
- Proxy indicators use badge patterns established in Wave 1

**Validation After Wave 2**:
```bash
cd client && npm run build && npm run lint
```

**Expected Duration**: 3-4 hours (parallel)

---

### Wave 3: AI Service Integration (Parallel)

**Plans**: 07, 08
**Parallelism**: Can run in parallel (different endpoints)

| Plan | Service Changes | Client Changes |
|------|-----------------|----------------|
| 07_session_title_autogen | New `/generate-title` endpoint | useAutoTitle hook |
| 08_message_editing | New `PATCH /messages/:id` endpoint | EditableMessageBubble |

**Why Wave 3?**
- Both require AI service changes (Python FastAPI)
- 08 touches chat state that overlaps with 01 - should wait for 01 to be stable

**Validation After Wave 3**:
```bash
# AI Service
cd ai-service && python -m pytest

# Client
cd client && npm run build

# Integration test
curl http://localhost:8000/health
```

**Expected Duration**: 4-5 hours (parallel)

---

### Wave 4: Complex Features

**Plans**: 09
**Parallelism**: Single plan, but can run builders in parallel for different phases

**Why Wave 4?**
- Artifact panel enhancements are complex (versioning, diff view)
- Should have stable chat and navigation before adding artifact complexity

**Validation After Wave 4**:
```bash
cd client && npm run build && npm run lint
```

**Expected Duration**: 4-5 hours

---

### Wave 5: Polish & Onboarding

**Plans**: 10
**Parallelism**: Single plan

**Why Last?**
- Onboarding tour references UI elements from all other plans
- Tour highlights (chat, progress panel, artifacts) should be stable
- Can adjust tour steps based on final UI

**Validation After Wave 5**:
```bash
cd client && npm run build && npm run lint
npx playwright test  # Full E2E
```

**Expected Duration**: 4-5 hours

---

## Execution Commands

### Option A: Maximum Parallelism (4 builders)

```bash
# Wave 1 - Launch all 4 in parallel
/build .claude/plans/ui_ux_improvements/01_stop_regenerate_buttons.md &
/build .claude/plans/ui_ux_improvements/02_keyboard_shortcuts.md &
/build .claude/plans/ui_ux_improvements/03_wheat_gold_badges.md &
/build .claude/plans/ui_ux_improvements/04_inline_session_rename.md &
wait

# Validate Wave 1
cd client && npm run build

# Wave 2 - Launch 2 in parallel
/build .claude/plans/ui_ux_improvements/05_command_palette_integration.md &
/build .claude/plans/ui_ux_improvements/06_proxy_edit_indicators.md &
wait

# Validate Wave 2
cd client && npm run build

# Wave 3 - Launch 2 in parallel
/build .claude/plans/ui_ux_improvements/07_session_title_autogen.md &
/build .claude/plans/ui_ux_improvements/08_message_editing.md &
wait

# Validate Wave 3
cd client && npm run build
cd ai-service && python -m pytest

# Wave 4
/build .claude/plans/ui_ux_improvements/09_artifact_panel_enhancements.md

# Wave 5
/build .claude/plans/ui_ux_improvements/10_onboarding_tour.md

# Final validation
npm run build && npx playwright test
```

### Option B: Conservative (2 builders max)

```bash
# Wave 1a
/build 01_stop_regenerate_buttons.md &
/build 02_keyboard_shortcuts.md &
wait

# Wave 1b
/build 03_wheat_gold_badges.md &
/build 04_inline_session_rename.md &
wait

# Continue sequentially...
```

### Option C: Sequential (Safest)

```bash
# Execute in order 01 → 10
for i in 01 02 03 04 05 06 07 08 09 10; do
  /build .claude/plans/ui_ux_improvements/${i}_*.md
  cd client && npm run build || exit 1
done
```

---

## Risk Mitigation

### Merge Conflicts

| Shared File | Plans That Touch It | Resolution |
|-------------|---------------------|------------|
| `useChatStore.ts` | 01, 08 | Run 01 first, 08 in Wave 3 |
| `AppLayout.tsx` | 02, 05, 10 | Staged execution |
| `badge.tsx` | 03, 06 | Run 03 first |
| `index.ts` exports | Multiple | Merge exports carefully |

### Rollback Strategy

Each wave should be committed separately:
```bash
# After each wave
git add -A
git commit -m "feat: Wave N - [features]"
```

If a wave fails:
```bash
git reset --hard HEAD~1  # Rollback last wave
```

---

## Progress Tracking

| Wave | Plans | Status | Validated |
|------|-------|--------|-----------|
| 1 | 01, 02, 03, 04 | ⬜ Pending | ⬜ |
| 2 | 05, 06 | ⬜ Pending | ⬜ |
| 3 | 07, 08 | ⬜ Pending | ⬜ |
| 4 | 09 | ⬜ Pending | ⬜ |
| 5 | 10 | ⬜ Pending | ⬜ |

---

## Time Estimates

| Approach | Total Time | Notes |
|----------|------------|-------|
| Maximum Parallel (4 builders) | ~10-12 hours | Fastest, highest risk |
| Moderate Parallel (2 builders) | ~14-16 hours | Balanced |
| Sequential | ~20-24 hours | Safest, slowest |

---

## Recommended Approach

**Use Wave-based execution with 2 parallel builders per wave.**

This provides:
- Good parallelism (40% time savings vs sequential)
- Manageable merge conflicts
- Clear validation checkpoints
- Easy rollback per wave

Start with:
```
/build 01_stop_regenerate_buttons.md
/build 02_keyboard_shortcuts.md
```

Then proceed wave by wave after validation passes.
