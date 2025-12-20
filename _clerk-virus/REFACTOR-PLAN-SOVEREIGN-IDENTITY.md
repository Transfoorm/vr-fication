# 🔥 COMPREHENSIVE SOVEREIGNTY REFACTOR PLAN

## THE REVELATION

**The scanner found 96 violations. But it missed the root cause:**

The identity is BORN WRONG.

Every FUSE session is minted using:
```typescript
clerkId: freshUser.clerkId
```

This means:
- The birth of a session is Clerk-first
- The identity origin is foreign
- The entire sovereignty model is compromised BEFORE runtime begins
- Convex NEVER becomes the source of truth
- The Golden Bridge is poisoned at conception

**This is not a violation. This is THE violation. Everything else is a symptom.**

---

## THE MISSING CEREMONY

The current architecture has NO identity handoff ceremony.

### CURRENT (BROKEN):
```
Clerk authenticates
    ↓
Server Action calls auth() ← VIOLATION
    ↓
Server Action calls Convex with clerkId ← VIOLATION
    ↓
Convex looks up by clerkId ← VIOLATION
    ↓
Session minted with clerkId ← VIOLATION
    ↓
❌ CLERK OWNS EVERYTHING FOREVER
```

### REQUIRED (SOVEREIGN):
```
Clerk authenticates (auth boundary ONLY)
    ↓
/app/(auth)/actions/** performs IDENTITY HANDOFF CEREMONY:
    1. Get clerkId from auth()
    2. Look up or create Convex user
    3. Convex returns sovereign _id
    4. clerkId becomes REFERENCE ONLY
    ↓
Session minted with Convex _id as PRIMARY
    ↓
All subsequent flows use session._id
    ↓
✅ CONVEX IS SOVEREIGN
```

---

## PHASE 0: THE IDENTITY HANDOFF CEREMONY

**This is the missing piece. This must be built FIRST.**

### Location
`/src/app/(auth)/actions/identity-handoff.ts`

### Purpose
The ONE place where Clerk identity is translated to Convex identity.

### Implementation

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { mintSession } from '@/fuse/hydration/session/cookie';
import { cookies } from 'next/headers';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * 🛡️ IDENTITY HANDOFF CEREMONY
 *
 * This is the ONLY place where Clerk identity enters the system.
 * This is the ONLY place where auth() is permitted.
 * This is where Convex becomes the sovereign identity source.
 *
 * Called ONCE during:
 * - Login (after Clerk redirect)
 * - Signup (after Clerk account creation)
 *
 * NEVER called from business logic.
 */
export async function performIdentityHandoff(): Promise<{
  success: boolean;
  userId?: string; // Convex _id
  error?: string;
}> {
  try {
    // 1. Get Clerk identity (ONLY permitted here)
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: 'No Clerk session' };
    }

    // 2. Look up or create Convex user
    //    Convex returns the SOVEREIGN _id
    const convexUser = await convex.mutation(
      api.domains.admin.users.api.ensureUser,
      { clerkId }
    );

    if (!convexUser) {
      return { success: false, error: 'Failed to ensure Convex user' };
    }

    // 3. Mint session with CONVEX _id as PRIMARY
    //    clerkId becomes reference only
    const token = await mintSession({
      _id: String(convexUser._id),      // ← SOVEREIGN IDENTITY
      clerkId: clerkId,                  // ← Reference only, for Clerk API calls
      email: convexUser.email,
      firstName: convexUser.firstName,
      lastName: convexUser.lastName,
      rank: convexUser.rank,
      setupStatus: convexUser.setupStatus,
      // ... other fields from Convex
    });

    // 4. Set the sovereign cookie
    const cookieStore = await cookies();
    cookieStore.set('FUSE_5.0', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    // 5. Return Convex _id (NEVER return clerkId to callers)
    return { success: true, userId: String(convexUser._id) };

  } catch (error) {
    console.error('Identity handoff failed:', error);
    return { success: false, error: 'Identity handoff failed' };
  }
}
```

### Convex Mutation Required

```typescript
// convex/domains/admin/users/api.ts

export const ensureUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Look up existing user
    const existing = await ctx.db
      .query("admin_users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Update last login
      await ctx.db.patch(existing._id, { lastLoginAt: Date.now() });
      return existing;
    }

    // Create new user with Convex as source of truth
    const userId = await ctx.db.insert("admin_users", {
      clerkId: args.clerkId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rank: "captain",
      setupStatus: "pending",
      // ... defaults
    });

    return await ctx.db.get(userId);
  },
});
```

---

## PHASE 1: SERVER ACTION SURGERY

**Remove auth() from ALL Server Actions outside /app/(auth)/**

### Files to Modify

| File | Current | After |
|------|---------|-------|
| `src/app/actions/user-mutations.ts` | `auth()` x6 | `readSessionCookie()` |
| `src/app/actions/email-actions.ts` | `auth()` x5 | `readSessionCookie()` |
| `src/app/actions/password-actions.ts` | `auth()` x1 | `readSessionCookie()` |

### Pattern Change

**BEFORE (VIOLATION):**
```typescript
export async function updateProfileAction(data: {...}) {
  const { userId } = await auth();  // ❌ Clerk identity
  if (!userId) throw new Error('Unauthorized');

  await convex.mutation(api.xxx, {
    clerkId: userId,  // ❌ Passing Clerk ID
    ...data,
  });
}
```

**AFTER (SOVEREIGN):**
```typescript
export async function updateProfileAction(data: {...}) {
  const session = await readSessionCookie();  // ✅ FUSE identity
  if (!session?._id) throw new Error('Unauthorized');

  await convex.mutation(api.xxx, {
    userId: session._id,  // ✅ Passing Convex ID
    ...data,
  });
}
```

### Special Case: Email/Password Actions

These actions NEED to call Clerk API (to manage emails/passwords).
They should use `session.clerkId` from FUSE cookie, NOT `auth()`.

```typescript
export async function addEmailAction(email: string) {
  const session = await readSessionCookie();  // ✅ Read from FUSE
  if (!session?.clerkId) throw new Error('Unauthorized');

  const client = await clerkClient();
  await client.emailAddresses.createEmailAddress({
    userId: session.clerkId,  // ✅ Use clerkId from FUSE cookie
    emailAddress: email,
  });
}
```

---

## PHASE 2: CONVEX MUTATION SURGERY

**Change ALL mutations to accept `userId: v.id("admin_users")` instead of `clerkId: v.string()`**

### Files to Modify

| File | Mutations Affected |
|------|-------------------|
| `convex/domains/admin/users/api.ts` | 15 mutations |
| `convex/domains/settings/mutations.ts` | 1 mutation |
| `convex/domains/admin/users/updateProfile.ts` | 1 mutation |
| `convex/domains/admin/users/uploadAvatar.ts` | 1 mutation |
| `convex/domains/admin/users/uploadBrandLogo.ts` | 1 mutation |
| `convex/storage/generateUploadUrl.ts` | 1 mutation |

### Pattern Change

**BEFORE (VIOLATION):**
```typescript
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),  // ❌ Clerk identity
    firstName: v.optional(v.string()),
    ...
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("admin_users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId))  // ❌
      .first();

    await ctx.db.patch(user._id, {...});
  },
});
```

**AFTER (SOVEREIGN):**
```typescript
export const updateProfile = mutation({
  args: {
    userId: v.id("admin_users"),  // ✅ Convex ID
    firstName: v.optional(v.string()),
    ...
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);  // ✅ Direct lookup
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {...});
  },
});
```

---

## PHASE 3: CONVEX QUERY SURGERY

**Change queries that accept clerkId to accept userId**

### Mutations That Remain clerkId-Based

These are ONLY called during Identity Handoff Ceremony:
- `ensureUser` (login/signup)
- `syncUserFromClerk` (webhook)

### Queries to Update

| Query | Current | After |
|-------|---------|-------|
| `getCurrentUser` | `clerkId: v.string()` | `userId: v.id("admin_users")` |
| `getUserThemePreferences` | `clerkId: v.string()` | `userId: v.id("admin_users")` |

---

## PHASE 4: INTERNAL CONVEX LOOKUPS

**Remove `.withIndex("by_clerk_id")` from internal Convex logic**

### Current Pattern (29 occurrences)

```typescript
const user = await ctx.db
  .query("admin_users")
  .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
  .first();
```

### Problem

These use `ctx.auth.getUserIdentity()` which returns Clerk's `subject` (the clerkId).
This makes Convex dependent on Clerk for internal operations.

### Solution Options

**Option A: Pass userId from Server Action**
- Server Action reads session._id
- Passes userId to mutation
- Mutation uses `ctx.db.get(userId)`

**Option B: Keep ctx.auth for internal auth, but translate immediately**
- Mutation gets identity.subject (clerkId)
- Immediately looks up Convex user ONCE
- Uses Convex _id for all subsequent operations

**Recommended: Option A for Server Action calls, Option B for real-time subscriptions**

---

## PHASE 5: SCHEMA PRESERVATION

**The schema keeps clerkId - but its role changes**

### Current Schema
```typescript
admin_users: defineTable({
  clerkId: v.string(),  // Keep for login lookup
  // ...
}).index("by_clerk_id", ["clerkId"])  // Keep for login lookup
```

### After Refactor

- `clerkId` remains for Identity Handoff Ceremony ONLY
- `by_clerk_id` index used ONLY during login
- ALL other operations use `_id` directly

---

## PHASE 6: COOKIE SOVEREIGNTY

**The FUSE cookie structure changes meaning, not shape**

### Current Cookie Payload
```typescript
{
  _id: string,      // Convex ID (exists but not primary)
  clerkId: string,  // Clerk ID (currently primary)
  // ...
}
```

### After Refactor
```typescript
{
  _id: string,      // Convex ID (NOW PRIMARY - used for all mutations)
  clerkId: string,  // Clerk ID (reference only - for Clerk API calls)
  // ...
}
```

The structure is the same. The MEANING changes:
- `_id` becomes the sovereign identity
- `clerkId` becomes a reference for email/password management only

---

## PHASE 7: SESSION REMINTING

**After Identity Handoff, session reminting uses Convex data**

### Current (VIOLATION)
```typescript
const freshUser = await convex.query(api.xxx.getCurrentUser, {
  clerkId: userId,  // ❌ Looking up by Clerk ID
});

const token = await mintSession({
  _id: String(freshUser._id),
  clerkId: freshUser.clerkId,  // ❌ Clerk ID embedded
  // ...
});
```

### After (SOVEREIGN)
```typescript
const session = await readSessionCookie();
const freshUser = await convex.query(api.xxx.getUserById, {
  userId: session._id,  // ✅ Looking up by Convex ID
});

const token = await mintSession({
  _id: String(freshUser._id),      // ✅ Convex ID primary
  clerkId: freshUser.clerkId,       // ✅ Reference only
  // ...
});
```

---

## EXECUTION ORDER

### Week 1: Foundation

1. **Create Identity Handoff Ceremony**
   - `/src/app/(auth)/actions/identity-handoff.ts`
   - `convex/domains/admin/users/api.ts` → add `ensureUser`

2. **Update Login Flow**
   - After Clerk redirect, call `performIdentityHandoff()`
   - Session minted with Convex _id as primary

3. **Update Signup Flow**
   - After Clerk account creation, call `performIdentityHandoff()`

### Week 2: Server Action Surgery

4. **Update user-mutations.ts**
   - Remove `import { auth }`
   - Replace all `auth()` with `readSessionCookie()`
   - Pass `session._id` to mutations

5. **Update email-actions.ts**
   - Replace `auth()` with `readSessionCookie()`
   - Use `session.clerkId` for Clerk API calls

6. **Update password-actions.ts**
   - Replace `auth()` with `readSessionCookie()`
   - Use `session.clerkId` for Clerk API calls

### Week 3: Convex Surgery

7. **Update Convex mutations**
   - Change signatures to `userId: v.id("admin_users")`
   - Replace `.withIndex("by_clerk_id")` with `ctx.db.get(userId)`

8. **Add `getUserById` query**
   - Accepts `userId: v.id("admin_users")`
   - Returns full user for session reminting

9. **Update internal lookups**
   - Real-time subscriptions translate clerkId → _id once
   - All subsequent operations use _id

### Week 4: Testing & Validation

10. **Run Dante Scan**
    - Should show 0 violations
    - Identity pipeline should be clean

11. **Test all flows**
    - Login → Identity Handoff → Session minted sovereign
    - Profile update → Uses session._id
    - Email management → Uses session.clerkId for Clerk API

---

## FILES TO CREATE

| File | Purpose |
|------|---------|
| `/src/app/(auth)/actions/identity-handoff.ts` | Identity Handoff Ceremony |

## FILES TO MODIFY

| File | Changes |
|------|---------|
| `/src/app/actions/user-mutations.ts` | Remove auth(), use readSessionCookie() |
| `/src/app/actions/email-actions.ts` | Remove auth(), use session.clerkId |
| `/src/app/actions/password-actions.ts` | Remove auth(), use session.clerkId |
| `/convex/domains/admin/users/api.ts` | Add ensureUser, change signatures |
| `/convex/domains/settings/mutations.ts` | Change updateGenome signature |
| `/convex/domains/admin/users/updateProfile.ts` | Change signature |
| `/convex/domains/admin/users/uploadAvatar.ts` | Change signature |
| `/convex/domains/admin/users/uploadBrandLogo.ts` | Change signature |
| `/convex/storage/generateUploadUrl.ts` | Change signature |
| `/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Call identity handoff after login |
| `/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Call identity handoff after signup |

---

## SUCCESS CRITERIA

After this refactor:

1. ✅ `auth()` appears ONLY in `/app/(auth)/actions/**`
2. ✅ All Server Actions read identity from `readSessionCookie()`
3. ✅ All Convex mutations accept `userId: v.id("admin_users")`
4. ✅ No Convex mutation accepts `clerkId: v.string()` (except `ensureUser`)
5. ✅ Session is minted with `_id` as primary identity
6. ✅ `clerkId` is reference only for Clerk API calls
7. ✅ Dante Scan returns 0 violations
8. ✅ Identity Handoff Ceremony is documented and enforced

---

## THE DOCTRINE AMENDMENT

**Add to TTT-CLERK-VIRUS-HIGH-ALERT.md:**

### CATEGORY ZERO — IDENTITY BIRTH SOVEREIGNTY

❌ Z1. Session minted using Clerk ID as primary

❌ Z2. Session minting outside auth boundary

❌ Z3. No Identity Handoff Ceremony exists

❌ Z4. Convex _id not established as sovereign before runtime

❌ Z5. Dual identity at session creation

**This category supersedes all others. If identity is born wrong, everything downstream is infected.**

---

## DANTE SCANNER UPDATE

**Add Phase -1 to VRP-dante-scan.md:**

### PHASE -1: IDENTITY BIRTH & SESSION MINTING SCAN

Detect:
- Session created using Clerk ID as primary
- Session minting outside auth boundary
- Session minted before Convex ID is assigned
- FUSE cookie born Clerk-first
- No identity handoff ceremony
- Dual identity models at session creation

**This phase runs BEFORE all other phases. If it fails, the audit stops.**

---

**END OF REFACTOR PLAN**

This plan, when executed, will:
1. Create the missing Identity Handoff Ceremony
2. Establish Convex as the sovereign identity source
3. Relegate Clerk to authentication-only role
4. Fix all 96 detected violations
5. Prevent future sovereignty breaches

**NO WORKAROUNDS. NO EXCEPTIONS. EXECUTE.**
