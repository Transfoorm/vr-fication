# 03 - Sovereign Router (SR)

> Client-side navigation that bypasses Next.js completely.

## What It Is

The Sovereign Router is a simple state-based router:

1. **Route state** lives in FUSE store (`sovereign.route`)
2. **`navigate()`** updates the route state
3. **`Router.tsx`** renders the component for current route

No Next.js `<Link>`. No App Router. No server round-trips.

## Core Components

| File | Purpose |
|------|---------|
| `/store/fuse.ts` | Contains `sovereign.route` state and `navigate()` |
| `/store/domains/navigation.ts` | Route utilities (`urlPathToRoute`, `routeToUrlPath`) |
| `/app/domains/Router.tsx` | Switch statement that renders views |
| `/middleware.ts` | Rewrites domain URLs to `/` |

## The Route State

```typescript
// In FUSE store
sovereign: {
  route: 'admin/users',  // Current route
  sections: { ... },      // Sidebar state
}
```

Route format: `'domain/page'` (e.g., `'admin/users'`, `'finance/invoices'`)

Special route: `'dashboard'` for the home view.

## How Navigation Works

```
User clicks "Users" in sidebar
         │
         ▼
┌─────────────────────────┐
│  navigate('admin/users')│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  FUSE store updates     │
│  sovereign.route =      │
│    'admin/users'        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  history.pushState()    │
│  URL → /admin/users     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Router.tsx re-renders  │
│  Returns <Users />      │
└─────────────────────────┘
```

Total time: **0.4ms**

## Files

- [BLUEPRINT.md](./BLUEPRINT.md) - Sovereign Router Blueprint (the philosophy)
- [IMPLEMENTATION-KIT.md](./IMPLEMENTATION-KIT.md) - Step-by-step implementation guide
- [route-state.md](./route-state.md) - The `sovereign.route` atom
- [navigate.md](./navigate.md) - The `navigate()` function
- [router-view.md](./router-view.md) - How Router.tsx works
- [middleware-rewrite.md](./middleware-rewrite.md) - URL handling
