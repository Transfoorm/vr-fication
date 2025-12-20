---
description: Clerk Virus Scanner - Dante-Grade Sovereignty Enforcement
tags: [vrp, clerk, security, virus, sovereignty, doctrine]
---

# 🛡️ CLERK VIRUS SCANNER — THE SUPREME ENFORCER v2.0

**FOOLPROOF EDITION — ZERO TOLERANCE — NOT A SINGLE BYTE ESCAPES**

**This scanner enforces the doctrine defined in:**
- `_clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md`
- `_clerk-virus/TTT-99-WAYS-CLERK-CAN-INFECT.md`
- `🔥 THE FULL CLERK VIOLATION COSMOLOGY.md` (152 violations)
- `🛑 ANTI-FUSE MANIFEST.md` (110+ violations)

**Every rule. Every category. Every prohibition. Word-for-word.**

**If a scan passes while ANY violation exists, the scanner is invalid and MUST be rewritten immediately. No exceptions. No leniency. No interpretation.**

---

## MASTER CATEGORY INDEX

| Category | Name | Violations | Priority |
|----------|------|------------|----------|
| BIRTH | Identity Origin | 9 | 🔴 CRITICAL |
| A | Direct Import Viruses | 5 | 🔴 CRITICAL |
| B | Indirect Import Viruses | 4 | 🔴 CRITICAL |
| C | Auth Flow Viruses | 4 | 🟠 HIGH |
| D | Convex Layer Viruses | 4 | 🔴 CRITICAL |
| E | Server Action Viruses | 2 | 🟠 HIGH |
| F | Navigation Viruses | 3 | 🟠 HIGH |
| G | Store & State Viruses | 3 | 🔴 CRITICAL |
| H | UI & Design Viruses | 2 | 🟡 MEDIUM |
| I | Cookie & Session Viruses | 3 | 🔴 CRITICAL |
| J | Identity Model Viruses | 3 | 🔴 CRITICAL |
| K | Golden Bridge Breaches | 5 | 🔴 CRITICAL |
| L | SSR Auth Breaches | 4 | 🔴 CRITICAL |
| M | Hydration & Preload | 4 | 🟠 HIGH |
| N | Runtime Elevation | 4 | 🟠 HIGH |
| X | Sovereignty Collapse | 5 | 🔴 NUCLEAR |
| COSMO | Edge Cases | 25 | 🟡 MEDIUM |

**TOTAL: 89 violation types across 17 categories**

---

## PHASE 0: DOCTRINE LOADING (MANDATORY FIRST STEP)

Before ANY scan, you MUST:

1. **Read ALL doctrine files:**
   - `_clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md`
   - `_clerk-virus/TTT-99-WAYS-CLERK-CAN-INFECT.md`

2. **Extract and memorize:**
   - All Category definitions (A through N, X, COSMO)
   - All prohibited patterns
   - All forbidden locations
   - All identity flow rules
   - All cookie sovereignty rules
   - All Convex sovereignty rules

3. **Verify doctrine integrity:**
   - Both files MUST exist
   - Scanner MUST enforce ALL categories
   - FAIL IMMEDIATELY if doctrine cannot be loaded

**The doctrine is LAW. You do not interpret. You ENFORCE.**

---

## PERMITTED CLERK ZONES (THE ONLY EXCEPTIONS)

Clerk is ONLY permitted in:
- `/app/(auth)/**` — Login/signup flows, identity handoff
- `/app/(clerk)/**` — Clerk SDK features (verify modals, webhooks)
- `src/features/vanish/**` — Quarantined deletion protocol (VanishQuarantine)
- `middleware.ts` (SSR boundary only)

**EVERYWHERE ELSE:**
- ❌ ZERO Clerk imports
- ❌ ZERO auth() calls
- ❌ ZERO getToken()
- ❌ ZERO clerkClient()
- ❌ ZERO Clerk UI components
- ❌ ZERO Clerk identity entering Golden Bridge
- ❌ ZERO Clerk tokens passed to Convex
- ❌ ZERO clerkId in function signatures
- ❌ ZERO dual-identity models

---

## PHASE 1: IDENTITY BIRTH SOVEREIGNTY (THE ORIGIN SCAN)

**This is the MOST CRITICAL scan. Without it, all other scans are downstream of a corrupted birth.**

### Scan Locations:
- `src/app/(auth)/actions/identity-handoff.ts` (PRIMARY SESSION BIRTH POINT)
- `src/app/api/session/route.ts` (if exists)
- Any file calling `mintSession()`

### Run these searches:

```bash
# Find ALL session minting locations
grep -rn "mintSession" src/ --include="*.ts"

# Check identity handoff for sovereign birth
grep -n "clerkId\|_id\|ensureUser" src/app/\(auth\)/actions/identity-handoff.ts
```

### BIRTH Violations to Detect:

| Code | Violation | Detection |
|------|-----------|-----------|
| BIRTH-1 | `auth()` is identity source | auth() used as primary identity |
| BIRTH-2 | clerkId before _id | Foreign identity established first |
| BIRTH-3 | Empty _id in session | `_id: ''` or `_id: undefined` |
| BIRTH-4 | by_clerk_id at birth | Clerk index controls lookup |
| BIRTH-5 | No handoff ceremony | Missing Clerk → Convex translation |
| BIRTH-6 | Optional sovereignty | Session minted without valid _id |
| BIRTH-7 | Dual identity | Both clerkId AND _id in runtime |
| BIRTH-8 | Race condition | mintSession before Convex returns |
| BIRTH-9 | Surrogate minting | Session minted outside auth boundary |

**Any BIRTH violation = SOVEREIGNTY NEVER EXISTED**

---

## PHASE 2: CATEGORY A — DIRECT IMPORT VIRUSES

### Scan Locations:
- `src/app/domains/**`
- `src/store/**`
- `src/features/**`
- `src/fuse/**`
- `src/shell/**`
- `src/vr/**`
- `convex/**`

### Run these searches:

```bash
# A1-A5: Direct Clerk imports
grep -rn "@clerk/nextjs" src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/ src/vr/ convex/
grep -rn "@clerk/clerk-react" src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/ src/vr/ convex/
grep -rn "from '@clerk" src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/ src/vr/ convex/
grep -rn 'from "@clerk' src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/ src/vr/ convex/
```

| Code | Violation |
|------|-----------|
| A1 | Importing Clerk in ANY client component |
| A2 | Importing Clerk in ANY Domain view |
| A3 | Importing Clerk inside FUSE store |
| A4 | Importing Clerk inside Convex config |
| A5 | Importing Clerk inside Router or Navigation |

**Any match = CATEGORY A VIOLATION**

---

## PHASE 3: CATEGORY B — INDIRECT IMPORT VIRUSES

### Run these searches:

```bash
# B1-B4: Clerk wrapper components
grep -rn "<SignedIn" src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/
grep -rn "<SignedOut" src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/
grep -rn "<ClerkLoaded" src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/
grep -rn "<ClerkProvider" src/app/domains/ src/store/ src/features/ src/fuse/ src/shell/
grep -rn "<UserButton" src/app/domains/ src/features/ src/shell/
grep -rn "<SignInButton" src/app/domains/ src/features/ src/shell/
grep -rn "<SignUpButton" src/app/domains/ src/features/ src/shell/
```

| Code | Violation |
|------|-----------|
| B1 | Using `<SignedIn>` or `<SignedOut>` wrappers |
| B2 | Using `<ClerkLoaded>` |
| B3 | Using `<ClerkProvider>` inside FuseApp or Domains |
| B4 | Using "clerk-react" instead of "clerk-nextjs" |

**Any match = CATEGORY B VIOLATION**

---

## PHASE 4: CATEGORY C — AUTH FLOW VIRUSES

### Run these searches:

```bash
# C1: Clerk redirect helpers
grep -rn "redirectToSignIn" src/app/domains/ src/features/ src/fuse/ src/shell/
grep -rn "redirectToSignUp" src/app/domains/ src/features/ src/fuse/ src/shell/

# C2: Clerk middleware in wrong location
grep -rn "clerkMiddleware" src/app/

# C3: useSession on client (outside auth)
grep -rn "useSession" src/app/domains/ src/features/ src/fuse/ src/shell/ | grep -v "(auth)" | grep -v "(clerk)"

# C4: Clerk as canonical source for user fields
grep -rn "user\.firstName" src/app/domains/ src/features/ | grep -i clerk
grep -rn "user\.lastName" src/app/domains/ src/features/ | grep -i clerk
grep -rn "user\.emailAddresses" src/app/domains/ src/features/
```

| Code | Violation |
|------|-----------|
| C1 | Using `redirectToSignIn()` / `redirectToSignUp()` |
| C2 | Clerk middleware in /app instead of root |
| C3 | Using Clerk's `useSession` on client |
| C4 | Relying on Clerk for firstName/lastName/email |

**Any match = CATEGORY C VIOLATION**

---

## PHASE 5: CATEGORY D — CONVEX LAYER VIRUSES

### Run these searches:

```bash
# D1: useMutation in Domains (NOT features - features are exempt)
grep -rn "useMutation" src/app/domains/ --include="*.tsx"

# D2: clerkId passed from client
grep -rn "clerkId:" src/app/domains/ src/features/ --include="*.tsx"

# D3: getUserIdentity in mutations
grep -rn "ctx.auth.getUserIdentity" convex/ --include="*.ts"

# D4: ConvexProvider inside FuseApp
grep -rn "ConvexProvider" src/app/domains/ src/fuse/
```

| Code | Violation |
|------|-----------|
| D1 | Calling `useMutation()` in Domain components |
| D2 | Passing clerkId from client |
| D3 | Using `ctx.auth.getUserIdentity()` in untrusted mutations |
| D4 | Using ConvexProvider inside FuseApp |

**Note: D1 exemption for /src/features/** - Feature Roots may use useMutation()

---

## PHASE 6: CATEGORY E — SERVER ACTION VIRUSES

### Run these searches:

```bash
# E1: Server Actions imported in Domain components
grep -rn "from.*actions" src/app/domains/ --include="*.tsx" | grep -v "type"

# E2: Check if Server Actions update FUSE after mutations
# (Manual analysis required - check each SA for hydrateX calls)
```

| Code | Violation |
|------|-----------|
| E1 | Importing Server Actions inside Domain components |
| E2 | Calling Server Actions without updating FUSE afterwards |

**Any match = CATEGORY E VIOLATION**

---

## PHASE 7: CATEGORY F — NAVIGATION VIRUSES

### Run these searches:

```bash
# F1: Clerk controlling navigation
grep -rn "redirectToSignIn" src/ --include="*.ts" --include="*.tsx" | grep -v "(auth)" | grep -v "(clerk)"
grep -rn "redirectToSignUp" src/ --include="*.ts" --include="*.tsx" | grep -v "(auth)" | grep -v "(clerk)"

# F2: ClerkProvider wrapping FuseApp/Domains (NOT root layout bootstrap shell)
# Root layout ClerkProvider is SAFE - it's just Next.js scaffolding
# VIRUS = ClerkProvider inside Domains, Features, FUSE, or Shell
grep -rn "ClerkProvider" src/app/domains/ src/features/ src/fuse/ src/shell/ src/store/

# F3: Clerk UI rendering before FuseApp
grep -rn "<SignedIn\|<SignedOut\|<ClerkLoaded" src/app/layout.tsx
```

| Code | Violation |
|------|-----------|
| F1 | Clerk controlling navigation |
| F2 | ClerkProvider wrapping FuseApp/Domains as identity source |
| F3 | Allowing Clerk UI to render before FuseApp |

**Note: F2 exemption for /src/app/layout.tsx** - Root layout ClerkProvider is just Next.js scaffolding, not identity authority

**Any match = CATEGORY F VIOLATION**

---

## PHASE 8: CATEGORY G — STORE & STATE VIRUSES

### Run these searches:

```bash
# G1: Clerk fields in FUSE store shape
grep -rn "clerkUser\|clerkSession\|clerkId" src/store/ --include="*.ts"

# G2: Clerk hooks hydrating FUSE
grep -rn "useUser\|useAuth\|useClerk" src/store/ --include="*.ts"

# G3: Zustand referencing Clerk
grep -rn "clerk" src/store/ --include="*.ts" | grep -v "clerkId.*reference\|// clerk"
```

| Code | Violation |
|------|-----------|
| G1 | Adding ANY Clerk field into FUSE store shape |
| G2 | Using Clerk hooks to populate initial FUSE state |
| G3 | Letting devs store Clerk session data in Zustand |

**Any match = CATEGORY G VIOLATION**

---

## PHASE 9: CATEGORY H — UI & DESIGN VIRUSES

### Run these searches:

```bash
# H1: Clerk UI components in Domain styling
grep -rn "<SignIn\|<SignUp\|<UserProfile" src/app/domains/ src/features/

# H2: Clerk modals/popups
grep -rn "clerk.*modal\|ClerkModal" src/app/domains/ src/features/
grep -rn "<SignInModal\|<SignUpModal" src/
```

| Code | Violation |
|------|-----------|
| H1 | Using Clerk UI components inside domain styling |
| H2 | Using Clerk modals/popups |

**Any match = CATEGORY H VIOLATION**

---

## PHASE 10: CATEGORY I — COOKIE & SESSION VIRUSES

### Scan Location:
- `src/fuse/hydration/session/cookie.ts`

### Run these searches:

```bash
# I1: Client reading Clerk cookies
grep -rn "__clerk\|__session" src/app/domains/ src/features/ src/fuse/

# I2: Clerk mutating cookies client-side
grep -rn "setCookie.*clerk\|clerk.*setCookie" src/

# I3: Verify cookie.ts has _id as primary
grep -n "clerkId\|_id" src/fuse/hydration/session/cookie.ts
```

| Code | Violation |
|------|-----------|
| I1 | Allowing devs to read Clerk cookies on client |
| I2 | Letting Clerk mutate cookies client-side |
| I3 | Injecting Clerk session objects into FUSE store |

**Rule:** `_id` (Convex) MUST be primary. clerkId is READ-ONLY reference.

---

## PHASE 11: CATEGORY J — IDENTITY MODEL VIRUSES

### Run these searches:

```bash
# J1: Clerk user as canonical
grep -rn "clerkUser\." src/app/domains/ src/features/ src/store/

# J2: Business data in Clerk metadata
grep -rn "publicMetadata\|privateMetadata\|unsafeMetadata" src/ | grep -v "(auth)" | grep -v "(clerk)"

# J3: Direct Clerk <-> Convex sync
grep -rn "syncClerk\|clerkSync\|syncFromClerk" src/app/domains/ src/features/
```

| Code | Violation |
|------|-----------|
| J1 | Treating Clerk user fields as canonical |
| J2 | Storing business/profile data in Clerk metadata |
| J3 | Allowing devs to "sync" Clerk profile → Convex directly |

**Any match = CATEGORY J VIOLATION**

---

## PHASE 12: CATEGORY K — GOLDEN BRIDGE IDENTITY BREACHES

### Scan Locations:
- `src/app/actions/**/*.ts`
- `src/server/**/*.ts`
- `src/lib/**/*.ts`

### Run these searches:

```bash
# K1: getToken outside auth boundary
grep -rn "getToken" src/app/actions/ src/server/ src/lib/ --include="*.ts" | grep -v "(auth)" | grep -v "(clerk)"

# K2: clerkClient.sessions outside auth
grep -rn "clerkClient.sessions" src/app/actions/ --include="*.ts" | grep -v "(auth)" | grep -v "(clerk)"

# K3: convex.setAuth with Clerk tokens
grep -rn "setAuth" src/app/actions/ src/server/ src/lib/ --include="*.ts"

# K4: Identity translation in Golden Bridge
grep -rn "auth().*getToken\|getToken.*setAuth" src/app/actions/ --include="*.ts"

# K5: Server Actions as identity brokers
grep -rn "clerkId:" src/app/actions/ --include="*.ts" | grep -v "(auth)" | grep -v "(clerk)"
```

| Code | Violation |
|------|-----------|
| K1 | Using `getToken({ template: 'convex' })` outside auth |
| K2 | Calling `clerkClient.sessions.revokeSession()` outside auth |
| K3 | Using `convex.setAuth(token)` with Clerk tokens |
| K4 | Performing identity translation inside Golden Bridge |
| K5 | Server Actions acting as identity brokers |

**Any match = CATEGORY K VIOLATION**

---

## PHASE 13: CATEGORY L — SSR AUTH BREACHES

### Run these searches:

```bash
# L1: auth() outside auth boundary
grep -rn "await auth()" src/app/actions/ src/server/ src/lib/ --include="*.ts" | grep -v "(auth)" | grep -v "(clerk)"
grep -rn "auth()" src/app/actions/ src/server/ src/lib/ --include="*.ts" | grep -v "(auth)" | grep -v "(clerk)"

# L2: clerkClient() outside auth boundary
grep -rn "clerkClient()" src/app/actions/ --include="*.ts" | grep -v "(auth)" | grep -v "(clerk)"

# L3: Returning Clerk user fields
grep -rn "emailAddresses\|primaryEmailAddress\|clerkUser" src/app/actions/ src/server/ --include="*.ts"

# L4: Clerk mutating cookies outside login/logout
grep -rn "clerk.*cookie\|setCookie.*clerk" src/app/actions/ --include="*.ts" | grep -v "(auth)" | grep -v "(clerk)"
```

| Code | Violation |
|------|-----------|
| L1 | Calling `auth()` inside ANY Server Action outside /app/(auth) |
| L2 | Using `clerkClient()` in mutations or non-auth actions |
| L3 | Returning Clerk user fields from Server Actions |
| L4 | Letting Clerk mutate cookies outside login/logout flows |

**Any match = CATEGORY L VIOLATION**

---

## PHASE 14: CATEGORY M — HYDRATION & PRELOAD CONTAMINATION

### Run these searches:

```bash
# M1: FuseApp hydration order check
grep -rn "useEffect.*clerk\|clerk.*useEffect" src/fuse/ src/store/

# M2: WARP/PRISM using Clerk identity
grep -rn "clerk\|auth()" src/app/api/warp/ src/fuse/warp/ src/fuse/prism/

# M3: Router rendering with undefined identity
grep -rn "identity.*undefined\|user.*undefined" src/app/domains/Router.tsx

# M4: Stale Clerk data in hydration
grep -rn "clerkUser\|useUser" src/fuse/hydration/
```

| Code | Violation |
|------|-----------|
| M1 | Hydrating FuseApp before reading FUSE cookie |
| M2 | WARP/PRISM preloading before identity is stable |
| M3 | Sovereign Router rendering under undefined identity |
| M4 | Client hydration reading stale Clerk values |

**Any match = CATEGORY M VIOLATION**

---

## PHASE 15: CATEGORY N — RUNTIME ELEVATION VIRUSES

### Run these searches:

```bash
# N1: UI allowing Clerk to influence runtime
grep -rn "useAuth\|useUser\|useClerk" src/app/domains/ src/features/ src/shell/

# N2: Mutations dependent on Clerk state
grep -rn "clerkId\|clerk.*identity" convex/ --include="*.ts" | grep -v "// deprecated\|// webhook"

# N3: Authorization from Clerk values
grep -rn "clerk.*role\|clerk.*permission\|clerk.*rank" src/

# N4: "Temporary" Clerk checks
grep -rn "// temp.*clerk\|// TODO.*clerk\|// FIXME.*clerk" src/
```

| Code | Violation |
|------|-----------|
| N1 | Any UI allowing Clerk to influence Router, Cookies, or FUSE |
| N2 | Mutations dependent on Clerk's identity state |
| N3 | Authorization logic derived from Clerk runtime values |
| N4 | "Temporary" Clerk checks in feature logic |

**Any match = CATEGORY N VIOLATION**

---

## PHASE 16: CATEGORY X — SOVEREIGNTY COLLAPSE (NUCLEAR)

### Run these searches:

```bash
# X1: by_clerk_id index in schema (except DeleteLog for webhooks)
grep -n "by_clerk_id" convex/schema.ts | grep -v "DeleteLog"

# X2: clerkId as primary lookup
grep -rn "withIndex.*by_clerk_id" convex/ --include="*.ts" | grep -v "webhook\|deprecated"

# X3: Convex identity derived from Clerk
grep -rn "clerkId.*_id\|_id.*clerkId" convex/ --include="*.ts"

# X4: Two identity masters
grep -rn "callerClerkId\|clerkUserId" convex/ --include="*.ts"

# X5: Clerk required for Convex access
grep -rn "auth.*convex\|convex.*auth" src/app/domains/ src/features/
```

| Code | Violation |
|------|-----------|
| X1 | `by_clerk_id` index used for runtime logic |
| X2 | clerkId as primary lookup key |
| X3 | Convex identity derived from Clerk |
| X4 | Two identity masters exist (Clerk + Convex) |
| X5 | Clerk becomes required to access Convex |

**Any X violation = COMPLETE SOVEREIGNTY COLLAPSE**

---

## PHASE 17: COSMOLOGY EDGE CASES

### Run these searches:

```bash
# COSMO-1: Analytics keyed by Clerk
grep -rn "analytics.*clerkId\|clerkId.*analytics\|track.*clerk" src/

# COSMO-2: Feature flags using Clerk
grep -rn "featureFlag.*clerk\|clerk.*feature" src/

# COSMO-3: A/B tests using Clerk
grep -rn "abTest.*clerk\|experiment.*clerk" src/

# COSMO-4: CRON/Background jobs using Clerk
grep -rn "clerk" convex/crons/ convex/jobs/ convex/scheduled/

# COSMO-5: Billing tied to Clerk
grep -rn "billing.*clerkId\|stripe.*clerk\|clerk.*subscription" src/

# COSMO-6: Tenant routing by Clerk
grep -rn "tenant.*clerk\|org.*clerk\|clerkOrg" src/

# COSMO-7: Export/Import by Clerk
grep -rn "export.*clerk\|import.*clerk" src/

# COSMO-8: Recovery flows using Clerk
grep -rn "recover.*clerk\|reset.*clerk" src/ | grep -v "(auth)" | grep -v "(clerk)"

# COSMO-9: Impersonation via Clerk
grep -rn "impersonate.*clerk\|actAs.*clerk" src/

# COSMO-10: MFA authority to Clerk
grep -rn "mfa.*clerk\|2fa.*clerk\|twoFactor.*clerk" src/ | grep -v "(auth)" | grep -v "(clerk)"
```

| Code | Violation |
|------|-----------|
| COSMO-1 | Analytics keyed by Clerk identity |
| COSMO-2 | Feature flags using Clerk identity |
| COSMO-3 | A/B tests using Clerk identity |
| COSMO-4 | CRON/Background jobs using Clerk identity |
| COSMO-5 | Billing flows tied to Clerk ID |
| COSMO-6 | Tenant routing based on Clerk ID |
| COSMO-7 | Export/import data keyed by Clerk |
| COSMO-8 | Recovery flows using Clerk identity |
| COSMO-9 | Impersonation flows via Clerk |
| COSMO-10 | MFA authority assigned to Clerk |

**Any match = COSMOLOGY VIOLATION**

---

## PHASE 18: SEMANTIC IDENTITY FLOW ANALYSIS

**This is NOT grep. This is flow analysis.**

For each Server Action in `src/app/actions/`, trace the identity pipeline:

### POISONED FLOW (VIOLATION):
```
Server Action
    ↓
auth() [CLERK]  ← L1 VIOLATION
    ↓
userId (Clerk ID)
    ↓
convex.mutation({ clerkId: userId })  ← K1 VIOLATION
    ↓
Convex: clerkId: v.string()  ← K VIOLATION
    ↓
Lookup: .withIndex("by_clerk_id")  ← X VIOLATION
    ↓
❌ SOVEREIGNTY COLLAPSED
```

### CORRECT FLOW (MANDATORY):
```
Server Action
    ↓
readSessionCookie() [FUSE]  ← CORRECT
    ↓
session._id (Convex ID)
    ↓
convex.mutation({ userId: session._id })  ← CORRECT
    ↓
Convex: userId: v.id("admin_users")  ← CORRECT
    ↓
Direct: ctx.db.get(userId)  ← CORRECT
    ↓
✅ SOVEREIGNTY MAINTAINED
```

---

## PHASE 19: RETURN VALUE SOVEREIGNTY SCAN

### Run these searches:

```bash
# Clerk user shape returns
grep -rn "return.*clerkUser\|return.*emailAddresses\|return.*primaryEmail" src/app/actions/ src/server/ --include="*.ts"
```

**Any Server Action returning Clerk user fields = L3/J VIOLATION**

---

## PHASE 20: FINAL DOCTRINE ALIGNMENT CHECK

**Verify scanner matches ALL doctrine:**

1. Read `_clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md`
2. Read `_clerk-virus/TTT-99-WAYS-CLERK-CAN-INFECT.md`
3. Cross-reference `🔥 THE FULL CLERK VIOLATION COSMOLOGY.md`
4. Cross-reference `🛑 ANTI-FUSE MANIFEST.md`
5. Verify EVERY category from ALL doctrine files is enforced
6. If ANY rule is not covered → SCANNER IS INVALID

**The scanner and doctrine must remain in PERFECT ALIGNMENT.**

---

## OUTPUT FORMAT

### IF VIOLATIONS FOUND:

```
🦠 CLERK VIRUS DETECTED - SOVEREIGNTY ANNIHILATED

═══════════════════════════════════════════════════════════════════════════════
  DANTE v2.0 — DOCTRINE ENFORCEMENT REPORT
═══════════════════════════════════════════════════════════════════════════════

Doctrine Sources:
  📜 _clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md
  📜 _clerk-virus/TTT-99-WAYS-CLERK-CAN-INFECT.md
  📜 🔥 THE FULL CLERK VIOLATION COSMOLOGY.md (152 violations)
  📜 🛑 ANTI-FUSE MANIFEST.md (110+ violations)

═══════════════════════════════════════════════════════════════════════════════
  VIOLATIONS BY CATEGORY
═══════════════════════════════════════════════════════════════════════════════

[List ALL violations by category with file:line references]

═══════════════════════════════════════════════════════════════════════════════
  VERDICT: SOVEREIGNTY ANNIHILATED
═══════════════════════════════════════════════════════════════════════════════

Total Violations: [count]
  Category BIRTH: [count] ← FIX FIRST
  Category A: [count]
  Category B: [count]
  Category C: [count]
  Category D: [count]
  Category E: [count]
  Category F: [count]
  Category G: [count]
  Category H: [count]
  Category I: [count]
  Category J: [count]
  Category K: [count]
  Category L: [count]
  Category M: [count]
  Category N: [count]
  Category X: [count] ← NUCLEAR
  Category COSMO: [count]

NO WORKAROUNDS. NO EXCEPTIONS. FIX. OR. BURN.
═══════════════════════════════════════════════════════════════════════════════
```

### IF CLEAN:

```
✅ DANTE v2.0 — SOVEREIGNTY VERIFIED

═══════════════════════════════════════════════════════════════════════════════
  FOOLPROOF SCAN COMPLETE — ALL 89 VIOLATION TYPES CHECKED
═══════════════════════════════════════════════════════════════════════════════

Doctrine Sources:
  📜 _clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md ✓
  📜 _clerk-virus/TTT-99-WAYS-CLERK-CAN-INFECT.md ✓
  📜 🔥 THE FULL CLERK VIOLATION COSMOLOGY.md ✓
  📜 🛑 ANTI-FUSE MANIFEST.md ✓

Categories Scanned:
  ✅ BIRTH (9 checks) — Identity Origin SOVEREIGN
  ✅ A (5 checks) — No Direct Imports
  ✅ B (4 checks) — No Indirect Imports
  ✅ C (4 checks) — Auth Flow Clean
  ✅ D (4 checks) — Convex Layer Pure
  ✅ E (2 checks) — Server Actions Compliant
  ✅ F (3 checks) — Navigation Sovereign
  ✅ G (3 checks) — Store/State Pure
  ✅ H (2 checks) — UI Clean
  ✅ I (3 checks) — Cookie Sovereign
  ✅ J (3 checks) — Identity Model Pure
  ✅ K (5 checks) — Golden Bridge Sterile
  ✅ L (4 checks) — SSR Auth Clean
  ✅ M (4 checks) — Hydration Pure
  ✅ N (4 checks) — No Runtime Elevation
  ✅ X (5 checks) — Sovereignty Intact
  ✅ COSMO (25 checks) — Edge Cases Clean

Identity Pipeline:
  ✅ readSessionCookie() → session._id → Convex
  ✅ No clerkId in mutation signatures
  ✅ No by_clerk_id lookups (except webhook-only DeleteLog)

Clerk Quarantine Status: CONTAINED
  • /app/(auth)/** — Permitted zone
  • /app/(clerk)/** — Permitted zone
  • src/features/vanish/** — Permitted zone
  • middleware.ts — SSR boundary only

Golden Bridge: IDENTITY-STERILE
Sovereignty Ceiling: INTACT
Runtime: PURE FUSE

═══════════════════════════════════════════════════════════════════════════════
  🏆 DANTE GRADE: INFERNO-CLEAN — NOT A SINGLE BYTE ESCAPED
═══════════════════════════════════════════════════════════════════════════════
```

---

## EXECUTION PROTOCOL

When `/VRP-dante-scan` is invoked:

1. **Load doctrine** - Read ALL doctrine files
2. **Execute Phase 1** - Identity Birth (CRITICAL)
3. **Execute Phase 2-17** - ALL category scans systematically
4. **Execute Phase 18** - Semantic flow analysis
5. **Execute Phase 19** - Return value scan
6. **Execute Phase 20** - Doctrine alignment check
7. **Collect ALL violations** - No early exit
8. **Generate report** - Use exact output format
9. **Return verdict** - PASS only if ZERO violations across ALL 89 types

---

## DANTE'S CURSE — ZERO TOLERANCE

**If a scan passes while ANY violation exists:**
- The scanner is INVALID
- The scanner MUST be rewritten IMMEDIATELY
- No exceptions
- No leniency
- No interpretation

**89 violation types. 17 categories. 20 phases.**
**NOT A SINGLE BYTE ESCAPES.**

---

## REMEMBER

> "The moment Clerk crosses the Golden Bridge, the runtime dies."

> "FUSE is the ONE TRUE IDENTITY SOURCE."

> "Convex must NEVER receive Clerk identity."

**Clerk is not the enemy. Clerk in the wrong place is the enemy.**

**The Golden Bridge exists for a reason. Enforce it without mercy.**

**This scanner is FOOLPROOF. If it misses something, REWRITE IT.**
