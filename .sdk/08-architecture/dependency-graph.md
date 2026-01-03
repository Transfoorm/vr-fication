# Dependency Graph

> What depends on what in the FUSE architecture.

## Layer Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  01 - App Router (Next.js)                                      │
│  Dependencies: Clerk, Middleware                                │
│  Provides: Server render, Auth pages, API routes                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  02 - FuseApp                                                   │
│  Dependencies: 01 (server render), 05 (FUSE store)              │
│  Provides: Shell, Router mount point                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  03 - Sovereign Router                                          │
│  Dependencies: 02 (mount point), 05 (route state)               │
│  Provides: Navigation, View switching                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  04 - Domain Views                                              │
│  Dependencies: 03 (routing), 05 (data)                          │
│  Provides: Page UI                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  05 - FUSE Store                                                │
│  Dependencies: None (core)                                      │
│  Provides: State for all layers                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────────────────────┐         ┌─────────────────────────┐
│  06 - WARP Orchestrator │         │  07 - Convex Sync       │
│  Dependencies: 05       │         │  Dependencies: 05       │
│  Provides: Preload data │         │  Provides: Real-time    │
└─────────────────────────┘         └─────────────────────────┘
```

## Import Rules

| Layer | Can Import From |
|-------|-----------------|
| 01 - App Router | Middleware, Clerk |
| 02 - FuseApp | 01, 03, 04, 05 |
| 03 - Sovereign Router | 05 |
| 04 - Domain Views | 03, 05 |
| 05 - FUSE Store | (nothing - core) |
| 06 - WARP | 05 |
| 07 - Convex | 05 |

## What Each Layer Owns

### 01 - App Router
- `/app/(auth)/` - Auth pages
- `/app/page.tsx` - Root page
- `/app/layout.tsx` - Root layout
- `/middleware.ts` - URL handling
- `/api/` - API endpoints

### 02 - FuseApp
- `/app/FuseApp.tsx` - The runtime
- `/shell/` - Shell components
- `/fuse/hydration/` - Cookie hydration

### 03 - Sovereign Router
- `/app/domains/Router.tsx` - View switch
- `/store/domains/navigation.ts` - Route utilities

### 04 - Domain Views
- `/app/domains/{domain}/` - All page components

### 05 - FUSE Store
- `/store/fuse.ts` - The store
- `/store/types.ts` - Type definitions
- `/store/selectors.ts` - Selectors

### 06 - WARP
- `/fuse/warp/` - Preload logic
- `/api/warp/` - Data endpoints

### 07 - Convex
- `/convex/` - All Convex code
- `/providers/*SyncProvider` - Sync providers

## Circular Dependency Prevention

**FUSE Store (05) imports nothing from other layers.**

This is critical. If FUSE store imported from Domain Views, you'd have:

```
Domain Views → FUSE Store → Domain Views (CIRCULAR!)
```

Instead:

```
Domain Views → FUSE Store ← WARP
                   ↑
               Convex Sync
```

FUSE Store is the hub. Everything points to it. It points to nothing.

## Adding New Code

| I'm adding... | Put it in... | Can import from... |
|---------------|--------------|-------------------|
| New page | 04 - Domain Views | 03, 05 |
| New store slice | 05 - FUSE Store | (nothing) |
| New shell component | 02 - FuseApp | 05 |
| New API route | 01 - App Router | Convex |
| New Convex function | 07 - Convex | (Convex only) |
