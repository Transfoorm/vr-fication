# TTTS Enforcement Protocol

> Triple-T Sovereignty Enforcement System
> For FUSE-ADP-PRISM-WARP Strategy 1 Implementation

**These are not suggestions - they are laws.**

---

## Part 1: Commit Knox Protocol (Protected Files - "The Tenacious Ten")

You can commit and push freely to main for **any file** - **except these 10 protected items:**

| # |    Protected Item   |                      Why                     |
|---|---------------------|----------------------------------------------|
| 1 | `eslint.config.mjs` | Code quality rules - affects entire codebase |
| 2 | `eslint/`           | Custom enforcement rules - VRP/FUSE doctrine |
| 3 | `package.json`      | Dependencies - security and stability        |
| 4 | `tsconfig*`         | TypeScript config - affects all type checking|
| 5 | `scripts/`          | Build/enforcement scripts - CI/CD integrity  |
| 6 | `.husky/`           | Git hooks - local enforcement                |
| 7 | `.vrp-approval*`    | Approval tokens - can't self-approve         |
| 8 | `.github/`          | Workflows & CODEOWNERS - protects protection |
| 9 | `src/middleware.ts` | Auth/routing gate - security critical        |
| 10 | `.claude/`         | AI guardrails - keeps Claude in check        |

### What Happens If You Touch a Protected File

**Step 1: Local Warning (Pre-Commit Hook)**
```
===============================================================
  STOP! YOU ARE WASTING YOUR TIME!
===============================================================

  Even if you bypass this hook, GitHub will BLOCK your push.
  These files are protected by CODEOWNERS - only @Metafoorm
  can approve changes. There is NO backdoor. NO bypass.

===============================================================
  --no-verify IS USELESS
  Go ahead, try it. GitHub will still reject your push.
  Server-side enforcement. No local bypass possible.
===============================================================
```

**Step 2: Even If You Bypass Locally...**
```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Cannot update this protected ref.
remote: - Changes must be made through a pull request.
```

**Blocked by GitHub.** Server-side. No local bypass possible.

### How to Get Approval for Protected Files

1. **Create a feature branch:** `git checkout -b my-feature-branch`
2. **Make your changes** to the protected file(s)
3. **Commit and push to your branch**
4. **Create a Pull Request** on GitHub
5. **Wait for Ken's approval** (CODEOWNERS auto-requests review)
6. **Merge** - only after approval

---

## Part 2: TTTS Rules (Automated Enforcement)

These 10 core rules protect Strategy 1, PRISM, WARP, FUSE, SRS, VRP, and TTT.

### TTTS-1 - Slice Discipline IMPLEMENTED

**Status:** ESLint rule `ttts/enforce-slice-shape`

Every domain slice MUST contain:
```js
{
  data: ...,
  status: "idle" | "hydrated" | "loading" | "error",
  lastFetchedAt: number | null,
  source: "warp" | "prism" | "update" | null,
  hydrateDomain: (payload) => void,
  clearDomain: () => void,
}
```

**Error:**
```
TTTS VIOLATION: Domain slice is not FUSE-compliant.
Every slice must follow the ADP/PRISM contract exactly.
```

---

### TTTS-2 - Golden Bridge Enforcement IMPLEMENTED

**Status:** ESLint rule `ttts/no-direct-convex-in-pages`

Components may NEVER fetch data directly. All reads MUST come from FUSE via WARP.

**Blocks:** useQuery, fetchQuery, client fetch(), direct Convex API

**Error:**
```
TTTS GOLDEN BRIDGE VIOLATION:
Components may NEVER fetch data directly.
All reads MUST originate from useFuse() via WARP -> Cookie -> Hydration.
```

---

### TTTS-3 - Predictive Trigger (PRISM) IMPLEMENTED

**Status:** Build-time verification via `npm run vrp:prism`

Every domain must be registered in the Sidebar's `SECTION_TO_DOMAIN` map for PRISM preloading.

**Checks:**
1. Sidebar has SECTION_TO_DOMAIN map, usePrism hook, preloadDomain call
2. Every nav domain is in the PRISM map

**Run:** `npm run vrp:prism` or `npm run vrp:all`

---

### TTTS-4 - WARP Endpoint Completeness IMPLEMENTED

**Status:** Build-time verification via `npm run vrp:warp`

Every domain MUST have a `/api/warp/{domain}.ts` endpoint.

**Checks:**
1. Orchestrator imports all rank nav configs
2. No hardcoded domain arrays
3. Every nav domain has matching WARP endpoint
4. Domains derive from nav configs via `getDomainsForRank`

**Run:** `npm run vrp:warp` or `npm run vrp:all`

---

### TTTS-5 - No Cross-Domain Imports IMPLEMENTED

**Status:** ESLint rule `ttts/no-cross-domain-imports`

Domains MUST NOT import each other:
```
X clients -> finance
X finance -> admin
X productivity -> projects
```

**Error:**
```
TTTS DOMAIN BOUNDARY VIOLATION:
Cross-domain import detected. Domains MUST remain sovereign islands.
```

---

### TTTS-6 - No Lazy Domain Loading IMPLEMENTED

**Status:** ESLint rule `ttts/no-lazy-domains`

Entire domain must be preloaded upon user intent. No lazy loading.

**Blocks:** `dynamic()`, `React.lazy()`, `lazy()` imports

**Only applies to:** `/app/domains/`, `/domains/`, `/views/`

**Error:**
```
TTTS-6 VIOLATION: dynamic() imports are forbidden in domain views.
FUSE Strategy 1 requires full domain preload via WARP/PRISM.
```

---

### TTTS-7 - No Render-Time Debt IMPLEMENTED

**Status:** ESLint rule `ttts/no-runtime-debt`

No data fetching at render time.

**Blocks:**
- `async () => {}` as useEffect callback
- `useQuery()` calls in components
- `fetch()` inside useEffect callbacks

**Error:**
```
TTTS-7 VIOLATION: useEffect with fetch/query detected.
Data must be preloaded via WARP/PRISM, not fetched at render time.
```

---

### TTTS-8 - No New Architecture Patterns MANUAL

Developers may not invent new routing shapes, store patterns, CSS rule structures, ADP variants, or WARP structures.

**Error:**
```
TTTS CONSISTENCY VIOLATION:
New architectural pattern detected. Transfoorm uses ONE WAY, not many.
```

---

### TTTS-9 - Reversibility Rule MANUAL

A feature must be deletable in one sprint. No global refs, irreversible dependencies, or cascading imports.

**Error:**
```
TTTS REVERSIBILITY FAIL:
This implementation creates irreversible coupling.
```

---

### TTTS-10 - Non-Fireable Path Rule MANUAL

If a PR implements more than one "option" for solving a problem - REJECT IT.

**Error:**
```
TTTS GOD PROTOCOL ACTIVATED:
Multiple solution paths found. Only ONE TTT-compliant path may exist.
```

---

## Part 3: Sovereignty Rules (SRB)

Additional governance rules for FUSE sovereignty.

### SRB-1 - Domain Pages Must Never Execute Server Code

No `export const dynamic`, `fetch`, async server functions, RSC data reads, or server actions in domain pages.

**Penalty:** Build fails.

---

### SRB-2 - Domain Navigation Must Not Use router.push

`router.push` = App Router = server round trip. Use `navigate('page')` only.

**Penalty:** Lint error + VRP block.

---

### SRB-3 - All Domain Views Must Render From FUSE First

Pages read from FUSE store, render instantly, use WarpPlaceholder if data missing.

**Penalty:** VRP "FUSE First" violation.

---

### SRB-4 - Convex Can NEVER Be Called Inside a View

Convex = background sync only. Must ONLY be called inside `/fuse/sync/`.

**Penalty:** Build fails + VRP denies commit.

---

### SRB-5 - Domain Files Must Be Pure Client Components

All files in `/views` must begin with `'use client';`

**Penalty:** VRP halts build.

---

### SRB-6 - WARP Must Preload Before First Navigation

FuseApp must call `runWarpPreload()` inside useEffect on mount.

**Penalty:** Runtime assertion failure.

---

### SRB-7 - FUSE Store is the Only Source of Truth

Allowed: FUSE atoms, selectors, computed state, preload objects.
Forbidden: useState for domain data, fetch('/api'), direct Convex, localStorage, sessionStorage.

**Penalty:** Architectural violation flagged by VRP.

---

### SRB-8 - No Side Effects in Views

`useEffect -> do things` forbidden in domain views. Only allowed in `/fuse/sync`, `/fuse/state`, `/fuse/prefetch`.

**Penalty:** VRP flags "Side-Effect in View Layer".

---

### SRB-9 - UI Must Never Block on Network Requests

No loading spinners. Placeholders only.

**Penalty:** TTT visual violation.

---

### SRB-10 - App Router Cannot Interfere Once FuseApp Mounts

No App Router `<Link>` inside /views. No RSC layout remounts.

**Penalty:** VRP flags "App Router Intrusion".

---

### SRB-11 - Every Navigation Must Be 32-65ms

Navigation time tests: warn at >65ms, fail at >120ms.

**Penalty:** Performance gate fails; build blocked.

---

### SRB-12 - All Domain Components Must Be Stateless

State = FUSE, Logic = PRISM, Sync = Convex. Components may not hold domain logic.

**Penalty:** Linter flags "State Leakage."

---

### SRB-13 - Sovereign Router May Never Unmount

FuseApp & Sovereign Router are persistent. Unmounting = memory loss.

**Penalty:** End-to-end test fails.

---

### SRB-14 - FUSE Must Be Fully Ready Before First Domain Render

FuseApp must block domain views until store has: user, workspace, permissions, core datasets.

**Penalty:** "Early Render Violation" VRP error.

---

### SRB-15 - A Dev Cannot Disable TTT Sovereignty Enforcement

`.vrp-approval` cannot be created locally. Must come from CI. No dev can bypass hooks, lint rules, approvals, or sovereign checks.

**Penalty:** Commit rejected. PR denied. Report to Ken.

---

## The Golden Law

> **"The Domain Belongs to FUSE. App Router Belongs to the Shell. Navigation Belongs to the Sovereign Router."**

Everything else is detail.

---

## Implementation Status

| Rule | Type | Status | Enforcement |
|------|------|--------|-------------|
| Commit Knox Protocol | Files | DONE | CODEOWNERS + pre-commit hook |
| TTTS-1 | Slice | DONE | ESLint |
| TTTS-2 | Golden Bridge | DONE | ESLint |
| TTTS-3 | PRISM | DONE | VRP script |
| TTTS-4 | WARP | DONE | VRP script |
| TTTS-5 | Cross-Domain | DONE | ESLint |
| TTTS-6 | No Lazy | DONE | ESLint |
| TTTS-7 | No Runtime Debt | DONE | ESLint |
| TTTS-8 | No New Patterns | MANUAL | Manual review |
| TTTS-9 | Reversibility | MANUAL | Manual review |
| TTTS-10 | Non-Fireable | MANUAL | Manual review |
| SRB-1 to SRB-15 | Sovereignty | MIXED | Various/Manual |

**7 of 10 TTTS rules now have automated enforcement.**

---

## Running Enforcement

```bash
# Lint all files
npm run lint

# Run VRP verification
npm run vrp:all

# Individual VRP checks
npm run vrp:warp    # TTTS-4
npm run vrp:prism   # TTTS-3
```
