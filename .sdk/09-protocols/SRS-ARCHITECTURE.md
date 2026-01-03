# SRS Architecture

> Sovereign Router System: Manifest-Based Authorization for Client-Side Routing

---

## What is SRS?

**SRS (Sovereign Router System)** is the authorization layer for Transfoorm's Sovereign Router architecture. It replaces the old SMAC 4-layer model with a streamlined 2-layer approach.

```
┌─────────────────────────────────────────────┐
│ SOVEREIGN ROUTER (Client-Side Navigation)   │
│ • FuseApp mounts ONCE, never unmounts       │
│ • navigate() switches domain views          │
│ • URL changes without page reload           │
│ • Middleware ONLY runs on initial load      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ SRS LAYER 1: Rank Manifests                 │
│ • Compile-time allowlists per rank          │
│ • Navigation uses manifest to show/hide     │
│ • Entry gate checks on initial load only    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ SRS LAYER 2: Convex Data Scoping            │
│ • Query-level rank filtering                │
│ • THE security layer - always enforced      │
│ • Can't bypass via client-side tricks       │
└─────────────────────────────────────────────┘
```

**Key Difference from SMAC:**
- SMAC assumed App Router (middleware runs on every navigation)
- SRS assumes Sovereign Router (middleware only runs on initial load)
- **Real security is in Convex queries, not middleware**

---

## The Two Layers

### Layer 1: Rank Manifests

Compile-time allowlists define what routes each rank can access:

```typescript
// src/rank/admiral/manifest.ts
export const ADMIRAL_MANIFEST: RankManifest = {
  id: 'admiral',
  label: 'Admiral',
  home: '/admin/users',
  allowed: [
    '/admin/users',
    '/admin/plans',
    '/system/ai',
    '/settings/account',
    // ... all routes
  ],
  nav: [
    { path: '/admin/users', label: 'Users', icon: 'users' },
    // ... navigation items
  ],
};
```

**What manifests do:**
- Define allowed routes per rank (compile-time)
- Build navigation menus (only show allowed items)
- Entry gate check on initial page load
- **NOT a security boundary** - just UX optimization

### Layer 2: Convex Data Scoping

The REAL security layer - queries filter data by rank:

```typescript
export const listClients = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    switch (user.rank) {
      case 'crew':
        // Only assigned clients
        return ctx.db.query('clients')
          .filter(q => q.eq(q.field('assignedTo'), user._id));

      case 'captain':
      case 'commodore':
        // Org-scoped
        return ctx.db.query('clients')
          .filter(q => q.eq(q.field('orgId'), user.orgId));

      case 'admiral':
        // All clients
        return ctx.db.query('clients');
    }
  }
});
```

**Why this is THE security layer:**
- Runs on Convex server (can't bypass)
- Every query enforces rank scoping
- Even if someone hacks the URL, they get no data
- Defense that actually works

---

## Why Only 2 Layers?

### The Sovereign Router Reality

With Sovereign Router:
1. User loads app → Middleware runs ONCE
2. FuseApp mounts → Never unmounts
3. User clicks link → `navigate()` swaps domain view
4. **Middleware doesn't run** on client navigation

This means:
- Middleware is an ENTRY GATE, not continuous enforcement
- Client-side manifest checks are UX, not security
- **Convex is the only real security boundary**

### The Old SMAC Model (Deprecated)

SMAC assumed App Router with 4 layers:
1. Domain-based routes (App Router folders)
2. Static manifests (per-route JSON files)
3. Edge Gate (middleware on every navigation)
4. Data scoping (Convex queries)

**Why it's wrong now:**
- Layer 1: Routes are now domain VIEWS, not route FOLDERS
- Layer 2: Manifests are per-RANK, not per-route
- Layer 3: Middleware only runs on initial load
- Layer 4: Still valid - this is SRS Layer 2

---

## Entry Gate (Middleware)

The middleware serves as an ENTRY GATE only:

```typescript
// src/middleware.ts (simplified)

// Only runs on:
// - Initial page load
// - Hard refresh
// - Direct URL entry

// Does NOT run on:
// - navigate() calls
// - Client-side routing
// - Domain view switches

if (!allowed) {
  if (SRS_ENFORCE) {
    // Hard mode: redirect to rank home
    return NextResponse.redirect(getRankHome(rank));
  } else {
    // Soft mode: log only
    console.log(`[SRS] Would block: ${rank} → ${pathname}`);
  }
}

// Rewrite all domain routes to / (FuseApp handles routing)
return NextResponse.rewrite(new URL('/', req.url));
```

**Entry Gate is NOT security:**
- It's a UX optimization (redirect wrong entry points)
- Real security is in Convex queries
- Even if bypassed, no data access without proper rank

---

## Data Scoping Patterns

| Rank | Clients | Finance | Projects | Settings |
|------|---------|---------|----------|----------|
| Crew | Assigned only | No access | Org-scoped | Self-only |
| Captain | Org-scoped | Org-scoped | Org-scoped | Self-only |
| Commodore | Org-scoped | Org-scoped | Org-scoped | Self-only |
| Admiral | All | All | All | Self-only |

**Enforcement:** Convex queries, not middleware.

---

## Implementation Checklist

### For New Domains

1. **Create domain view** - `src/app/domains/[name]/[View].tsx`
2. **Add to Sovereign Router** - Register in domain map
3. **Create Convex backend** - `convex/domains/[name]/`
4. **Implement data scoping** - Rank-based query filters
5. **Update rank manifests** - Add routes to allowed arrays
6. **Test authorization** - Verify Convex blocks unauthorized access

### Key Difference from SMAC

- NO manifest.json per route
- NO middleware enforcement per navigation
- Domain views are COMPONENTS, not route folders
- Security is CONVEX-FIRST

---

## Philosophy

### Principle 1: Convex is Security
Middleware is UX. Convex queries are security.

### Principle 2: Manifests are Navigation
Rank manifests define what to SHOW, not what to PROTECT.

### Principle 3: Client-Side is Sovereign
FuseApp owns routing. Middleware is just the entry gate.

### Principle 4: Two Layers, Not Four
Simpler model, clearer responsibilities.

---

## Database Alignment

SRS aligns with database naming:

```
Domain View:  /app/domains/admin/Users.tsx
Backend:      /convex/domains/admin/users/
Database:     admin_users, admin_users_DeletionLogs
```

All layers use the same domain hierarchy.

---

## Summary

**SRS** = Sovereign Router System

- **Layer 1**: Rank Manifests (compile-time allowlists, navigation)
- **Layer 2**: Convex Data Scoping (query-level security)

**SRS doesn't replace FUSE. It authorizes access to FUSE data.**

- FUSE handles **data flow and state**
- SRS handles **who can access what data**
- Sovereign Router handles **client-side navigation**

Together, they form the Transfoorm architecture.

---

## Migration from SMAC

If you see references to:
- "SMAC Layer 3" → This is now just "Entry Gate" (UX, not security)
- "SMAC Layer 4" → This is now "SRS Layer 2" (the real security)
- "Edge Gate enforcement" → Only on initial load now
- `SMAC_ENFORCE` → Now `SRS_ENFORCE`

The security model hasn't weakened - it's been clarified. Convex was always the real security layer. SRS just makes that explicit.
