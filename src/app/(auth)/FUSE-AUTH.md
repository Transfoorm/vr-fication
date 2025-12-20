# 🔐 FUSE-AUTH + S.I.D.
## Authentication Architecture & Sovereign Identity Doctrine

**Version**: 3.1.0
**Last Updated**: 2025-12-11
**Author**: Ken Roberts
**Purpose**: Complete authentication architecture including S.I.D. rules, Clerk integration, FUSE patterns, Verify* features, and CSS doctrine

---

# SECTION 1: S.I.D. RULES (The Law)

> **Sovereign Identity Doctrine**
> Clerk authenticates. Convex identifies. FUSE embodies. Nothing else rules.

---

## 1.1 PRINCIPLES OF SOVEREIGN IDENTITY

These rules are absolute and non-negotiable.

| # | Principle |
|---|-----------|
| 0.1 | **Identity originates in Convex** - Clerk provides *authentication*, but Convex issues the *canonical* identity (`_id`) |
| 0.2 | **Identity is handed off exactly once** - Only during login/signup inside `(auth)` |
| 0.3 | **After handoff, Clerk identity is reference-only** - Used exclusively for Clerk API operations (email/password) |
| 0.4 | **All business logic MUST use Convex `_id`** - Never `clerkId` |
| 0.5 | **FUSE cookie is the real-time identity carrier** - All UI, stores, and features hydrate from the sovereign cookie |

---

## 1.2 IDENTITY BIRTHPOINT (SID Phase 0)

Executed **ONCE** immediately after Clerk authenticates the user.

**File:** `src/app/(auth)/actions/identity-handoff.ts`

**The ritual:**
1. `auth()` is called **here only**
2. Clerk identity → Convex `ensureUser()`
3. Convex returns canonical `_id`
4. FUSE mints sovereign session cookie
5. Clerk ID is stored as *reference only*
6. Caller receives **Convex `_id` only**

No other part of the application may call `auth()` or derive identity from Clerk.

---

## 1.3 FUSE SESSION COOKIE SPECIFICATION

After handoff, the cookie is the authoritative identity payload.

| Field | Meaning |
|-------|---------|
| `_id` | Sovereign Convex user ID (primary identity) |
| `clerkId` | Reference-only identity for Clerk API calls |
| Profile | User UI context: name, email, avatar, theme, etc. |
| Rank | captain / admiral / commodore |
| Setup state | pending / complete |
| Product state | dashboard widgets, preferences |

**Rules:**
- `_id` MUST always exist
- It MUST NOT be empty or undefined
- No business logic may read Clerk identity from anywhere else

---

## 1.4 SERVER ACTION CONTRACT (SID Phase 1)

**Server Actions must NEVER call `auth()` or `clerkClient()`**
(except inside `(auth)` folder during initial handoff)

### All Server Actions MUST:
1. Call `readSessionCookie()`
2. Extract `_id`
3. Pass `_id` to Convex (`userId`)
4. Never pass or accept `clerkId`

### Illegal patterns (must never appear):
```typescript
await auth()
await clerkClient()
convex.mutation(api..., { clerkId })
```

### Legal:
```typescript
const session = await readSessionCookie();
convex.mutation(api..., { userId: session._id });
```

---

## 1.5 CONVEX MUTATION CONTRACT (SID Phase 2)

ALL Convex mutations and queries must follow:

### Required:
```typescript
userId: v.id("admin_users")
```

### Forbidden:
```typescript
clerkId: v.string()
.withIndex("by_clerk_id")
ctx.auth.getUserIdentity()   // (HttpClient = unauthenticated)
```

### Lookup rule:
Identity lookup MUST be:
```typescript
ctx.db.get(userId);
```
No indexing by Clerk identity is ever legal.

---

## 1.6 SCHEMA SOVEREIGNTY (SID Phase 3)

Schema defines the identity model of the entire system.

**Rules:**
- `clerkId` field MAY exist only on `admin_users` for reference
- No domain may rely on it
- No index may be built on it
- Relationships MUST use Convex `_id`

**Illegal:**
```typescript
.index("by_clerk_id", ["clerkId"])
```

---

## 1.7 PIPELINE HYDRATION CONTRACT (SID Phase 4)

The UI must hydrate from the sovereign cookie.

**Rules:**
- UI may NOT call Clerk identity hooks for profile data
- UI may call Clerk for authentication UI only
- Stores hydrate from cookie only

### Illegal:
```typescript
const clerkUser = useUser();
const convexUser = useQuery(api..., { clerkId: clerkUser.id })
```

### Legal:
```typescript
const session = useFuseSession();
session._id  // true identity
```

---

## 1.8 S.I.D. TESTING CHECKLIST

Every developer must confirm:

- [ ] No `auth()` outside `(auth)`
- [ ] No Convex lookup by Clerk
- [ ] No mutation accepting `clerkId`
- [ ] No Server Action using Clerk identity
- [ ] Cookie always contains valid `_id`
- [ ] After login, Convex `_id` flows seamlessly → cookie → store → UI

---

## 1.9 DANTE SCAN (Mandatory)

After any auth refactor:

```
/VRP-dante-scan
```

**0 violations = merge allowed.**
Any violations = refactor blocked.

---

# SECTION 2: IMPLEMENTATION (How To)

---

## 2.1 ARCHITECTURE OVERVIEW

```
app/
├── (auth)/                    # Public routes - NO authentication
│   ├── auth.css               # Shared auth page styles (.ft-auth-*)
│   ├── sign-in/               # Sign in page
│   ├── sign-up/               # Sign up page
│   ├── forgot/                # Password reset (email + password forms inline)
│   │   └── page.tsx           # Stage 1 + <VerifyForgot/> + Stage 3
│   └── actions/               # Identity handoff (S.I.D. Phase 0)
│
├── domains/                   # Protected routes - Sovereign Router
│   ├── Router.tsx             # Sovereign Router switch
│   ├── admin/                 # Admin domain views
│   ├── clients/               # Clients domain views
│   ├── finance/               # Finance domain views
│   ├── productivity/          # Productivity domain views
│   ├── projects/              # Projects domain views
│   ├── settings/              # Settings domain views
│   └── system/                # System domain views
│
├── FuseApp.tsx                # Sovereign Runtime (mounts once, never unmounts)
│   └── FUSE Store             # All domain data from cookie + WARP
│
└── api/
    ├── session/               # Session cookie minting
    └── webhooks/clerk/        # Clerk webhook endpoint

features/auth/                 # Auth Features (Clerk dirty playground)
├── VerifySetup/               # Verify email during onboarding
├── VerifyEmail/               # Change primary email verification
├── VerifySecondary/           # Add secondary email verification
└── VerifyForgot/              # Password reset code verification

prebuilts/modal/
└── Verify.tsx                 # Modal.verify VR (dumb shell)
```

---

## 2.2 PROVIDER STACK

### Layer 1: ClerkProvider (Authentication)

**File**: `app/FuseApp.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function ProtectedLayout({ children }) {
  return (
    <ClerkProvider>
      <FuseProvider>
        {children}
      </FuseProvider>
    </ClerkProvider>
  );
}
```

**What it does:**
- Provides `useUser()`, `useAuth()`, `useClerk()` hooks
- Handles authentication state globally
- Protects all routes (Clerk relegated to auth only via Golden Bridge)

### Layer 2: FuseProvider (State Management)

**File**: `components/providers/FuseProvider.tsx`

```typescript
'use client';

import { useFuse } from '@/store/fuse';

export function FuseProvider({ children }) {
  // Hydrate from sovereign cookie - NOT from Clerk
  const session = useFuseSession();

  // Store is ready when cookie is hydrated
  if (!session._id) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
```

---

## 2.3 WEBHOOK INTEGRATION

Keep Convex database in sync with Clerk user updates.

**File**: `app/api/webhooks/clerk/route.ts`

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  // Verify webhook signature
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response('Error', { status: 400 });
  }

  // Handle user.updated event
  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // Sync to Convex (uses clerkId for lookup ONLY - this is the exception)
    await convex.mutation(api.domains.users.api.syncUserFromClerk, {
      clerkId: id,
      email: email_addresses?.find(e => e.id === evt.data.primary_email_address_id)?.email_address,
      firstName: first_name || undefined,
      lastName: last_name || undefined,
      avatarUrl: image_url || undefined,
    });
  }

  return new Response('', { status: 200 });
}
```

---

## 2.4 SETUP CHECKLIST

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CONVEX_URL=https://...
```

### Clerk Dashboard Configuration

1. Go to https://dashboard.clerk.com
2. Navigate to **Webhooks**
3. Click **Add Endpoint**
4. Enter URL: `https://yourdomain.com/api/webhooks/clerk`
5. Subscribe to: `user.updated`
6. Copy **Signing Secret** → Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

---

## 2.5 COMPONENT PATTERNS

### Server Component (Default)

```typescript
// No 'use client' = server component
export default async function Page() {
  return <div>Static content - SSR</div>;
}
```

### Client Component (With FUSE)

```typescript
'use client';

import { useFuse } from '@/store/fuse';

export default function AccountPage() {
  const user = useFuse(s => s.user); // From sovereign cookie

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
    </div>
  );
}
```

---

## 2.6 COMMON PITFALLS

### DON'T: Fetch data in components
```typescript
// ❌ Creates loading state
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

if (!data) return <Spinner />; // ❌ User waits!
```

### DO: Use FUSE store
```typescript
// ✅ Data already loaded from cookie
const data = useFuse(s => s.data);
return <div>{data}</div>; // ✅ Instant render!
```

---

## 2.7 VERIFY FEATURES (VR DOCTRINE)

All email verification flows use the **Modal.verify VR** (dumb shell) with dedicated features handling Clerk logic.

### The Pattern

```
Modal.verify (VR)          ← Dumb shell, just UI
    ↑
Verify* (Feature)          ← Dirty playground with Clerk hooks
    ↑
Consumer (Page/Tab)        ← ONE LINE import
```

### Available Verify Features

| Feature | Purpose | Used By |
|---------|---------|---------|
| `VerifySetup` | Verify email during onboarding | SetupModal |
| `VerifyEmail` | Change primary email | EmailTab |
| `VerifySecondary` | Add secondary email | EmailTab |
| `VerifyForgot` | Password reset code | forgot/page.tsx |

### Usage Example

```typescript
// In forgot/page.tsx - Stage 2 is ONE LINE
<VerifyForgot
  isOpen={stage === 'code'}
  email={email}
  onSuccess={() => setStage('password')}
  onCancel={() => setStage('email')}
/>
```

### Why This Pattern?

1. **Consistency** - All verification flows look/behave identically
2. **Separation** - Clerk hooks confined to features, not pages
3. **Reusability** - Modal.verify VR used by all features
4. **Testability** - Features can be tested in isolation

---

# SECTION 3: CSS DOCTRINE

---

## 3.1 THE THREE-LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: FUSE-STYLE BRAIN (Platform Infrastructure)       │
│  /styles/tokens.css, /styles/themes/transtheme.css         │
│  └── --radius-xl, --font-size-base, --text-primary         │
└─────────────────────────────────────────────────────────────┘
                          ↓ Consumed via var(--)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: FEATURE CSS (Semantic Layer)                     │
│  /src/features/auth/auth.css                               │
│  ├── Consumes: CSS Custom Properties from FUSE tokens      │
│  ├── Creates: .ft-auth-* semantic classes                  │
│  └── Imported via: /styles/features.css                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ Composed in JSX
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: COMPONENTS (Presentation)                        │
│  sign-in/page.tsx, sign-up/page.tsx, forgot/page.tsx       │
│  └── className="ft-auth-input ft-auth-input-with-icon"     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.2 AUTH CSS LOCATION

**File:** `/src/app/(auth)/auth.css`
**Prefix:** `.ft-auth-*`
**Imported via:** `/styles/features.css` AND local `./auth.css` in layout.tsx

Auth CSS lives WITH the auth pages since it's specific to the `(auth)` route group.

| What | Location |
|------|----------|
| Auth pages | `/src/app/(auth)/sign-in/`, `sign-up/`, `forgot/` |
| Auth CSS | `/src/app/(auth)/auth.css` |
| Auth actions | `/src/app/(auth)/actions/` |
| Verify features | `/src/features/auth/VerifySetup/`, `VerifyEmail/`, etc. |

---

## 3.3 CSS CLASS PREFIXES

| Prefix | Layer | Location |
|--------|-------|----------|
| `.vr-*` | VR/Prebuilts | `/src/prebuilts/` |
| `.ft-*` | Features | `/src/features/` |
| `.ly-*` | Shell/Layout | `/src/shell/` |

Auth uses `.ft-auth-*` because it's feature-level CSS.

---

## 3.4 FUSE TOKEN CONSUMPTION

```css
/* /src/app/(auth)/auth.css */
.ft-auth-input {
  border-radius: var(--radius-xl);      /* ← From tokens.css */
  color: var(--ft-auth-text-primary);   /* ← Local semantic var */
  font-size: var(--font-size-base);     /* ← From tokens.css */
}

.ft-auth-progress-fill {
  background: linear-gradient(
    to right,
    var(--brand-gradient-start),        /* ← From transtheme.css */
    var(--brand-gradient-end)           /* ← From transtheme.css */
  );
}
```

---

## 3.5 THE UNIVERSAL LAW: NO INLINE STYLES

**ISV (Inline Style Virus) is architectural poison.**

```tsx
// ❌ ISV INFECTION - Bypasses FUSE-STYLE Brain
<div style={{ padding: '4rem 0', textAlign: 'center' }}>

// ✅ FUSE CONSUMER - Uses feature class
<div className="ft-auth-centered-content">
```

**Why inline styles are forbidden:**
- Bypass the FUSE-STYLE Brain
- Theme switching breaks
- Single source of truth violated
- Performance degrades
- Maintainability destroyed

---

## 3.6 VERIFICATION COMMANDS

Check FUSE token consumption:
```bash
grep -c "var(--" src/app/\(auth\)/auth.css
```

Check class prefix compliance:
```bash
grep -c "\.ft-auth-" src/app/\(auth\)/auth.css
```

---

# APPENDIX

## Success Criteria

- [ ] S.I.D. rules followed (no `auth()` outside `(auth)`)
- [ ] Cookie contains valid `_id`
- [ ] Webhooks sync Clerk → Convex
- [ ] No loading states in components
- [ ] CSS uses `.ft-auth-*` prefix
- [ ] CSS lives in `/src/app/(auth)/auth.css`
- [ ] Verify* features use Modal.verify VR
- [ ] Dante scan passes

---

**Status**: Production-Ready
**Maintainer**: Ken Roberts

---

*"Clerk authenticates. Convex identifies. FUSE embodies. Nothing else rules."*
