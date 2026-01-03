# Route State

> The `sovereign.route` atom in FUSE store.

## Location

`/store/fuse.ts` → `sovereign` slice

## Structure

```typescript
interface SovereignState {
  route: string;           // Current route: 'admin/users', 'dashboard', etc.
  sections: {              // Sidebar expand/collapse state
    [sectionId: string]: boolean;
  };
}
```

## Route Format

Routes are simple strings in `domain/page` format:

| URL | Route |
|-----|-------|
| `/` | `'dashboard'` |
| `/admin/users` | `'admin/users'` |
| `/admin/plans` | `'admin/plans'` |
| `/finance/invoices` | `'finance/invoices'` |
| `/clients/contacts` | `'clients/contacts'` |
| `/settings/account` | `'settings/account'` |

## Reading the Route

```typescript
// In a component
const route = useFuse((s) => s.sovereign.route);

// Or use the selector
const route = useFuse(selectRoute);
```

## Route Changes Trigger

When `sovereign.route` changes:

1. Router.tsx re-renders (subscribed to route)
2. Sidebar active state updates
3. PageHeader updates (via `useSetPageHeader`)
4. Browser URL updates (via `history.pushState`)

## Initial Route

Set on FuseApp mount by parsing the URL:

```typescript
const pathname = window.location.pathname;
const initialRoute = urlPathToRoute(pathname);
navigate(initialRoute);
```

## Route Persistence

Routes are NOT persisted to localStorage. On page refresh:

1. URL is read from browser
2. Middleware rewrites to `/`
3. FuseApp parses URL
4. Route is set in store

This means the URL is the source of truth for initial route.
