# Email Sync Doctrine

## Core Principles

1. **Polling is baseline** — Delta sync is the standard transport. Webhooks accelerate but never replace.

2. **Background polling is invisible** — No spinners, no UI blocking, no user awareness.

3. **Initial sync ≠ polling** — Initial sync shows progress. Polling is silent.

4. **Prefetch defines perceived speed** — Data should be there before the click.

5. **Fail fast, not silently** — On error, throw. Never save partial state.

## File Architecture

| File | Purpose | Line Limit |
|------|---------|------------|
| `outlook.ts` | Sync orchestrator (Graph API calls, control flow) | 1200 |
| `outlookStore.ts` | Persistence (message/folder storage) | 600 |
| `outlookActions.ts` | User actions (trash, archive, delete) | 600 |
| `outlookDiagnostics.ts` | Admin tools, resets, migrations | 600 |
| `sync.ts` | Cron orchestration, intent triggers | 600 |

## Invariants

- `outlook.ts` may **call** storage helpers but may not **contain** DB-heavy loops
- User-initiated sync sets `isSyncing: true` (shows spinner)
- Background polling sets `isBackgroundPolling: true` (invisible)
- Delta tokens saved **only** after successful folder completion
- Lock released with `success: false` on any error

## What Doesn't Belong Here

- Verbose docstrings explaining past decisions
- Phase 1/2/3 commentary
- ASCII box decorations
- Migration justification comments

Keep assertions, not essays.
