# 05 - FUSE Store

> The single source of truth for all application state.

## Location

`/store/fuse.ts`

## What It Is

FUSE Store is a Zustand store that holds:

- **User data** - Profile, preferences, rank
- **Domain data** - Admin, clients, finance, etc.
- **UI state** - Sidebar sections, current route
- **Session data** - From cookie hydration

Everything lives here. No separate contexts. No provider soup.

## Store Structure

```typescript
interface FuseStore {
  // User (hydrated from cookie)
  user: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    rank: UserRank;
  };

  // Theme
  theme: {
    name: string;
    mode: 'light' | 'dark';
  };

  // Sovereign Router
  sovereign: {
    route: string;
    sections: Record<string, boolean>;
  };

  // Domain Data (populated by WARP)
  admin: { ... };
  clients: { ... };
  finance: { ... };
  productivity: { ... };
  projects: { ... };
  settings: { ... };
  system: { ... };

  // Actions
  navigate: (route: string) => void;
  setUser: (user: UserData) => void;
  setTheme: (theme: ThemeData) => void;
  // ... more actions
}
```

## Usage

```typescript
import { useFuse } from '@/store/fuse';

// Read state
const user = useFuse((s) => s.user);
const route = useFuse((s) => s.sovereign.route);

// Call actions
const navigate = useFuse((s) => s.navigate);
navigate('admin/users');
```

## Files

- [slices.md](./slices.md) - Store structure and slices
- [hydration.md](./hydration.md) - How store gets populated
