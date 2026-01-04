# Identity Pipeline

> The single valid path for identity to flow through the system

---

## Overview

Identity must flow through a strictly defined pipeline. Any deviation creates "dual identity" — where both Clerk and Convex claim authority — leading to runtime instability.

---

## The Golden Bridge

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTH BOUNDARY                             │
│  /app/(auth)/** and /app/(clerk)/**                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Clerk authenticates user                                     │
│     └── clerkId obtained from auth()                            │
│                                                                  │
│  2. Server Action performs IDENTITY HANDOFF                      │
│     └── Lookup: getOrCreateByClerkId(clerkId)                   │
│     └── Returns: convexUser._id                                  │
│                                                                  │
│  3. Session cookie minted with Convex _id                        │
│     └── Cookie contains: { _id, rank, orgId, ... }              │
│     └── clerkId is NOT in cookie                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Cookie delivered via SSR
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SOVEREIGN RUNTIME                           │
│  FuseApp, Domains, Features, Convex                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  4. FuseApp reads session cookie                                 │
│     └── Hydrates FUSE store with user data                      │
│     └── _id becomes canonical identity                          │
│                                                                  │
│  5. Domain views read from FUSE                                  │
│     └── useFuse((s) => s.user)                                  │
│     └── No Clerk imports, no auth() calls                       │
│                                                                  │
│  6. Convex mutations receive userId                              │
│     └── mutation({ userId: session._id })                       │
│     └── ctx.db.get(userId) — direct document lookup             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Handoff Ceremony

The critical moment where identity transitions from Clerk to FUSE:

```typescript
// INSIDE AUTH BOUNDARY ONLY
export async function performIdentityHandoff() {
  // Step 1: Clerk provides identity
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Not authenticated');

  // Step 2: Find or create Convex user
  const convexUser = await convex.query(
    api.identity.getOrCreateByClerkId,
    { clerkId }
  );

  // Step 3: Mint sovereign session
  const sessionData = {
    _id: convexUser._id,        // PRIMARY IDENTITY
    rank: convexUser.rank,
    orgId: convexUser.orgId,
    // clerkId is NOT included
  };

  // Step 4: Write cookie
  await writeSessionCookie(sessionData);

  // Clerk's job is DONE. FUSE takes over.
}
```

**Key points:**
- `clerkId` is used exactly ONCE — for the Convex lookup
- Session cookie contains only Convex data
- After handoff, `clerkId` never appears again

---

## Identity Resolution

### In Domain Views

```typescript
// Domain component
function UserProfile() {
  // Read from FUSE — sovereign identity
  const user = useFuse((s) => s.user);

  return <Profile userId={user._id} />;
}
```

### In Convex Mutations

```typescript
// Convex mutation
export const updateProfile = mutation({
  args: {
    userId: v.id("admin_users"),  // Convex ID, not clerkId
    data: v.object({ ... }),
  },
  handler: async (ctx, { userId, data }) => {
    // Direct document lookup — no index needed
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, data);
  },
});
```

### In Server Actions

```typescript
// Server Action (OUTSIDE auth boundary)
export async function updateUserProfile(data: ProfileData) {
  // Read from cookie — sovereign identity
  const session = await readSessionCookie();

  // Pass Convex _id to mutation
  await convex.mutation(api.users.updateProfile, {
    userId: session._id,  // NOT clerkId
    data,
  });
}
```

---

## Anti-Patterns

### Dual Identity

```typescript
// VIOLATION: Using both identities
const { userId: clerkId } = await auth();
const session = await readSessionCookie();

// Now you have two sources of truth — which is canonical?
await mutation({
  clerkId,        // From Clerk
  userId: session._id  // From FUSE
});
```

### Runtime Translation

```typescript
// VIOLATION: Converting at runtime
function Component() {
  const { user: clerkUser } = useUser();  // Clerk hook

  // Translating Clerk → Convex in component
  const convexUser = useQuery(api.users.getByClerkId, {
    clerkId: clerkUser?.id
  });
}
```

### Cookie Pollution

```typescript
// VIOLATION: Storing clerkId in session
const sessionData = {
  _id: convexUser._id,
  clerkId: clerkId,  // NEVER store this
};
```

---

## Verification

To verify correct pipeline implementation:

1. **Cookie inspection:** Session cookie should not contain `clerkId`
2. **Import scan:** No `@clerk/*` imports outside auth boundary
3. **Mutation scan:** No mutations accepting `clerkId: v.string()`
4. **Query scan:** No queries using `by_clerk_id` index for runtime lookups

---

*The Golden Bridge is crossed once. After crossing, the bridge is burned.*
