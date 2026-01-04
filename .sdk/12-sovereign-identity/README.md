# Sovereign Identity Doctrine (S.I.D.)

> Identity sovereignty through strict auth boundary enforcement

**"Clerk authenticates. FUSE identifies. Convex stores. Sovereignty prevails."**

---

## What is S.I.D.?

**Sovereign Identity Doctrine** ensures the FUSE runtime maintains complete authority over user identity. External auth providers (Clerk) are quarantined to a strict boundary, preventing identity pollution across the application.

### Why "Sovereign"?

A **sovereign runtime** is one where:
- Identity originates from FUSE, not external providers
- All identity lookups use Convex document IDs (`_id`)
- No auth provider can influence runtime behavior
- Provider swap is possible without code changes

Once an auth provider leaks beyond its boundary, sovereignty is lost. S.I.D. maintains this separation through **strict quarantine**.

---

## Documents in This Section

| Document | Purpose |
|----------|---------|
| `IDENTITY-PIPELINE.md` | How identity flows from auth to runtime |
| `CLERK-QUARANTINE.md` | Where Clerk is permitted and forbidden |
| `VIOLATIONS.md` | Categories of sovereignty violations |
| `COMPLIANCE.md` | How to implement identity correctly |

---

## The Identity Pipeline

```
Auth Boundary (Clerk)
       |
       | clerkId (used ONCE for lookup)
       v
Server Action (identity handoff)
       |
       | convexUserId: Id<"admin_users">
       v
Session Cookie (FUSE_5.0)
       |
       | _id (sovereign identity)
       v
FUSE Store (canonical truth)
       |
       | user object
       v
Domain Views (pure, infection-free)
```

**Key insight:** Clerk's job ends at the auth boundary. After handoff, only Convex `_id` is used.

---

## The Quarantine

### Clerk Permitted

| Location | Purpose |
|----------|---------|
| `/app/(auth)/**` | Sign-in, sign-up, forgot password |
| `/app/(clerk)/**` | Clerk webhooks and verification |
| `middleware.ts` | SSR session validation |

### Clerk Forbidden

| Location | Consequence |
|----------|-------------|
| `/src/features/**` | Runtime identity pollution |
| `/src/app/domains/**` | Domain sovereignty loss |
| `/src/store/**` | FUSE authority undermined |
| `/convex/**` | Database identity corruption |
| `/src/hooks/**` | Hook dependency on external auth |

---

## Violation Categories

S.I.D. defines 7 catastrophic violations that indicate complete sovereignty loss:

| Code | Violation | Detection |
|------|-----------|-----------|
| SID-14.1 | `by_clerk_id` index used for runtime lookups | Schema scan |
| SID-14.2 | Mutation accepting `clerkId: v.string()` | Convex scan |
| SID-14.3 | Identity born from Clerk instead of Convex | Server Action scan |
| SID-14.4 | Server Action using `auth()` outside boundary | Import scan |
| SID-14.5 | Convex lookup starting with Clerk ID | Query scan |
| SID-14.6 | Runtime permission using Clerk identity | Feature scan |
| SID-14.7 | Clerk-to-Convex conversion in runtime | Pipeline scan |

---

## Compliance Checklist

Before committing identity-related code:

- [ ] No `@clerk/*` imports outside auth boundary
- [ ] No `auth()` calls outside `/app/(auth)/**`
- [ ] No `clerkId` passed to Convex mutations
- [ ] Session cookie contains only Convex `_id`
- [ ] FUSE store receives identity from cookie, not Clerk
- [ ] Domain views read from FUSE, never Clerk

---

## Scanner

**Tool:** `/VRP-clerk-scan`

Runs comprehensive sovereignty verification across all layers.

---

## Provider Swappability

A key benefit of S.I.D. is auth provider independence. Because Clerk is quarantined:

- Schema uses Convex `_id`, not `clerkId`
- Mutations accept `userId: v.id("admin_users")`
- Server Actions translate once at boundary
- FUSE store is provider-agnostic

**Result:** Clerk can be replaced with any auth provider without touching:
- Database schema
- Convex mutations
- Domain views
- FUSE store

---

## Quick Reference

### Forbidden Patterns

```typescript
// Never in features/domains
import { useUser } from '@clerk/nextjs';
const { userId } = await auth();
await mutation({ clerkId: userId });
```

### Sovereign Patterns

```typescript
// Always use FUSE identity
const user = useFuse((s) => s.user);
await mutation({ userId: session._id });
const doc = await ctx.db.get(userId);
```

---

*See `.archive/_clerk-virus/` for historical development notes and exhaustive violation taxonomy.*
