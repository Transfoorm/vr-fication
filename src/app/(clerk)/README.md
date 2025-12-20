# (clerk) — Identity Quarantine Zone

This folder contains every piece of code in the app that directly touches Clerk.

Anything that imports:

```ts
import { useUser, useSignIn, useSignUp } from '@clerk/nextjs';
import { clerkClient, auth } from '@clerk/nextjs/server';
```

must live inside this folder and nowhere else.

The rest of the app interacts with identity through server actions and the FUSE cookie, not Clerk.

---

## Why this folder exists

1. **Clerk is an external identity surface** — it needs to be tightly contained.
2. **VRP/SID rules enforce zero Clerk leakage** into features/domains.
3. **Frontend features stay clean** by calling actions that live here.
4. **ESLint enforces this boundary**: `/app/(clerk)` is the only permitted Clerk zone.

---

## ESLint enforcement

Two rules block Clerk imports outside this folder:

**`vrp/no-foreign-auth`** — blocks `@clerk/*` imports globally, except:
```js
/\/app\/\(clerk\)\//   // This folder
/\/app\/\(auth\)\//    // Sign-in/sign-up pages
```

**`ttts/no-clerk-in-domains`** — blocks Clerk hooks in domain views, except:
```js
"src/app/(clerk)/**/*.{ts,tsx}"
"src/app/(auth)/**/*.{ts,tsx}"
```

If you import Clerk outside these zones, the build fails.

Everything here is either:
- a server action that talks to Clerk,
- an API route that mutates identity,
- a verification flow that needs Clerk hooks,
- or a webhook that receives Clerk events.

---

## Structure

```
/app/(clerk)/
  actions/         → server actions that use clerkClient
  api/             → API endpoints that mutate identity
  features/        → UI flows that require Clerk hooks (verify)
  webhooks/        → inbound events from Clerk
```

Each subfolder contains only identity-sensitive logic.

---

## What does not belong here

- Normal app features
- Prebuilts
- VR components
- FUSE state
- Any code that does not import Clerk

Those go in `/src/features` or domains.

---

## In one sentence

**If the file imports Clerk, it lives in (clerk) — no exceptions.**
