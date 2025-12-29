# EMAIL SYNC HANDOVER

**Date**: December 30, 2025
**Branch**: `EMAIL-IMPLEMENTATION-PROJECT` (47 commits ahead of main)
**Last Commit**: `0a02971` - Fix: Email sync deletions + conditional folders + manual refresh

---

## WHAT WAS DONE THIS SESSION

### 1. Manual Refresh Bypass
**File**: `convex/productivity/email/sync.ts`

The refresh button was stuck because ALL sync intents (including manual) had a 30-second cooldown. Fixed by making manual refresh bypass the cooldown since it's an explicit user action.

```typescript
const bypassCooldown = args.intent === 'manual';
```

### 2. Conditional Folder Display (Clutter, Conversation History)
**File**: `src/features/productivity/email-console/index.tsx`

These folders should only appear when they have emails, hide when empty. Microsoft marks Clutter as a "hidden" folder (`isHidden: true`), so we also needed to add `includeHiddenFolders=true` to the folder fetch.

```typescript
// Conditional folders: only show if they have emails
if (isConditional && messageCount === 0) continue;

// Conditional folders with emails go to custom section
if (isConditional && messageCount > 0) {
  tree.custom.push(folder);
  continue;
}
```

### 3. Graceful 404 Handling for Stale Messages
**File**: `convex/productivity/email/bodyCache.ts`

When viewing emails after a folder reset, old message IDs in our DB were stale (deleted from Microsoft). Now returns empty string instead of throwing error.

```typescript
if (response.status === 404) {
  console.log(`Message not found in Microsoft Graph (404) - may have been deleted`);
  return '';
}
```

### 4. Hidden Folder Fetching
**File**: `convex/productivity/email/outlook.ts`

Added `includeHiddenFolders=true` to the Microsoft Graph API call to fetch Clutter folder.

```typescript
const foldersResponse = await fetch(
  'https://graph.microsoft.com/v1.0/me/mailFolders?$select=id,displayName,childFolderCount&$top=100&includeHiddenFolders=true',
  ...
);
```

### 5. Deletion Sync (Delta API)
**File**: `convex/productivity/email/outlook.ts`

Added handling for `@removed` flag in delta sync responses. When Microsoft returns a message with `@removed`, we delete it from our DB.

```typescript
if (message['@removed']) {
  // Delete from our DB + body cache
  await ctx.db.delete(existing._id);
  continue;
}
```

### 6. Stale Message Cleanup (Phase A Sync)
**File**: `convex/productivity/email/outlook.ts`

Phase A (full folder sync) doesn't return `@removed` flags. Added `removeStaleMessages` mutation that compares what Microsoft returns vs what we have, deletes the difference.

```typescript
export const removeStaleMessages = mutation({
  args: {
    userId: v.id('admin_users'),
    folderId: v.string(),
    validMessageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get our messages for this folder
    // Compare with validMessageIds from Microsoft
    // Delete any that aren't in the valid set
  },
});
```

### 7. WARP Endpoint Try/Catch Fix
**Files**: All 8 `src/app/api/warp/*/route.ts` files

Moved `readSessionCookie()` inside the try/catch block. Previously, if the session cookie was invalid, it would throw before the try/catch. Now returns empty data gracefully instead of 401.

### 8. TypeScript Fix
**File**: `convex/productivity/email/outlook.ts`

Added null guard for `tokens` variable inside nested recursive function to satisfy TypeScript.

---

## WHAT'S NOT WORKING

### Deletion Sync Still Not Removing Emails

**The Problem**: User deletes email from Outlook desktop. Our app still shows it after sync.

**What We Tried**:
1. Added `@removed` handling for delta sync - this works for Phase B (incremental sync)
2. Added `removeStaleMessages` for Phase A (full sync) - should compare and delete

**Possible Issues**:
- The `removeStaleMessages` might not be getting called correctly
- The folder ID matching might be wrong
- Need to verify the mutation is actually running and what it's deleting

**To Debug**:
1. Check Convex logs during sync for `removeStaleMessages` output
2. Verify the `folderId` being passed matches what's in the DB
3. Confirm the `validMessageIds` array is populated correctly

---

## KEY FILES

| File | Purpose |
|------|---------|
| `convex/productivity/email/outlook.ts` | Main Outlook sync logic (folder fetch, message sync, OAuth) |
| `convex/productivity/email/sync.ts` | Sync orchestration (cooldowns, cron, intent-based refresh) |
| `convex/productivity/email/bodyCache.ts` | Email body caching with ring buffer eviction |
| `src/features/productivity/email-console/index.tsx` | Email UI component |

---

## SYNC ARCHITECTURE

### Two-Phase Sync
- **Phase A**: Full folder sync (fetches all messages, compares for stale cleanup)
- **Phase B**: Delta sync (uses Microsoft delta tokens, only gets changes)

### Sync Triggers
1. **Cron** (every 2 min): Processes accounts due for sync
2. **Manual Refresh**: User clicks button, bypasses cooldown
3. **Intent-based**: App focus, inbox open, network reconnect

### Folder Hierarchy
- Recursive subfolder fetch for nested folders (Fyxer AI creates `Inbox > Fyxer AI > 1: To respond`)
- `includeHiddenFolders=true` to catch Clutter

---

## NEXT STEPS

1. **Debug deletion sync** - Figure out why `removeStaleMessages` isn't working
2. **Test with fresh sync** - Disconnect/reconnect Outlook, verify full sync works
3. **Merge to main** - 47 commits ready when email is stable
4. **Gmail support** - Currently only Outlook implemented

---

## BRANCH STATUS

```
Branch: EMAIL-IMPLEMENTATION-PROJECT
Remote: Synced (pushed)
Ahead of main: 47 commits
Working tree: Clean
```

Merge to main when ready to deploy to production.
