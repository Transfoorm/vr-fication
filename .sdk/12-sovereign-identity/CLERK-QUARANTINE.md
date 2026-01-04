# Clerk Quarantine

> Strict boundaries for external auth provider containment

---

## Overview

Clerk is an external auth provider. Like any external dependency, it must be contained to prevent coupling across the codebase. The quarantine ensures:

- Auth logic stays isolated
- Provider can be swapped without refactoring
- Runtime remains sovereign
- FUSE maintains identity authority

---

## Permitted Zones

### Zone 1: Auth Pages

**Path:** `/app/(auth)/**`

**Contains:**
- Sign-in page
- Sign-up page
- Forgot password
- Password reset
- Email verification

**Permitted imports:**
```typescript
import { auth } from '@clerk/nextjs/server';
import { SignIn, SignUp } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs/server';
```

### Zone 2: Clerk Routes

**Path:** `/app/(clerk)/**`

**Contains:**
- Webhook handlers
- Verification callbacks
- OAuth callbacks

**Permitted imports:**
```typescript
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
```

### Zone 3: Middleware

**Path:** `middleware.ts`

**Purpose:** SSR session validation only

**Permitted pattern:**
```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

---

## Forbidden Zones

### Features

**Path:** `/src/features/**`

**Violation examples:**
```typescript
// FORBIDDEN
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useClerk } from '@clerk/clerk-react';
```

**Consequence:** Runtime identity pollution. Components become dependent on external auth state.

### Domain Views

**Path:** `/src/app/domains/**`

**Violation examples:**
```typescript
// FORBIDDEN
import { SignedIn, SignedOut } from '@clerk/nextjs';
const { isLoaded, isSignedIn } = useAuth();
```

**Consequence:** Domain logic couples to auth provider. Navigation becomes auth-dependent.

### FUSE Store

**Path:** `/src/store/**`

**Violation examples:**
```typescript
// FORBIDDEN
import { useUser } from '@clerk/nextjs';

// Using Clerk to hydrate FUSE
const { user } = useUser();
setUser(user);
```

**Consequence:** FUSE loses canonical authority. Two identity sources compete.

### Convex

**Path:** `/convex/**`

**Violation examples:**
```typescript
// FORBIDDEN
import { auth } from '@clerk/nextjs/server';

// Using Clerk identity in mutations
export const updateUser = mutation({
  handler: async (ctx) => {
    const { userId } = await auth();  // VIOLATION
  }
});
```

**Consequence:** Database operations depend on external provider. Schema couples to Clerk.

### Hooks

**Path:** `/src/hooks/**`

**Violation examples:**
```typescript
// FORBIDDEN
import { useUser } from '@clerk/nextjs';

export function useCurrentUser() {
  const { user } = useUser();  // Clerk hook
  return user;
}
```

**Consequence:** Application-wide hooks depend on auth provider.

---

## Detection

### Import Scan

```bash
# Find Clerk imports outside permitted zones
grep -r "@clerk" src/features/ src/store/ src/hooks/ convex/
```

### Pattern Scan

```bash
# Find auth() calls outside permitted zones
grep -r "await auth()" src/features/ src/app/domains/ convex/
```

### Scanner Tool

```bash
/VRP-clerk-scan
```

---

## Exception Handling

### What if I need user data in a feature?

**Wrong:** Import Clerk hooks
```typescript
import { useUser } from '@clerk/nextjs';
const { user } = useUser();
```

**Right:** Read from FUSE
```typescript
const user = useFuse((s) => s.user);
```

### What if I need to check auth status?

**Wrong:** Use Clerk hooks
```typescript
const { isSignedIn } = useAuth();
```

**Right:** Check FUSE session
```typescript
const session = useFuse((s) => s.session);
const isSignedIn = !!session;
```

### What if I need to call a mutation with user ID?

**Wrong:** Get from Clerk
```typescript
const { userId } = await auth();
await mutation({ clerkId: userId });
```

**Right:** Get from session cookie
```typescript
const session = await readSessionCookie();
await mutation({ userId: session._id });
```

---

## Quarantine Breach Protocol

When a Clerk import is found outside permitted zones:

1. **Identify the violation** — Which file, which import
2. **Trace the dependency** — Why was Clerk needed here?
3. **Find the FUSE alternative** — Cookie, store, or session
4. **Remove the import** — Replace with sovereign pattern
5. **Verify isolation** — Run scanner to confirm

---

*Quarantine is not optional. Every breach weakens sovereignty.*
