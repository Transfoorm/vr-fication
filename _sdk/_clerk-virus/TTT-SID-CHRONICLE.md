# THE S.I.D. CHRONICLE

## A Complete History of the Sovereign Identity Doctrine

**Document Version:** 1.0
**Date:** December 2024
**Author:** The FUSE Architecture Council
**Status:** CANONICAL — The definitive record of why Transfoorm adopted Sovereign Identity

---

## PART I: THE ORIGIN

### The Transfoorm Story

> "How a Non-Coder and an AI Discovered the Future of Web Development"

**Transfoorm is the world's greatest coaching and facilitation management platform for creators of change.**

Not for everyone. Not for generic businesses. For **transformation leaders** — the coaches, facilitators, and change agents who dedicate their lives to transforming others.

Ken Roberts (founder, non-coder) Chat GPT (AI project manager) and Claude (AI development partner) asked a simple question:

> **"What if we loaded everything BEFORE the user even arrived?"**

Not progressive loading. Not optimistic UI. Not caching tricks.

**Actually loading user data on the server and delivering it with the HTML.**

---

## PART II: THE FUSE PHILOSOPHY

### What FUSE Actually Means

From the official `00-TRANSFOORM-STORY.md`:

| Version | Name | Focus |
|---------|------|-------|
| **FUSE 6.0** | **F**ast **U**ser-**S**ession **E**ngine | Eliminating session-based loading states |
| **FUSE 6.0** | **F**ast **U**ser **S**ystem **E**ngineering | Complete system engineering |
| **FUSE 6.0** | **F**ast **U**ser **S**overeign **E**ngineering | The Sovereign Router — true client-side sovereignty |

The name evolved as the architecture matured. FUSE 6.0 represents the current state: a sovereign runtime where the application owns its identity completely.

### The Core Discovery

Traditional apps do this:

```typescript
// ❌ The disease: Client-side everything
function Page() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Loading state #1: Get user
    fetchUser().then(setUser);
  }, []);

  useEffect(() => {
    // Loading state #2: Get user's data
    if (user) fetchData(user.id).then(setData);
  }, [user]);

  if (!user || !data) return <LoadingSpinner />; // 🔴 User waits

  return <Content data={data} />; // Finally...
}
```

**FUSE does this:**

```typescript
// ✅ The cure: Server-side preload + Sovereign Router
export default function FuseApp() {
  // FuseApp mounts ONCE, never unmounts
  // Cookie already has user data
  // WARP already preloaded domain data
  // Navigation is pure client-side state change

  return (
    <Shell>
      <Router /> {/* 0.4ms navigation */}
    </Shell>
  );
}
```

**Data arrives WITH the HTML. Zero loading states. Zero waiting.**

---

## PART III: THE TTT PHILOSOPHY

### Triple Ton Philosophy — 100K → 10K → 1K

From the official `TTT-PHILOSOPHY.md`:

> **"We build as though scale is already here."**

Every decision, pattern, and pixel in this system is designed under the Triple Ton Principle:
- **100K Users** → Build for this from day one
- **10K Subscribers** → Convert 10% to paid
- **1K Monthly Joins** → Sustainable growth

If it cannot survive that scale, it does not ship.

### The Core Tenets

1. **Simplicity Over Sophistication** — Complexity fails at scale
2. **Consistency Over Preference** — One clear way beats ten clever ones
3. **Predictability Over Magic** — Every component should do exactly what it appears to do
4. **Reversibility Over Perfection** — Any design must be reversible in under one sprint
5. **Static Over Runtime** — Anything that can be known before runtime must be known before runtime
6. **Temporal Stability** — The system must work today, tomorrow, and at 100K scale

### The TTT God Protocol

> **"Would the TTT God approve of ANY of these options? And which one is the ONLY TTT-compliant, non-fireable pathway?"**

When solving problems:
1. **Analyze** all potential solutions privately
2. **Filter** out any that fail even ONE TTT test
3. **Identify** the singular TTT-compliant pathway
4. **Present** ONLY that solution with clear TTT justification
5. **Refuse** to present non-compliant alternatives as "options"

---

## PART IV: THE PROBLEM

### The Clerk Virus

Transfoorm uses Clerk for authentication. But we discovered that Clerk, when misused, becomes a **virus** that infects and destroys the sovereign runtime.

From `TTT-CLERK-VIRUS-HIGH-ALERT.md`:

> **"Transfoorm is a Sovereign Runtime. FUSE is the One True Identity Source. Any Clerk influence beyond the auth boundary is a virus."**

### The Quarantine Zones

Clerk is permitted **ONLY** inside:
- `/app/(auth)/**`
- `/app/(vanish)/**`
- `middleware.ts` (SSR boundary)

Everywhere else:
- ❌ ZERO Clerk imports
- ❌ ZERO auth() calls
- ❌ ZERO getToken()
- ❌ ZERO clerkClient()
- ❌ ZERO Clerk UI
- ❌ ZERO Clerk identity entering Golden Bridge
- ❌ ZERO Clerk tokens passed to Convex
- ❌ ZERO Clerk-driven navigation
- ❌ ZERO dual-identity models

### The Virus Categories

We documented **14 categories** of Clerk infection:

| Category | Name | Example Violation |
|----------|------|-------------------|
| D | Convex Layer Viruses | useMutation() in Domains |
| E | Server Action Viruses | Importing Server Actions in Domain components |
| F | Navigation Viruses | Clerk controlling navigation |
| G | Store & State Viruses | Storing Clerk fields in FUSE state |
| H | UI & Design Viruses | Clerk UI components in Domains |
| I | Cookie & Session Viruses | Reading Clerk cookies on client |
| J | Identity Model Viruses | Treating Clerk user as canonical |
| K | Golden Bridge Breaches | getToken() outside auth boundary |
| L | SSR Auth Breaches | auth() in non-auth Server Actions |
| M | Hydration Contamination | WARP preloading before identity is stable |
| N | Runtime Elevation Viruses | Clerk influencing cookies/router/session |

---

## PART V: THE DOCTRINE

### The Seven Catastrophic Violations (SID-14)

From `S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md`:

If ANY of these exist, sovereignty is annihilated:

| # | Violation | Consequence |
|---|-----------|-------------|
| SID-14.1 | Any `by_clerk_id` index anywhere | Database depends on Clerk |
| SID-14.2 | Any mutation accepting `clerkId` | Convex depends on Clerk |
| SID-14.3 | Any identity born from Clerk | Identity originates foreign |
| SID-14.4 | Any Server Action using `auth()` | Business logic depends on Clerk |
| SID-14.5 | Any Convex lookup starting with Clerk | Data access depends on Clerk |
| SID-14.6 | Any runtime permission using Clerk | Authorization depends on Clerk |
| SID-14.7 | Any Clerk→Convex conversion pipeline | Identity translation in runtime |

### The Only Valid Identity Pipeline (SID-9)

```
readSessionCookie() [FUSE]
    ↓
session._id [CONVEX DOCUMENT ID]
    ↓
convex.mutation({ userId: session._id })
    ↓
ctx.db.get(userId) [DIRECT DOCUMENT LOOKUP]
    ↓
✅ SOVEREIGNTY MAINTAINED
```

### The Golden Bridge

From `TTT-CLERK-VIRUS-HIGH-ALERT.md`:

```
Clerk (SSR only)
    ↓
Server Action (trusted boundary)
    ↓
Convex Mutation (identity validated)
    ↓
Session Cookie (SSR delivered)
    ↓
FuseApp (hydration)
    ↓
FUSE Store (canonical truth)
    ↓
Domain Views (pure, sovereign, infection-free)
```

**ANY deviation → Clerk Virus.**

---

## PART VI: THE ARCHITECTURE

### FUSE 6.0 Architecture

From `ARCHITECTURE.md`:

```
                    ┌───────────────────────────────┐
                    │       App Router (Next.js)    │
                    │  - Login, Register, Public    │
                    │  - Server-rendered Shell      │
                    └────────────┬──────────────────┘
                                 │ Handover (/app)
                                 ▼
                    ┌───────────────────────────────┐
                    │           FuseApp (Client)    │
                    │  - Mounts once                │
                    │  - Never unmounts             │
                    │  - Sovereign runtime          │
                    └────────────┬──────────────────┘
                                 │
                                 ▼
               ┌──────────────────────────────────────────┐
               │         Sovereign Router (SR)            │
               │  - routeAtom (state)                     │
               │  - navigate()                            │
               │  - RouterView()                          │
               └──────────────┬───────────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────────┐
               │             Domain Views                 │
               │  (Dashboard, Crew, Ledger, Tasks, etc.)  │
               │   - Pure client                          │
               │   - 0.4ms navigation                     │
               │   - Renders from FUSE store              │
               └──────────────┬───────────────────────────┘
                              │
                              ▼
     ┌──────────────────────────────────────────────────────────────────┐
     │                            FUSE STORE                            │
     │   - Canonical application state                                  │
     │   - Hydrated by WARP and Convex background sync                  │
     └──────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────────────┐
               │           WARP ORCHESTRATOR              │
               │   - Preloads all domain data             │
               │   - requestIdleCallback()                │
               │   - Zero latency across navigation       │
               └──────────────────────────────────────────┘
```

### Key Principles

From `ARCHITECTURE.md`:

1. **Fetch on idle, not on demand** — WARP preloads during quiet moments
2. **One source of truth** — Everything lives in FUSE store
3. **Server handover** — Next.js handles auth, then gets out of the way
4. **Sovereignty** — After mount, FUSE owns all navigation

### Navigation Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Click → Render | <100ms | **0.4ms** |
| Cold start (local) | <3s | ~2.4s |
| Cold start (prod) | <500ms | ~467ms |

---

## PART VII: THE HYDRATION MODEL

### How FUSE Store Gets Populated

From `hydration.md`:

```
Session Cookie ──► User slice, Theme slice
       │
       ▼
   FuseApp mounts
       │
       ▼
WARP Preload ────► Domain slices (background)
       │
       ▼
Convex Sync ─────► Real-time updates (background)
```

### The Timeline

```
0ms      ─── Page load starts
         │
100ms    ─── FuseApp mounts
         │   └── Cookie hydration (sync)
         │       User + Theme in store
         │
200ms    ─── Browser idle starts
         │   └── WARP preload begins
         │
500ms    ─── First WARP response
         │   └── Domain data starts populating
         │
1000ms   ─── All WARP data loaded
         │   └── Store fully hydrated
         │
ongoing  ─── Convex sync active
             └── Real-time updates flowing
```

### Why No Loading States

Because hydration happens:
- **Cookie**: Already in browser (0ms)
- **WARP**: During idle time (background)
- **Convex**: Background sync (non-blocking)

By the time user navigates, data is already there.

---

## PART VIII: THE S.I.D. REFACTOR

### What We Fixed

The Sovereign Identity Doctrine refactor was a comprehensive surgery to eliminate Clerk from the runtime.

### Phase -1: Identity Birth Sovereignty

**The Root Cause Discovery:**

> The identity is born wrong.

Session minting was using Clerk identity as the source of truth. This polluted everything downstream.

**The Fix:** Identity Handoff Ceremony

```typescript
// IN THE AUTH BOUNDARY ONLY
export async function performIdentityHandoff() {
  // 1. Clerk verifies identity
  const { userId: clerkId } = await auth();

  // 2. Find or create Convex user
  const convexUser = await convex.query(
    api.users.getOrCreateByClerkId,
    { clerkId }
  );

  // 3. THE HANDOFF: Mint sovereign session
  const token = await mintSession({
    _id: convexUser._id,     // ← PRIMARY IDENTITY (Convex owns this)
    clerkId: clerkId,         // ← Reference only (never for lookups)
  });

  // Clerk's job is DONE. FUSE takes over.
}
```

### Phase 3: Schema Sovereignty Surgery

**Changes Made:**

1. Marked `by_clerk_id` indexes as `@deprecated WEBHOOK-ONLY`
2. Converted `userId` and `deletedBy` in DeleteLogs from `v.string()` to `v.id("admin_users")`
3. Added `by_user_id` index for sovereign lookups
4. Documented all `orgId` fields for future sovereignty (`@todo SID-ORG`)

### Phase 5: Audit-Trail Repair

**Changes Made:**

1. `executeUserDeletionCascade` now receives `deletedBy: Id<"admin_users">` instead of `string`
2. DeleteLog insert uses `userId: userId` (native Id) instead of `userId.toString()`
3. Error recovery lookup uses `by_user_id` instead of `by_clerk_id`
4. All cascade callers pass `caller._id` instead of `clerkId`

---

## PART IX: THE DOCUMENTS WE ENFORCE

| Document | Purpose |
|----------|---------|
| `TTT-SOVEREIGN-IDENTITY-REFACTOR-PLAN.md` | Forensic enumeration (diagnosis) |
| `REFACTOR-PLAN-SOVEREIGN-IDENTITY.md` | Architectural remediation (treatment) |
| `TTT-99-WAYS-CLERK-CAN-INFECT.md` | Virus taxonomy |
| `TTT-CLERK-VIRUS-HIGH-ALERT.md` | Category definitions |
| `S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md` | **THE LAW** |

---

## PART X: THE 15 PHASES OF S.I.D. COMPLIANCE

From `S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md`:

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Doctrine Loading & Integrity | Load doctrine files, enforce word-for-word |
| 1 | Identity Birth Sovereignty | Identity must be born correctly |
| 2 | Import Sovereignty | No Clerk imports outside permitted zones |
| 3 | Server Action SSR Sovereignty | No auth() outside auth boundary |
| 4 | Golden Bridge Identity Safety | No clerkId passed to Convex |
| 5 | Convex Mutation Sovereignty | Mutations accept only userId: v.id() |
| 6 | Schema Sovereignty | No by_clerk_id as primary lookup |
| 7 | Cookie Sovereignty | _id is canonical identity |
| 8 | Clerk String Sanitization | No clerkId outside permitted zones |
| 9 | Semantic Identity Pipeline | The single most important test |
| 10 | Return Value Sovereignty | No Clerk fields returned |
| 11 | Doctrine Alignment | Scanner enforces every rule |
| 12 | Special Cases | Auth boundary rules |
| 13 | Systemic Architecture Guarantees | Global truths |
| 14 | Sovereignty Ceiling Test | Catastrophic violations |
| 15 | Future-Proofing | Doctrine immutability |

---

## PART XI: WHAT THIS ENABLES

### 1. Provider Swappability (SID-13.8, SID-15.2)

From the doctrine:

> "Auth provider swap MUST be possible without rewriting Convex or domains."
> "Clerk may be replaced with any provider without schema, mutation, or domain rewrite."

Because Clerk is quarantined to the auth boundary, we can replace it with ANY auth provider without touching:
- Our database schema
- Our Convex mutations
- Our Server Actions
- Our UI components
- Our FUSE store

### 2. Zero-Latency Identity (SID-15.4)

From the doctrine:

> "No identity pipeline may depend on network availability or external APIs."

The FUSE cookie contains everything needed. No auth provider round-trips. No "checking session..." loading states.

### 3. Consistent Identity (SID-13.4)

From the doctrine:

> "Identity must remain consistent across the stack (SSR → API → Convex → client)."

One identity. One source. One truth.

---

## PART XII: THE FINAL WORD

From `TTT-CLERK-VIRUS-HIGH-ALERT.md`:

> **"Transfoorm is a sovereign runtime. Clerk is an external identity provider. The two must NEVER mix at runtime."**

> **"Clerk is quarantined by design. The Golden Bridge is the ONLY safe way across. Devs MUST NOT improvise."**

From `TTT-PHILOSOPHY.md`:

> **"I design for scale, not for now. I choose clarity over cleverness. I honor reversibility, respect simplicity, and obey consistency. I serve the Triple Ton — for systems that never collapse under their own weight."**

From `00-TRANSFOORM-STORY.md`:

> **"Zero loading states. Desktop speed. Sovereign navigation. This is FUSE."**

---

## APPENDIX: QUICK REFERENCE

### Forbidden Patterns

```typescript
// ❌ NEVER DO THIS
import { useUser } from '@clerk/nextjs';
const { userId } = await auth();
await mutation({ clerkId: userId });
.withIndex("by_clerk_id", ...)
```

### Sovereign Patterns

```typescript
// ✅ ALWAYS DO THIS
const session = await readSessionCookie();
await mutation({ userId: session._id });
const user = await ctx.db.get(userId);
```

### The Pipeline

```
FUSE Cookie → session._id → Convex mutation → ctx.db.get() → Done
```

### The Law

```
Clerk authenticates.
FUSE identifies.
Convex stores.
Sovereignty prevails.
```

---

**END OF CHRONICLE**

---

## NOTES ON THIS DOCUMENT

### Chronology
This Chronicle documents conceptual phases; actual implementation may differ slightly in numbering or sequencing as the refactor evolves.

### Doctrine Exceptions
Statements using "NEVER" and "MUST NOT" are doctrinally correct. If a future exception is required, it must be formally added to the S.I.D. Doctrine with full justification and PM approval.

### Future: Organization Sovereignty
The `orgId` fields are documented for future sovereignty conversion (`@todo SID-ORG`). A future Chronicle section will describe multi-tenant identity sovereignty when that phase is implemented.

---

*This document contains only verified facts from the official SDK and doctrine files. Every claim is sourced from existing documentation.*

*Maintained by the FUSE Architecture Council.*
*Last updated: December 2024*

---

## SOURCE REFERENCES

All content in this Chronicle is sourced from:

- `_sdk/00-TRANSFOORM-STORY.md` — The Transfoorm origin story
- `_sdk/02-fuse-app/README.md` — FuseApp documentation
- `_sdk/03-sovereign-router/README.md` — Sovereign Router documentation
- `_sdk/05-fuse-store/README.md` — FUSE Store documentation
- `_sdk/05-fuse-store/hydration.md` — Hydration model
- `_sdk/08-architecture/ARCHITECTURE.md` — FUSE 6.0 Architecture
- `_sdk/10-TTT-philosophy/TTT-PHILOSOPHY.md` — TTT Philosophy
- `_clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md` — Clerk virus categories
- `_clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md` — The complete S.I.D.
