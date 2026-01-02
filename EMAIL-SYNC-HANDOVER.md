# Email Sync Handover Document

## Current Branch
`EMAIL-IMPLEMENTATION-PROJECT`

**Last Updated:** 2024-12-30

---

## Phase Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Fix Heavy Polling | ✅ Complete |
| Code Refactor | Split outlook.ts + file size gate | ✅ Complete |
| Phase 2 | Bug fixes (ghost messages, stale trash) | ❌ Not started |
| Phase 3 | Body cache architecture redesign | ❌ Deferred |
| Webhooks | Near-real-time sync | ❌ Future (see trigger conditions) |

---

## Phase 1: Fix Heavy Polling ✅

### Plan Document
`/Polling and subscription Implementation Record.md`

### Doctrine Document
`/convex/productivity/email/EMAIL-DOCTRINE.md`

### Implementation Status

| Cut | Description | Status | Notes |
|-----|-------------|--------|-------|
| Cut 1 | Folder caching (skip if < 1 hour) | ✅ Done | `foldersCachedAt` field added |
| Cut 2 | Inbox-only for background polling | ⚠️ Bug | Syncing 3 folders instead of 1 (see below) |
| Cut 3 | Early bail-out on empty delta | N/A | Obsolete - inbox-only eliminates need |
| Cut 4 | Separate `isSyncing` / `isBackgroundPolling` | ✅ Done | Background sync is invisible |

### Phase 1 Bug: Inbox-Only Not Filtering Correctly

Background polling is supposed to sync only Inbox, but logs show:
```
Clutter: 0 messages
Conversation History: 0 messages
Inbox: 0 messages
Total: 3006ms (inbox-only)
```

**Impact:** 3 API calls instead of 1, runtime ~3s instead of <1s
**Fix needed:** Tighten the folder filter in `syncOutlookMessages` when `syncMode: 'inbox-only'`

---

## Code Refactoring ✅

Refactored oversized `outlook.ts` (2442 lines → 1168 lines) into focused modules:

| File | Lines | Purpose |
|------|-------|---------|
| `outlook.ts` | 1168 | Sync orchestrator (OAuth, Graph API, delta sync) |
| `outlookStore.ts` | 416 | Persistence (store messages, folders, remove stale) |
| `outlookActions.ts` | 200 | User actions (trash, archive, delete) |
| `outlookDiagnostics.ts` | 503 | Admin/ops tools, resets, migrations |

### Global File Size Gate

Pre-commit hook enforces line limits on all `.ts`/`.tsx` files:
- Default: 400 lines
- Exceptions: Listed in `.husky/pre-commit`
- Policy: `.husky/CODE-SIZE-POLICY.md`

---

## Current User Experience

### What Works
- [x] Background sync happens silently (no spinner flashing)
- [x] Refresh button stays enabled during background sync
- [x] Manual refresh syncs all folders with visible feedback
- [x] Initial sync shows progress indicator

### What's Broken
- [ ] Ghost messages - deleted emails still appear in app
- [ ] Trash folder shows stale data
- [ ] Email body loads on-click (slow), not prefetched
- [ ] Inbox-only filter not working (3 folders sync instead of 1)

### Latency Reality
- Background polling: every 30 seconds
- Best case delay: ~1 second
- Worst case delay: ~30 seconds
- **This will never match native Outlook's "live" feel without webhooks**

---

## Known Bugs (Phase 2 Work)

### 1. Ghost Messages
- Messages deleted from Outlook stay in our database
- Root cause: Delta tokens may be stale, `@removed` notifications missed
- Needs investigation into delta sync reconciliation

### 2. Trash Folder Stale
- `removeStaleMessages` only runs in Phase A (initial sync), not Phase B (delta sync)
- Delta sync relies on `@removed` from Microsoft which may not always arrive

### 3. Inbox-Only Filter Bug
- Background polling syncs Clutter + Conversation History + Inbox
- Should only sync Inbox
- 3x API calls, 3x runtime

---

## Body Cache (Deferred)

Disabled (`maxBodiesPerAccount: 0`) because:
1. Architecture is backwards - fetches on click instead of prefetching during sync
2. Eviction not working correctly
3. Race conditions with fire-and-forget mutations

**Future fix:** Prefetch bodies during sync, not on click.

---

## Webhook Strategy

**Current state:** Polling only (no webhook infrastructure)

**Polling = baseline, not end state.**

Webhooks become the right move when:
- Users report "email feels slow"
- Email becomes a daily-driver feature
- Phase 2 bugs are fixed (sync engine stable 30+ days)
- Product positioning emphasizes email

**Decision gate:**
> "Are users noticing the 30-second delay, AND is email important enough to invest a week+ of infrastructure work?"

**Architecture when ready:**
- Polling = correctness backbone (always runs)
- Webhooks = latency optimization (accelerator, not dependency)
- Sync engine = arbiter of truth

---

## Key Files

| File | Purpose |
|------|---------|
| `/convex/productivity/email/outlook.ts` | Sync orchestrator (OAuth, Graph API, delta sync) |
| `/convex/productivity/email/outlookStore.ts` | Persistence layer |
| `/convex/productivity/email/outlookActions.ts` | User actions (trash, archive, delete) |
| `/convex/productivity/email/outlookDiagnostics.ts` | Admin tools, resets, migrations |
| `/convex/productivity/email/sync.ts` | Cron orchestration, intent-based sync |
| `/convex/productivity/email/bodyCache.ts` | Body blob caching (disabled) |
| `/convex/productivity/email/cacheConfig.ts` | Cache config dial |
| `/convex/productivity/email/EMAIL-DOCTRINE.md` | Short doctrine (philosophy, no code) |
| `/src/features/productivity/email-console/index.tsx` | Email UI |

---

## Schema Fields

In `productivity_email_Accounts`:
- `isSyncing` - true during user-initiated sync (shows spinner)
- `isBackgroundPolling` - true during background sync (invisible)
- `foldersCachedAt` - timestamp for folder cache TTL

---

## Commands

```bash
# Push changes to Convex
npx convex dev --once

# Check logs
npx convex logs

# Reset sync state (clears delta tokens)
npx convex run "productivity/email/outlookDiagnostics:resetSyncState" '{"userId":"<user_id>"}'

# Reset stuck sync lock
npx convex run "productivity/email/outlookDiagnostics:resetStuckSync" '{"userId":"<user_id>"}'

# Disconnect account (nuclear option)
npx convex run "productivity/email/outlookDiagnostics:disconnectOutlookAccount" '{"accountId":"<account_id>"}'
```

---

## Git Status

All changes committed and pushed to `origin/EMAIL-IMPLEMENTATION-PROJECT`.

Latest commits:
- `8ef5ec3` Move code size policy to .husky for discoverability
- `5e0d877` VRP-Compliant: Email refactoring + global 400-line file size gate
