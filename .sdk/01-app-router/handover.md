# Server → Client Handover

> How Next.js passes control to FUSE.

## The Handover Point

```
Browser request: /admin/users
        │
        ▼
┌─────────────────────────┐
│      Middleware         │
│  Rewrites to /          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   /app/page.tsx (SSR)   │
│   Returns <FuseApp />   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   FuseApp hydrates      │
│   Reads URL pathname    │
│   Sets sovereign.route  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Router.tsx renders    │
│   <Users /> component   │
└─────────────────────────┘
```

## Session Cookie

Before handover, the session cookie is already set (from login). It contains:

```typescript
interface SessionPayload {
  clerkId: string;
  rank: UserRank;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  themeName: string;
  themeMode: string;
}
```

FuseApp hydrates the FUSE store from this cookie on mount.

## URL Parsing

On mount, FuseApp reads the current URL and converts it to a route:

```typescript
// FuseApp.tsx
useEffect(() => {
  const pathname = window.location.pathname;
  const initialRoute = urlPathToRoute(pathname);
  navigate(initialRoute);
}, []);
```

The `urlPathToRoute` function converts:
- `/admin/users` → `'admin/users'`
- `/finance/invoices` → `'finance/invoices'`
- `/` → `'dashboard'`

## Why Rewrite Instead of Catch-All?

We use middleware rewrite instead of `[[...slug]]` catch-all because:

1. **Cleaner build output** - Only actual pages show in build
2. **No route conflicts** - Catch-all can conflict with other routes
3. **Explicit control** - Middleware shows exactly what routes are handled
4. **Same result** - URL preserved, FuseApp renders

## After Handover

Once FuseApp mounts, Next.js is done. All subsequent navigation:

1. User clicks sidebar link
2. `navigate('new/route')` called
3. `sovereign.route` updates in FUSE store
4. Router.tsx re-renders with new component
5. Browser URL updated via `history.pushState`

No server round-trips. No Next.js involvement. Pure client-side.
