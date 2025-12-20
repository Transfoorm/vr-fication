# 🛑 100+ WAYS CLERK CAN INFECT AND DESTROY A SOVEREIGN RUNTIME

# 🛡️ CLERK KNOX SOVEREIGN DOCTRINE — TOTAL LOCKDOWN

Clerk is permitted **ONLY** in:
  • `/app/(auth)/**`
  • `/app/(vanish)/**`
  • `middleware.ts` (SSR boundary only)

Everywhere else:
  ❌ ZERO Clerk imports  
  ❌ ZERO auth() calls  
  ❌ ZERO getToken()  
  ❌ ZERO clerkClient()  
  ❌ ZERO Clerk tokens passed to Convex  
  ❌ ZERO Clerk UI components  
  ❌ ZERO runtime Clerk identity  
  ❌ ZERO dual-identity models allowed  

FUSE is the **single canonical identity source**.  
Golden Bridge is **identity-sterile**.  
Convex must **never** receive Clerk identity.  

Any violation = **Category K+ virus** and must be treated as a CRITICAL SOVEREIGN BREACH.

(Use this to catch devs before they burn down your kingdom.)

⸻

⚠️ CATEGORY A — DIRECT IMPORT VIRUSES

These are instant nuclear violations. The moment a dev writes them, the runtime is compromised.

🔥 A1. Importing Clerk in ANY client component

import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useClerk } from '@clerk/clerk-react';

Effect:
	•	Hydration mismatch
	•	Runtime identity resolution
	•	Loading states
	•	Sovereign Router corruption
	•	FUSE dethroned

🔥 A2. Importing Clerk in ANY Domain view

Path violation:

src/app/domains/**/*

Effect:
Foreign authority enters sovereign territory.

🔥 A3. Importing Clerk inside FUSE store

Effect:
Clerk gains influence over state shape → apocalypse.

🔥 A4. Importing Clerk inside Convex config

Effect:
Dual authority: Convex + Clerk → unstable identity model.

🔥 A5. Importing Clerk inside Router or Navigation

Effect:
Sovereign Router becomes subordinate → fatal.

⸻

⚠️ CATEGORY B — INDIRECT IMPORT VIRUSES

Sneaky devs use “nice-looking” helpers to bypass the ban.

🔥 B1. Using <SignedIn> or <SignedOut> wrappers

These look harmless.
They are NOT.
They require runtime auth → virus.

🔥 B2. Using <ClerkLoaded>

Triggers hydration + auth → virus.

🔥 B3. Using <ClerkProvider> inside FuseApp or Domains

Provider = runtime → virus spreads instantly.

🔥 B4. Using “clerk-react” instead of “clerk-nextjs”

This bypasses your SSR gating → VIRUS MASSACRE.

⸻

⚠️ CATEGORY C — AUTH FLOW VIRUSES

Clerk tries to OWN navigation or session.

🔥 C1. Using redirectToSignIn()

Hijacks Sovereign Router → fatal.

🔥 C2. Using Clerk middleware in /app instead of root

Middleware = navigation controller → virus.

🔥 C3. Using Clerk’s useSession on the client

Creates TWO session models → guaranteed meltdown.

🔥 C4. Relying on Clerk to store:
	•	firstName
	•	lastName
	•	email
	•	image
	•	username
	•	phone

Effect:
Two identities.
Two sources of truth.
Two worlds.
Runtime schizophrenia.

⸻

⚠️ CATEGORY D — CONVEX VIRUSES

Sneaky devs inject Clerk identity into Convex incorrectly.

🔥 D1. Calling Convex mutations from client via useMutation()

Mutation runs through ConvexProvider → ConvexProvider requires Clerk authentication →
Clerk virus injected into domain runtime.

🔥 D2. Passing clerkId from the client

NEVER allow devs to send identity from client → forgery vector.

🔥 D3. Using ctx.auth.getUserIdentity() in untrusted mutations

If unguarded → exploit gateway.

🔥 D4. Allowing ConvexHttpClient to “guess” identity

Impossible → leads to failure → dev tries hacks → virus.

⸻

⚠️ CATEGORY E — SERVER ACTION VIRUSES

Server Actions are safe ONLY if used correctly. They become viral when misused.

🔥 E1. Importing Server Actions inside Domain components

This executes server code inside client → Clerk runtime → virus.

🔥 E2. Calling Server Actions without updating FUSE afterwards

Creates dueling state machines → FUSE loses authority.

⸻

⚠️ CATEGORY F — NAVIGATION VIRUSES

If Clerk interferes with routing even ONCE → Sovereignty collapses.

🔥 F1. Using Clerk’s built-in redirect helpers

They assume Next.js App Router owns navigation → contradiction → runtime fracture.

🔥 F2. Using Clerk inside middleware that touches routes under /app

Middleware MUST only protect /auth — never /app.

🔥 F3. Allowing Clerk UI components to render before FuseApp

Clerk hydration + FUSE hydration = undefined behaviour → explosion.

⸻

⚠️ CATEGORY G — STORE & STATE VIRUSES

Clerk must never touch FUSE.

🔥 G1. Adding ANY Clerk field into FUSE store shape

FUSE loses sovereignty.

🔥 G2. Using Clerk hooks to populate initial FUSE state

Runtime fetch → delayed mount → breaks Mount Lifecycle.

🔥 G3. Letting devs store Clerk session data in Zustand

Nuclear violation.

⸻

⚠️ CATEGORY H — UI AND DESIGN SYSTEM VIRUSES

🔥 H1. Using Clerk UI components (SignIn, SignUp) INSIDE your domain styling

Clerk loads its OWN CSS → pollutes Platform CSS.

🔥 H2. Using Clerk modals

Modals assume full-react-context ownership → breaks FUSE layering.

⸻

⚠️ CATEGORY I — COOKIE AND SESSION VIRUSES

🔥 I1. Allowing devs to read Clerk cookies on the client

Client-side parsing of session cookie = hack = virus.

🔥 I2. Letting Clerk mutate cookies client-side

Only Server Actions or SSR can do this.

🔥 I3. Allowing a dev to bypass Golden Bridge

Cookie must be written:
Clerk → Server Action → Convex → Cookie → FUSE

Skipping ANY step = virus.

⸻

⚠️ CATEGORY J — IDENTITY MODEL VIRUSES

🔥 J1. Treating Clerk user fields as canonical

They are NOT.

🔥 J2. Storing business or profile information in Clerk metadata

Metadata looks safe → but it’s runtime & external → virus.

🔥 J3. Allowing devs to “sync” Clerk profile → Convex directly

This inverts your sovereignty model.

⚠️ CATEGORY K — GOLDEN BRIDGE IDENTITY BREACHES

These viruses do **not** show up through simple import scans.  
They hide inside Server Actions and poison the identity pipeline itself.

🔥 K1. Using getToken({ template: 'convex' }) outside the Auth Boundary

Effect:
  • Clerk becomes identity source for Convex  
  • Dual identity pipeline  
  • Identity Ceiling violation  
  • Sovereign Router receives stale or mismatched user state  

🔥 K2. Calling clerkClient.sessions.revokeSession() outside /app/(auth)/**

Effect:
  • Business logic becomes dependent on Clerk  
  • Auth boundary collapses  
  • Golden Bridge becomes Clerk → Convex instead of FUSE → Convex  

🔥 K3. Using convex.setAuth(token) WITH Clerk-generated tokens

Effect:
  • Convex authorization becomes Clerk-centric  
  • FUSE is bypassed entirely  
  • Rank checks become inconsistent with runtime identity  

🔥 K4. Performing identity translation inside Golden Bridge

Effect:
  • Golden Bridge becomes an identity layer  
  • Server Actions become mini-auth-middleware  
  • Domain logic now depends on Clerk  

🔥 K5. Server Actions acting as identity brokers

Pattern:
  • auth() → getToken() → setAuth() → mutation()

Effect:
  • Clerk identity travels across sovereign layers  
  • Convex no longer trusts FUSE  
  • Complete Sovereignty collapse  

Summary:
  CATEGORY K viruses are the deepest and most destructive.  
  They bypass all surface-level scanning and corrupt identity at the pipeline level.

⚠️ CATEGORY L — SSR AUTH BREACHES

🔥 L1. Calling auth() inside ANY Server Action outside /app/(auth)
Effect: Clerk identity leaks into business logic.

🔥 L2. Using clerkClient() in mutations or non-auth actions
Effect: Server Actions become unauthorized auth layers.

🔥 L3. Returning Clerk user fields from Server Actions
Effect: Leaks external identity into runtime → sovereignty collapse.

🔥 L4. Letting Clerk mutate cookies outside login/logout flows
Effect: Cookie authority compromised.

⸻

⚠️ CATEGORY M — HYDRATION & PRELOAD CONTAMINATION

🔥 M1. Hydrating FuseApp before reading FUSE_5.0 cookie
Effect: Ghost identity or half-mounted runtime.

🔥 M2. WARP/PRISM preloading before identity is stable
Effect: Preloading restricted domains for the wrong user.

🔥 M3. Sovereign Router rendering under undefined identity
Effect: Route poisoning and flicker-based auth bypass.

🔥 M4. Client hydration reading stale Clerk values
Effect: Clerk silently re-enters runtime without imports.

⸻

⚠️ CATEGORY N — RUNTIME ELEVATION VIRUSES

🔥 N1. Any UI that allows Clerk to influence Router, Cookies, or FUSE
Even indirectly — instant sovereignty breach.

🔥 N2. Mutations dependent on Clerk’s identity state
Creates invisible K-class identity leaks.

🔥 N3. Authorization logic derived from Clerk runtime values
Identity Ceiling violation.

🔥 N4. “Temporary” Clerk checks in feature logic
These metastasize into permanent sovereignty failures.

⸻

🩸 THE MOST DANGEROUS VIRUS OF ALL

“It works fine locally.”

This is how devs justify:
	•	pulling Clerk hooks into Domains
	•	using ConvexProvider client-side
	•	mutating identity on the client
	•	referencing Clerk session at runtime
	•	bypassing the Golden Bridge
	•	skipping server actions
	•	storing Clerk fields in FUSE
	•	injecting auth into the store

This is the most catastrophic intrusion vector because it disguises itself as convenience.

⸻

🛡️ THE IMMUNE SYSTEM (ANTI-VIRUS CHECKS)

✔ ESLint Rules
	•	ttts/no-clerk-in-domains
	•	vrp/no-foreign-auth
	•	srb/no-identity-in-views

✔ VRP Enforcement
	•	Zero Clerk imports in /src/app/domains
	•	Zero Convex client calls from Domains
	•	No useMutation() in Domain components

✔ Structural Patterns
	•	All identity → Server Actions
	•	All side effects → Server Actions
	•	All mutations → Server Actions
	•	All updates → Cookie → FUSE

✔ Runtime Principles
	•	FuseApp mounts once
	•	Sovereign Router owns navigation
	•	Clerk never crosses the Golden Bridge

⸻

# 🚨 NEVER AGAIN FALSE NEGATIVES — SCANNER REQUIREMENTS

A scan MUST FAIL if ANY of the following are true:

• Clerk identity enters Server Actions outside /app/(auth)
• getToken(), auth(), or clerkClient() used anywhere except auth boundary
• Convex receives Clerk-based tokens or identity
• Any identity translation happens inside Golden Bridge
• Hydration occurs before FUSE cookie lock
• Any Clerk reference appears in Shell, Domains, Features, FUSE, or Convex
• Domain logic relies on Clerk’s schema or metadata
• Dual identity models detected in any layer

If a scan passes with ANY of these present,
**the scanner is invalid and MUST be updated immediately.**

All three documents — 99 Ways, High Alert, and VRP Scanner —
must remain in PERFECT doctrinal alignment.

⸻
# 🚨 NEVER AGAIN FALSE NEGATIVES — SCANNER REQUIREMENTS

⚠️ ZERO FALSE POSITIVES — PRECISION REQUIREMENT  
The scanner MUST distinguish between Clerk identity and FUSE identity.  
Only imports originating from the @clerk/* namespace constitute a virus.  

Identifiers such as:  
  • useFuse  
  • useFuseUser  
  • FuseUser  
  • useUser (FUSE selector)  
MUST NOT trigger the scanner.

The scanner must ONLY flag:  
  • Explicit Clerk imports  
  • Clerk UI components  
  • Clerk identity flows  
  • Clerk→Convex identity bridges  
  • Any useUser/useAuth/useClerk imported from Clerk’s namespace  

Any broader pattern match is invalid and MUST be corrected.  
Accuracy is mandatory — noise is forbidden.

A scan MUST FAIL if ANY of the following are true:

• Clerk identity enters Server Actions outside /app/(auth)
• getToken(), auth(), or clerkClient() used anywhere except auth boundary
• Convex receives Clerk-based tokens or identity
• Any identity translation happens inside Golden Bridge
• Hydration occurs before FUSE cookie lock
• Any Clerk reference appears in Shell, Domains, Features, FUSE, or Convex
• Domain logic relies on Clerk’s schema or metadata
• Dual identity models detected in any layer

If a scan passes with ANY of these present,
**the scanner is invalid and MUST be updated immediately.**

All three documents — 99 Ways, High Alert, and VRP Scanner —
must remain in PERFECT doctrinal alignment.

⸻

🏆 FINAL PRODUCT: THE OFFICIAL DOCUMENT

* REFER to:
🔥 “CLERK VIRUS HIGH ALERT — DEV BLACKLIST”
/Users/ken/App/v1/_clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md


🏆 FINAL PRODUCT: THE OFFICIAL DOCUMENT

* REFER to:
🔥 “CLERK VIRUS HIGH ALERT — DEV BLACKLIST”
/Users/ken/App/v1/_clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md