# S.I.D. Compliance

> Implementation guide for sovereign identity patterns

---

## Overview

This document provides practical guidance for implementing identity correctly across all layers of the application.

---

## Pre-Flight Checklist

Before writing identity-related code, verify:

- [ ] I am NOT in a permitted Clerk zone
- [ ] I will NOT import `@clerk/*` packages
- [ ] I will read identity from FUSE or session cookie
- [ ] I will pass `userId: Id<"admin_users">` to mutations
- [ ] I will use `ctx.db.get(userId)` for lookups

---

## Layer-by-Layer Implementation

### Layer 1: Session Cookie

The session cookie is the source of truth for the sovereign runtime.

**Structure:**
```typescript
interface SessionCookie {
  _id: Id<"admin_users">;    // PRIMARY IDENTITY
  rank: Rank;
  orgId: Id<"admin_orgs">;
  setupStatus: SetupStatus;
  theme: Theme;
  // NO clerkId
}
```

**Reading:**
```typescript
// In Server Actions
import { readSessionCookie } from '@/lib/session';

export async function myAction() {
  const session = await readSessionCookie();
  const userId = session._id;  // Sovereign identity
}
```

### Layer 2: FUSE Store

FUSE is hydrated from the session cookie, never from Clerk.

**Hydration:**
```typescript
// In FuseApp
const session = await readSessionCookie();

// Hydrate FUSE with cookie data
useFuse.setState({
  user: session,
  isHydrated: true,
});
```

**Reading:**
```typescript
// In components
const user = useFuse((s) => s.user);
const userId = user._id;  // Sovereign identity
```

### Layer 3: Convex Mutations

Mutations accept only Convex IDs.

**Correct pattern:**
```typescript
export const updateProfile = mutation({
  args: {
    userId: v.id("admin_users"),  // Convex ID type
    data: v.object({ ... }),
  },
  handler: async (ctx, { userId, data }) => {
    // Direct document lookup
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, data);
  },
});
```

**Calling from client:**
```typescript
const user = useFuse((s) => s.user);
const updateProfile = useMutation(api.users.updateProfile);

await updateProfile({
  userId: user._id,  // From FUSE, not Clerk
  data: formData,
});
```

### Layer 4: Convex Queries

Queries use Convex IDs for all lookups.

**Correct pattern:**
```typescript
export const getProfile = query({
  args: {
    userId: v.id("admin_users"),
  },
  handler: async (ctx, { userId }) => {
    // Direct lookup by Convex ID
    return await ctx.db.get(userId);
  },
});
```

### Layer 5: Server Actions

Server Actions read from cookie, never from Clerk.

**Correct pattern:**
```typescript
'use server';

import { readSessionCookie } from '@/lib/session';
import { convex } from '@/lib/convex';

export async function updateUserProfile(data: ProfileData) {
  // Read sovereign identity
  const session = await readSessionCookie();

  // Pass to Convex
  await convex.mutation(api.users.updateProfile, {
    userId: session._id,
    data,
  });

  // Revalidate if needed
  revalidatePath('/settings/account');
}
```

---

## Common Patterns

### Getting Current User

```typescript
// In components
const user = useFuse((s) => s.user);

// In Server Actions
const session = await readSessionCookie();

// In Convex (passed as argument)
export const myMutation = mutation({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
  },
});
```

### Checking Rank

```typescript
// In components
const user = useFuse((s) => s.user);
const isAdmiral = user.rank === 'admiral';

// In Convex
const user = await ctx.db.get(userId);
if (user.rank !== 'admiral') {
  throw new Error("Unauthorized");
}
```

### Checking Organization

```typescript
// In components
const user = useFuse((s) => s.user);
const orgId = user.orgId;

// In Convex
const user = await ctx.db.get(userId);
const orgUsers = await ctx.db
  .query("admin_users")
  .withIndex("by_org_id", (q) => q.eq("orgId", user.orgId))
  .collect();
```

---

## Testing Compliance

### Manual Verification

1. **Check imports:** No `@clerk/*` outside auth boundary
2. **Check mutations:** All accept `userId: v.id("admin_users")`
3. **Check queries:** All use Convex ID lookups
4. **Check cookie:** No `clerkId` field
5. **Check store:** No Clerk hydration

### Automated Verification

```bash
# Full scan
/VRP-clerk-scan

# Import check
grep -r "@clerk" src/features/ src/store/ convex/

# Mutation check
grep -r "clerkId: v.string()" convex/
```

---

## Migration Guide

### From Clerk Hooks to FUSE

**Before:**
```typescript
import { useUser } from '@clerk/nextjs';

function Profile() {
  const { user } = useUser();
  return <div>{user?.firstName}</div>;
}
```

**After:**
```typescript
import { useFuse } from '@/store/fuse';

function Profile() {
  const user = useFuse((s) => s.user);
  return <div>{user?.firstName}</div>;
}
```

### From auth() to Session Cookie

**Before:**
```typescript
import { auth } from '@clerk/nextjs/server';

export async function myAction() {
  const { userId } = await auth();
  await mutation({ clerkId: userId });
}
```

**After:**
```typescript
import { readSessionCookie } from '@/lib/session';

export async function myAction() {
  const session = await readSessionCookie();
  await mutation({ userId: session._id });
}
```

### From by_clerk_id to Direct Lookup

**Before:**
```typescript
const user = await ctx.db
  .query("admin_users")
  .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
  .unique();
```

**After:**
```typescript
const user = await ctx.db.get(userId);
```

---

## Exceptions

### Webhooks

Clerk webhooks necessarily receive `clerkId`. This is permitted **only** in `/app/(clerk)/webhooks/**`:

```typescript
// PERMITTED in webhook handler
export async function POST(req: Request) {
  const payload = await req.json();
  const clerkId = payload.data.id;

  // Lookup or create — the ONLY place this is allowed
  const user = await convex.query(api.identity.getOrCreateByClerkId, {
    clerkId
  });
}
```

### Identity Handoff

The initial login flow necessarily uses `auth()`. This is permitted **only** in `/app/(auth)/**`:

```typescript
// PERMITTED in auth boundary
export async function handleLogin() {
  const { userId: clerkId } = await auth();

  // Perform handoff
  const convexUser = await convex.query(api.identity.getByClerkId, { clerkId });

  // Mint sovereign session
  await writeSessionCookie({
    _id: convexUser._id,
    // clerkId NOT included
  });
}
```

---

*Compliance is not optional. Every pattern must follow the doctrine.*
