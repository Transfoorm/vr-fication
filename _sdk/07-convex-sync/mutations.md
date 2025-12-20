# Convex Mutations

> Writing data to Convex.

## Mutation Structure

```typescript
// /convex/users.ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('users', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('users'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, updates);
  },
});
```

## Using Mutations

```typescript
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

function CreateUserForm() {
  const createUser = useMutation(api.users.create);

  const handleSubmit = async (data) => {
    await createUser({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    // No need to refetch - Convex will update subscribers
  };
}
```

## Optimistic Updates

For instant feedback, update FUSE immediately:

```typescript
function CreateUserForm() {
  const createUser = useMutation(api.users.create);
  const addUser = useFuse((s) => s.addAdminUser);

  const handleSubmit = async (data) => {
    // Optimistic: Update UI immediately
    const tempId = `temp-${Date.now()}`;
    addUser({ ...data, _id: tempId });

    // Then sync with server
    await createUser(data);
    // Convex will push the real user with real ID
  };
}
```

## The Write Flow

```
User clicks "Save"
        │
        ├─► 1. Update FUSE (optimistic)
        │       UI updates immediately
        │
        ├─► 2. Call mutation
        │       Sent to Convex
        │
        ▼
Convex processes
        │
        ├─► Success: Query subscribers notified
        │            FUSE updated with real data
        │
        └─► Failure: Roll back optimistic update
                     Show error to user
```

## Error Handling

```typescript
const handleSubmit = async (data) => {
  try {
    await createUser(data);
    toast.success('User created');
  } catch (error) {
    toast.error('Failed to create user');
    // If optimistic update was made, roll it back
    removeUser(tempId);
  }
};
```

## Mutations and Authorization

Mutations should check permissions:

```typescript
export const delete = mutation({
  args: { id: v.id('users') },
  handler: async (ctx, { id }) => {
    // Check caller has permission
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await ctx.db.get(id);
    if (!user) throw new Error('User not found');

    await ctx.db.delete(id);
  },
});
```

## Mutations Don't Block Navigation

Because FUSE store is the source of truth for UI:

1. User makes change
2. FUSE updated optimistically
3. User navigates away (instant)
4. Mutation completes in background
5. Convex syncs data when user returns

No waiting. No blocking. No spinners.
