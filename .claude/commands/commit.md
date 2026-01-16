# Commit Command

Create detailed git commits that serve as "git memory" for agents. Commits should be comprehensive enough that future agents can understand what was done, why, and how to work with the changes.

## Philosophy: Git as Memory

Commit messages are not just for humans - they're documentation for future AI agents. A well-crafted commit enables:
- **Context Recovery**: Agents can understand past decisions without re-reading all code
- **Change Tracking**: Know what files were touched and why
- **Dependency Awareness**: Understand what features depend on what
- **Rollback Intelligence**: Know what to undo if reverting

## Commit Message Format

```
<type>(<scope>): <short summary>

## What Changed
- <file/component>: <what was added/modified>
- <file/component>: <what was added/modified>

## Why
<Brief explanation of the motivation and context>

## Technical Details
<Implementation notes, patterns used, dependencies>

## Files Changed
<count> files changed, <insertions> insertions(+), <deletions> deletions(-)

## Testing
- <How to test this change>
- <Test commands if applicable>

## Related
- Plan: <plan file if applicable>
- Issue: <issue number if applicable>
- Depends on: <prior commits/features if applicable>

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Maintenance, dependencies, config |
| `style` | Formatting, no code change |
| `perf` | Performance improvement |

## Scope Examples

- `chat` - Chat/conversation features
- `auth` - Authentication
- `docs` - Document processing
- `modules` - M1-M5 module forms
- `shell` - AppLayout, panels, navigation
- `ai-service` - Python AI service
- `server` - Express backend
- `client` - React frontend general

## Instructions

1. **Analyze Changes**: Run `git status` and `git diff --stat` to understand scope
2. **Group Logically**: Don't mix unrelated changes in one commit
3. **Be Specific**: List actual files and what changed in each
4. **Explain Why**: Context is more valuable than "what" (code shows what)
5. **Include Testing**: How can someone verify this works?
6. **Link Related Work**: Reference plans, issues, or dependencies

## Example Commit

```
feat(chat): add stop/regenerate buttons for AI responses

## What Changed
- StopGenerationButton.tsx: New component with destructive variant, Escape shortcut hint
- RegenerateButton.tsx: New component with ghost variant, refresh icon
- chatShortcuts.ts: Escape key handler for stopping generation
- useStopGeneration.ts: Hook combining keyboard shortcut and store state
- useRegenerate.ts: Hook for regenerate logic (removes message, re-sends)
- useChatStore.ts: Added lastUserMessage state and removeMessage action
- ChatInput.tsx: Conditional stop/send button, dynamic helper text
- MessageList.tsx: Regenerate button on last assistant message
- ChatCenter.tsx: Integrated stop/regenerate props and streaming indicator

## Why
Users needed ability to stop long AI responses (saves tokens, time) and
regenerate responses they weren't satisfied with. PRD Section 7.1 specifies
these as core conversational interface features.

## Technical Details
- Stop uses AbortController pattern for clean stream cancellation
- Regenerate removes last assistant message, re-sends last user message
- Escape shortcut works even when focused in textarea (allowInInputs: true)
- Preserves partial content when stopping mid-stream

## Files Changed
9 files changed, 312 insertions(+), 45 deletions(-)

## Testing
- Start AI response, press Escape - should stop and preserve partial text
- Complete response, hover last assistant message - regenerate button appears
- Click regenerate - removes response, re-sends your message

## Related
- Plan: .claude/plans/ui_ux_improvements/01_stop_regenerate_buttons.md
- PRD: Section 7.1 Conversational AI Interface

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Anti-Patterns

❌ **Too vague**: "Updated chat functionality"
❌ **No context**: "Added StopGenerationButton.tsx"
❌ **Everything in one**: Mixing 5 unrelated features
❌ **No testing info**: How do I verify this works?
❌ **Missing files**: Only listing some changed files

## Running This Command

When user says `/commit` or asks to commit:

1. Run `git status` to see changes
2. Run `git diff --stat` to see file statistics
3. Run `git log --oneline -5` to see recent commit style
4. Group related changes logically
5. Create detailed commit message following format above
6. Stage files: `git add <files>`
7. Commit with HEREDOC for proper formatting
8. Verify with `git log -1`

## Multiple Commits

For large changesets, split into logical commits:
- By feature/plan
- By service (client vs server vs ai-service)
- By type (feat vs fix vs refactor)

Each commit should be independently meaningful and buildable.
