# FUSE 6.0 Architecture

> The Sovereign Runtime - Zero loading states. Forever.

```
                    ┌───────────────────────────────┐
                    │       App Router (Next.js)    │
                    │  - Login, Register, Public    │
                    │  - Server-rendered Shell      │
                    └────────────┬──────────────────┘
                                 │ Handover (/app)
                                 ▼
                    ┌───────────────────────────────┐
                    │           FuseApp (Client)    │
                    │  - Mounts once                │
                    │  - Never unmounts             │
                    │  - Sovereign runtime          │
                    └────────────┬──────────────────┘
                                 │
                                 ▼
               ┌──────────────────────────────────────────┐
               │         Sovereign Router (SR)            │
               │  - routeAtom (state)                     │
               │  - navigate()                            │
               │  - RouterView()                          │
               └──────────────┬───────────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────────┐
               │             Domain Views                 │
               │  (Dashboard, Crew, Ledger, Tasks, etc.)  │
               │   - Pure client                          │
               │   - 32–65ms navigation                   │
               │   - Renders from FUSE store              │
               └──────────────┬───────────────────────────┘
                              │
                              ▼
     ┌──────────────────────────────────────────────────────────────────┐
     │                            FUSE STORE                            │
     │   - Canonical application state                                  │
     │   - Hydrated by WARP and Convex background sync                  │
     └──────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────────────┐
               │           WARP ORCHESTRATOR              │
               │   - Preloads all domain data             │
               │   - requestIdleCallback()                │
               │   - Zero latency across navigation       │
               └──────────────┬───────────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────────┐
               │          Convex Background Sync          │
               │   - Not UI-critical                      │
               │   - Not blocking                         │
               │   - Hydrates FUSE                        │
               └──────────────────────────────────────────┘
```

## The Philosophy

Every spinner is a bug. Every skeleton loader is an admission of defeat. Every "Loading..." is a broken promise.

When you click a link, the page appears. Not "fast" - **instant**. Like it was always there.

## Layer Summary

| Layer | Purpose | Location |
|-------|---------|----------|
| [01 - App Router](./01-app-router/) | Next.js server layer for auth pages | `/app/(auth)/`, `/app/page.tsx` |
| [02 - FuseApp](./02-fuse-app/) | Sovereign client runtime | `/app/FuseApp.tsx` |
| [03 - Sovereign Router](./03-sovereign-router/) | Client-side navigation | `/store/fuse.ts`, `/app/domains/Router.tsx` |
| [04 - Domain Views](./04-domain-views/) | Page components | `/app/domains/{domain}/` |
| [05 - FUSE Store](./05-fuse-store/) | Canonical state | `/store/fuse.ts` |
| [06 - WARP Orchestrator](./06-warp-orchestrator/) | Idle-time preloading | `/fuse/warp/` |
| [07 - Convex Sync](./07-convex-sync/) | Background data sync | `/convex/` |

## Data Flow

1. **User logs in** → Clerk authenticates → Session cookie set with user data
2. **FuseApp mounts** → Hydrates from cookie → WARP starts preloading
3. **User clicks nav** → `navigate()` updates route state → Router renders new view
4. **View renders** → Reads from FUSE store → Data already there (WARP preloaded it)

No fetching on navigation. No loading states. No spinners.

## Key Principles

1. **Fetch on idle, not on demand** - WARP preloads during quiet moments
2. **One source of truth** - Everything lives in FUSE store
3. **Server handover** - Next.js handles auth, then gets out of the way
4. **Sovereignty** - After mount, FUSE owns all navigation

## Navigation Performance

| Metric             | Target | Achieved |
|--------------------|--------|----------|
| Click → Render     | <100ms |   0.4ms  |
| Cold start (local) | <3s    |   ~2.4s  |
| Cold start (prod)  | <500ms |   ~467ms |
