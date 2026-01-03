# Store Hydration

> How FUSE store gets populated with data.

## Hydration Sources

FUSE store is hydrated from multiple sources:

```
Session Cookie ──► User slice, Theme slice
       │
       ▼
   FuseApp mounts
       │
       ▼
WARP Preload ────► Domain slices (background)
       │
       ▼
Convex Sync ─────► Real-time updates (background)
```

## 1. Cookie Hydration (Immediate)

On FuseApp mount, `ClientHydrator` reads the session cookie:

```tsx
// /fuse/hydration/ClientHydrator.tsx
export function ClientHydrator() {
  useEffect(() => {
    const session = readSessionCookie();
    if (session) {
      useFuse.getState().setUser({
        clerkId: session.clerkId,
        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName,
        avatarUrl: session.avatarUrl,
        rank: session.rank,
      });
      useFuse.getState().setTheme({
        name: session.themeName,
        mode: session.themeMode,
      });
    }
  }, []);

  return null;
}
```

This is **immediate** - no network call. Cookie is already in browser.

## 2. WARP Preload (Background)

During idle time, WARP preloads domain data:

```typescript
// In FuseApp mount
requestIdleCallback(() => {
  runWarpPreload();
});
```

WARP fetches from `/api/warp/{domain}` endpoints:

```
/api/warp/admin       ──► admin slice
/api/warp/clients     ──► clients slice
/api/warp/finance     ──► finance slice
/api/warp/productivity ──► productivity slice
/api/warp/projects    ──► projects slice
/api/warp/settings    ──► settings slice
/api/warp/system      ──► system slice
```

This is **background** - doesn't block UI.

## 3. Convex Sync (Real-time)

For data that changes frequently, Convex provides real-time sync:

```typescript
// Convex subscription
const users = useQuery(api.users.list);

// When users change, update FUSE
useEffect(() => {
  if (users) {
    useFuse.getState().setAdminUsers(users);
  }
}, [users]);
```

This is **real-time** - updates arrive via WebSocket.

## Hydration Timeline

```
0ms      ─── Page load starts
         │
100ms    ─── FuseApp mounts
         │   └── Cookie hydration (sync)
         │       User + Theme in store
         │
200ms    ─── Browser idle starts
         │   └── WARP preload begins
         │
500ms    ─── First WARP response
         │   └── Domain data starts populating
         │
1000ms   ─── All WARP data loaded
         │   └── Store fully hydrated
         │
ongoing  ─── Convex sync active
             └── Real-time updates flowing
```

## Priority Order

1. **Cookie** - User identity, theme (needed immediately)
2. **Current domain** - Data for the page user is viewing
3. **Adjacent domains** - Likely next navigation targets
4. **Other domains** - Everything else during idle

## No Loading States

Because hydration happens:
- Cookie: Already in browser
- WARP: During idle time
- Convex: Background sync

By the time user navigates, data is already there.
