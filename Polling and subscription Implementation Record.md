# Start with Phase 1.

Here’s the reasoning, clearly and decisively.

Why Phase 1 comes first (non-negotiable)

Phase 1 fixes a correctness-of-experience violation, not a cosmetic issue.

Right now:
	•	Background polling runs ~30 seconds
	•	It touches too much state
	•	It blocks UI paths
	•	It earns visibility because it behaves like a batch job

If you jump straight to Phase 2 (decoupling the sync button) without fixing Phase 1, you’ll only be hiding a broken process. The user won’t see the button light up, but they’ll still feel:
	•	sluggishness
	•	delayed interactions
	•	subtle freezes
	•	unexplained lag

That would violate the doctrine more deeply.

Phase ordering is intentional

The doctrine is already correctly sequenced:
	•	Phase 1 = make polling cheap
	•	Phase 2 = make polling invisible
	•	Phase 3 = make the UI predictive
	•	Phase 4 = make freshness faster

You cannot make something invisible until it is fast and scoped. Outlook Web works because its background work is already small.

What Phase 1 concretely achieves

When Phase 1 is done:
	•	Polling runtime is bounded (<2s)
	•	Scope is limited (active folder only)
	•	No full rescans
	•	No state wipes
	•	No long-held locks

At that point, polling becomes something you can safely decouple from UI state in Phase 2.

Why not “full plan mode” yet

A full plan across all phases is premature right now because:
	•	Phase 1 discoveries will inform Phase 2 boundaries
	•	You’ll likely delete code rather than refactor it
	•	Some “sync” concepts may disappear entirely once Phase 1 is done

Planning without first reshaping polling risks planning around broken assumptions.

Clear directive

Do this:
	1.	Take Phase 1
	2.	Treat it as a surgical reduction:
	•	reduce scope
	•	reduce runtime
	•	reduce surface area
	3.	When polling is cheap and boring, move to Phase 2

Once Phase 1 is complete, Phase 2 will be straightforward and low-risk.

Answer:
👉 Option 1 — Start with Phase 1: Fix the heavy polling that takes 30 seconds and blocks UI.

That is the correct first move.

# PHASE 1 PLAN

Phase 1: Fix Heavy Polling (Surgical Reduction)

 Problem Statement

 Current background polling takes ~30 seconds because:
 1. Folder fetch overhead (~10-15s): Fetches ALL folders recursively every sync
 2. All-folder scope (~15-20s): Syncs EVERY non-system folder sequentially
 3. No early bail-out: Even when nothing changed, full process runs
 4. UI blocking: isSyncing flag disables refresh button during background polls

 Target: <2 second background polling

 ---
 Surgical Cuts

 Cut 1: Cache folder structure (eliminate 10-15s overhead)

 Current: Every sync fetches folder hierarchy from Microsoft Graph recursively
 Fix: Skip folder fetch if cached within last hour

 File: /convex/productivity/email/outlook.ts
 - Add foldersCachedAt timestamp to account record
 - In syncOutlookMessages, check if folders cached < 1 hour ago
 - If cached: skip fetchAllFolders() call entirely
 - If stale or manual refresh: fetch folders as normal

 Estimated savings: 10-15 seconds

 ---
 Cut 2: Scope background polling to inbox-only

 Current: Syncs ALL folders (Inbox + Sent + Drafts + 47 custom folders)
 Fix: Background polling syncs only inbox. Full sync on manual refresh.

 File: /convex/productivity/email/outlook.ts
 - Add syncMode parameter: 'full' | 'inbox-only'
 - 'inbox-only': Filter syncableFolders to just inbox canonical
 - 'full': Current behavior (all folders)

 File: /convex/productivity/email/sync.ts
 - Cron calls with syncMode: 'inbox-only'
 - Manual refresh calls with syncMode: 'full'

 Estimated savings: If 20 folders, this is 19x reduction in scope

 ---
 Cut 3: Early bail-out when delta returns empty

 Current: Processes empty delta responses (stores 0 messages, saves token)
 Fix: Detect "no changes" and skip remaining folders

 File: /convex/productivity/email/outlook.ts
 - Track totalChanges across all folders in Phase B
 - If first folder returns 0 changes AND delta token was valid: consider bailing
 - Still save the delta token, but skip expensive operations

 Estimated savings: Variable, but significant for quiet inboxes

 ---
 Cut 4: Separate isSyncing for background vs user-initiated

 Current: Single isSyncing flag blocks refresh button for ALL sync types
 Fix: Two flags - isBackgroundPolling (invisible) and isSyncing (visible)

 File: /convex/productivity/email/outlook.ts
 - Add isBackgroundPolling field to account
 - Background cron sets isBackgroundPolling = true (UI ignores this)
 - Manual refresh sets isSyncing = true (UI shows spinner, disables button)

 File: /src/features/productivity/email-console/index.tsx
 - Refresh button disabled only when isSyncing (not isBackgroundPolling)
 - "Syncing..." text shown only for user-initiated syncs

 ---
 Implementation Order

 1. Cut 2 first (inbox-only scope) - Biggest impact, surgical change
 2. Cut 4 second (separate flags) - Removes UI blocking
 3. Cut 1 third (folder caching) - Eliminates overhead
 4. Cut 3 last (early bail-out) - Optimization polish

 ---
 Files to Modify

 | File                                               | Changes                                             |
 |----------------------------------------------------|-----------------------------------------------------|
 | /convex/productivity/email/outlook.ts              | Add syncMode param, folder caching, flag separation |
 | /convex/productivity/email/sync.ts                 | Pass syncMode: 'inbox-only' from cron               |
 | /src/features/productivity/email-console/index.tsx | Only block on isSyncing, ignore isBackgroundPolling |
 | /convex/schema.ts                                  | Add isBackgroundPolling, foldersCachedAt fields     |

 ---
 Success Criteria

 - Background poll completes in <2 seconds
 - Refresh button NOT disabled during background polling
 - "Syncing..." text NOT shown during background polling
 - Manual refresh still shows full sync feedback
 - Initial sync still syncs all folders with progress indicator

 ---
 What We're NOT Changing

 - Initial sync behavior (still syncs all folders, shows progress)
 - Manual refresh behavior (still syncs all folders, shows spinner)
 - Delta token management (still saves per-folder)
 - Two-phase sync architecture (Phase A / Phase B)