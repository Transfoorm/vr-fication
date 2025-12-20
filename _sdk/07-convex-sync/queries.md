# Convex Queries

> Reading data from Convex.

## Query Structure

```typescript
// /convex/users.ts
import { query } from './_generated/server';

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

export const getById = query({
  args: { id: v.id('users') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
```

## Using Queries in Components

```typescript
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

function UserList() {
  const users = useQuery(api.users.list);

  // users is undefined while loading
  // then becomes the array of users
}
```

## Syncing to FUSE Store

The pattern for syncing Convex data to FUSE:

```typescript
function UserSyncProvider() {
  const users = useQuery(api.users.list);
  const setAdminUsers = useFuse((s) => s.setAdminUsers);

  useEffect(() => {
    if (users) {
      setAdminUsers(users);
    }
  }, [users, setAdminUsers]);

  return null;  // Invisible component
}
```

This component:
1. Subscribes to Convex query
2. When data arrives/updates, pushes to FUSE
3. Domain views read from FUSE (not Convex directly)

## Why Not Use Convex Directly in Views?

You could do:

```typescript
// Direct Convex usage
function Users() {
  const users = useQuery(api.users.list);  // Returns undefined initially
  if (!users) return <Loading />;          // Loading state needed
  return <UserTable users={users} />;
}
```

But this means loading states on every page.

Instead:

```typescript
// FUSE pattern
function Users() {
  const users = useFuse((s) => s.admin.users);  // Already populated
  return <UserTable users={users} />;            // No loading state
}
```

WARP preloaded the data. Convex keeps it fresh.

## Real-Time Updates

Convex queries are reactive:

```
User A adds new user
        │
        ▼
Convex DB updated
        │
        ▼
All subscribed clients notified
        │
        ▼
UserSyncProvider receives update
        │
        ▼
FUSE store updated
        │
        ▼
UI re-renders with new user
```

All automatic. No polling. No manual refresh.

## Query Caching

Convex caches query results:

- Same query with same args = cached result
- Cache invalidated when underlying data changes
- No stale data possible

You don't manage cache. Convex handles it.
