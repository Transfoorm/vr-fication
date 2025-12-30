# 5-Layer Email Strategy - Implementation Doctrine

Based on: `Polling and Subscription 5 Layer Strategy.md`

This is iron-clad because:
- Does not depend on undocumented APIs
- Does not require Exchange-only protocols
- Degrades gracefully when optimizations fail
- Already works in pieces today
- Aligns with how Outlook Web actually behaves

---

## Layer 1: Transport Layer (Honest Baseline)

### Three Sync Modes

**User-initiated = visible. System-initiated = invisible.**

| Mode | Trigger | Visibility | Behavior |
|------|---------|------------|----------|
| **Initial Sync** | Account connect | ✅ Visible | Sync button active, "Syncing..." tag, item count increases, user watches progress |
| **Manual Refresh** | User clicks refresh | ✅ Visible | Same as initial sync - user requested it, expects feedback |
| **Background Polling** | Automatic/timer | ❌ Invisible | No button, no spinner, no tag, completely silent |

**Rule**: User-initiated and system-initiated sync must never share UI affordances or execution paths. Merging them is how "heavy polling" creeps back in.

### Background Polling Optimization
- [ ] Cap polling runtime to < 2 seconds (currently ~30 seconds)
- [ ] Implement delta-only polling (skip full folder scans)
- [ ] Add early bail-out when delta token shows no changes
- [ ] **Maximum delta scope: active folder only** (never poll all folders)
- [ ] Remove UI blocking during poll operations

### Webhook Foundation (Future)
- [ ] Fix webhook subscription payload:
  - Change `resource` from `me/messages` to `/me/mailFolders('{folderId}')/messages`
  - Remove `deleted` from `changeType` (use delta sync instead)
  - Verify `notificationUrl` is publicly reachable
- [ ] Add webhook renewal cron (subscriptions expire in 3 days)
- [ ] Webhooks trigger delta sync, not replace it

---

## Layer 2: Freshness Layer (FUSE-Timed Intent)

### Immediate Rendering
- [ ] Inbox renders from FUSE store immediately (no fetch wait)
- [ ] Message list appears before polling completes
- [ ] Bodies prefetched on hover/focus, not on click

### Predictive Prefetch
- [ ] Prefetch next N messages in viewport
- [ ] Prefetch message bodies on keyboard navigation
- [ ] Clicks should reveal, not fetch
- [ ] **Prefetch cancellation**: Don't overfetch if user scrolls fast (debounce/abort)

---

## Layer 3: Variance Control (Bounded Persistence)

### Cache Boundaries
- [ ] Define working-set size (20 → 50 → 100 bodies)
- [ ] Implement LRU eviction for body blobs
- [ ] Older mail gracefully falls back to Graph fetch
- [ ] No "infinite sync" - working set only

### Blob Strategy
- [ ] Blobs are for predictability, not speed
- [ ] Clear cache sizing dial (user-configurable later)

---

## Layer 4: UX Doctrine (Invisible Background Work)

### Remove All Sync Visibility
- [ ] Polling NEVER lights up sync button
- [ ] Polling NEVER shows spinners
- [ ] Polling NEVER blocks user actions
- [ ] Polling NEVER wipes/resets state
- [ ] Remove `isSyncing` UI coupling entirely

### Mental Model Shift
- [ ] Rename internal concept from "sync" to "refresh hints"
- [ ] User sees: content, readiness, intent
- [ ] User never sees: sync, polling, background work

---

## Layer 5: Control & Trust (Explicit Over Implicit)

### Folder Transparency
- [x] Show exact folders Outlook has (done)
- [x] Root folder filtering matches Microsoft behavior (done)
- [x] Unread counts match Microsoft exactly (done)

### No Magic
- [ ] No hidden system filtering
- [ ] No "magic grouping" that eats data
- [ ] Everything inspectable and predictable
- [ ] **Unknown folders are rendered, not inferred** (show what exists, don't guess)

---

## Implementation Priority

### Phase 1: Fix Polling Shape (Critical)
1. Remove UI blocking during polls
2. Cap poll runtime to < 2 seconds
3. Scope to active folder only

### Phase 2: Invisible Polling (High)
4. Remove sync button state coupling
5. Remove spinners from polling
6. Background refresh without user awareness

### Phase 3: Prefetch Intelligence (Medium)
7. Prefetch on hover/focus
8. Viewport-based message prefetch
9. Body blob working-set management

### Phase 4: Webhook Optimization (Future)
10. Fix webhook subscription payload
11. Add subscription renewal
12. Webhooks as accelerator, not replacement

---

## Success Criteria

> "If the user can tell polling is happening, it's implemented incorrectly."

- [ ] No visible spinners during background refresh
- [ ] No blocked UI during polling
- [ ] Clicks feel instant (data already there)
- [ ] Polling completes in < 2 seconds
- [ ] User never waits for "sync"

---

## The North Star

> "At the moment the user intends to read, act, or decide, the system is already ready."

Not "messages are real-time" or "sync is fast" - those are mechanisms.
The outcome is: **readiness before intent**.
