# TRANSFOORM EMAIL COMPLETE SPECIFICATION

**THE DEFINITIVE GUIDE TO THE TRANSFOORM EMAIL SYSTEM**

> **Version:** 1.0 (Consolidated)
> **Status:** Canonical Reference
> **Last Consolidated:** 2025-12-30
> **Authors:** Ken Roberts (Product Owner), Claude (Architecture & Implementation)

---

## TABLE OF CONTENTS

1. [EXECUTIVE SUMMARY](#part-1-executive-summary)
2. [ORIGIN & VISION](#part-2-origin--vision)
3. [CORE PHILOSOPHY](#part-3-core-philosophy)
4. [THE TWO MODES: LIVE & IMPACT](#part-4-the-two-modes-live--impact)
5. [UX DOCTRINE](#part-5-ux-doctrine)
6. [DATA ARCHITECTURE](#part-6-data-architecture)
7. [CANONICAL EMAIL MODEL](#part-7-canonical-email-model)
8. [STORAGE & LIFECYCLE DOCTRINE](#part-8-storage--lifecycle-doctrine)
9. [BODY CACHE IMPLEMENTATION](#part-9-body-cache-implementation)
10. [THREAD STATE DERIVATION](#part-10-thread-state-derivation)
11. [AI & AUTOMATION BOUNDARIES](#part-11-ai--automation-boundaries)
12. [IMPLEMENTATION PHASES](#part-12-implementation-phases)
13. [COMPONENT SPECIFICATIONS](#part-13-component-specifications)
14. [SUCCESS METRICS](#part-14-success-metrics)
15. [FORBIDDEN PATTERNS](#part-15-forbidden-patterns)
16. [GLOSSARY](#part-16-glossary)

---

# PART 1: EXECUTIVE SUMMARY

## What Is Transfoorm Email?

Transfoorm Email is **not another email client**. It is an intelligent intake, triage, and promotion system designed to help transformation leaders (coaches, facilitators, change agents) **escape email** — not live in it.

## The One-Sentence Description

> **"Email is not a destination. It's an intake, triage, and promotion system that turns messages into outcomes."**

## Key Differentiators

| Traditional Email | Transfoorm Email |
|------------------|------------------|
| Inbox is where you live | Inbox is a queue you clear |
| Reply is the primary action | Promote/Resolve are primary actions |
| Folders organize messages | Resolution states drive workflow |
| Read/unread is the main indicator | With Me/With Them/Done states |
| Email stays in email | Email promotes to Tasks, Projects, Calendar |
| Loading spinners everywhere | Zero loading states (FUSE architecture) |

## The North Star

> **"Users spend 80% less time in email, 200% more time in promoted tasks/projects."**

---

# PART 2: ORIGIN & VISION

## The Problem We're Solving

Modern transformation leaders — coaches, facilitators, change agents — spend 2-3 hours daily trapped in email. They would rather be:
- Guiding clients through breakthroughs
- Facilitating transformation
- Creating lasting change

Email is a productivity black hole that interrupts flow states with:
- Constant checking
- Unclear priorities
- No sense of completion
- Actions scattered across systems

## The Research Foundation

### User Persona: The Transformation Leader

**Representative User: Sasha Leevey**
- 25-year-old wedding photographer (similar workflow patterns)
- $120K/year revenue
- Spends 2-3 hours daily on email
- **Goal:** Reduce to 1 hour/day
- **Frustrations:** Too formal, redundant tasks, never reaches inbox zero
- **Current Tools:** MS Office, Outlook for Gmail, iOS Calendar, Slack

### Competitive Analysis

Research examined modern email clients:

| App | Key Pattern Learned |
|-----|---------------------|
| Airmail | Smart inbox on/off toggle |
| Spark | Smart categorization by email type |
| Canary | Clean command tab, chat-like window |
| Slack | Channel organization |
| Linear | Queue + state + fast resolution |
| Notion | Metadata-first, content second |
| GitHub Issues | State-driven, not message-driven |

### Critical User Testing Finding

> **70% of respondents found three-column layouts confusing.**
> Scanning from one end to the other when switching channels or reading conversations required too much cognitive effort.

**Result:** Simplified two-pane feel with intelligence rail as primary surface.

## How Transfoorm Email Fits Into the Platform

Transfoorm is the world's greatest coaching and facilitation management platform. Email is one intake channel that feeds into:

- **Tasks** — Action items promoted from email
- **Projects** — Contextual groupings linked to email threads
- **Calendar/Bookings** — Meetings scheduled from email
- **Decisions** — Tracked outcomes from email discussions
- **Client Records** — Communication history

**Email is the intake funnel. The rest of Transfoorm is where work happens.**

---

# PART 3: CORE PHILOSOPHY

## The Three Sacred Rules

### Rule 1: STATE OWNERSHIP BOUNDARY

**"AI suggests. Humans commit."**

| AI CAN | AI CANNOT |
|--------|-----------|
| Analyze intent, priority, promotions | Autonomously change resolutionState |
| Flag likely "awaiting_me" or "awaiting_them" | Promote emails to tasks without approval |
| Detect follow-up opportunities | Mark emails as resolved |
| Recommend linking to tasks/projects | Delete or archive without permission |
| Classify senders (human vs automated) | Send follow-ups automatically |

**Why:** Trust. Users must feel in control. AI assists, never commands.

### Rule 2: NOTIFICATION BUDGET

**"Maximum 3 proactive notifications per day."**

- AI must rank and prioritize
- Only the top 3 most urgent items get notifications
- No notification creep over time
- Hard cap enforced at system level

**Why:** Fast systems must be respectful systems. 10 notifications = 0 notifications (user ignores all).

### Rule 3: PROMOTION REVERSIBILITY

**"Every promotion must be undoable and unlinkable."**

- Promoted email → task? User can undo within 30 seconds
- Linked email → project? User can unlink and restore to inbox later
- Fast actions require fast forgiveness
- No permanent consequences from quick clicks

**Why:** Fast systems without forgiveness = anxiety.

## The Four Architectural Laws

### Law 1: THREAD STATE DERIVATION

Thread-level state is derived from message-level states, never stored.

```
If ANY message is awaiting_me → thread is awaiting_me
If ALL messages are resolved → thread is resolved
If last message sent by me + no reply → awaiting_them
Default → none
```

### Law 2: SEARCH VS STATE SEMANTICS

Search is exhaustive. Inbox views are opinionated.

- **Inbox view:** Filtered by resolution state
- **Search view:** Spans ALL states, no filtering

**Why:** Prevents "system ate my email" panic.

### Law 3: METADATA-ONLY SYNC

Store metadata index (lightweight), fetch content on-demand.

| Stored (Convex) | Fetched On-Demand |
|-----------------|-------------------|
| Subject, sender, date | Full email body |
| Snippet (first 200 chars) | Attachments |
| Resolution state, AI metadata | Full thread history |
| Folder, timestamps | Images |

**Why:** Matches desktop Outlook's "Cached Exchange Mode" pattern.

### Law 4: SENDER CLASSIFICATION

Classify senders, suppress notifications for low-value categories.

| Classification | Notification Behavior |
|---------------|----------------------|
| human | Full notifications |
| automated | Suppress (GitHub, Jira, CI/CD) |
| transactional | Suppress unless urgent |
| marketing | Always suppress |
| system | High priority (password resets) |

---

# PART 4: THE TWO MODES: LIVE & IMPACT

## The Core Mental Model

Transfoorm Email has two modes operating on the same data:

| Mode | Purpose | Feel |
|------|---------|------|
| **Live** | Trust + Familiarity | Standard email, safe, unsurprising |
| **Impact** | Turn email into outcomes | Outcome-driven, action-focused |

**This is not two inboxes. It is one email system with two action grammars.**

Same threads. Same sync. Same storage. Different defaults and affordances.

## Live Mode (Baseline)

**Purpose:** Trust + Familiarity

- Standard email reading/replying
- Thread list + reading pane
- Traditional affordances
- No pressure to "act"
- **This mode must feel safe and unsurprising**

Live mode exists so users trust the system.

### Responsive Mailbox Rail

- On wide viewports: Persistent column
- On narrow viewports: Collapses to header dropdown
- Breakpoint-driven, non-configurable
- No "show/hide" toggle — system decides based on available space

## Impact Mode (Primary Differentiator)

**Purpose:** Turn email into outcomes

Impact mode applies a different action grammar to the same threads.

### Three-Pane Console Layout

```
┌────────────────────┬─────────────────────────────────────┬────────────────────────┐
│  RESOLUTION QUEUE  │  CONVERSATION (Transient)           │  INTELLIGENCE RAIL     │
│  (Left Pane)       │  (Center Pane)                      │  (Right Pane)          │
│                    │                                     │                        │
│  • State filters   │  • Chat-style bubbles               │  • Thread state        │
│  • Thread list     │  • Minimal chrome                   │  • AI insights         │
│  • Search          │  • Reply is secondary               │  • Linked objects      │
│                    │                                     │  • Temporal data       │
│  Width: 320-400px  │  Width: Flexible                    │  Width: 320-380px      │
└────────────────────┴─────────────────────────────────────┴────────────────────────┘
```

### The "Big 3" Actions

Impact mode exposes exactly three primary actions. Nothing else is promoted to first-class. All three are split buttons:

#### 1. PROMOTE

**Primary action:** → Promote to Task

**Dropdown options:**
- Promote to Task
- Promote to Calendar
- Promote to Pipeline
- Promote to Note

**Intent:** "Promote" means elevate email into work. Intent comes first, destination second.

#### 2. LINK

**Primary action:** → Link to Project (AI-suggested)

**Dropdown options:**
- Link to Project...
- Create New Project
- Pin to Timeline / Gantt
- Attach to Notes
- Reference Only (no state change)

**Intent:** Linking provides context, not commitment.

#### 3. RESOLVE

**Primary action:** → Resolve Thread

**Dropdown options:**
- Resolve & Archive
- Resolve & Delete
- Snooze
- Mark "No Action"
- Undo Resolution (time-boxed)

**Intent:** "Resolve" is psychologically final but neutral. Dangerous verbs (Delete) never appear on the main path.

---

# PART 5: UX DOCTRINE

## The Forbidden Clone

**DO NOT CLONE OUTLOOK.**
**DO NOT CLONE GMAIL.**
**DO NOT CLONE SUPERHUMAN.**

Not visually. Not structurally. Not mentally.

## The Core Distinction

| Outlook/Gmail Optimize For | Transfoorm Optimizes For |
|---------------------------|-------------------------|
| "Staying inside email" | "Exiting email as fast as possible" |

If it looks like email, users will use it like email.
If it looks like a system, they will use it like one.

## The Three False Assumptions (To Avoid)

### Assumption 1: The inbox is the destination
**Truth:** The inbox is a queue to clear, not a place to live.

### Assumption 2: Reading is the core action
**Truth:** Promotion/resolution are the core actions. Reading is transient.

### Assumption 3: Context lives elsewhere
**Truth:** The intelligence rail brings context INTO the email view.

## The Four Visual Zones

### Zone 1: INBOX AS QUEUE (Left Panel)

**What it is:** A work queue, not a storage folder.

**Visual properties:**
- Flat list (no nested hierarchy obsession)
- High density (50-60 threads visible without scrolling)
- Minimal chrome (no decorative borders)
- Strong state indicators (awaiting_me = orange dot, bold)

**Each row answers immediately:**
1. Who is this from?
2. Why is it here? (state badge)
3. Am I needed? (visual weight)

### Zone 2: CENTER PANEL IS TRANSIENT (Middle Panel)

**Critical mindset shift:**
- In Gmail/Outlook: Message body feels **permanent**
- In Transfoorm: Message body feels **temporary**

**Visual properties:**
- Clean, almost "reader mode"
- No heavy borders or container chrome
- Fast transitions in/out
- Chat-style message bubbles

**The body is something you pass through, not settle into.**

### Zone 3: RIGHT RAIL IS PRIMARY INTELLIGENCE (Right Panel)

**This is where you break from every mainstream email app.**

The right rail is the **primary intelligence surface**.

**It answers:**
1. What is this connected to? (linked tasks/projects)
2. What does the system think? (AI intent, priority, suggestions)
3. What should happen next? (promotion actions)

**If you removed the email body entirely, the right rail should still explain why this email matters.**

**Sections (priority order):**
1. Thread State — Current state badge + quick actions
2. AI Analysis — Intent, priority, extracted insights
3. Primary Actions — Promotion buttons (dominant CTAs)
4. Linked Objects — Tasks/projects/bookings connected
5. Temporal — Follow-up detection, timing data
6. Sender Profile — Classification, history, patterns

### Zone 4: ACTIONS ARE INVERTED (Bottom Bar)

**The critical inversion:**

| Gmail | Transfoorm |
|-------|------------|
| Reply is primary | Promote/Resolve/Link are primary |
| Everything else secondary | Reply is secondary |

## Visual Language

### Typography

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
```

### State Colors

```css
--state-awaiting-me: #F97316;      /* Orange 600 — "With Me" */
--state-awaiting-them: #3B82F6;    /* Blue 600 — "With Them" */
--state-resolved: #9CA3AF;         /* Gray 400 — "Done" */
--state-none: transparent;
```

### Animation Principles

```css
--duration-instant: 0ms;           /* State updates */
--duration-fast: 150ms;            /* Hover, focus */
--duration-normal: 250ms;          /* Transitions */
```

**What gets animated:** Thread selection, state changes, hover states, modal open/close.

**What does NOT get animated:** Spinners, skeleton loaders, progress bars, decorative flourishes.

**Why:** Fast systems don't have time to animate loading states.

## Keyboard Navigation

```
j/k          Navigate up/down threads
Enter        Open selected thread
Esc          Close thread
e            Resolve thread
r            Reply
p            Promote to task
l            Link to project
/            Focus search
g a          Go to "With Me"
g t          Go to "With Them"
g r          Go to "Done"
```

---

# PART 5B: THE 5-LAYER SYNC STRATEGY

## The Uncomfortable Truth

You cannot beat Outlook Desktop on transport mechanics.
You can beat every web email product on **perceived speed, control, and clarity**.

Zoho, Fastmail, etc. all fail because they:
- Pretend polling = push
- Over-sync everything
- Block UI during refresh
- Mix correctness with freshness
- Let architecture leak into UX

**Your advantage is that you separated these concerns early.**

## The Winning Strategy

> **We do not chase real-time transport. We eliminate user-perceived waiting.**

That distinction is the entire game.

## Layer 1: TRANSPORT (Honest Baseline)

**Polling is baseline. Webhooks are opportunistic.**

### The Three Sync Modes

**User-initiated = visible. System-initiated = invisible.**

| Mode | Trigger | Visibility | Behavior |
|------|---------|------------|----------|
| **Initial Sync** | Account connect | Visible | Sync button active, progress shown, user watches |
| **Manual Refresh** | User clicks refresh | Visible | Same as initial — user requested it, expects feedback |
| **Background Polling** | Automatic/timer | Invisible | No button, no spinner, completely silent |

**Rule:** User-initiated and system-initiated sync must never share UI affordances or execution paths. Merging them is how "heavy polling" creeps back in.

### Polling Principles

| Principle | Implementation |
|-----------|---------------|
| Polling is first-class, not a fallback | It is the guaranteed, always-works sync mechanism |
| Polling is delta-only | Never full scans |
| Polling is scoped | **Active folder only** — never poll all folders |
| Polling is capped | < 2 second runtime |
| Polling is invisible | No UI blocking, no "sync button" |
| Webhooks are never required | They reduce latency, not provide correctness |

**The codified rule:**

> "Polling is the system of record for sync correctness; webhooks are an opportunistic accelerator for perceived freshness."

### What Outlook Desktop Does (And Why You Can't Copy It)

Outlook Desktop uses **push-based protocols**:
- MAPI over HTTP (modern Outlook)
- Historically RPC over HTTP
- Mobile uses Exchange ActiveSync

These are stateful, server-driven connections. The server tells the client "new mail arrived."

**Graph does not give you:**
- Persistent connections
- Mailbox push streams
- Per-message change events without subscriptions

**Your choices are:** Smart polling, Webhooks, or Hybrid. No fourth option.

### What Outlook Web Does (Your Real Comparison)

Outlook Web **does poll** — but you never feel it.

| System | Polls? | User Feels It? |
|--------|--------|----------------|
| Outlook Desktop | No | No |
| Outlook Web | Yes (smart) | No |
| Your Current Impl | Yes (heavy) | Yes |

OWA uses:
- Long-lived HTTPS connections
- Very small delta queries (sub-second)
- Aggressive client caching
- Background refreshes
- **UI never blocks on "sync"**

**The single rule:**

> "If the user can tell polling is happening, it's implemented incorrectly."

## Layer 2: FRESHNESS (FUSE-Timed Intent)

This is where you already outperform competitors.

| Principle | Implementation |
|-----------|---------------|
| Inbox renders immediately | No wait, data already in FUSE store |
| Prefetch triggers before intent | Viewport, hover, keyboard focus |
| Clicks never fetch | Body already in memory |
| Work is time-shifted | Not faster APIs, smarter timing |

**Zoho doesn't do this correctly. Outlook Web does it partially. You do it fully.**

## Layer 3: VARIANCE CONTROL (Bounded Persistence)

| Principle | Implementation |
|-----------|---------------|
| Blobs are for predictability, not speed | Cache exists to reduce variance |
| Cache size is dialed | 20 → 50 → 100 based on observed need |
| Older mail gracefully degrades | Falls back to Graph fetch |
| No "infinite sync" fantasies | Working-set optimization only |

This keeps the system honest and fast.

## Layer 4: UX DOCTRINE (Never Announce Background Work)

**This is non-negotiable:**

| Rule | Meaning |
|------|---------|
| Polling never lights buttons | No visual indication of sync |
| Polling never blocks interaction | User can always act |
| Polling never wipes state | Data only grows, never resets |
| "Sync" is not a user concept | Users don't know or care about sync |

**User only sees:**
- Content
- Readiness
- Intent response

## Layer 5: CONTROL & TRUST (Explicit Over Implicit)

This is how you beat Zoho emotionally:

| Principle | Implementation |
|-----------|---------------|
| Users see exact folders Outlook has | No hidden filtering |
| No "magic grouping" that eats data | Everything is explicit |
| No lies about security | Honest about what we can/can't do |
| No pretending to be native | Web-first, honest about it |

Everything is:
- Explicit
- Reversible
- Inspectable
- Predictable

**That earns trust.**

## Why This Is Not Pie In The Sky

Every part of this already exists in production systems:

| Product | Proven Mechanic |
|---------|-----------------|
| Outlook Web | Polling + delta + caching |
| Gmail | Aggressive prefetch + sandboxing |
| Slack | Intent-based loading |
| Notion | Local memory + background refresh |
| VS Code Web | Illusion of desktop via timing, not transport |

**You are not inventing new physics. You are combining proven mechanics with discipline.**

## The FUSE North Star

> **At the moment the user intends to read, act, or decide, the system is already ready.**

Not "messages are real-time" or "sync is fast" or "polling is hidden."

Those are mechanisms. **Ready when needed** is the outcome.

## Implementation Priority (4 Phases)

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

## Sync Success Criteria

- [ ] No visible spinners during background refresh
- [ ] No blocked UI during polling
- [ ] Clicks feel instant (data already there)
- [ ] Polling completes in < 2 seconds
- [ ] User never waits for "sync"

---

# PART 6: DATA ARCHITECTURE

## The Three Storage Tiers

| Tier | Technology | Purpose | Lifecycle |
|------|------------|---------|-----------|
| **HOT** | Convex Tables | Queryable metadata, instant access | Permanent until deleted |
| **WARM** | Convex Storage | User-owned assets (avatars, logos), cached bodies | Permanent or TTL-based |
| **COLD** | External (S3/R2) or On-Demand | Large/temporary content (email bodies) | Cached or fetched live |

## What Goes Where

### HOT TIER (Convex Tables) — Always Synced

```
admin_users           → User identity, preferences
email_Accounts        → OAuth tokens, sync state
email_Index           → Email metadata (subject, from, date, read status)
email_Folders         → Folder structure, delta tokens
```

**Principle:** Only store what you need to QUERY or display in lists.

### WARM TIER (Convex Storage) — User Assets + Body Cache

```
User avatars          → Uploaded once, displayed everywhere
Brand logos           → Uploaded once, displayed everywhere
Email body cache      → Bounded ring buffer (100 bodies per account)
```

**Principle:** User-owned content + acceleration cache.

### COLD TIER — Email Bodies & Attachments

**Strategy: On-Demand Fetch with Optional Cache**

```
User clicks email → Check cache → If miss, fetch from Microsoft Graph → Display → Cache for next time
```

## Sync Strategy

| Data | Sync Behavior | Storage |
|------|---------------|---------|
| Folder list | Full sync on connect | Convex table |
| Email headers | Delta sync (incremental) | Convex table |
| Email bodies | ON-DEMAND (fetch when opened) | Cache optional |
| Attachments | ON-DEMAND (fetch when clicked) | Not stored |
| Read status | Sync both directions | Convex + Microsoft |

---

# PART 7: CANONICAL EMAIL MODEL

## Provider-Agnostic Classification

**Core Principle:** "If a user sees an email in Gmail / Outlook / Yahoo web UI, they can always find it in Transfoorm."

## Two Separate State Systems

### 1. Resolution State (Transfoorm Workflow)

Where is this email in *your* workflow?

| State | Meaning |
|-------|---------|
| `with_me` | Requires my action/response |
| `with_them` | I responded, waiting for their reply |
| `done` | Conversation concluded |
| `none` | Not yet categorized |

**Storage:** `resolutionState` field (single value per message)

### 2. Canonical States (Provider Metadata)

What properties does the provider assign?

| State | Provider Source |
|-------|-----------------|
| `unread` | Gmail UNREAD label, Outlook isRead=false |
| `starred` | Gmail STARRED, Outlook flagged |
| `important` | Gmail IMPORTANT, Outlook high importance |
| `snoozed` | Gmail SNOOZED label |
| `focused` | Outlook Focused Inbox |
| `other` | Outlook Other Inbox |

**Storage:** `canonicalStates[]` field (array — multiple can apply)

**Key Point:** These are SEPARATE. `canonicalStates` is provider metadata. `resolutionState` is Transfoorm workflow.

## Canonical Folders

### UI-Visible Folders (6)

| Folder | Purpose |
|--------|---------|
| Inbox | Active incoming mail |
| Drafts | Unsent messages |
| Sent | Messages I sent |
| Archive | Processed but kept |
| Trash | Deleted items |
| Spam | Junk/spam |

## Provider Mapping

### Gmail Mapping

| Gmail Source | Canonical Folder | Canonical State(s) |
|--------------|------------------|-------------------|
| INBOX label | `inbox` | — |
| SENT label | `sent` | — |
| DRAFT label | `drafts` | — |
| All Mail (no labels) | `archive` | — |
| SPAM label | `spam` | — |
| TRASH label | `trash` | — |
| STARRED label | — | `starred` |
| IMPORTANT label | — | `important` |

**Priority Logic:** TRASH > SPAM > DRAFT > SENT > INBOX > SCHEDULED > CHAT > ARCHIVE

### Outlook Mapping

| Outlook Source | Canonical Folder | Canonical State(s) |
|----------------|------------------|-------------------|
| Inbox | `inbox` | — |
| Sent Items | `sent` | — |
| Drafts | `drafts` | — |
| Archive | `archive` | — |
| Junk Email | `spam` | — |
| Deleted Items | `trash` | — |
| Focused Inbox | `inbox` | `focused` |
| Other Inbox | `inbox` | `other` |
| Flagged | — | `starred` |

---

# PART 8: STORAGE & LIFECYCLE DOCTRINE

## The Three Principles

1. **Store only what you must query** — Everything else is fetched on-demand
2. **Delete means DELETE** — Full cascade, no orphans, ever
3. **VANISH means ZERO TRACE** — Complete erasure within 30 days (GDPR)

## The Graduated Capability Model

**Three layers, each building on the last:**

| Layer | Name | What | Who Gets It | Feel |
|-------|------|------|-------------|------|
| 0 | Baseline | On-demand fetch + prefetch | Everyone | Outlook web parity |
| 1 | Working Set Cache | 100-body ring buffer | Everyone (silent) | Near-desktop |
| 2 | Local Storage | Opt-in filesystem | Power users (future) | True desktop |

**The North Star:** First 100 emails feel desktop-like.

## The Key Insight: Prefetch

> "Not because you stored it during sync, but because you fetched it 500ms before they clicked."

```
User sees email in list
  → Silently fetch body in background (on hover/focus/selection)
  → Cache it
  → User clicks
  → Body already there = INSTANT
```

Prefetch + cache = perceived instant opens.

## Codified Rules

### CACHE LOSS INVARIANT

```
If the entire body cache is deleted, corrupted, or unavailable:
- Navigation must not break
- Email list must not break
- Opening an email must succeed (via fallback fetch)
- No user-facing errors may surface
- The only perceptible difference is a brief fetch delay
```

### CONVEX STORAGE CACHE RULE

```
Bodies stored in Convex Storage must be:
- Opaque blobs (no parsing, no indexing, no searching)
- Non-queryable (no "find emails containing X" against cache)
- Strictly evicted (ring buffer, no exceptions)
- Treated as disposable (deletion must never require cache presence)
```

### GRADUATED ENABLEMENT RULE

```
Cache size is a tunable parameter, not a fixed architecture decision.
System must function correctly at CACHE_SIZE = 0 (pure on-demand).
Cache size may be increased (0 → 20 → 50 → 100) without code changes.
```

### PREFETCH DOCTRINE

```
The system must silently fetch email bodies BEFORE the user clicks:
- Hover: 300ms dwell triggers prefetch
- Keyboard focus: Arrow-key navigation triggers prefetch
- Selection: Single-click (highlight) triggers prefetch
- Viewport: Top N visible emails prefetch on list render

Prefetch is:
- Silent (no UI indication)
- Non-blocking (fails silently if network slow)
- Rate-limited (max 5 concurrent prefetch requests)
- Cache-populating (prefetched bodies enter the ring buffer)
```

### PER-ACCOUNT GRANULARITY

```
Cache limits are enforced per email account, not per user.
- User with 1 account: up to 100 bodies
- User with 2 accounts: up to 200 bodies (100 each)
```

### ORPHAN ASSUMPTION RULE

```
All storage systems must be treated as potentially leaky.
Orphan detection and cleanup is a required operational capability.
```

## Cascade Delete Rules

**When a parent is deleted, ALL children must be deleted. No orphans. Ever.**

```
USER DELETED
  └── All email_Accounts deleted
        └── All email_Folders deleted
        └── All email_Index deleted
              └── All email_BodyCache deleted
                    └── All storage blobs deleted
        └── All email_SenderCache deleted
        └── All webhook_Subscriptions deleted
  └── Avatar storage blob deleted
  └── Brand logo storage blob deleted
  └── All settings deleted
```

---

# PART 9: BODY CACHE IMPLEMENTATION

## Schema

```typescript
productivity_email_BodyCache: defineTable({
  // Identity
  accountId: v.id("productivity_email_Accounts"),
  messageId: v.string(), // External message ID from Microsoft/Google

  // Storage reference
  storageId: v.id("_storage"), // Convex Storage blob ID

  // Metadata for eviction
  cachedAt: v.number(),  // Timestamp when cached
  size: v.number(),      // Body size in bytes

  // Lifecycle
  createdAt: v.number(),
})
  .index("by_account", ["accountId"])
  .index("by_message", ["messageId"])
  .index("by_account_oldest", ["accountId", "cachedAt"])
```

## Configuration

```typescript
export const CACHE_CONFIG = {
  /**
   * Maximum bodies to cache per email account.
   * 0 = Pure on-demand | 20 = Friction smoother | 50 = Working set | 100 = Full Layer 1
   */
  maxBodiesPerAccount: 0,  // Start at 0, dial up based on feedback

  /**
   * Maximum age before body is evicted (days).
   */
  ttlDays: 14,

  /**
   * Whether prefetch is enabled.
   */
  prefetchEnabled: true,

  /**
   * Maximum concurrent prefetch requests.
   */
  maxConcurrentPrefetch: 5,
} as const;
```

## Core Algorithm: Get Email Body

```typescript
async function getEmailBody(userId, messageId) {
  // Step 1: Try cache first (fast path)
  const cached = await getCachedBody(messageId);
  if (cached) {
    const blob = await storage.get(cached.storageId);
    if (blob) return { body: await blob.text(), fromCache: true };
  }

  // Step 2: Fetch from Microsoft Graph (always works if token valid)
  const body = await fetchFromMicrosoftGraph(messageId);

  // Step 3: Populate cache for next time (fire and forget)
  cacheBody(userId, messageId, body).catch(() => {
    // Cache failure is silent — system still works
  });

  return { body, fromCache: false };
}
```

## Eviction Logic: Ring Buffer

```typescript
async function evictOldestIfNeeded(accountId) {
  const entries = await db.query("productivity_email_BodyCache")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();

  if (entries.length <= CACHE_CONFIG.maxBodiesPerAccount) return;

  // Sort by cachedAt (oldest first)
  entries.sort((a, b) => a.cachedAt - b.cachedAt);

  // Delete oldest until at limit
  const toDelete = entries.slice(0, entries.length - max);

  for (const entry of toDelete) {
    await storage.delete(entry.storageId);
    await db.delete(entry._id);
  }
}
```

---

# PART 10: THREAD STATE DERIVATION

## The Problem

Email threads contain multiple messages. Each message can have a different `resolutionState`:

```
Thread: "Q4 Planning Meeting"
├─ Message 1: "Can we meet Friday?" (with_them)
├─ Message 2: "Yes, 2pm works" (with_me)
└─ Message 3: "Great, see you then" (done)
```

**Question:** What is the thread's state?

**Answer:** Derive a single thread state from message states algorithmically.

## The Algorithm

```typescript
function deriveThreadState(messages, currentUserEmail) {
  const sorted = messages.sort((a, b) => b.timestamp - a.timestamp);
  const lastMessage = sorted[0];

  // Rule 1: If ANY message is with_me → thread is with_me
  if (messages.some(m => m.resolutionState === "with_me")) {
    return "with_me";
  }

  // Rule 2: If ALL messages are done → thread is done
  if (messages.every(m => m.resolutionState === "done")) {
    return "done";
  }

  // Rule 3: If last message from me + not with_me → with_them
  if (lastMessage.from.email === currentUserEmail) {
    return "with_them";
  }

  // Rule 4: Default to "none"
  return "none";
}
```

## Key Invariants

1. **Thread state is NEVER stored** — only computed on every read
2. **Derivation is deterministic** — same messages = same thread state
3. **Message states can be changed independently** — thread auto-updates
4. **Performance is O(n)** — scales linearly with thread size

---

# PART 11: AI & AUTOMATION BOUNDARIES

## What AI Can Do

- Analyze intent (action_required, scheduling, decision, reference)
- Detect priority (urgent, normal, low)
- Suggest promotions to tasks/projects/bookings
- Monitor temporal patterns (follow-up detection)
- Classify senders (human vs automated)
- Flag likely state (with_me vs with_them)
- Rank notification candidates

## What AI Cannot Do

- Autonomously change `resolutionState`
- Send emails without user approval
- Delete or archive emails
- Promote to tasks without user click
- Exceed 3 notifications per day
- Override user's manual classifications
- Access email content without user opening it

## AI Agent Architecture

```typescript
// Agent runs every 15 minutes (background job)
export const emailTriageAgent = internalMutation({
  handler: async (ctx) => {
    // 1. Fetch new emails (last 15 min)
    const newEmails = await getRecentEmails(ctx);

    // 2. Classify senders (cache lookup + AI if new)
    for (const email of newEmails) {
      const sender = await classifySender(ctx, email.from.email);

      // 3. Analyze intent + priority (only for human senders)
      if (sender.classification === "human") {
        const analysis = await analyzeEmail(email);

        await ctx.db.patch(email._id, {
          aiIntent: analysis.intent,
          aiPriority: analysis.priority,
          aiSuggestedState: analysis.suggestedState,
          aiSuggestedLinks: analysis.suggestedLinks
        });
      }
    }

    // 4. Temporal monitoring (follow-up detection)
    await detectFollowUps(ctx);

    // 5. Notification ranking (respect budget)
    await rankNotificationCandidates(ctx);
  }
});
```

## Temporal Monitoring: Follow-Up Detection

**Scenario 1: I sent email, no reply**
```
If lastMessage from me AND Date.now() - lastMessage.timestamp > 3 days:
  → Flag as follow-up candidate
  → aiReason: "You sent this 3 days ago, no reply yet"
```

**Scenario 2: They promised reply by date**
```
AI extracts "I'll get back to you by Friday" from email body
If Date.now() > expectedReplyBy:
  → aiReason: "They said they'd reply by Friday, it's now Monday"
```

---

# PART 12: IMPLEMENTATION PHASES

## Phase 1: Web-Style Email (Current)

**Goal:** Correctness and UX foundation.

- Sync: Metadata + HTML bodies
- Storage: Convex DB for structured data
- Rendering: Text/HTML only (images may be missing)
- Outcome: Inbox, threads, states, actions work correctly

**This phase is intentionally Outlook Web–like.**

## Phase 2: Asset Pipeline (Next Mandatory Step)

**Goal:** Make emails visually correct.

For every email body:
1. Parse and classify image references (Base64, CID, External URL)
2. Store assets (Convex storage → S3/R2 later)
3. Rewrite HTML (replace src with Transfoorm-controlled asset URLs)
4. Render (images load instantly, no external dependency)

**Result:** Desktop-class rendering.

## Phase 3: Full Impact Mode

**Goal:** Complete the Impact mode experience.

- Resolution states fully implemented
- AI triage agent active
- Promotion engine complete (Task, Project, Calendar, Decision)
- Intelligence rail fully populated
- Temporal monitoring active

## Phase 4: Storage Migration (Later, Mechanical)

**Goal:** Scalability and cost control.

- Swap asset backend: Convex storage → S3/R2
- Keep: Asset IDs, HTML references, client behavior
- Zero UI or schema changes

---

# PART 13: COMPONENT SPECIFICATIONS

## Thread Row Component

```typescript
<ThreadRow
  state="with_me"
  selected={true}
  unread={true}
>
  <StateDot state="with_me" />        // Orange dot
  <Avatar src={sender.avatar} />
  <SenderName weight={600}>Sarah Chen</SenderName>
  <Subject truncate>Q4 Planning...</Subject>
  <Timestamp>2:34 PM</Timestamp>
  <StateBadge state="with_me">WITH ME</StateBadge>
</ThreadRow>
```

**Visual Properties:**
- Height: 64px
- Padding: 12px 16px
- State dot: 8px circle with glow effect
- Hover: Subtle background change
- Selected: Left border accent (3px brand color) + warm background

## State Badge Component

```typescript
<StateBadge state="with_me">WITH ME</StateBadge>
```

**Visual Properties:**
- Shape: Pill (rounded-full)
- Font: 11px, uppercase, letter-spacing 0.05em
- Colors:
  - `with_me`: Orange bg (#fff6f4), orange text (#e53606)
  - `with_them`: Blue bg (#dbeafe), blue text (#1d4ed8)
  - `done`: Gray bg (#f3f4f6), gray text (#6b7280)

## Message Bubble Component

```typescript
<MessageBubble
  direction="incoming"  // or "outgoing"
  message={message}
>
  <BubbleHeader>
    <Avatar /><SenderName /><Timestamp />
  </BubbleHeader>
  <BubbleBody>{message.body}</BubbleBody>
  <BubbleFooter>
    <ReplyIcon /><ReplyAllIcon /><ForwardIcon />
  </BubbleFooter>
</MessageBubble>
```

**Visual Properties:**
- Incoming: Left-aligned, `--bg-secondary` background
- Outgoing: Right-aligned, `--brand-faint` background
- Border radius: 12px
- Max width: 80% of container

## Promotion Button Component

```typescript
<PromotionButton variant="primary" icon="arrow-right">
  Promote to Task
</PromotionButton>
```

**Visual Properties:**
- Full width in rail
- Brand gradient background
- White text
- Icon + text (not icon-only)
- Height: 44px

---

# PART 14: SUCCESS METRICS

## Product North Star

> "Users spend 80% less time in email, 200% more time in promoted tasks/projects."

## Key Metrics

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Promotion Rate | > 30% | Emails becoming real work |
| Resolution Speed | < 24h average | Emails not lingering |
| Notification Accuracy | > 70% acted on | AI suggestions are useful |
| Undo Usage | < 5% | Users confident in actions |
| Search Rescue Rate | < 10% | Emails not "lost" in states |

## Anti-Metrics (Should Decrease)

| Metric | Target |
|--------|--------|
| Time spent in email tab | < 10 min/day |
| Emails in "none" state | < 10% |
| Notification ignore rate | < 30% |

## Visual Tests (Pass/Fail)

- [ ] Email looks like work queue, not mailbox
- [ ] State is more visible than content
- [ ] Promotion is easier than reply
- [ ] Right rail feels primary, not secondary
- [ ] Message body feels transient, not permanent
- [ ] No folder tree visible
- [ ] No stars, flags, or importance markers
- [ ] No envelope icons or email nostalgia

---

# PART 15: FORBIDDEN PATTERNS

## Never Do These

| Pattern | Why Forbidden |
|---------|--------------|
| Store thread state | Must be derived, never stored |
| Auto-change resolution state | AI suggests, humans commit |
| Exceed 3 notifications/day | Respect user attention |
| Store full bodies during sync | Metadata only, bodies on-demand |
| Show loading spinners | FUSE architecture = instant |
| Clone Gmail/Outlook layout | Different philosophy, different UI |
| Add folders/labels/stars | Resolution states replace these |
| Make Reply primary action | Promote/Resolve are primary |
| Friendly/chatty AI tone | System tool, not consumer app |
| Heavy card containers | Body feels transient |
| Envelope icons/email nostalgia | This is a work system |
| Three-column left panel | Confuses 70% of users |

## If Implementation Violates These

Stop and reconsider. The pattern exists for a reason documented in this specification.

---

# PART 16: GLOSSARY

| Term | Definition |
|------|------------|
| **FUSE** | Fast User System Engineering — Transfoorm's zero-loading-state architecture |
| **Impact Mode** | Outcome-driven email view with Promote/Link/Resolve actions |
| **Live Mode** | Traditional email view for trust and familiarity |
| **Resolution State** | with_me / with_them / done / none — user's workflow state |
| **Canonical State** | Provider metadata (unread, starred, focused) — separate from resolution |
| **Canonical Folder** | Unified folder model (inbox, sent, drafts, archive, trash, spam) |
| **Promotion** | Converting email into Task, Project, Calendar event, or Decision |
| **Intelligence Rail** | Right panel showing AI insights, linked objects, temporal data |
| **Thread State Derivation** | Algorithm that computes thread state from message states |
| **Prefetch** | Silently fetching body before user clicks |
| **Ring Buffer Cache** | Bounded cache that evicts oldest when full |
| **VANISH** | GDPR-compliant complete user data deletion |
| **Graduated Enablement** | Cache size as tunable config, not fixed architecture |

---

# APPENDIX A: DOCUMENT SOURCES

This consolidated specification was derived from:

1. `EMAIL_DOCTRINE.md` — Core philosophy and rules
2. `EMAIL_UX_DOCTRINE.md` — Visual and interaction design
3. `EMAIL_WIREFRAME_REFERENCE.md` — State transition wireframes
4. `EMAIL_DESIGN_PLAN.md` — PoppinsMail research synthesis
5. `EMAIL_THREAD_STATE_DERIVATION.md` — Technical algorithm
6. `EMAIL-IMPLEMENTATION-PLAN.md` — Development phases
7. `canonical-email-model.md` — Provider-agnostic taxonomy
8. `EMAIL-MULTISELECT-PLAN.md` — Selection and context menu
9. `STORAGE-LIFECYCLE-DOCTRINE.md` — Storage strategy decisions
10. `EMAIL-BODY-CACHE-IMPLEMENTATION.md` — Cache system design
11. `ASSET & STORAGE DIRECTION.txt` — Asset pipeline direction
12. `LIVE and IMPACT.txt` — Two-mode system definition
13. `poppins-emai-design.md` — External UX research
14. `Polling and Subscription 5 Layer Strategy.md` — Transport/sync doctrine (discussion)
15. `Polling and Subscription 5 Layer Strategy - DOCTRINE.md` — Transport/sync doctrine (implementation)
16. `HANDOVER-EMAIL-SYNC.md` — Current implementation status (operational)

---

# APPENDIX B: DECISION LOG

Key decisions made during the design process:

| Decision | Rationale | Date |
|----------|-----------|------|
| Polling is baseline, webhooks optional | Correctness over freshness; webhooks can fail independently | Dec 2024 |
| Resolution states over folders | Workflow-driven, not storage-driven | Dec 2024 |
| Thread state derived, not stored | Single source of truth, no sync issues | Dec 2024 |
| Bodies fetched on-demand | Scale without storage explosion | Dec 2024 |
| Prefetch as primary speed lever | Perceived instant without storing during sync | Dec 2024 |
| 100-body ring buffer cache | Bounded cost, near-desktop feel | Dec 2024 |
| Per-account cache granularity | Clean cascade deletes | Dec 2024 |
| Graduated enablement (0→100) | Test before committing to storage | Dec 2024 |
| Two modes (Live/Impact) | Trust + outcomes on same data | Dec 2024 |
| Three primary actions only | Focus, not feature creep | Dec 2024 |
| AI suggests, humans commit | Trust and control | Dec 2024 |
| Max 3 notifications/day | Respect attention | Dec 2024 |

---

**END OF SPECIFICATION**

This document is the canonical reference for the Transfoorm Email system.
All implementation must comply with this specification.
Deviations require explicit approval and specification amendment.

*Last consolidated: 2025-12-30*
*Version: 1.0*
