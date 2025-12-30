# Email Sync Handover Document

## Current Branch
`EMAIL-IMPLEMENTATION-PROJECT`

---

## Phase 1 Status: Fix Heavy Polling

### Plan Document
`/Polling and subscription Implementation Record.md`

### Doctrine Document
`/Polling and Subscription 5 Layer Strategy - DOCTRINE.md`

### Implementation Status

| Cut | Description | Status | Notes |
|-----|-------------|--------|-------|
| Cut 1 | Folder caching (skip if < 1 hour) | Done | `foldersCachedAt` field added |
| Cut 2 | Inbox-only for background polling | Done | `syncMode` param added |
| Cut 3 | Early bail-out on empty delta | Obsolete | Inbox-only eliminates need |
| Cut 4 | Separate `isSyncing` / `isBackgroundPolling` | Done | Bug fixed: was using `undefined` instead of `false` |

---

## Uncommitted Changes

Files modified but NOT committed:

1. **`/convex/productivity/email/outlook.ts`**
   - Fixed `acquireSyncLock` to use `true`/`false` instead of `true`/`undefined`
   - Fixed `moveMessageToTrash` to update `providerFolderId` (not just `canonicalFolder`)
   - Fixed `moveMessageToArchive` to update `providerFolderId`

2. **`/convex/productivity/email/cacheConfig.ts`**
   - Body cache disabled: `maxBodiesPerAccount: 0`

3. **`/convex/productivity/email/bodyCache.ts`**
   - Added `purgeAllBodyCache` internal mutation

---

## Known Bugs

### 1. Deleted Folder Not Syncing
- Trash folder shows stale data
- `removeStaleMessages` only runs in Phase A (initial sync), not Phase B (delta sync)
- Delta sync relies on `@removed` from Microsoft which may not always arrive

### 2. Ghost Messages
- Messages deleted from Outlook stay in our database
- 191 items in our DB vs 94 in Outlook (before disconnect)
- Root cause: Delta tokens may be stale, `@removed` notifications missed

### 3. Sync Stopped After Reconnect
- User disconnected and reconnected
- Sync stopped after ~5 minutes
- Current state unknown - needs investigation via Convex dashboard logs

---

## Body Cache Issues (Deferred)

Body cache was disabled because:
1. Architecture is backwards - fetches on click instead of prefetching during sync
2. Eviction not working - 24 blobs when limit is 20
3. Fire-and-forget mutations causing race conditions

Future fix: Prefetch bodies during sync, not on click.

---

## Key Files

| File | Purpose |
|------|---------|
| `/convex/productivity/email/outlook.ts` | Main sync logic, OAuth, CRUD |
| `/convex/productivity/email/sync.ts` | Cron orchestration, intent-based sync |
| `/convex/productivity/email/bodyCache.ts` | Body blob caching (disabled) |
| `/convex/productivity/email/cacheConfig.ts` | Cache config dial |
| `/src/hooks/useEmailSyncIntent.ts` | Client-side sync triggers |
| `/src/hooks/useProductivitySync.ts` | FUSE hydration from Convex |
| `/src/features/productivity/email-console/index.tsx` | Email UI |

---

## Schema Fields Added

In `productivity_email_Accounts`:
- `isSyncing` - true during user-initiated sync (shows spinner)
- `isBackgroundPolling` - true during background sync (invisible)
- `foldersCachedAt` - timestamp for folder cache TTL

---

## What Needs Investigation

1. Why sync stopped after reconnect
2. Check Convex dashboard logs for errors
3. Verify Phase A is running (initial sync) vs Phase B (delta)
4. Check if OAuth tokens are valid

---

## Commands

```bash
# Push changes to Convex
npx convex dev --once

# Check logs
npx convex logs

# Reset sync state (clears delta tokens)
npx convex run "productivity/email/outlook:resetSyncState" '{"userId":"<user_id>"}'

# Reset stuck sync lock
npx convex run "productivity/email/outlook:resetStuckSync" '{"userId":"<user_id>"}'
```

---

## Git Status

Uncommitted changes exist. User explicitly said DO NOT COMMIT.

To see changes:
```bash
git diff
git status
```
