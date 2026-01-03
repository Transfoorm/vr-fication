# 06 - WARP Orchestrator

> Preload all domain data during idle time.

## What It Is

WARP (Web Application Resource Preloader) fetches all domain data in the background while the user is idle. By the time they navigate, the data is already in FUSE store.

## Location

`/fuse/warp/`

## How It Works

```
FuseApp mounts
      │
      ▼
requestIdleCallback()
      │
      ▼
┌─────────────────────────┐
│    WARP Orchestrator    │
│  Fetches domain data    │
│  in priority order      │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
/api/warp/*    FUSE Store
(endpoints)    (hydration)
```

## Priority Order

WARP fetches in this order:

1. **Current domain** - Where user is right now
2. **Dashboard** - Home page data
3. **Adjacent domains** - Likely next clicks
4. **Remaining domains** - Everything else

## API Endpoints

Each domain has a WARP endpoint:

| Endpoint | Populates |
|----------|-----------|
| `/api/warp/dashboard` | Dashboard data |
| `/api/warp/admin` | Admin slice |
| `/api/warp/clients` | Clients slice |
| `/api/warp/finance` | Finance slice |
| `/api/warp/productivity` | Productivity slice |
| `/api/warp/projects` | Projects slice |
| `/api/warp/settings` | Settings slice |
| `/api/warp/system` | System slice |

## Files

- [idle-preload.md](./idle-preload.md) - The requestIdleCallback strategy
- [domain-preload.md](./domain-preload.md) - Per-domain fetching
