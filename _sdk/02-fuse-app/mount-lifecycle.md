# Mount Lifecycle

> FuseApp mounts once and stays mounted forever.

## The Single Mount

```typescript
// This useEffect runs ONCE
useEffect(() => {
  console.log('FUSE 6.0: Sovereign runtime mounted');

  // 1. Hydrate sidebar sections
  sovereignHydrateSections();

  // 2. Parse initial URL
  const pathname = window.location.pathname;
  const initialRoute = urlPathToRoute(pathname);
  navigate(initialRoute);

  // 3. Handle browser navigation
  window.addEventListener('popstate', handlePopState);

  // 4. Start WARP preloading
  requestIdleCallback(() => {
    // runWarpPreload();
  });

  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}, []);
```

## What Triggers on Mount

| Action | Purpose |
|--------|---------|
| `sovereignHydrateSections()` | Restore sidebar expand/collapse from localStorage |
| `urlPathToRoute(pathname)` | Convert URL to route string |
| `navigate(route)` | Set initial route in FUSE store |
| `addEventListener('popstate')` | Handle browser back/forward |
| `requestIdleCallback` | Start WARP preloading when browser is idle |

## What Does NOT Trigger

FuseApp does NOT re-mount when:

- User clicks sidebar navigation
- URL changes via `navigate()`
- Browser back/forward buttons
- Data updates in FUSE store

The only way FuseApp unmounts is:

- Full page refresh (F5)
- Navigate to auth pages (`/sign-in`, etc.)
- Close browser tab

## Memory Implications

Since FuseApp never unmounts:

- All child component state is preserved
- Event listeners stay attached
- FUSE store subscriptions remain active
- WARP preloaded data stays in memory

This is intentional. Memory is cheap. Speed is everything.

## Session Boundaries

```
Login ─────► FuseApp mounts
                │
                │  (All navigation happens here)
                │  (FuseApp stays mounted)
                │
Logout ────► FuseApp unmounts
```

A "session" in FUSE terms = one FuseApp mount lifecycle.
