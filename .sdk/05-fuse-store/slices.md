# Store Slices

> The structure of FUSE store.

## Slice Architecture

FUSE store is organized into slices:

```
FuseStore
├── user          # User profile & auth
├── theme         # Theme settings
├── sovereign     # Router state
├── admin         # Admin domain data
├── clients       # Clients domain data
├── finance       # Finance domain data
├── productivity  # Productivity domain data
├── projects      # Projects domain data
├── settings      # Settings domain data
└── system        # System domain data
```

## User Slice

Hydrated from session cookie on mount:

```typescript
user: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  rank: UserRank;  // 'admiral' | 'captain' | 'lieutenant' | 'crew'
}
```

## Theme Slice

```typescript
theme: {
  name: string;      // Theme name
  mode: 'light' | 'dark';
}
```

## Sovereign Slice

Controls the Sovereign Router:

```typescript
sovereign: {
  route: string;     // Current route: 'admin/users'
  sections: {        // Sidebar expand state
    [sectionId: string]: boolean;
  };
}
```

## Domain Slices

Each domain has its own slice:

```typescript
admin: {
  users: User[];
  plans: Plan[];
  // ...
}

clients: {
  contacts: Contact[];
  teams: Team[];
  // ...
}

finance: {
  invoices: Invoice[];
  payments: Payment[];
  // ...
}
```

## Actions

```typescript
// Navigation
navigate: (route: string) => void;
sovereignHydrateSections: () => void;
toggleSection: (sectionId: string) => void;

// User
setUser: (user: UserData) => void;
clearUser: () => void;

// Theme
setTheme: (theme: ThemeData) => void;

// Domain data
setAdminData: (data: AdminData) => void;
setClientsData: (data: ClientsData) => void;
// ... etc
```

## Creating Selectors

For frequently accessed data, create selectors:

```typescript
// In /store/selectors.ts
export const selectUser = (s: FuseStore) => s.user;
export const selectRoute = (s: FuseStore) => s.sovereign.route;
export const selectInvoices = (s: FuseStore) => s.finance.invoices;
```

Usage:

```typescript
const user = useFuse(selectUser);
const route = useFuse(selectRoute);
```

## Adding a New Slice

1. Define the type in `/store/types.ts`
2. Add initial state in `/store/fuse.ts`
3. Add actions for updating the slice
4. Add WARP preloader for the data
