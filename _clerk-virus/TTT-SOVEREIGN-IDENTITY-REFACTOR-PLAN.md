# 🔥 COMPREHENSIVE REFACTOR PLAN: SOVEREIGN IDENTITY RESURRECTION

**Date:** 2025-12-09
**Auditor:** Claude Opus 4.5
**Status:** CRITICAL - SOVEREIGNTY ANNIHILATED
**Root Cause Identified:** Identity is born wrong

---

## 📜 THE REVELATION

**The scanner flagged runtime contamination, mutation signatures, schema poisoning, SSR breaches, and Golden Bridge violations...**

**...but missed the single most catastrophic sovereignty breach:**

> ❌ THE IDENTITY IS BORN WRONG.

Session minting uses Clerk identity as the source of truth. This is not another violation. This is the ROOT of every other violation.

---

## 🔴 CURRENT STATE (BROKEN)

```
Clerk authenticates
    ↓
Server Action calls auth() → gets clerkId
    ↓
Server Action calls Convex → passes clerkId
    ↓
Convex looks up user by clerkId index
    ↓
Server Action mints FUSE session with clerkId as primary identity
    ↓
❌ CLERK OWNS EVERYTHING FOREVER
```

---

## 🟢 REQUIRED STATE (SOVEREIGN)

```
Clerk authenticates (auth boundary ONLY)
    ↓
Auth boundary creates/retrieves Convex user → gets Convex _id
    ↓
Auth boundary performs IDENTITY HANDOFF CEREMONY
    ↓
FUSE session minted with Convex _id as PRIMARY identity
    ↓
clerkId becomes reference-only (never used for lookups)
    ↓
All Server Actions use readSessionCookie() → session._id
    ↓
All Convex mutations receive userId: v.id("admin_users")
    ↓
✅ CONVEX IS SOVEREIGN TRUTH
```

---

## 🔬 FULL AUDIT FINDINGS

### CATEGORY L - SSR AUTH BREACHES

| File | Line | Violation | Code |
|------|------|-----------|------|
| `src/app/actions/user-mutations.ts` | 15 | L1 | `import { auth } from '@clerk/nextjs/server'` |
| `src/app/actions/user-mutations.ts` | 28 | L1 | `const { userId } = await auth()` |
| `src/app/actions/user-mutations.ts` | 98 | L1 | `const { userId } = await auth()` |
| `src/app/actions/user-mutations.ts` | 165 | L1 | `const { userId } = await auth()` |
| `src/app/actions/user-mutations.ts` | 194 | L1 | `const { userId } = await auth()` |
| `src/app/actions/user-mutations.ts` | 274 | L1 | `const { userId } = await auth()` |
| `src/app/actions/user-mutations.ts` | 292 | L1 | `const { userId } = await auth()` |
| `src/app/actions/password-actions.ts` | 16 | L1 | `const { userId } = await auth()` |
| `src/app/actions/password-actions.ts` | 43 | L2 | `const client = await clerkClient()` |
| `src/app/actions/email-actions.ts` | 10 | L1 | `const { userId } = await auth()` |
| `src/app/actions/email-actions.ts` | 16 | L2 | `const client = await clerkClient()` |
| `src/app/actions/email-actions.ts` | 46 | L1 | `const { userId } = await auth()` |
| `src/app/actions/email-actions.ts` | 52 | L2 | `const client = await clerkClient()` |
| `src/app/actions/email-actions.ts` | 83 | L1 | `const { userId } = await auth()` |
| `src/app/actions/email-actions.ts` | 89 | L2 | `const client = await clerkClient()` |
| `src/app/actions/email-actions.ts` | 92 | L3 | `const clerkUser = await client.users.getUser()` |
| `src/app/actions/email-actions.ts` | 122 | L1 | `const { userId } = await auth()` |
| `src/app/actions/email-actions.ts` | 128 | L2 | `const client = await clerkClient()` |
| `src/app/actions/email-actions.ts` | 157 | L1 | `const { userId } = await auth()` |
| `src/app/actions/email-actions.ts` | 163 | L2 | `const client = await clerkClient()` |

### CATEGORY K - GOLDEN BRIDGE IDENTITY BREACHES

| File | Line | Code |
|------|------|------|
| `src/app/actions/user-mutations.ts` | 33 | `clerkId: userId` → updateBusinessCountry |
| `src/app/actions/user-mutations.ts` | 39 | `clerkId: userId` → getCurrentUser |
| `src/app/actions/user-mutations.ts` | 50 | `clerkId: freshUser.clerkId` → mintSession |
| `src/app/actions/user-mutations.ts` | 103 | `clerkId: userId` → completeSetup |
| `src/app/actions/user-mutations.ts` | 109 | `clerkId: userId` → getCurrentUser |
| `src/app/actions/user-mutations.ts` | 120 | `clerkId: freshUser.clerkId` → mintSession |
| `src/app/actions/user-mutations.ts` | 170 | `clerkId: userId` → updateThemePreferences |
| `src/app/actions/user-mutations.ts` | 199 | `clerkId: userId` → updateProfile |
| `src/app/actions/user-mutations.ts` | 205 | `clerkId: userId` → getCurrentUser |
| `src/app/actions/user-mutations.ts` | 216 | `clerkId: freshUser.clerkId` → mintSession |
| `src/app/actions/user-mutations.ts` | 279 | `clerkId: userId` → updateGenome |
| `src/app/actions/user-mutations.ts` | 297 | `clerkId: userId` → getCurrentUser |
| `src/app/actions/user-mutations.ts` | 311 | `clerkId: freshUser.clerkId` → mintSession |

### CATEGORY X - SOVEREIGNTY COLLAPSE (SCHEMA)

| File | Line | Violation |
|------|------|-----------|
| `convex/schema.ts` | 11 | `clerkId: v.string()` field defined |
| `convex/schema.ts` | 92 | `.index("by_clerk_id", ["clerkId"])` |
| `convex/schema.ts` | 100 | `clerkId: v.string()` field defined |
| `convex/schema.ts` | 146 | `.index("by_clerk_id", ["clerkId"])` |

### CATEGORY X - SOVEREIGNTY COLLAPSE (LOOKUPS)

30+ files use `.withIndex("by_clerk_id")`:

- `convex/vanish/updateClerkDeletionStatus.ts:35`
- `convex/vanish/deleteAnyUser.ts:85, 106`
- `convex/vanish/deleteCurrentUser.ts:87`
- `convex/vanish/deleteDeletionLog.ts:51`
- `convex/vanish/cascade.ts:494`
- `convex/system/utils/rankAuth.ts:28, 52, 91`
- `convex/_guards/requireSovereignIdentity.ts:57`
- `convex/domains/productivity/mutations.ts:27`
- `convex/domains/productivity/queries.ts:25`
- `convex/domains/finance/mutations.ts:27`
- `convex/domains/finance/queries.ts:27`
- `convex/domains/clients/mutations.ts:27`
- `convex/domains/clients/queries.ts:27`
- `convex/domains/projects/mutations.ts:27`
- `convex/domains/projects/queries.ts:27`
- `convex/domains/settings/mutations.ts:60, 91, 131, 180, 232`
- `convex/domains/settings/queries.ts:31, 88`
- `convex/domains/admin/users/model.ts:39, 85`
- `convex/domains/admin/users/api.ts` (multiple)

### CONVEX MUTATIONS ACCEPTING clerkId

| File | Mutations |
|------|-----------|
| `convex/storage/generateUploadUrl.ts` | generateUploadUrl |
| `convex/domains/settings/mutations.ts` | updateGenome |
| `convex/domains/admin/users/updateProfile.ts` | updateProfile |
| `convex/domains/admin/users/uploadBrandLogo.ts` | uploadBrandLogo |
| `convex/domains/admin/users/uploadAvatar.ts` | uploadAvatar |
| `convex/domains/admin/users/api.ts` | 15+ mutations |

### FEATURES USING CLERK (EXEMPT PER DOCTRINE)

| File | Imports | Status |
|------|---------|--------|
| `src/features/UserSetup/VerifyModal/index.tsx` | `useSignUp, useUser` | EXEMPT |
| `src/features/UserSetup/SetupModal/index.tsx` | `useUser` | EXEMPT |
| `src/features/VerifyModal/index.tsx` | `useSignUp, useUser` | EXEMPT |

---

## 🏗️ REFACTOR PHASES

---

### PHASE -1: IDENTITY BIRTH SOVEREIGNTY (THE ROOT FIX)

**Priority:** CRITICAL
**Effort:** High
**Files:** 2-3 new files

#### Problem

Session minting uses Clerk identity as the source of truth. The identity is born wrong.

#### Step -1.1: Create Identity Handoff Ceremony

**Create:** `src/app/(auth)/actions/identity-handoff.ts`

```typescript
/**
 * 🔱 IDENTITY HANDOFF CEREMONY
 *
 * This is the ONE AND ONLY place where Clerk identity
 * transforms into Convex sovereign identity.
 *
 * After this ceremony:
 * - Convex _id is the PRIMARY identity
 * - clerkId is REFERENCE ONLY (for webhook correlation)
 * - FUSE session is born SOVEREIGN
 */
'use server';

import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { mintSession } from '@/fuse/hydration/session/cookie';
import { cookies } from 'next/headers';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function performIdentityHandoff() {
  // Step 1: Clerk authenticates (ONLY place auth() is allowed for identity)
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Not authenticated');

  // Step 2: Get or create Convex user (Convex becomes sovereign)
  const convexUser = await convex.query(
    api.domains.admin.users.api.getOrCreateByClerkId,
    { clerkId }
  );

  // Step 3: THE HANDOFF - Mint session with Convex _id as PRIMARY
  const token = await mintSession({
    _id: String(convexUser._id),        // ← PRIMARY IDENTITY
    clerkId: clerkId,                    // ← Reference only, NEVER for lookups
    email: convexUser.email,
    firstName: convexUser.firstName,
    lastName: convexUser.lastName,
    avatarUrl: convexUser.avatarUrl,
    brandLogoUrl: convexUser.brandLogoUrl,
    rank: convexUser.rank,
    setupStatus: convexUser.setupStatus,
    businessCountry: convexUser.businessCountry,
    entityName: convexUser.entityName,
    socialName: convexUser.socialName,
    themeMode: convexUser.themeDark ? 'dark' : 'light',
    // ... other fields from Convex, NOT from Clerk
  });

  // Step 4: Set sovereign cookie
  const cookieStore = await cookies();
  cookieStore.set('FUSE_5.0', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return { success: true, userId: String(convexUser._id) };
}
```

#### Step -1.2: Update Session Cookie Validation

**File:** `src/fuse/hydration/session/cookie.ts`

Add sovereign guard to `readSessionCookie()`:

```typescript
export async function readSessionCookie(): Promise<SessionPayload | null> {
  // ... existing code ...

  // SOVEREIGN GUARD: _id MUST exist and be valid
  if (!payload._id || typeof payload._id !== 'string') {
    console.error('[FUSE] Session missing sovereign identity (_id)');
    return null;
  }

  // _id is the PRIMARY identity, clerkId is reference only
  return payload;
}
```

#### Step -1.3: Update Login Flow

Ensure login flow calls `performIdentityHandoff()` after Clerk auth:

**File:** `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` or equivalent

After successful Clerk sign-in, call the handoff ceremony before redirecting to app.

---

### PHASE 0: AUTH BOUNDARY CONSOLIDATION

**Priority:** CRITICAL
**Effort:** Medium
**Files:** 2 files moved

#### Problem

`auth()` and `clerkClient()` are used in business-logic Server Actions.

#### Rule

These functions may ONLY exist in:
- `/app/(auth)/actions/**`
- `/app/(vanish)/actions/**`
- `middleware.ts`

#### Step 0.1: Move Clerk-Specific Actions

**Move:** `src/app/actions/password-actions.ts` → `src/app/(auth)/actions/password-actions.ts`

**Move:** `src/app/actions/email-actions.ts` → `src/app/(auth)/actions/email-actions.ts`

These ARE Clerk operations (changing passwords, managing emails in Clerk) - they legitimately need Clerk and belong in the auth boundary.

#### Step 0.2: Create Auth Boundary Index

**Create:** `src/app/(auth)/actions/index.ts`

```typescript
/**
 * 🔐 AUTH BOUNDARY ACTIONS
 *
 * These are the ONLY Server Actions allowed to use:
 * - auth()
 * - clerkClient()
 * - Any @clerk/* imports
 *
 * NOTHING outside this boundary may touch Clerk.
 */
export { performIdentityHandoff } from './identity-handoff';
export { changePassword } from './password-actions';
export {
  addEmailAndSendCode,
  setPrimaryEmail,
  swapEmailsToPrimary,
  deleteSecondaryEmail,
  deleteEmail
} from './email-actions';
```

---

### PHASE 1: SERVER ACTION SOVEREIGNTY

**Priority:** CRITICAL
**Effort:** High
**Files:** 1 file complete rewrite

#### Problem

`src/app/actions/user-mutations.ts` uses `auth()` and passes `clerkId` to Convex.

#### Step 1.1: Rewrite user-mutations.ts

**BEFORE (BROKEN):**

```typescript
import { auth } from '@clerk/nextjs/server';

export async function updateBusinessCountryAction(businessCountry: string) {
  const { userId } = await auth();  // ❌ CLERK
  if (!userId) throw new Error('Unauthorized');

  await convex.mutation(api.domains.admin.users.api.updateBusinessCountry, {
    clerkId: userId,  // ❌ PASSING CLERK ID
    businessCountry,
  });

  const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
    clerkId: userId,  // ❌ LOOKUP BY CLERK ID
  });

  const token = await mintSession({
    _id: String(freshUser._id),
    clerkId: freshUser.clerkId,  // ❌ SESSION BORN CLERK-FIRST
    // ...
  });
}
```

**AFTER (SOVEREIGN):**

```typescript
// NO CLERK IMPORTS
import { readSessionCookie, mintSession } from '@/fuse/hydration/session/cookie';

export async function updateBusinessCountryAction(businessCountry: string) {
  // ✅ Read FUSE session - the ONLY source of identity
  const session = await readSessionCookie();
  if (!session?._id) throw new Error('Unauthorized - no sovereign identity');

  // ✅ Pass Convex _id, NEVER clerkId
  await convex.mutation(api.domains.admin.users.api.updateBusinessCountry, {
    userId: session._id,  // ✅ SOVEREIGN IDENTITY
    businessCountry,
  });

  // ✅ Query by Convex _id
  const freshUser = await convex.query(api.domains.admin.users.api.getUserById, {
    userId: session._id,  // ✅ Direct document lookup
  });

  if (!freshUser) throw new Error('User not found');

  // ✅ Re-mint session with Convex as source of truth
  const token = await mintSession({
    _id: String(freshUser._id),        // PRIMARY
    clerkId: freshUser.clerkId,        // Reference only
    email: freshUser.email,
    // ... all fields from Convex
  });

  // ... set cookie
}
```

#### Step 1.2: Apply Pattern to All Functions

Apply the same transformation to:

| Function | Status |
|----------|--------|
| `updateBusinessCountryAction` | Rewrite |
| `completeSetupAction` | Rewrite |
| `updateThemeAction` | Rewrite |
| `updateProfileAction` | Rewrite |
| `updateGenomeAction` | Rewrite |
| `refreshSessionAfterUpload` | Rewrite |

**Pattern for each:**
1. Remove `auth()` import and usage
2. Add `readSessionCookie()`
3. Change `clerkId: userId` to `userId: session._id`
4. Change Convex query to use `getUserById` with `userId`
5. Session minting stays the same (Convex data → session)

---

### PHASE 2: CONVEX MUTATION SIGNATURES

**Priority:** HIGH
**Effort:** High
**Files:** 6+ files

#### Problem

Mutations accept `clerkId: v.string()` parameter.

#### Step 2.1: Create New Query - getUserById

**File:** `convex/domains/admin/users/api.ts`

```typescript
export const getUserById = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Resolve storage URLs
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : null;
    const brandLogoUrl = user.brandLogoStorageId
      ? await ctx.storage.getUrl(user.brandLogoStorageId)
      : null;

    return {
      ...user,
      avatarUrl,
      brandLogoUrl,
    };
  },
});
```

#### Step 2.2: Update Mutation Signatures

**BEFORE:**

```typescript
export const updateBusinessCountry = mutation({
  args: {
    clerkId: v.string(),  // ❌
    businessCountry: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("admin_users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId))  // ❌
      .first();
    // ...
  },
});
```

**AFTER:**

```typescript
export const updateBusinessCountry = mutation({
  args: {
    userId: v.id("admin_users"),  // ✅ Convex document ID
    businessCountry: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);  // ✅ Direct lookup
    if (!user) throw new Error("User not found");
    // ...
  },
});
```

#### Step 2.3: Files Requiring Signature Changes

| File | Mutations |
|------|-----------|
| `convex/domains/admin/users/api.ts` | updateBusinessCountry, completeSetup, updateThemePreferences, updateProfile, getCurrentUser → getUserById, + 10 more |
| `convex/domains/admin/users/updateProfile.ts` | updateProfile |
| `convex/domains/admin/users/uploadAvatar.ts` | uploadAvatar |
| `convex/domains/admin/users/uploadBrandLogo.ts` | uploadBrandLogo |
| `convex/domains/settings/mutations.ts` | updateGenome |
| `convex/storage/generateUploadUrl.ts` | generateUploadUrl |

---

### PHASE 3: CONVEX QUERY PATTERN OVERHAUL

**Priority:** HIGH
**Effort:** Very High
**Files:** 15+ files

#### Problem

30+ files use `.withIndex("by_clerk_id")` for lookups.

#### Step 3.1: Domain Mutations/Queries Pattern

For files that use `ctx.auth.getUserIdentity()` (ConvexProvider flows):

**BEFORE:**

```typescript
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("admin_users")
    .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))  // ❌
    .first();

  if (!user) throw new Error("User not found");
  return user;
}
```

**AFTER (Option A - For ConvexHttpClient flows):**

```typescript
// Mutation receives userId directly from Server Action
export const updateSomething = mutation({
  args: { userId: v.id("admin_users"), /* ... */ },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);  // ✅ Direct lookup
    if (!user) throw new Error("User not found");
    // ...
  },
});
```

**AFTER (Option B - For ConvexProvider client flows, if needed):**

```typescript
// Keep identity lookup for real-time client subscriptions
// BUT: Consider whether client should use ConvexProvider at all
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  // identity.subject is still clerkId from Clerk JWT
  // This is acceptable ONLY for ConvexProvider real-time flows
  const user = await ctx.db
    .query("admin_users")
    .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
    .first();

  if (!user) throw new Error("User not found");
  return user;
}
```

#### Step 3.2: Files to Update

**Domain Mutations (change to receive userId):**
- `convex/domains/productivity/mutations.ts`
- `convex/domains/finance/mutations.ts`
- `convex/domains/clients/mutations.ts`
- `convex/domains/projects/mutations.ts`
- `convex/domains/settings/mutations.ts`

**Domain Queries (evaluate if ConvexProvider needed):**
- `convex/domains/productivity/queries.ts`
- `convex/domains/finance/queries.ts`
- `convex/domains/clients/queries.ts`
- `convex/domains/projects/queries.ts`
- `convex/domains/settings/queries.ts`

**System Utils:**
- `convex/system/utils/rankAuth.ts`
- `convex/_guards/requireSovereignIdentity.ts`

**Admin Users:**
- `convex/domains/admin/users/model.ts`
- `convex/domains/admin/users/api.ts`

---

### PHASE 4: SCHEMA SOVEREIGNTY

**Priority:** MEDIUM
**Effort:** Low
**Files:** Schema + ESLint

#### Problem

Schema defines `clerkId` field and `by_clerk_id` index as primary lookup.

#### Decision

**KEEP** `clerkId` field and `by_clerk_id` index for:
- Webhook flows (Clerk sends events with clerkId)
- Initial user creation
- Account deletion flows (vanish)

**BUT:** Runtime code NEVER uses these for identity. They are reference-only.

#### Step 4.1: Add ESLint Rule

**File:** `eslint.config.mjs`

```javascript
{
  'ttts/no-clerk-id-lookup': ['error', {
    // Allow in these paths (webhooks, auth boundary, vanish)
    allowedPaths: [
      '**/convex/vanish/**',
      '**/convex/http.ts',
      '**/app/(auth)/**',
      '**/app/(vanish)/**',
    ]
  }]
}
```

Rule detects:
- `.withIndex("by_clerk_id"` in non-allowed paths
- `clerkId:` in mutation args in non-allowed paths

---

### PHASE 5: IDENTITY GUARD REWRITE

**Priority:** HIGH
**Effort:** Medium
**Files:** 1 file rewrite

#### Problem

`requireSovereignIdentity.ts` uses clerkId lookup.

#### Step 5.1: Rewrite for True Sovereignty

**File:** `convex/_guards/requireSovereignIdentity.ts`

**BEFORE:**

```typescript
export async function requireSovereignIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const callerClerkId = identity?.subject;

  const user = await ctx.db
    .query("admin_users")
    .withIndex("by_clerk_id", q => q.eq("clerkId", callerClerkId))  // ❌
    .first();

  return user;
}
```

**AFTER:**

```typescript
/**
 * 🔱 SOVEREIGN IDENTITY GUARD
 *
 * For ConvexHttpClient flows (Server Actions):
 * - userId comes as argument
 * - Direct document lookup
 *
 * For ConvexProvider flows (client real-time):
 * - Use ctx.auth.getUserIdentity()
 * - Accept clerkId lookup as necessary evil for real-time
 */

// For Server Action flows (PREFERRED)
export async function requireSovereignUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"admin_users">
) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("[SOVEREIGN GUARD] User not found");
  }
  return user;
}

// For ConvexProvider flows (real-time subscriptions only)
export async function requireAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    throw new Error("[SOVEREIGN GUARD] Not authenticated");
  }

  // Note: This uses clerkId lookup - acceptable for real-time only
  const user = await ctx.db
    .query("admin_users")
    .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("[SOVEREIGN GUARD] User not found");
  }
  return user;
}
```

---

### PHASE 6: FEATURES LAYER AUDIT

**Priority:** LOW
**Effort:** Medium
**Files:** 1-2 files

#### Status

Per doctrine, Features under `/src/features/**` are EXEMPT from Category A/B.

#### However

Features should transition to FUSE identity where possible.

#### Step 6.1: Audit

| File | Clerk Usage | Recommendation |
|------|-------------|----------------|
| `SetupModal/index.tsx` | `useUser` | Transition to `useFuse()` |
| `VerifyModal/index.tsx` | `useSignUp, useUser` | Keep - legitimate OTP flow |
| `UserSetup/VerifyModal/index.tsx` | `useSignUp, useUser` | Keep - legitimate OTP flow |

#### Step 6.2: Transition SetupModal

**BEFORE:**

```typescript
import { useUser } from '@clerk/nextjs';
const { user: clerkUser } = useUser();
// Uses clerkUser.firstName, etc.
```

**AFTER:**

```typescript
import { useFuse } from '@/store/fuse';
const { user } = useFuse();
// Uses user.firstName from FUSE store
```

---

### PHASE 7: RUNTIME VERIFICATION

**Priority:** MEDIUM
**Effort:** Low
**Files:** 2 new files

#### Step 7.1: Server Action Guard

**Create:** `src/lib/guards/sovereign-action.ts`

```typescript
import type { SessionPayload } from '@/fuse/hydration/session/cookie';

export function assertSovereignSession(
  session: SessionPayload | null
): asserts session is SessionPayload {
  if (!session) {
    throw new Error('[SOVEREIGN] No session - user not authenticated');
  }
  if (!session._id) {
    throw new Error('[SOVEREIGN] Session has no _id - identity corrupted');
  }
  if (typeof session._id !== 'string' || session._id.length < 10) {
    throw new Error('[SOVEREIGN] Invalid _id format');
  }
}
```

#### Step 7.2: Convex Guard

**Create:** `convex/_guards/assertSovereignUserId.ts`

```typescript
import { Id } from './_generated/dataModel';

export function assertSovereignUserId(
  userId: unknown
): asserts userId is Id<"admin_users"> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('[CONVEX] Missing userId');
  }
  // Convex IDs are base62 encoded
  if (userId.length < 10) {
    throw new Error('[CONVEX] Invalid userId format - possible clerkId leak');
  }
}
```

---

### PHASE 8: DANTE SCANNER UPDATE

**Priority:** CRITICAL
**Effort:** Low
**Files:** 1 file update

#### Step 8.1: Add Phase -1 to Scanner

**File:** `.claude/commands/VRP-dante-scan.md`

Add before Phase 1:

```markdown
## PHASE -1: IDENTITY BIRTH & SESSION MINTING SCAN (HIGHEST SEVERITY)

**This is the most critical phase. All other violations are downstream of identity birth.**

**Scan for:**

1. **Session minting using Clerk identity:**
   ```bash
   # Session minted with clerkId as lookup key
   grep -rn "clerkId:" src/app/actions/ | grep -v "(auth)"
   ```

2. **auth() in non-auth Server Actions:**
   ```bash
   # auth() should ONLY be in /app/(auth)/actions/
   grep -rn "await auth()" src/app/actions/ | grep -v "(auth)/actions"
   ```

3. **Session minting outside auth boundary:**
   ```bash
   # mintSession should ideally only be in auth boundary for creation
   # Other uses should be for REFRESH with Convex data
   grep -rn "mintSession" src/ | grep -v "(auth)" | grep -v "(vanish)"
   ```

4. **Missing identity handoff:**
   ```bash
   # Look for performIdentityHandoff or equivalent
   grep -rn "performIdentityHandoff\|identityHandoff" src/app/
   ```

5. **Convex lookups using clerkId from auth():**
   ```bash
   # Pattern: auth() → userId → getCurrentUser({ clerkId: userId })
   grep -A5 "await auth()" src/app/actions/ | grep "clerkId"
   ```

**Any match = CATEGORY X (SOVEREIGNTY COLLAPSE)**

**Report Format:**

```
═══════════════════════════════════════════════════════════
  PHASE -1: IDENTITY BIRTH VIOLATIONS (CATEGORY X)
═══════════════════════════════════════════════════════════

❌ X-BIRTH. [file:line]
   `[code snippet]`
   → Identity born from Clerk, not Convex
   → This is the ROOT CAUSE of all other violations

IDENTITY BIRTH FLOW (CURRENT - BROKEN):
   Clerk auth() → clerkId → Convex lookup → Session mint
   ❌ CLERK IS SOVEREIGN

IDENTITY BIRTH FLOW (REQUIRED):
   Clerk auth() → [AUTH BOUNDARY] → Convex _id → Session mint
   ✅ CONVEX IS SOVEREIGN
```
```

---

## 📋 EXECUTION ORDER

| Order | Phase | Priority | Effort | Files | Description |
|-------|-------|----------|--------|-------|-------------|
| 1 | -1 | CRITICAL | High | 2-3 | Identity handoff ceremony |
| 2 | 0 | CRITICAL | Medium | 2 | Move Clerk actions to auth boundary |
| 3 | 8 | CRITICAL | Low | 1 | Update Dante scanner |
| 4 | 1 | CRITICAL | High | 1 | Rewrite user-mutations.ts |
| 5 | 5 | HIGH | Medium | 1 | Rewrite identity guard |
| 6 | 2 | HIGH | High | 6+ | Convex mutation signatures |
| 7 | 3 | HIGH | Very High | 15+ | Convex query patterns |
| 8 | 7 | MEDIUM | Low | 2 | Runtime guards |
| 9 | 4 | MEDIUM | Low | 2 | Schema + ESLint |
| 10 | 6 | LOW | Medium | 1-2 | Features transition |

---

## ✅ SUCCESS CRITERIA

After refactor completion:

| Criteria | Check |
|----------|-------|
| `auth()` exists ONLY in `/app/(auth)/actions/` | ☐ |
| All Server Actions use `readSessionCookie()` for identity | ☐ |
| All Convex mutations receive `userId: v.id("admin_users")` | ☐ |
| All Convex lookups use `ctx.db.get(userId)` not index queries | ☐ |
| FUSE session is born with `_id` as PRIMARY identity | ☐ |
| Identity handoff ceremony exists and is used | ☐ |
| Dante Scanner includes Phase -1 | ☐ |
| Dante Scanner passes with ZERO violations | ☐ |
| ESLint rule `ttts/no-clerk-id-lookup` is active | ☐ |

---

## 🔄 MIGRATION STRATEGY

### Option A: Big Bang (Recommended for this codebase)

1. Create all new patterns in parallel
2. Update all files in single PR
3. Run full Dante scan
4. Deploy

**Pros:** Clean cut, no dual-code paths
**Cons:** Large PR, higher risk

### Option B: Incremental

1. Add new patterns alongside old
2. Deprecate old patterns
3. Migrate file by file
4. Remove deprecated code

**Pros:** Lower risk per change
**Cons:** Temporary dual-code, longer timeline

### Recommendation

Given the codebase size and the interconnected nature of identity:
**Option A (Big Bang)** is recommended.

The violations are systemic. Incremental migration would require maintaining two identity systems simultaneously, which increases complexity and risk of bugs.

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Vanish flows** may legitimately need clerkId for Clerk account deletion correlation
2. **Webhook handlers** (convex/http.ts) will continue to receive clerkId from Clerk - this is acceptable
3. **ConvexProvider real-time subscriptions** may still need identity lookup - evaluate if these are needed
4. **Session refresh** after mutations should use Convex data, not Clerk data
5. **Error messages** should never expose clerkId to users

---

## 🚨 WARNINGS

1. **DO NOT** remove `by_clerk_id` index until webhook flows are audited
2. **DO NOT** remove `clerkId` from schema - it's needed for webhook correlation
3. **DO NOT** mix old and new patterns in same file
4. **DO NOT** deploy partial migration
5. **DO NOT** skip Phase -1 - it's the root fix

---

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Next Review:** After Phase -1 implementation
