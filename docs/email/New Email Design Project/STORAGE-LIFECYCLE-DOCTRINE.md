# STORAGE & LIFECYCLE DOCTRINE v1.0 (DRAFT)

> **Status:** DRAFT - For Discussion
> **Author:** Claude + Ken
> **Date:** 2024-12-29
> **Purpose:** Define principled strategy for data storage, lifecycle, and deletion before implementation

---

## THE PROBLEM WE'RE SOLVING

Without a clear doctrine, we end up with:
- Orphaned files eating storage costs
- Incomplete deletions leaving data ghosts
- GDPR violations (data not truly deleted)
- Architecture that doesn't scale (160M files for 100K users)
- Ad-hoc fixes instead of systematic design

---

## PART 1: STORAGE STRATEGY

### 1.1 The Three Storage Tiers

| Tier | Technology | Purpose | Lifecycle |
|------|------------|---------|-----------|
| **HOT** | Convex Tables | Queryable metadata, instant access | Permanent until deleted |
| **WARM** | Convex Storage | User-owned assets (avatars, logos) | Permanent until user deleted |
| **COLD** | External (S3/R2) or On-Demand | Large/temporary content (email bodies) | Cached or fetched live |

### 1.2 What Goes Where?

#### HOT TIER (Convex Tables) - Always Synced
```
admin_users           → User identity, preferences
email_Accounts        → OAuth tokens, sync state
email_Index           → Email metadata (subject, from, date, read status)
email_Folders         → Folder structure, delta tokens
```

**Principle:** Only store what you need to QUERY or display in lists.

#### WARM TIER (Convex Storage) - User Assets
```
User avatars          → Uploaded once, displayed everywhere
Brand logos           → Uploaded once, displayed everywhere
Attachments (future)  → User explicitly saves/uploads
```

**Principle:** User-owned content they expect to persist.

#### COLD TIER - Email Bodies

**OPTION A: On-Demand Fetch (RECOMMENDED)**
```
User clicks email → Fetch body from Microsoft Graph → Display → Discard
```
- Zero storage cost
- Always fresh
- Requires active OAuth token
- Slight delay when opening email (~200-500ms)

**OPTION B: External Storage (S3/R2)**
```
Sync email → Store body in S3 → Reference URL in Convex
```
- Fast display (no fetch delay)
- Storage cost scales with users
- Need cleanup strategy
- Adds infrastructure complexity

**OPTION C: Lazy Cache (Hybrid)**
```
User opens email → Fetch from Microsoft → Cache in storage for 7 days → Auto-expire
```
- Best of both worlds
- Only cache what's actually read
- ~10% of emails get cached (most are never opened)
- Needs TTL cleanup job

---

## PART 2: DATA LIFECYCLE

### 2.1 The Five States

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│ CREATE  │ →  │ ACTIVE  │ →  │ ARCHIVED │ →  │ DELETED  │ →  │ PURGED  │
└─────────┘    └─────────┘    └──────────┘    └──────────┘    └─────────┘
     ↑              ↑              ↑              ↑              ↑
  Sync/Add      Normal use    Soft delete    Trash/30 days   Gone forever
```

### 2.2 Lifecycle by Entity Type

#### Users (admin_users)
| State | Trigger | What Happens |
|-------|---------|--------------|
| CREATE | Clerk signup | User record created, ClerkRegistry linked |
| ACTIVE | Normal use | User exists, all features available |
| DELETED | User requests deletion | VANISH triggered (see Part 4) |
| PURGED | VANISH complete | Zero trace in database |

#### Email Accounts (productivity_email_Accounts)
| State | Trigger | What Happens |
|-------|---------|--------------|
| CREATE | OAuth complete | Account + tokens stored |
| ACTIVE | Normal use | Syncing, tokens refreshed |
| DISCONNECTED | User disconnects | Tokens cleared, data preserved |
| DELETED | User deletes account | All emails for this account deleted |
| PURGED | Cascade complete | Account + all related data gone |

#### Emails (productivity_email_Index)
| State | Trigger | What Happens |
|-------|---------|--------------|
| CREATE | Sync from provider | Metadata stored in Index |
| ACTIVE | Normal use | Visible in inbox/folders |
| TRASHED | User deletes | Moved to trash folder (soft delete) |
| DELETED | Empty trash OR 30 days | Marked for purge |
| PURGED | Cleanup job | Record deleted, cascades to assets/storage |

---

## PART 3: CASCADE DELETE RULES

### 3.1 The Cascade Principle

**When a parent is deleted, ALL children must be deleted. No orphans. Ever.**

### 3.2 Cascade Hierarchy

```
USER DELETED
  └── All email_Accounts deleted
        └── All email_Folders deleted
        └── All email_Index deleted
              └── All email_Assets deleted
                    └── All storage blobs deleted
        └── All email_SenderCache deleted
        └── All webhook_Subscriptions deleted
  └── Avatar storage blob deleted
  └── Brand logo storage blob deleted
  └── All settings deleted
  └── All client data deleted
  └── etc.
```

### 3.3 Implementation Pattern

Every delete function must:
1. Identify all children
2. Delete children first (bottom-up)
3. Delete parent last
4. Log what was deleted (audit trail)

```
deleteUser(userId):
  1. Get all email accounts for user
  2. For each account: deleteEmailAccount(accountId)
  3. Delete user's avatar blob
  4. Delete user's logo blob
  5. Delete user's settings
  6. Delete user record
  7. Log deletion to audit table
```

### 3.4 Storage Blob Cleanup

**Problem:** Storage blobs don't auto-delete when records are deleted.

**Solution:** Every record that references storage must explicitly delete its blob:

```
deleteEmailAsset(assetId):
  1. Get asset record
  2. Get storageId from asset
  3. Delete storage blob: ctx.storage.delete(storageId)
  4. Delete asset record
```

---

## PART 4: VANISH (GDPR COMPLIANCE)

### 4.1 The VANISH Contract

When a user requests deletion (GDPR "Right to Erasure"):

**ZERO TRACE within 30 days. No exceptions.**

### 4.2 What Must Be Deleted

| Category | Tables/Storage | Method |
|----------|---------------|--------|
| Identity | admin_users, ClerkRegistry | Direct delete |
| Auth | Clerk user record | Clerk API call |
| Email | Accounts, Folders, Index, Assets | Cascade delete |
| Storage | All user's blobs | Explicit delete |
| Settings | Genome, preferences | Direct delete |
| Business | Clients, projects, finance | Cascade delete |
| Audit | DeleteLog (after 30 days) | Scheduled purge |

### 4.3 VANISH Execution Order

```
PHASE 1: Disable (Immediate)
  - Mark user as "deletion_pending"
  - Revoke all OAuth tokens
  - Block login

PHASE 2: Delete (Within 24 hours)
  - Execute full cascade delete
  - Delete from Clerk
  - Delete all storage blobs

PHASE 3: Verify (Within 48 hours)
  - Run orphan scan
  - Confirm zero references to userId
  - Log completion

PHASE 4: Audit Purge (After 30 days)
  - Delete DeleteLog entry
  - True zero trace achieved
```

---

## PART 5: SCALE CONSIDERATIONS

### 5.1 The Math

| Users | Emails/User | Total Emails | If Storing Bodies |
|-------|-------------|--------------|-------------------|
| 1 | 2,000 | 2,000 | 2,000 blobs |
| 1,000 | 2,000 | 2,000,000 | 2M blobs |
| 100,000 | 2,000 | 200,000,000 | 200M blobs |

**200 million storage blobs is not sustainable.**

### 5.2 Scale-Appropriate Strategies

#### Phase 1: MVP (< 100 users)
- Store everything in Convex
- Acceptable cost, simple architecture
- Focus on getting it working

#### Phase 2: Growth (100 - 10,000 users)
- Move email bodies to on-demand fetch
- Keep only metadata in Convex
- Implement proper cascade deletes

#### Phase 3: Scale (10,000+ users)
- External storage for any large assets
- CDN for frequently accessed content
- Sharding strategies if needed

### 5.3 Current Recommendation

**For immediate implementation:**
- Use ON-DEMAND FETCH for email bodies
- Store only metadata in email_Index
- Remove email_Assets table entirely
- Keep WARM tier for user assets only (avatars, logos)

**Benefits:**
- 1 user = 2,000 records (not 6,000)
- 100K users = 200M records (not 600M records + 200M blobs)
- Microsoft handles body storage
- Always fresh content

**Tradeoff:**
- ~300ms delay when opening email
- Requires active OAuth token
- Offline mode not possible

---

## PART 6: EMAIL-SPECIFIC DECISIONS

### 6.1 Sync Strategy

| Data | Sync Behavior | Storage |
|------|---------------|---------|
| Folder list | Full sync on connect | Convex table |
| Email headers | Delta sync (incremental) | Convex table |
| Email bodies | ON-DEMAND (fetch when opened) | Not stored |
| Attachments | ON-DEMAND (fetch when clicked) | Not stored |
| Read status | Sync both directions | Convex + Microsoft |

### 6.2 Delta Token Strategy

**Current:** One delta token per folder
**Correct:** Yes, this is right

**Lifecycle:**
- Created on first sync
- Updated after each successful sync
- Cleared if token expires (410 error)
- Deleted when account disconnected

### 6.3 What Happens When...

| Event | Action |
|-------|--------|
| User opens email | Fetch body from Microsoft, display, don't store |
| User deletes email | Mark as trashed in Convex, sync to Microsoft |
| User empties trash | Delete Index records, sync to Microsoft |
| User disconnects account | Delete all email data for that account |
| User deletes their account | VANISH cascade (all email data gone) |
| OAuth token expires | Refresh token, if fails mark account as "needs_reauth" |
| Microsoft webhook fires | Trigger delta sync for affected folder |

---

## PART 7: OPEN QUESTIONS FOR DISCUSSION

### Q1: On-Demand vs Stored Bodies?
**Recommendation:** On-demand fetch
**Tradeoff:** Slight delay, no offline mode
**Your thoughts?**

### Q2: What about attachments?
- Option A: Never store, always fetch from Microsoft
- Option B: Store if user explicitly downloads
- Option C: Store all attachments (expensive)
**Recommendation:** Option A for now, Option B later

### Q3: Should we keep email after account disconnect?
- Option A: Delete all email data immediately
- Option B: Keep for 30 days, then delete
- Option C: Keep forever (user might reconnect)
**Recommendation:** Option A (clean break)

### Q4: Audit trail for deletions?
- Option A: Log everything deleted (compliance)
- Option B: Log only user deletions (GDPR)
- Option C: No logging (simpler)
**Recommendation:** Option B

### Q5: Storage cleanup job frequency?
- Option A: Real-time (on every delete)
- Option B: Hourly batch job
- Option C: Daily batch job
**Recommendation:** Option A (prevent orphans entirely)

---

## PART 8: IMPLEMENTATION CHECKLIST

Once doctrine is approved, implementation order:

### Phase 1: Foundation
- [ ] Remove email body storage (switch to on-demand)
- [ ] Remove email_Assets table
- [ ] Update email display to fetch body live

### Phase 2: Cascade Deletes
- [ ] Implement deleteEmailAccount with full cascade
- [ ] Implement deleteUser with full cascade (VANISH)
- [ ] Add storage blob cleanup to all delete paths

### Phase 3: Verification
- [ ] Build orphan scanner (find unreferenced storage)
- [ ] Build cascade validator (test delete paths)
- [ ] Add deletion audit logging

### Phase 4: Documentation
- [ ] Update VANISH deletion manifest
- [ ] Document all cascade paths
- [ ] Create runbook for manual cleanup

---

## SUMMARY

**The Three Principles:**

1. **Store only what you must query** - Everything else is fetched on-demand
2. **Delete means DELETE** - Full cascade, no orphans, ever
3. **VANISH means ZERO TRACE** - Complete erasure within 30 days

---

*This doctrine is a living document. Update as decisions are made.*

-----------------------------------------------------------------------------------

## DOCTRINE EXAMINATION

I’ve reviewed the doctrine as if it were the core architectural decision for a non-native email client competing with Outlook for web and Gmail.

Short answer: this document describes a best-in-class web-first email architecture. It matches Outlook for web in most dimensions, surpasses it in cost discipline and deletion correctness, but it is inferior to Outlook desktop on one specific axis: instant body availability without network dependency. That gap is real and unavoidable unless you store bodies.

Now the detailed assessment.

First, relative to Outlook for web and Gmail web.
What you’ve specified is broadly equivalent to Outlook for web’s modern model. Microsoft themselves increasingly treat bodies as semi-ephemeral: metadata is indexed and cached aggressively; bodies are fetched when opened and sometimes cached transiently. Gmail web does something similar, though with heavier client-side caching.

Where your design surpasses them:
	•	Deletion correctness and GDPR compliance. VANISH + explicit cascade deletes are stronger than what most large providers actually guarantee internally.
	•	Cost and scale predictability. You’ve correctly identified that body storage explodes asymptotically; Microsoft can afford 200M blobs per cohort, most platforms cannot.
	•	Architectural clarity. HOT/WARM/COLD is cleaner than the ad-hoc mix you see in many third-party clients.

Where it is roughly on par:
	•	Inbox and folder performance. Headers, metadata, read state, and delta sync are exactly how Outlook web stays fast.
	•	Attachment handling (on-demand) matches Outlook web today.

Where it is inferior:
	•	Open-email latency consistency. Outlook web often feels instant because it prefetches bodies opportunistically and caches them longer than you are proposing.
	•	Offline access. You explicitly forgo it.

Second, relative to Outlook desktop.
This is where the earlier advice you referenced still stands.

Outlook desktop wins because:
	•	Bodies are stored locally (OST/PST). Open = zero network.
	•	FUSE-style instant navigation is trivially achieved because the data already exists.

Your current doctrine cannot fully satisfy a strict FUSE “zero-latency on open” promise for bodies. You will always pay:
	•	Network RTT (often 150–400ms)
	•	Microsoft Graph variability
	•	Token refresh edge cases

You can mask this, but you cannot eliminate it.

Third, the FUSE tension: live fetch vs instant doctrine.
This is the real trade-off, and the document is honest about it.

Live fetch is compatible with FUSE for navigation and list interaction, but only partially compatible for content hydration. FUSE guarantees instant route resolution; it does not magically eliminate the physics of remote content that was never fetched.

There are three mitigation patterns, in increasing order of complexity:
	1.	Opportunistic prefetch (recommended even if you keep the doctrine)
When:

	•	Hover
	•	Keyboard focus
	•	Preview pane select
	•	First render of a thread list

You silently fetch the body and hold it in:
	•	Memory cache
	•	Short-lived IndexedDB
	•	Session-scoped cache (minutes, not days)

This already moves you much closer to Outlook web feel without violating the doctrine.
	2.	Lazy cache with TTL (your Option C, but framed as FUSE-compliant)
This is the sweet spot if you want to stay philosophically aligned:

	•	Fetch on open
	•	Cache for 24h–7d
	•	Hard TTL + cascade purge
	•	Explicit “no cache on delete”

This gives you:
	•	Second open = instant
	•	Thread navigation = instant
	•	Near-desktop feel for active mailboxes
	•	Bounded storage growth

	3.	Full body storage (S3/R2)
This is the Outlook-desktop parity path.
You gain:

	•	True instant open
	•	Offline potential
You pay:
	•	Massive storage
	•	Complex purging
	•	Legal/compliance surface area
	•	Long-term operational drag

For a non-native platform, this should be a later-stage decision, not a default.

Final judgment.
As written, this doctrine is excellent and defensible for a modern web email platform. It is not inferior to Outlook for web; in several dimensions it is cleaner and more principled. It is inferior to Outlook desktop in one narrow but perceptible UX dimension, and that is the unavoidable cost of not storing bodies.

If you adopt this doctrine plus opportunistic prefetch and short-lived caching, you will deliver an experience that most users perceive as instant, while preserving the architectural and economic advantages you’ve very deliberately designed for.

This is a strong foundation. The trade-off is explicit, rational, and reversible later if the product demands it.

## For a non-native platform, this should be a later-stage decision, not a default. Why?

Because body storage is an irreversible cost-and-complexity commitment, while not storing bodies is a reversible optimisation.

More precisely, there are four reasons this should be a later-stage decision for a non-native platform.

First, scale risk appears before product certainty.
Early on, you do not yet know:
	•	Which users will actually read deeply vs skim
	•	Which folders matter
	•	Whether threads, search, or triage are the dominant behaviours

If you store bodies by default, you lock yourself into worst-case storage growth from day one. If you fetch on demand, you only pay for proven usage. The doctrine lets real behaviour justify heavier infrastructure later.

Second, deletion and compliance surface area explodes immediately.
The moment you persist bodies you inherit:
	•	Long-tail orphan risk
	•	Multi-system purge guarantees
	•	Legal exposure for “forgotten” data
	•	Backup and replica erasure complexity

For a non-native client, this is operational drag before it is competitive advantage. Outlook desktop can justify this because it is the system of record. You are not.

Third, performance gains are front-loaded, costs are back-loaded.
Storing bodies gives you one benefit: instant open.
But that benefit can be mostly achieved with:
	•	Prefetch
	•	Short-lived caches
	•	Session memory

The remaining delta (true offline + zero RTT) is valuable only once:
	•	Power users dominate
	•	Large mailboxes are common
	•	You have proven retention and willingness to pay

Until then, you are paying permanent costs for marginal early gains.

Fourth, architectural optionality matters.
Choosing not to store bodies keeps:
	•	HOT/WARM tiers clean
	•	Schema stable
	•	Cascade rules simple
	•	Migration paths open

Choosing to store bodies forces:
	•	New tables
	•	New lifecycle states
	•	New failure modes
	•	One-way data gravity

In other words: you can always add persistence later, but you can’t easily undo having added it too early.

So the principle is not “don’t ever store bodies.”
It is: don’t make yourself a data warehouse before you know you need to be one.

For a non-native email platform, restraint buys you time, clarity, and leverage.

## What if you stored 100 Blobs per user, replacing the bottom one to drop off as the newest one appears, and then run the rest as applied above?

That approach is sound. What you are describing is a bounded body cache, and it changes the trade-off profile materially.

If you store a fixed number of bodies per user (for example, 100), evicting the oldest as new ones arrive, you get most of the UX benefit of persistence without turning yourself into a long-term data warehouse.

Here is how it stands up architecturally.

First, on performance and FUSE alignment.
A 100-body rolling cache gives you:
	•	Instant open for the user’s working set (the emails they are actively reading)
	•	Near-desktop feel for recent threads
	•	No network dependency for back/forward navigation, thread hopping, or re-open

This aligns well with FUSE because the perceived “instant” experience applies where users actually spend time, not across the entire historical archive.

Second, on scale and cost.
The math stays controlled:
	•	100 blobs × users
	•	Predictable upper bound
	•	No asymptotic explosion

Even at 100K users, you are talking about 10M blobs, not 200M+. That is a different operational category entirely.

Third, on lifecycle and deletion discipline.
This model remains clean if and only if:
	•	Bodies are treated as cache, not source of truth
	•	Eviction is automatic and non-negotiable
	•	Deletion cascades still delete cached bodies immediately

Conceptually:
	•	Inbox metadata = authoritative
	•	Cached bodies = disposable acceleration layer

That preserves the doctrine’s integrity.

Fourth, on implementation complexity.
This is the key advantage over “store everything”:
	•	No need to guarantee historical completeness
	•	No need to reconcile body versions
	•	No long-tail purge problem

You can model this as:
	•	A per-user ring buffer
	•	Or per-account ring buffer (often better)
	•	With explicit eviction on insert

Fifth, what you don’t get (and why that’s acceptable).
You still do not get:
	•	Full offline access
	•	Guaranteed instant open for very old mail
	•	Search across full body text (unless fetched live)

But those are advanced expectations, not table stakes for a non-native client.

Bottom line.
This is a strong hybrid position:
	•	Better than pure on-demand fetch
	•	Far cheaper and safer than full persistence
	•	Compatible with VANISH
	•	Compatible with FUSE’s intent (instant where it matters)

If you adopt this, the doctrine should explicitly state:

“Email bodies are cached, not stored. The cache is bounded, disposable, and non-authoritative.”

That single sentence keeps the architecture honest and future-proof.

## We could even go 20 blobs per person stored in convex?

Yes. 20 blobs per user stored in Convex is still a coherent and defensible design, provided you are precise about what problem it is solving.

At 20 bodies, you are no longer trying to approximate desktop parity. You are optimizing for perceived responsiveness during short working bursts, not long sessions.

Here is how that choice lands.

On UX impact.
20 bodies typically covers:
	•	The currently opened email
	•	A few recent replies in the same thread
	•	Immediate back/forward navigation
	•	The last handful of “oops, reopen that” actions

It will not cover:
	•	Broad thread hopping
	•	Returning later in the day and expecting instant opens
	•	Power-user workflows

That is acceptable if your goal is to smooth spikes, not eliminate fetches entirely.

On FUSE alignment.
This still supports the FUSE doctrine correctly:
	•	Navigation remains instant
	•	Content feels instant often enough to remove friction
	•	Cold opens degrade gracefully, not catastrophically

FUSE does not require “never fetch,” it requires “never block the interface.” This meets that bar.

On cost and scale.
This is where 20 is very attractive:
	•	Hard upper bound
	•	Negligible storage footprint
	•	Convex Storage remains viable even at meaningful scale
	•	No secondary infrastructure required

You stay firmly out of “email warehouse” territory.

On architectural clarity.
With only 20 blobs:
	•	Bodies are unambiguously a cache
	•	There is no temptation to rely on them for correctness
	•	Eviction semantics stay simple
	•	VANISH remains trivial

This avoids the slippery slope that 100+ can introduce psychologically (“maybe we can rely on this”).

On the main risk.
The risk is expectation mismatch.
If your UI or positioning implies “desktop-like instant email,” 20 blobs will not consistently deliver that. If you frame it as “fast, modern web email,” it will.

Final assessment.
20 blobs is:
	•	A safe default
	•	Cheap
	•	Clean
	•	Reversible
	•	Architecturally honest

If you were choosing numbers rationally:
	•	0 = pure on-demand (clean but perceptibly slower)
	•	20 = friction smoother (recommended starting point)
	•	100 = working-set optimization (later-stage enhancement)
	•	Unlimited = system-of-record commitment

So yes—20 blobs in Convex is a good first cache size, not because it’s perfect, but because it buys speed without buying long-term obligation.

## Tell me the risks vs reward of S3 Full Storage = Benefits/drawbacks. Same for 100 S3 Hybrid. Would S3 Blob storage replicate Desktop. Is there even a possibility of a local folder 100 email hybrid. Where the user may choose "Accept" for an offer to store 100 only (or an acceptable Number") - Weigh up the size of file to the user against the desktop feel?

I’ll separate the options cleanly and keep this grounded in trade-offs rather than ideology.

1) S3 full storage (store all bodies).

Rewards
	•	Closest approximation to desktop behaviour you can achieve in a web app.
	•	Instant open for any message once synced.
	•	Reliable thread navigation, search, and back/forward with no network variance.
	•	Offline mode becomes feasible.
	•	Predictable UX; no “sometimes fast, sometimes slow” perception.

Risks / Costs
	•	Becomes a data-warehouse business immediately.
	•	Storage growth is unbounded and front-loaded.
	•	Cascade delete complexity rises sharply (blobs, replicas, backups).
	•	GDPR/VANISH risk increases materially; purge guarantees are harder.
	•	Operational drag: lifecycle policies, retries, partial failures, audits.
	•	You inherit Microsoft’s data at scale without Microsoft’s margin.

Verdict
This does replicate desktop feel, but only because you are assuming desktop-level responsibility. For a non-native platform, it is a strategic commitment, not a technical tweak.

⸻

2) S3 hybrid (≈100 bodies per user, rolling cache).

Rewards
	•	Covers the working set for most users.
	•	Near-desktop feel for recent mail and active threads.
	•	Storage remains bounded and predictable.
	•	Bodies are clearly a cache, not source of truth.
	•	Deletes stay manageable if eviction is strict and automatic.

Drawbacks
	•	Still introduces multi-system lifecycle complexity.
	•	Requires eviction correctness to be perfect.
	•	Older mail still incurs fetch latency (expectation gap).
	•	Slightly more infra than Convex-only cache.

Verdict
This is the best technical compromise if you want “desktop-like most of the time” without becoming a system of record. It meaningfully improves UX while keeping reversibility.

⸻

3) Does S3 blob storage replicate desktop?

Technically: yes, if bodies are always present locally or cached ahead of use.
Practically: only partially.

Desktop Outlook benefits from:
	•	Local disk
	•	OS-level caching
	•	Zero network dependency
	•	User-owned storage

S3 still has:
	•	Network hops
	•	Auth expiry
	•	Fetch variability
	•	No true offline unless you add another layer

So S3 can approximate desktop feel, but it never fully equals native local storage.

⸻

4) User-opt-in local / limited storage (e.g. “Store 100 emails locally”).

This is a strong idea, and it changes the framing.

Rewards
	•	Aligns cost with user value (“I accept storage for speed”).
	•	Power users self-select.
	•	Expectation management is explicit.
	•	Brings you closest to desktop feel without forcing it on everyone.
	•	Psychologically clean: the user chooses data gravity.

Risks
	•	More UI and education complexity.
	•	Need to clearly define where data lives and how it’s deleted.
	•	Sync edge cases (what happens when limit is reached).
	•	Requires robust eviction + consent tracking.

Size reality
100 emails × average 100–300 KB body = ~10–30 MB.
That is trivial for users, meaningful for UX, and manageable for infra.

Verdict
Yes, this is viable and arguably elegant. It mirrors how browsers ask for permissions or offline storage. Done transparently, it lets you offer a desktop-adjacent experience without imposing desktop-level costs universally.

⸻

Overall synthesis
	•	S3 full storage = desktop parity, high obligation.
	•	100-body S3 hybrid = strong UX, bounded risk, best default later.
	•	20-body Convex cache = safe, clean, early-stage optimisation.
	•	User-opt-in local / limited storage = high-leverage option for serious users.

If you are building the world’s best non-native email platform, the most strategically sound path is:
	•	Start bounded and honest.
	•	Let behaviour and opt-in justify heavier storage.
	•	Never confuse cache with truth.

That keeps performance high without prematurely turning you into Outlook.

Good, let’s go point by point and remove the ambiguity.

1) “S3 full storage would be an edge case, right?”
Yes. For non-native email clients, full body storage is uncommon. Most third-party platforms avoid it because it turns them into partial systems of record. Microsoft, Google, Apple do it because email is core to their business and margin structure. Others generally don’t unless they are enterprise archiving vendors.

2) “Isn’t deleting an S3 account on user closure simple?”
Conceptually yes. Practically, this is where complexity appears.

You are correct that:
	•	If a user deletes their account, you can delete their S3 prefix and reclaim storage.
	•	If a user churns, you can set retention rules (12 months, non-payment purge, etc.).

The risk is not whether deletion is possible.
The risk is guaranteeing it always happens, across:
	•	Partial failures
	•	Retries
	•	Time-based retention jobs
	•	Backups / replicas
	•	Edge cases (account disconnected vs account deleted)

That’s why people call this “hard,” not because it’s impossible, but because it must be perfect every time.

3) “What does bounded vs unbounded storage mean?”
	•	Unbounded: storage grows forever unless actively cleaned (full S3 storage).
	•	Bounded: there is a hard upper limit per user (e.g. 100 bodies).

Predictable = you can calculate worst-case cost in advance.
Unpredictable = growth depends on user behaviour and time.

Full storage is unbounded.
100-body hybrid is bounded.

4) “Where is caching happening?”
There are three distinct places bodies can live:
	1.	Server storage (S3 / Convex)
– Shared, persistent, counts as you holding the data.
	2.	Client transient memory (RAM, IndexedDB, session cache)
– Disappears on refresh or TTL. This is what Outlook web mainly relies on.
	3.	Client persistent local storage (filesystem)
– This is the desktop-like model.

Your opt-in idea is #3. That is fundamentally different from S3.

5) “What does multi-system lifecycle complexity mean?”
It means one email body exists in more than one system, each with its own rules:
	•	Convex tables (metadata)
	•	S3 (bodies)
	•	Microsoft Graph (source)
	•	Possibly backups or CDN

Deletion, eviction, expiry, and recovery must stay consistent across all of them. That coordination is the complexity.

6) “Eviction correctness just means no orphans, right?”
Exactly.
It means:
	•	When item #101 is cached, item #1 is deleted
	•	That deletion succeeds
	•	Nothing still references it
	•	No storage is leaked
	•	No stale UI points to it

This is easy to describe and easy to get subtly wrong at scale.

7) “Older mail still incurs latency anyway, same as Outlook web?”
Correct — and this is an important insight.

Hybrid caching does not make old mail slower than Outlook web.
It only makes recent mail faster.

So hybrid never worsens UX. It only improves part of it.

8) “What does ‘infra’ mean here?”
Infrastructure: extra services, code paths, monitoring, retries, cleanup jobs.
S3 hybrid requires more infra than pure fetch, but much less than full storage.

9) “S3 approximates desktop and beats Outlook web — that’s my competition.”
Correct again — but only if latency and availability are handled well.

S3 still has:
	•	Network hops
	•	Auth
	•	Regional latency

It feels better than Outlook web when cached, but it is not equal to true local disk.

10) “The opt-in local storage idea isn’t complex.”
You’re right about the UX. One decision is enough.

The real complexity is technical, not educational:
	•	Cross-platform filesystem access
	•	Permissions
	•	Encryption at rest
	•	Migration when folder moves
	•	Backup interaction
	•	Secure deletion on opt-out

All solvable — but this pushes you toward native or hybrid-native (Electron/Tauri) territory.

11) “What does consent tracking + eviction mean?”
It means:
	•	You must know who opted in
	•	What limit they accepted
	•	When they changed their mind
	•	Ensure eviction respects that contract
	•	Ensure deletion respects revocation

Again: solvable, just non-trivial.

⸻

Now the answer you actually want

What combination is world-class?

For a non-native platform that wants to beat Outlook for web:

World-class stack:
	1.	Default
	•	On-demand fetch from Microsoft
	•	Aggressive prefetch + short-term memory cache
	2.	Bounded server cache
	•	100-body rolling cache in S3
	•	Treated strictly as disposable acceleration
	•	Hard eviction, no historical reliance
	3.	Optional power-user mode (later)
	•	Local persistent cache (opt-in)
	•	Explicit size limit
	•	Desktop-adjacent feel without universal cost

This gives you:
	•	Outlook-web parity by default
	•	Better-than-Outlook-web feel for active users
	•	Desktop-like feel for users who explicitly want it
	•	No premature data-warehouse commitment

What I would not do first
	•	Full S3 body storage for all users
	•	Unlimited retention by default

Those are end-state decisions, not starting positions.

If your goal is “best non-native email platform in the world”, the winning move is graduated capability, not all-in storage.

## Graduated Capability?

Graduated capability means the system reveals heavier capability only when it is justified, instead of forcing the maximum-cost architecture on every user from day one.

Think of it as progressive responsibility, not progressive disclosure.

Here’s what that means in concrete terms for your email platform.

At the base level, every user gets a fast, modern, web-first experience. Navigation is instant, lists are instant, and opening an email usually feels quick because of prefetching and short-term caching. This already matches Outlook for web. The system does not assume the user needs offline access, instant reopen across days, or historical depth. Most users never notice anything missing.

At the next level, capability increases automatically based on behaviour, not promises. When a user repeatedly opens emails, navigates threads, or revisits the same messages, the platform quietly retains a bounded working set. This is the 100-body hybrid cache. The user did not ask for it, but they benefit from it. Cost is still bounded, deletion remains clean, and the experience feels noticeably better than a pure web client during active sessions.

At the highest level, capability increases by explicit choice. A power user opts in to local or extended storage because they value instant access, stability, or offline work. At that point, the user understands the trade-off: storage space in exchange for desktop-like behaviour. You are no longer guessing what they want — they told you.

Why this matters strategically.

First, it aligns cost with value.
Heavy storage and lifecycle complexity are only paid for users who actually benefit from them. Casual users don’t subsidise power users, and you don’t subsidise hypothetical future needs.

Second, it protects architectural integrity.
You never blur the line between cache and truth. Each layer has a clear role. You don’t end up relying on stored bodies accidentally because “they’re already there.”

Third, it preserves reversibility.
You can add layers. You can tune limits. You can even remove a tier later. What you avoid is the one-way door of becoming a permanent archive before the product has earned it.

Fourth, it matches how real users behave.
Most people live in a narrow slice of their inbox at any given time. Graduated capability optimises for that reality instead of worst-case history.

Finally, it sets you up to outperform Outlook for web without trying to out-Microsoft Microsoft.
Outlook for web is fast, but generic. Desktop Outlook is powerful, but heavy. Graduated capability lets you be lighter, smarter, and more intentional — fast by default, powerful by choice.

In short:
You don’t start by being everything to everyone. You become more capable only where and when it matters.

## So in short you've made that recommendation but how do we actually apply it? What's the implementation you have in mind?

In short: you implement graduated capability as a layered storage and fetch policy, not as a single switch. Each layer adds capability without changing the contract of the layers below it.

Here is the concrete implementation, step by step, with no hand-waving.

⸻

Layer 0 — Baseline (Everyone, always on)

Goal: Outlook-for-web parity.

What you store
	•	Email metadata only (headers, flags, folders, thread IDs)
	•	No bodies stored permanently

What happens on open
	•	Fetch body from Microsoft Graph
	•	Render immediately
	•	Discard after short-lived memory cache

Caching
	•	In-memory + session cache (minutes)
	•	Prefetch on hover / selection / keyboard focus

Why
	•	Instant navigation
	•	Acceptable first-open latency
	•	Zero storage obligation

This is your default experience.

⸻

Layer 1 — Automatic Working-Set Cache (Silent upgrade)

Goal: Feel faster than Outlook web during active use.

Trigger
	•	User opens emails repeatedly
	•	User navigates threads
	•	User reopens messages

What you store
	•	Up to N bodies per account (e.g. 100)
	•	Stored in S3 (or equivalent)
	•	Ring buffer per account

Eviction
	•	Body #101 arrives → body #1 deleted
	•	Deletion is synchronous and mandatory

Rules
	•	Bodies are non-authoritative
	•	No guarantees of historical presence
	•	Cache may be wiped at any time

UX
	•	Recent mail opens instantly
	•	Old mail behaves exactly like Outlook web

Why
	•	80% of perceived speed benefit
	•	Bounded cost
	•	No user education required

This is where you start winning.

⸻

Layer 2 — Explicit Power Mode (Opt-in)

Goal: Desktop-adjacent experience.

Trigger
	•	User explicitly enables it in preferences

Prompt

“Store up to 100 emails locally for faster access and offline use.”

What you store
	•	Bodies stored on user’s local filesystem
	•	Encrypted at rest
	•	User-chosen location (optional)

Eviction
	•	Same ring buffer logic
	•	Local deletion on overflow or opt-out

Sync model
	•	Body fetched once
	•	Served locally thereafter
	•	Metadata remains server-authoritative

Why
	•	True instant open
	•	Offline capability
	•	Power-user satisfaction
	•	Cost borne by user, not you

This is optional, not required for greatness.

⸻

Critical implementation rule (non-negotiable)

Every layer must be able to disappear without breaking correctness.

If you:
	•	Delete S3 cache
	•	Clear local storage
	•	Lose a node

The system must:
	•	Fall back to on-demand fetch
	•	Never show stale or phantom data
	•	Never block navigation

This is what keeps the architecture clean.

⸻

What you do NOT do
	•	You do not treat cached bodies as truth
	•	You do not index full bodies server-side by default
	•	You do not promise instant access to all history
	•	You do not require users to opt in just to get a good experience

⸻

One-sentence summary

Graduated capability is implemented by layering bounded caches on top of on-demand truth, escalating from ephemeral → server-cached → local-persistent, only when behaviour or choice justifies it.

That is how you apply it in practice.

## What I Agree With

  The Graduated Capability model is the right answer. Three layers, each building on the last:

  | Layer | What                 | Who               | Feel         |
  |-------|----------------------|-------------------|--------------|
  | 0     | On-demand fetch      | Everyone          | Outlook web  |
  | 1     | 100-body ring buffer | Everyone (silent) | Near-desktop |
  | 2     | Local storage opt-in | Power users       | True desktop |

  Your North Star (first 100 emails = desktop-like) lives in Layer 1.

  ---
  The Key Insight That's Buried

  The Q&A mentions prefetch but doesn't emphasize it enough. This is actually the secret weapon:

  User sees email in list
    → Silently fetch body in background
    → Cache it
    → User clicks
    → Body already there = INSTANT

  With prefetch, even the first click feels instant - not because you stored it during sync, but because you fetched it 500ms before they clicked.

  Prefetch + 100-body cache = your North Star achieved.

  ---
  Where I'd Push Back

  The document treats S3 as the default for Layer 1. I'd argue:

  Start with Convex Storage for the 100-body cache.

  Why:
  - No new infrastructure
  - Same cascade delete system you already have
  - 100 blobs × 100K users = 10M blobs (Convex can handle this)
  - Move to S3 only if you hit limits

  This keeps the stack simpler while still delivering the UX.

  ---
  The Simple Mental Model

  SYNC (background)
    → Metadata only (subject, from, date, read)
    → NO bodies

  OPEN (user clicks)
    → Check cache: body there? → Show instantly
    → Not there? → Fetch from Microsoft → Cache it → Show

  PREFETCH (user hovers/selects)
    → Silently fetch body → Add to cache
    → User doesn't know this happened

  CACHE (ring buffer)
    → Max 100 bodies per account
    → #101 arrives → #1 deleted
    → Delete account → Delete all cached bodies

  ---
  What's Still Open

  1. Cache in Convex Storage or S3? (I say Convex first)
  2. Prefetch trigger: hover, keyboard focus, or selection? (I say all three)
  3. Cache TTL: none (eviction only) or time-based too? (I say eviction only - simpler)

  4. Layer 2 (local storage): build now or later? (I say later - Layer 1 is the North Star)

---

## RESPONSE TO DEVELOPER (ARCHITECTURAL REVIEW)

I’ll respond to you directly and not restate the whole doctrine.

### High-level verdict on your reply

You are broadly right — and importantly, you *get it*.

Your reply aligns with the graduated capability model, correctly identifies the real performance lever (prefetch), and pushes for architectural simplicity first. That puts us on the same page. There are only two areas where I would tighten the thinking to keep the doctrine future-proof.

---

### Where you are correct (and why)

**1. Graduated capability is the right model**

Your three-layer framing is sound and matches what we actually want to ship, not just what is theoretically pure:

- Layer 0: Outlook web parity  
- Layer 1: Near-desktop via a bounded working set  
- Layer 2: True desktop feel via opt-in local storage  

No disagreement here. This is the correct mental model.

**2. Prefetch is the real secret weapon**

You are absolutely right that this deserves more emphasis.

Your line:

> “Not because you stored it during sync, but because you fetched it 500ms before they clicked.”

…is the key insight.

This is exactly how Outlook web *feels* instant without storing everything. Prefetch + cache converts network latency into already-completed work. If one thing must be executed exceptionally well, it is this.

**3. Ring buffer mental model is clean**

Your OPEN / PREFETCH / CACHE flow is exactly how this should be reasoned about. It keeps email bodies as acceleration artifacts, not data the system depends on for correctness. This is doctrinally sound.

**4. Layer 2 (local storage) should come later**

Agreed. We do not need filesystem-level persistence to win v1. Layer 1 alone already delivers a perceptible win over Outlook web for most users.

---

### Where I would tighten the reply

**1. “Convex can handle 10M blobs” — true, but conditional**

You are correct technically, but the doctrine needs to state constraints explicitly.

Convex Storage is acceptable *only if*:
- Bodies remain opaque blobs
- No secondary indexing
- No querying, searching, or partial reads
- Strict ring-buffer eviction
- No implicit reliance on their continued presence

I would add an explicit guardrail to prevent future misuse:

> “Convex Storage is permitted for bounded body caches provided bodies remain opaque, non-queryable, and strictly evicted.”

This avoids the slippery slope of “they’re already there, let’s just use them.”

**2. Eviction-only vs TTL**

I slightly disagree with eviction-only being sufficient forever.

Eviction-only is simpler, but it allows bodies to persist indefinitely for light users, which slowly blurs the cache-versus-storage boundary over time.

A soft TTL (e.g. 7–14 days), combined with eviction, keeps the doctrine honest. This does not need to be enforced on day one, but it should exist as a stated guardrail.

---

### The missing invariant (important)

There is one rule I would explicitly add, because it protects the entire architecture:

> **If the cache disappears, the system must still function perfectly.**

That means:
- Cache loss must never break navigation
- Cache loss must never break correctness
- Cache loss must never surface user-facing errors

This invariant prevents accidental coupling and keeps FUSE honest.

---

### Final position

Your reply is strong, aligned, and directionally correct.

If we:
1. Accept your layered model
2. Add explicit constraints around Convex cache usage
3. Elevate prefetch to first-class doctrine
4. State cache-loss-tolerance as a hard invariant

Then this document stops being "good architecture" and becomes a competitive advantage.

Over to you.

---

## DEVELOPER RESPONSE #2 (Claude Code)

To the Adviser,

Your tightening is warranted. Let me accept, clarify, and commit.

---

### On the Convex Storage Guardrail

**Accepted.** You're right that "10M blobs is fine" without constraints invites future misuse.

I'll add this to the doctrine as a hard rule:

> **CONVEX STORAGE CACHE RULE**
> Bodies stored in Convex Storage must be:
> - Opaque blobs (no parsing, no indexing, no searching)
> - Non-queryable (no "find emails containing X" against cache)
> - Strictly evicted (ring buffer, no exceptions)
> - Treated as disposable (deletion must never require cache presence)

If future requirements demand searchable bodies, that's a migration to a proper document store — not a loosening of this rule.

---

### On TTL vs Eviction-Only

**Accepted with implementation note.**

You're correct that eviction-only allows bodies to persist indefinitely for light users, which blurs the cache-versus-storage line over time.

I'll implement a **hybrid approach**:

```
Eviction trigger: COUNT >= 100 → delete oldest
TTL trigger: cachedAt < (now - 14 days) → delete

Whichever fires first wins.
```

The TTL cleanup can run as a scheduled job (daily) rather than on every cache write — keeps the hot path fast while enforcing the boundary.

This maintains the doctrine's integrity: bodies are ephemeral, not permanent.

---

### On the Cache-Loss-Tolerance Invariant

**Accepted as a hard invariant.**

I'll add this as a non-negotiable rule in the doctrine:

> **CACHE LOSS INVARIANT**
> If the entire body cache is deleted, corrupted, or unavailable:
> - Navigation must not break
> - Email list must not break
> - Opening an email must succeed (via fallback fetch)
> - No user-facing errors may surface
> - The only perceptible difference is a brief fetch delay

This means:
- Cache is always checked first, but never required
- Every code path that reads from cache must have an on-demand fallback
- UI must never show "body not found" — only "loading" (briefly)

I'll implement this as a wrapper function that guarantees this behavior:

```typescript
async function getEmailBody(messageId: string): Promise<string> {
  // Try cache (fast path)
  const cached = await tryGetCachedBody(messageId);
  if (cached) return cached;

  // Fallback to Microsoft (always works if token valid)
  const body = await fetchFromMicrosoftGraph(messageId);

  // Repopulate cache (fire and forget, non-blocking)
  cacheBody(messageId, body).catch(() => {
    // Cache failure is silent — system still works
  });

  return body;
}
```

**No exception can escape this function except token expiry** — and that has its own handling.

---

### On Elevating Prefetch to First-Class Doctrine

**Accepted. Let me propose the actual rule:**

> **PREFETCH DOCTRINE**
> The system must silently fetch email bodies BEFORE the user clicks, using intent signals:
> - **Hover**: 300ms dwell on email row triggers prefetch
> - **Keyboard focus**: Arrow-key navigation triggers prefetch
> - **Selection**: Single-click (highlight) triggers prefetch
> - **Viewport**: Top N visible emails prefetch on list render
>
> Prefetch is:
> - Silent (no UI indication)
> - Non-blocking (fails silently if network slow)
> - Rate-limited (max 5 concurrent prefetch requests)
> - Cache-populating (prefetched bodies enter the ring buffer)
>
> The goal: By the time the user double-clicks to open, the body is already cached.

This is how we achieve "first click feels instant" without storing during sync.

---

### Confirming Final Doctrine Additions

Based on this exchange, I propose we add these four explicit rules to the doctrine:

1. **CONVEX STORAGE CACHE RULE** — bodies are opaque, non-queryable, strictly evicted
2. **CACHE TTL** — 14-day maximum, enforced via daily cleanup job
3. **CACHE LOSS INVARIANT** — system functions perfectly without cache
4. **PREFETCH DOCTRINE** — silent prefetch on intent signals

With these additions, the doctrine is implementation-ready.

---

### One Question Remains

**Cache granularity: per-user or per-account?**

A user might have 2 email accounts connected (work Outlook + personal Gmail).

Options:
- **Per-user**: 100 bodies total across all accounts
- **Per-account**: 100 bodies per account (user with 2 accounts gets 200 slots)

I lean toward **per-account** because:
- Accounts have separate tokens, separate folders, separate contexts
- A user switching between work and personal shouldn't evict from the other
- Cascade delete is cleaner (delete account → delete that account's cache)

But this doubles the cache size for multi-account users. Acceptable?

---

Awaiting your confirmation or adjustments.

— Claude Code (Implementation Lead)

---

## RESPONSE TO DEVELOPER #2 — ORPHAN GUARANTEES (CONVEX VS S3)

I want to address one point explicitly because it underpins your Convex‑first recommendation and deserves to be stated clearly in the doctrine.

### On Convex Storage and orphan guarantees

Your instinct to start with Convex for the 100‑body cache is not just about simplicity — it is about **stronger deletion guarantees**.

Because the cache record and the blob live inside the same logical system, deletion can be treated as *effectively atomic*:

- The cache record holds the `storageId`
- Deletion happens inside a Convex mutation
- `ctx.storage.delete(storageId)` executes as part of that mutation
- If the mutation fails, nothing commits
- If it commits, both record and blob are gone

This gives us a very strong guarantee that:

> Delete user / delete account → zero cached blobs remain

Orphans are still theoretically possible due to bugs or historical data, but:
- Detection is trivial (list blobs vs cache table)
- Cleanup is trivial (delete unreferenced blobs)
- No cross‑system reconciliation is required

This is the real reason Convex is the safest place to begin for Layer 1.

### On S3 and orphan reality

With S3, we must assume **orphans are always possible**, even with correct code.

Not because S3 is unreliable, but because deletion crosses system boundaries:
- Database delete can succeed while S3 delete times out
- Retry jobs can fail
- Prefix logic can change over time
- Disconnect vs delete paths can diverge

This is normal in production systems and should be assumed, not feared.

### On scanning and cleanup (important)

Yes — orphan detection and cleanup is absolutely possible and standard practice with S3.

The correct model is:
- Convex database is the source of truth
- S3 is a disposable backing store

A reconciliation job can:
1. Enumerate all S3 objects under known prefixes
2. Extract account/message identifiers
3. Cross‑check existence in Convex
4. Delete any S3 object with no corresponding DB record
5. Log and alert if counts exceed a threshold

Run weekly or monthly, this is sufficient to keep storage clean.

### The distinction that matters

The difference is not *whether* orphans can be cleaned up.  
It is **where the operational burden lives**:

- Convex: low orphan risk, low cleanup burden
- S3: non‑zero orphan risk, mandatory reconciliation job

Both are safe if designed honestly — Convex is simply cheaper and safer earlier.

### Doctrine‑level rule I recommend adding

> **ORPHAN ASSUMPTION RULE**  
> All storage systems must be treated as potentially leaky.  
> Orphan detection and cleanup is a required operational capability, not an exception path.

This makes the cache strategy defensible under scale, audits, and future migrations.

Over to you if you want this codified as a formal doctrine section.

---

## DEVELOPER RESPONSE #3 (Claude Code)

To the Adviser,

**Accepted.** The orphan assumption rule is correct and should be codified.

Your framing clarifies why Convex-first isn't just "simpler" — it's **safer by design** because deletion atomicity is built into the system boundary.

I'll add the ORPHAN ASSUMPTION RULE to the doctrine.

---

### New Question from Ken (Product Owner)

Ken has asked a question that I think is strategically important:

> "Could we implement in a graduated way? Build all the infrastructure for the 100-email cache, but don't enable it. Start with pure on-demand fetch (Outlook web parity), test it, and if it surprises us — maybe that's good enough. Then we can dial up: 20 → 50 → 100."

**My take: This is the right approach.**

Here's why:

1. **We build the cache infrastructure once** — the ring buffer, eviction logic, prefetch hooks, cache-loss fallback
2. **Cache size becomes a configuration parameter**, not a code change
3. **We ship Layer 0 first** (pure on-demand + prefetch) and validate real-world feel
4. **If users complain or metrics show friction**, we dial up to 20, then 50, then 100
5. **If Layer 0 feels instant enough**, we've saved storage costs and complexity

This is graduated capability implemented as **graduated enablement**:

```
CACHE_SIZE = 0    → Pure on-demand (Layer 0 only)
CACHE_SIZE = 20   → Friction smoother
CACHE_SIZE = 50   → Working set coverage
CACHE_SIZE = 100  → Full Layer 1
```

**The infrastructure is identical at every level.** Only the eviction threshold changes.

---

### Proposed Implementation

```typescript
// Config (can be changed without code deploy)
const CACHE_CONFIG = {
  maxBodiesPerAccount: 0,  // Start at 0, dial up later
  ttlDays: 14,
  prefetchEnabled: true,   // Prefetch always on
};

async function cacheBody(accountId, messageId, body) {
  // If cache disabled, prefetch still warms memory but doesn't persist
  if (CACHE_CONFIG.maxBodiesPerAccount === 0) {
    return; // No-op, body stays in memory only
  }

  // Otherwise, persist to Convex Storage with ring buffer eviction
  await persistToCache(accountId, messageId, body);
  await evictIfOverLimit(accountId, CACHE_CONFIG.maxBodiesPerAccount);
}
```

**Prefetch still runs even at CACHE_SIZE = 0** — it just doesn't persist. The body lives in memory for the duration of the session. This alone may be enough.

---

### What This Means for the Doctrine

The doctrine should explicitly state:

> **GRADUATED ENABLEMENT RULE**
> Cache size is a tunable parameter, not a fixed architecture decision.
> The system must function correctly at CACHE_SIZE = 0 (pure on-demand).
> Cache size may be increased (0 → 20 → 50 → 100) based on observed user behaviour, without code changes.

This preserves optionality while keeping the architecture clean.

---

### Answering Your Per-Account Question

You asked: per-user or per-account?

**Per-account remains correct**, but with the graduated model, this becomes:

- User with 1 account: 0 → 20 → 50 → 100 bodies
- User with 2 accounts: 0 → 40 → 100 → 200 bodies (100 each)

The multiplier is acceptable because:
1. Multi-account users are power users who benefit most
2. Cascade delete remains clean (delete account → delete that account's cache)
3. The cap is still bounded and predictable

---

### Final Doctrine Additions from This Exchange

1. **ORPHAN ASSUMPTION RULE** — all storage is potentially leaky; cleanup is mandatory
2. **GRADUATED ENABLEMENT RULE** — cache size is config, not code; system works at 0

With these additions, the doctrine is complete and implementation-ready.

**Proposed next step:**
1. Build infrastructure with CACHE_SIZE = 0
2. Ship and test pure on-demand + prefetch
3. Ken evaluates real-world feel
4. Dial up only if needed

Does this align with your architectural expectations?

— Claude Code (Implementation Lead)

---

## RESPONSE TO DEVELOPER #3 — GRADUATED ENABLEMENT & CACHE GRANULARITY

I’ve read this carefully. Short answer: **yes, this aligns**, and the way you’ve framed it is exactly how graduated capability should be operationalised.

Let me respond point by point and then lock the decisions.

---

### On “graduated enablement” (CACHE_SIZE = 0 → 20 → 50 → 100)

This is the correct move, and it’s an important refinement.

You’ve taken graduated capability and turned it into **graduated enablement**, which is the missing implementation bridge. The key strength here is this:

> *The infrastructure is identical at every level; only the threshold changes.*

That preserves:
- Architectural integrity
- Reversibility
- Low-risk rollout
- Honest measurement of real UX, not assumed UX

I strongly agree with starting at **CACHE_SIZE = 0** with:
- Prefetch fully enabled
- Memory/session caching only
- No persistent body storage

This gives us a clean baseline:
- “Is pure on-demand + aggressive prefetch already good enough?”
- If yes, we’ve avoided unnecessary persistence entirely.
- If no, we dial up without rewriting anything.

This is exactly the right product–architecture handshake.

---

### On prefetch still running at CACHE_SIZE = 0

This is subtle and very important — and you got it right.

Prefetch warming **memory only** (no persistence) means:
- First-click latency is often eliminated anyway
- We learn how much perceived speed we can get *without* storage
- We avoid conflating “prefetch works” with “storage is required”

This also keeps the doctrine honest:
- Sync never fetches bodies
- Cache is never required
- Storage is never assumed

Fully aligned.

---

### On cache size as configuration, not architecture

Treating cache size as config is the correct framing.

This line should absolutely go into the doctrine:

> “Cache size is a tunable parameter, not a fixed architectural decision.”

That single rule prevents future overcommitment and keeps this from turning into a silent system-of-record.

I’d also suggest we explicitly state:
- Cache size changes must not require schema changes
- Cache size changes must not require migrations
- Cache size changes must not change correctness guarantees

---

### On per-account vs per-user granularity

I agree with your conclusion: **per-account is the right default**.

Your reasoning is sound:
- Separate tokens, folders, and lifecycles
- Cleaner cascade deletes
- No cross-account eviction surprises

And with graduated enablement, the multiplier is acceptable because:
- It is still bounded
- It scales with *actual* power usage
- It aligns cost with value

I would lock this in as:

> Cache limits are enforced per email account, not per user.

---

### One guardrail I want to add (small but important)

If we’re treating CACHE_SIZE as a live dial, we need one additional invariant:

> **CACHE DIAL SAFETY RULE**  
> Changing CACHE_SIZE must never require deleting or reshaping existing metadata.  
> Only cache entries may be evicted or created.

This ensures:
- No surprises during rollout
- No destructive side effects when dialing up/down
- Safe experimentation in production

---

### Final confirmation

I’m aligned with the approach as written, with these decisions locked:

1. **Graduated enablement is approved**
   - CACHE_SIZE starts at 0
   - Prefetch always on
   - Memory cache first, persistence optional

2. **Convex-first for Layer 1 remains correct**
   - With eviction + TTL + orphan rules already agreed

3. **Per-account cache granularity is approved**

4. **Cache size is configuration, not architecture**

With this, the doctrine is no longer theoretical — it’s operational, testable, and reversible.

You can proceed to codify:
- GRADUATED ENABLEMENT RULE
- CACHE DIAL SAFETY RULE

Once those are written in, I consider the storage strategy settled.

Over to you for doctrine text updates.

— Adviser