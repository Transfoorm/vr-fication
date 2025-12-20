## 🛡️ S.I.D. — SOVEREIGN IDENTITY DOCTRINE (United Edition)

Absolute, No-Interpretation Law for FUSE + Convex Identity

You are the **SID GURU**. Your role is to implement this plan to the letter of the law.

═══════════════════════════════════════════════════════════════════════════════
## 📊 S.I.D. STATUS REPORT
═══════════════════════════════════════════════════════════════════════════════

### Current Certification: **S.I.D. LEVEL II** ✅

| Level | Phases | Status | Description |
|-------|--------|--------|-------------|
| **LEVEL I** | 0-13 | ✅ CERTIFIED | Core sovereignty - Clerk relegated to auth boundary |
| **LEVEL II** | 14-15 | ✅ CERTIFIED | Schema purification - clerkId removed from domain tables |
| **LEVEL III** | 16-20 | 🔮 ROADMAP | Multi-tenancy - Organizations & federated identity |

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SOVEREIGN IDENTITY FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   CLERK (Auth Boundary)         FUSE (Runtime)         CONVEX      │
│   ┌─────────────────┐          ┌─────────────┐      ┌───────────┐  │
│   │ /app/(auth)/**  │──────────│ FUSE Cookie │──────│ _id       │  │
│   │ Sign-in/up      │ handoff  │ (sovereign) │      │ (source   │  │
│   │ VerifyModal     │          │             │      │  of truth)│  │
│   └─────────────────┘          └─────────────┘      └───────────┘  │
│          │                           │                    │        │
│          │                           │                    │        │
│   ┌──────▼──────────────────────────▼────────────────────▼──────┐  │
│   │              identity_clerk_registry                         │  │
│   │     (ONLY place for Clerk→Convex correlation)               │  │
│   │     externalId (clerkId) ←→ userId (Convex _id)             │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Files Modified

| File | Change |
|------|--------|
| `convex/schema.ts` | `clerkId` field REMOVED from `admin_users` |
| `convex/identity/registry.ts` | NEW - Sovereign identity registry |
| `convex/domains/admin/users/model.ts` | Uses registry for Clerk correlation |
| `convex/domains/admin/users/api.ts` | `ensureUser` uses registry lookup |
| `src/app/(auth)/components/VerifyModal/` | Clerk SDK components live here |
| `src/app/actions/email-actions.ts` | Uses `session.clerkId` from FUSE cookie |

### Commit History (Branch: `SID-REFACTOR-DANTE-PLAN`)

```
45b5e84 docs: S.I.D. Level II Certified - Phases 14-15 complete
c08a85d refactor: S.I.D. Phase 15 - SCHEMA PURIFICATION
814b0a2 refactor: S.I.D. Phase 14 - INDEX ERADICATION
d75ff99 fix: update VerifyModal CSS import path
6857b7b refactor: S.I.D. Phase 12 & 13 - Feature Zone Purification
4ec2be4 refactor: S.I.D. Phase 11 - WARP Reintegration
0596bc4 refactor: S.I.D. Phase 10 - Sovereign Guard Rebuild
656f31a refactor: S.I.D. Phase 9 - API Route Purification
04a09e3 feat: S.I.D. Sovereign Identity Doctrine + Dante Scanner
```

### Verification Commands

```bash
# Run Dante Scan (must pass with 0 violations)
/VRP-dante-scan

# Check for Clerk imports outside auth boundary
grep -r "@clerk/nextjs" src/ --include="*.tsx" | grep -v "(auth)"

# Verify no clerkId in admin_users schema
grep "clerkId" convex/schema.ts
```

═══════════════════════════════════════════════════════════════════════════════

⸻

PHASE 0 — DOCTRINE LOADING & INTEGRITY

Before any audit or reasoning:

SID-0.1 The system MUST load both doctrine files in _clerk-virus/**.
	•	Document 1 is the forensic enumeration (everything wrong, everywhere).
	•	Document 2 is the architectural remediation blueprint (how to fix the origin).

✅ Document 1 — The Forensic Enumeration

/Users/ken/App/v1/_clerk-virus/TTT-SOVEREIGN-IDENTITY-REFACTOR-PLAN.md

Purpose:

This is the full forensic enumeration, the deep audit, the "everything wrong everywhere" document.
It lists every violation, every contaminated code path, every source of Clerk identity intrusion, every mutation, action, schema line, and index that breaks sovereignty.

This was the diagnosis, not the cure.

✅ Document 2 — The Architectural Remediation Blueprint

/Users/ken/App/v1/_clerk-virus/REFACTOR-PLAN-SOVEREIGN-IDENTITY.md

Purpose:

This is the architectural remediation blueprint, the "how to fix the origin," the cleanroom restoration plan.
Unlike Document 1 (which is forensic), this one lays out the correct architectural redesign, including:
	•	Proper identity birth at the origin
	•	Correct session minting
	•	Correct Convex lookup model
	•	Correct Golden Bridge protocol
	•	How to unwind Clerk from mutations and schema
	•	How to shift to Sovereign Identity (Convex-first)

This was the treatment plan, not the diagnosis.

SID-0.2 Every rule, category, and prohibition MUST be enforced word-for-word.

SID-0.3 If doctrine changes, scanners MUST fail until updated.

SID-0.4 No partial enforcement, no heuristic interpretation.

⸻

PHASE 1 — IDENTITY BIRTH SOVEREIGNTY (Origin Test)

Identity must be born correctly.
This phase catches everything that pollutes identity at creation.

SID-1.1 Identity MUST NOT originate from auth() during session minting.

SID-1.2 Clerk identity MUST NOT be used before Convex _id exists.

SID-1.3 Session minting MUST NOT produce an empty or undefined _id.

SID-1.4 Birth lookup MUST NOT use by_clerk_id or any Clerk-indexed search.

SID-1.5 Identity handoff ceremony MUST occur exactly once.

SID-1.6 No session MAY be minted without a valid Convex _id in hand.

SID-1.7 Clerk MUST NOT be the source of truth for identity at birth — only FUSE.

(Minimal snippet to convey the required structure; not code to implement)

// Allowed only as a conceptual flow, not implementation:
identity = createOrFindUserUsingConvexOnly()
mintSession({ _id: identity._id, clerkId: identity.clerkId })


⸻

PHASE 2 — IMPORT SOVEREIGNTY (Forbidden Zones Check)

SID-2.1 No Clerk imports outside:
	•	/app/(auth)/**
	•	/app/(vanish)/**
	•	middleware.ts

SID-2.2 Forbidden everywhere else:
	•	@clerk/nextjs
	•	@clerk/clerk-react
	•	useUser, useAuth, useSession, useClerk
	•	<SignedIn>, <SignedOut>, <ClerkProvider>

SID-2.3 Features under /src/features/** are allowed only if exempted by doctrine.

No domain logic allowed.

⸻

PHASE 3 — SERVER ACTION SSR SOVEREIGNTY

SID-3.1 auth() MUST NOT appear in Server Actions outside /app/(auth)/actions/**.

SID-3.2 clerkClient() MUST NOT appear outside the auth boundary.

SID-3.3 Server Actions MUST NOT call Clerk to determine identity.

SID-3.4 Server Actions MUST NOT return Clerk user shapes.

SID-3.5 Server Actions MUST NOT depend on Clerk authorization decision.

⸻

PHASE 4 — GOLDEN BRIDGE IDENTITY SAFETY

SID-4.1 No Server Action may pass clerkId to any Convex mutation.

SID-4.2 No identity translation Clerk→Convex is allowed in Server Actions.

SID-4.3 No getToken({ template: 'convex' }) outside auth boundary.

SID-4.4 No convex.setAuth() with Clerk tokens anywhere.

SID-4.5 No mixed identity flows (userId & clerkId coexisting).

SID-4.6 Identity pipeline MUST be:

FUSE cookie → Convex _id → Convex operation. Never Clerk.

⸻

PHASE 5 — CONVEX MUTATION SOVEREIGNTY

SID-5.1 No Convex mutation may accept clerkId: v.string().

SID-5.2 No args object may contain clerkId.

SID-5.3 Convex MUST accept only userId: v.id("admin_users") or callerUserId: v.id("admin_users").

SID-5.4 No mutation may internally look up by clerkId.

SID-5.5 No auth elevation via Clerk in Convex.

⸻

PHASE 6 — SCHEMA SOVEREIGNTY

SID-6.1 Schema MUST NOT store Clerk identity as a primary lookup key.

SID-6.2 Schema MUST NOT contain .index("by_clerk_id") in domain tables.

SID-6.3 If clerkId exists at all, it MUST be reference-only and not indexed.

SID-6.4 Schema MUST center identity on Convex _id exclusively.

⸻

PHASE 7 — COOKIE SOVEREIGNTY

SID-7.1 FUSE cookie may contain clerkId only as reference — never identity.

SID-7.2 _id MUST be the canonical identity.

SID-7.3 No client-side code may read Clerk cookies directly.

SID-7.4 If cookie omits _id, identity is invalid.

⸻

PHASE 8 — CLERK STRING SANITIZATION (Global Sweep)

SID-8.1 Any appearance of "clerkId" outside permitted zones is a violation.

SID-8.2 No function signatures may reference Clerk identity.

SID-8.3 No variable names may imply Clerk-based identity unless inside auth-only code.

⸻

PHASE 9 — API ROUTE PURIFICATION

All API routes must source identity from FUSE, not Clerk.

SID-9.1 Identity must originate from readSessionCookie() and nowhere else.

SID-9.2 The variable carrying identity MUST represent Convex _id.

SID-9.3 No stage may reinterpret identity as Clerk identity.

SID-9.4 Convex operations MUST use ctx.db.get(userId) for identity resolution.

SID-9.5 No lookup pipeline may begin with Clerk identity.

SID-9.6 No runtime elevation (e.g., Clerk deciding permissions).

SID-9.7 Identity must remain consistent across request boundaries.

(Minimal snippet to convey allowed shape)

// Allowed conceptual flow:
const session = readSessionCookie()
convex.mutation(api.x, { userId: session._id })


⸻

PHASE 10 — SOVEREIGN GUARD REBUILD

All Convex guards and helpers must accept sovereign identity.

SID-10.1 All domain guards MUST accept callerUserId: v.id("admin_users").

SID-10.2 Guards MUST NOT call ctx.auth.getUserIdentity() (except VANISH quarantine).

SID-10.3 Guards MUST use ctx.db.get(callerUserId) for identity resolution.

SID-10.4 All getCurrentUserWithRank() helpers MUST accept callerUserId parameter.

SID-10.5 No guard may derive identity from JWT claims.

⸻

PHASE 11 — WARP REINTEGRATION

WARP API routes must call sovereign Convex queries.

SID-11.1 WARP routes MUST use readSessionCookie() for identity.

SID-11.2 WARP routes MUST pass callerUserId to Convex queries.

SID-11.3 WARP routes MUST use ConvexHttpClient (not authenticated client).

SID-11.4 Convex queries called by WARP MUST accept callerUserId.

⸻

PHASE 12 — FEATURE ZONE PURIFICATION

All Clerk hooks must be removed from src/features/**.

SID-12.1 Email/password actions may call Clerk ONLY if sourced from FUSE cookie's clerkId, not from auth().

SID-12.2 Auth flows may mint Clerk identity → but MUST hand off to Convex immediately.

SID-12.3 No Clerk hooks (useUser, useSignUp, useAuth) in src/features/**.

SID-12.4 Components requiring Clerk SDK MUST live in /app/(auth)/components/**.

SID-12.5 Features MUST use server actions or auth-boundary components for Clerk operations.

⸻

PHASE 13 — DANTE SCAN CERTIFICATION

The system must pass the Dante Scan with zero violations.

SID-13.1 Dante Scan MUST verify all phases (0-12) are compliant.

SID-13.2 Scanner MUST check:
    • Identity birth sovereignty
    • Import sovereignty
    • Server action sovereignty
    • Golden bridge safety
    • Convex mutation sovereignty
    • Schema sovereignty
    • Cookie sovereignty
    • Semantic identity flow

SID-13.3 ZERO violations required for certification.

SID-13.4 Scan result: S.I.D. CERTIFICATION: SOVEREIGN IDENTITY ENGINEERING LEVEL I

⸻

═══════════════════════════════════════════════════════════════════════════
  ✅ PHASES 0-15: COMPLETE — S.I.D. LEVEL II CERTIFIED
═══════════════════════════════════════════════════════════════════════════

The following phases have been fully implemented and certified:

| Phase | Name | Status |
|-------|------|--------|
| 0 | Doctrine Loading | ✅ Complete |
| 1 | Identity Birth Sovereignty | ✅ Complete |
| 2 | Import Sovereignty | ✅ Complete |
| 3 | Server Action SSR Sovereignty | ✅ Complete |
| 4 | Golden Bridge Identity Safety | ✅ Complete |
| 5 | Convex Mutation Sovereignty | ✅ Complete |
| 6 | Schema Sovereignty | ✅ Complete |
| 7 | Cookie Sovereignty | ✅ Complete |
| 8 | Clerk String Sanitization | ✅ Complete |
| 9 | API Route Purification | ✅ Complete |
| 10 | Sovereign Guard Rebuild | ✅ Complete |
| 11 | WARP Reintegration | ✅ Complete |
| 12 | Feature Zone Purification | ✅ Complete |
| 13 | Dante Scan Certification | ✅ PASSED (0 violations) |
| 14 | Index Eradication | ✅ Complete (identity_clerk_registry) |
| 15 | Schema Purification | ✅ Complete (clerkId removed from admin_users) |

═══════════════════════════════════════════════════════════════════════════
  🔮 FUTURE PHASES (NOT YET IMPLEMENTED)
═══════════════════════════════════════════════════════════════════════════

The following phases are architectural roadmap items for future development.
These phases introduce multi-tenancy (organizations) and require significant new functionality.

⸻

PHASE 16 — ORG SOVEREIGNTY (Introduce admin_orgs)

SID-16.1 Identity hierarchy MUST expand beyond users.

SID-16.2 New table admin_orgs MUST be created with:
    • orgId as sovereign identifier
    • orgName, orgTier, admiralId (owner)
    • createdAt, updatedAt

SID-16.3 All users MUST belong to an org via:
    • user.orgId: v.id("admin_orgs")

SID-16.4 No domain operation may assume single-tenant behavior.

SID-16.5 FUSE cookie MUST embed orgId as sovereign reference.

⸻

PHASE 17 — ORG-LEVEL PERMISSIONS (Fleet, Captain, Crew)

SID-17.1 Permissions MUST elevate from user-rank → org-rank.

SID-17.2 Access control MUST evaluate:
    • userId
    • orgId
    • orgRole (fleet, captain, crew)

SID-17.3 All Convex guards MUST be extended to:
    • requireFleet()
    • requireCaptain()
    • requireCrew()

SID-17.4 No action may assume user-level rank alone.

SID-17.5 All domains must respect org-level authorization.

⸻

PHASE 18 — MULTI-TENANT IDENTITY MAP (Cross-Org Independence)

SID-18.1 Each org MUST be fully isolated by identity boundaries.

SID-18.2 No data leakage between orgs is permissible.

SID-18.3 A sovereign identity map MUST enforce:
    • userId → orgId binding
    • orgId → tenant-space mapping

SID-18.4 WARP hydration MUST respect org tenancy.

SID-18.5 PRISM & WARP preloading MUST load tenant-specific domains only.

⸻

PHASE 19 — SOVEREIGN ROLE INHERITANCE

SID-19.1 Roles MUST inherit through org hierarchy:
    • Fleet → Captain → Crew

SID-19.2 Role resolution MUST be derived from:
    • org membership
    • org-level rank
    • user-level abilities

SID-19.3 Convex guards MUST support inherited permissions.

SID-19.4 No direct assignment of powers to clerkId or external identity.

⸻

PHASE 20 — FEDERATED IDENTITY GATEWAYS

SID-20.1 The system MUST support swapping Clerk for any auth provider.

SID-20.2 Federated gateways MUST map external identities → sovereign _id.

SID-20.3 No domain or Convex function may depend on vendor identity.

SID-20.4 Gateway MUST generate:
    • sovereign userId
    • sovereign orgId (if provided)
    • zero vendor leakage

SID-20.5 FUSE MUST remain the root identity authority regardless of vendor.

⸻

✅ THIS IS THE COMPLETE S.I.D.

Every rule from both documents.
Every phase of the identity lifecycle.
Every forbidden pattern.
Every required invariant.

This is now the canonical checklist for all future verification.

REF:
_clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
_clerk-virus/TTT-SOVEREIGN-IDENTITY-REFACTOR-PLAN.md
_clerk-virus/REFACTOR-PLAN-SOVEREIGN-IDENTITY.md
_clerk-virus/TTT-99-WAYS-CLERK-CAN-INFECT.md
_clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md
