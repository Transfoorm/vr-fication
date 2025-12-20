# 07 - Convex Background Sync

> Real-time data updates that don't block the UI.

## What It Is

Convex provides real-time data synchronization via WebSocket. When data changes in the database, subscribed clients receive updates automatically.

## Location

`/convex/`

## Role in FUSE

Convex is the **background sync layer**:

- NOT UI-critical (don't wait for it)
- NOT blocking (doesn't delay navigation)
- Hydrates FUSE store with fresh data
- Keeps data current after WARP preload

## The Principle

```
WARP preloads ─────► FUSE store has data
                           │
                           ▼
                     User sees content
                           │
                           ▼
Convex syncs ─────► FUSE store updated (background)
                           │
                           ▼
                     UI updates reactively
```

User never waits for Convex. It just keeps things fresh.

## Files

- [queries.md](./queries.md) - Reading data patterns
- [mutations.md](./mutations.md) - Writing data patterns
