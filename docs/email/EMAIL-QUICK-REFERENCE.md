# TRANSFOORM EMAIL — QUICK REFERENCE CARD

> **For the full specification, see:** `TRANSFOORM-EMAIL-COMPLETE-SPECIFICATION.md`

---

## WHAT IS IT?

**Email as an intake/promotion system, not a destination.**

Users don't live in email. They clear it, promote it, and exit.

---

## TWO MODES, ONE DATA

| Mode | Purpose | Primary Actions |
|------|---------|-----------------|
| **Live** | Trust + Familiarity | Read, Reply (traditional email) |
| **Impact** | Turn email into outcomes | Promote, Link, Resolve |

Same threads. Same sync. Different UX.

---

## THE THREE STATES

| State | Meaning | Visual |
|-------|---------|--------|
| **With Me** | Ball in my court | Orange dot, bold |
| **With Them** | I replied, waiting | Blue dot |
| **Done** | Conversation finished | Gray, dimmed |

Thread state is **derived** from message states, never stored.

---

## THE BIG 3 ACTIONS (Impact Mode)

```
PROMOTE → Task, Calendar, Pipeline, Note
LINK    → Project, Timeline, Notes
RESOLVE → Archive, Delete, Snooze, Mark "No Action"
```

Reply is secondary. Promotion is primary.

---

## SYNC STRATEGY (5-Layer System)

| Layer | What | Rule |
|-------|------|------|
| 1. Transport | Polling is baseline | Webhooks are opportunistic, never required |
| 2. Freshness | FUSE-timed prefetch | Work before intent, clicks never fetch |
| 3. Variance | Bounded cache | 0-100 bodies, dial as needed |
| 4. UX | Invisible sync | If user sees polling, it's wrong |
| 5. Trust | Explicit over implicit | No magic, no hidden filtering |

**The Rule:** "Polling is the system of record for correctness; webhooks are an accelerator for freshness."

---

## STORAGE STRATEGY

| What | Where | When |
|------|-------|------|
| Metadata (subject, sender, date) | Convex DB | Always synced |
| Email bodies | Fetched on-demand | When user opens |
| Body cache | Convex Storage | Optional, 0-100 bodies |

**Sync never fetches bodies.** Bodies are fetched on click or prefetched on hover.

---

## THE PREFETCH SECRET

```
Hover 300ms → Silently fetch body
User clicks → Body already cached → INSTANT
```

This is how we achieve desktop-like speed without storing everything.

---

## AI BOUNDARIES

| AI CAN | AI CANNOT |
|--------|-----------|
| Suggest states | Change states |
| Flag follow-ups | Auto-send reminders |
| Recommend links | Promote without approval |
| Rank notifications | Exceed 3/day budget |

---

## CANONICAL FOLDERS (6)

```
Inbox | Drafts | Sent | Archive | Trash | Spam
```

No folder tree. States replace folders.

---

## KEYBOARD SHORTCUTS

```
j/k     Navigate threads
Enter   Open thread
Esc     Close thread
e       Resolve
r       Reply
p       Promote to task
l       Link to project
```

---

## FORBIDDEN PATTERNS

- No loading spinners (FUSE architecture)
- No folder trees or labels
- No stars/flags (states replace them)
- No auto-state-change by AI
- No >3 notifications/day
- No storing bodies during sync
- No cloning Gmail/Outlook UI

---

## THE NORTH STAR

> "Users spend 80% less time in email, 200% more time in promoted tasks/projects."

---

## FILE LOCATIONS

| Document | Purpose |
|----------|---------|
| `TRANSFOORM-EMAIL-COMPLETE-SPECIFICATION.md` | Full canonical spec |
| `EMAIL-QUICK-REFERENCE.md` | This quick reference |
| `New Email Design Project/` | Source research & discussion |

---

*Quick reference v1.0 — 2025-12-30*
