# Sovereignty Violations

> Classification and detection of identity boundary breaches

---

## Overview

Violations are categorized by severity and layer. Understanding these categories helps identify and prevent sovereignty loss before it spreads.

---

## Severity Levels

| Level | Name | Impact | Recovery |
|-------|------|--------|----------|
| Critical | Catastrophic | Complete sovereignty loss | Full refactor required |
| High | Structural | Partial sovereignty loss | Targeted refactor |
| Medium | Leakage | Contained breach | Local fix |
| Low | Risk | Potential for breach | Preventive fix |

---

## Category A: Import Violations

**Severity:** High

Direct imports of Clerk packages outside permitted zones.

| Code | Violation | Location |
|------|-----------|----------|
| A1 | `import { useUser } from '@clerk/nextjs'` | Features |
| A2 | `import { useAuth } from '@clerk/nextjs'` | Features |
| A3 | `import { auth } from '@clerk/nextjs/server'` | Server Actions |
| A4 | `import { clerkClient } from '@clerk/nextjs/server'` | Convex |

**Detection:** `grep -r "@clerk" src/features/ src/store/ convex/`

---

## Category B: Identity Flow Violations

**Severity:** Critical

Clerk identity entering the runtime pipeline.

| Code | Violation | Description |
|------|-----------|-------------|
| B1 | `auth()` in Server Actions | Outside auth boundary |
| B2 | `getToken()` anywhere | JWT extraction |
| B3 | `clerkId` in mutations | Passing to Convex |
| B4 | `setAuth(token)` with Clerk token | Convex auth pollution |

**Detection:** Scan Server Actions for `auth()` calls

---

## Category C: Schema Violations

**Severity:** Critical

Database structure depending on Clerk.

| Code | Violation | Description |
|------|-----------|-------------|
| C1 | `by_clerk_id` index for runtime | Primary lookup via Clerk |
| C2 | `clerkId: v.string()` in mutations | Accepting Clerk ID |
| C3 | Foreign keys to Clerk ID | Cross-table Clerk refs |
| C4 | `clerkId` stored as primary key | Table keyed by Clerk |

**Detection:** Schema scan for `clerk` patterns

---

## Category D: Cookie Violations

**Severity:** High

Session cookie containing Clerk data.

| Code | Violation | Description |
|------|-----------|-------------|
| D1 | `clerkId` in session cookie | Clerk ID persisted |
| D2 | Clerk JWT in cookie | Token stored |
| D3 | Clerk metadata in cookie | Profile from Clerk |

**Detection:** Cookie structure inspection

---

## Category E: Store Violations

**Severity:** High

FUSE store hydrated from Clerk.

| Code | Violation | Description |
|------|-----------|-------------|
| E1 | Clerk hooks in store hydration | `useUser()` populating FUSE |
| E2 | Clerk fields in store shape | `clerkId` as store field |
| E3 | Clerk session in store | Clerk session object stored |

**Detection:** Store file scan

---

## Category F: Runtime Violations

**Severity:** Medium

Runtime behavior influenced by Clerk.

| Code | Violation | Description |
|------|-----------|-------------|
| F1 | Navigation via Clerk state | Route guards using `isSignedIn` |
| F2 | UI rendering via Clerk | `<SignedIn>` wrappers |
| F3 | Permissions via Clerk | Role checks from Clerk |

**Detection:** Component scan for Clerk patterns

---

## The 7 Catastrophic Violations (SID-14)

These indicate complete sovereignty collapse:

| Code | Violation | Why Catastrophic |
|------|-----------|------------------|
| SID-14.1 | `by_clerk_id` index anywhere | Database depends on Clerk |
| SID-14.2 | Mutation accepting `clerkId` | Convex depends on Clerk |
| SID-14.3 | Identity born from Clerk | Identity originates foreign |
| SID-14.4 | Server Action using `auth()` | Business logic depends on Clerk |
| SID-14.5 | Convex lookup via Clerk ID | Data access depends on Clerk |
| SID-14.6 | Runtime permission via Clerk | Authorization depends on Clerk |
| SID-14.7 | Clerk-to-Convex conversion | Identity translation in runtime |

**Any single SID-14 violation = sovereignty annihilated.**

---

## Detection Commands

### Full Scan

```bash
/VRP-clerk-scan
```

### Import Scan

```bash
grep -r "@clerk" src/features/ src/store/ src/hooks/ convex/
```

### Server Action Scan

```bash
grep -r "await auth()" src/app/actions/ --include="*.ts"
```

### Schema Scan

```bash
grep -r "clerk" convex/schema.ts
grep -r "by_clerk_id" convex/
```

### Mutation Scan

```bash
grep -r "clerkId" convex/ --include="*.ts"
```

---

## Remediation

### For Import Violations

Replace Clerk hooks with FUSE selectors:

```typescript
// Before
const { user } = useUser();

// After
const user = useFuse((s) => s.user);
```

### For Identity Flow Violations

Replace `auth()` with session cookie:

```typescript
// Before
const { userId } = await auth();

// After
const session = await readSessionCookie();
const userId = session._id;
```

### For Schema Violations

Replace Clerk indexes with Convex ID indexes:

```typescript
// Before
.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))

// After
.withIndex("by_user_id", (q) => q.eq("userId", userId))
// Or direct lookup:
await ctx.db.get(userId);
```

---

*Every violation weakens the wall. Fix immediately.*
