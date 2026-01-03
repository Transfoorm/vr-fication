# Idle-Time Preloading

> Using requestIdleCallback to preload without blocking.

## The Strategy

Browser has "idle time" - moments when it's not doing anything important:

- User is reading content
- No animations running
- No input being handled

WARP uses this time to fetch data.

## requestIdleCallback

```typescript
// In FuseApp mount
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    runWarpPreload();
  });
}
```

This tells the browser: "When you have nothing better to do, run this."

## How It Works

```
User lands on Dashboard
         │
         ▼
┌─────────────────────────┐
│  Page renders (fast)    │
│  User starts reading    │
└───────────┬─────────────┘
            │
            ▼ (idle time detected)
┌─────────────────────────┐
│  WARP starts fetching   │
│  One domain at a time   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  User clicks nav        │
│  Data already in store  │
│  Instant render!        │
└─────────────────────────┘
```

## Deadline Management

```typescript
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && hasPendingWork()) {
    doNextChunk();
  }

  if (hasPendingWork()) {
    // Schedule more work for next idle period
    requestIdleCallback(continueWork);
  }
});
```

Key points:
- Check `deadline.timeRemaining()` before each chunk
- Yield back to browser if time runs out
- Resume on next idle period

## Fallback for Safari

Safari doesn't support requestIdleCallback. Fallback:

```typescript
const requestIdleCallback =
  window.requestIdleCallback ||
  ((cb) => setTimeout(cb, 1));
```

Not as smart, but still non-blocking.

## What Gets Preloaded

Priority order:

```typescript
const preloadOrder = [
  'dashboard',      // Always needed
  currentDomain,    // Where user is
  'admin',          // Common next
  'clients',
  'finance',
  'productivity',
  'projects',
  'settings',
  'system',
];
```

## User Interaction Interrupts

If user interacts (click, scroll, type), browser takes back control:

```
Idle → Preloading → User clicks → Preload pauses
                                        │
                                        ▼
                                 Handle interaction
                                        │
                                        ▼
                               Idle again → Resume preload
```

User experience is never impacted.
