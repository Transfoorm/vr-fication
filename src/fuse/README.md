# FUSE Framework Layer

**Location:** `/src/fuse/`
**Purpose:** Core framework infrastructure for FUSE architecture

---

## 🎯 What is FUSE?

**FUSE 6.0** = **F**ast **U**ser **S**ystem **E**ngineering

A zero-loading-state architecture that makes web apps feel like native applications through:
1. **Server-side data embedding** (no client fetch on navigation)
2. **Cookie-based state hydration** (instant store population)
3. **Background preloading (WARP)** (predictive data fetching)
4. **Single source of truth** (Zustand store for all state)

---

## 📂 Structure

```
/src/fuse/
├── README.md                    # ← You are here
├── hydration/                   # Store hydration infrastructure
│   ├── ClientHydrator.tsx       # Populates store from cookie
│   ├── session/                 # Cookie encode/decode utilities
│   │   ├── cookie.ts            # Server-side cookie handling
│   │   └── cookieClient.ts      # Client-side cookie reading
│   ├── server/                  # Server-side utilities
│   │   └── fetchUser.ts         # Fetch user data server-side
│   └── hooks/                   # Hydration-related hooks
│       └── useRankCheck.ts      # Rank-based access control
├── constants/                   # Framework constants
│   ├── coreThemeConfig.ts       # Theme defaults, storage keys
│   └── ranks.ts                 # Rank system configuration
├── domains/                     # Domain registry (WARP/WRAP)
│   ├── registry.ts              # Central domain configuration
│   └── index.ts                 # Domain registry exports
├── warp/                        # Background preloading
│   └── orchestrator.ts          # WARP orchestration engine
└── providers/                   # Framework providers
    └── [future providers]       # Convex, Auth, etc.
```

---

## 🔄 How FUSE Works

### The Flow

```
┌─────────────────────────────────────────────────────┐
│  1. SERVER (layout.tsx, page.tsx)                   │
│     ↓ Fetch user data from Convex                   │
│     ↓ Encode into FUSE_5.0 cookie                   │
│     ↓ Embed in HTML response                        │
└─────────────────────────────────────────────────────┘
                    ↓ Send to Browser ↓
┌─────────────────────────────────────────────────────┐
│  2. CLIENT (Initial Load)                           │
│     ↓ ClientHydrator reads FUSE_5.0 cookie          │
│     ↓ Decodes user data                             │
│     ↓ Populates Zustand store (useFuse)             │
│     ↓ Components render with data INSTANTLY         │
└─────────────────────────────────────────────────────┘
                    ↓ User Navigates ↓
┌─────────────────────────────────────────────────────┐
│  3. NAVIGATION (No Loading State!)                  │
│     ↓ Next.js navigation (client-side)              │
│     ↓ Store already has data (from cookie)          │
│     ↓ Components render INSTANTLY (0ms)             │
│     ✅ NO LOADING SPINNER                           │
└─────────────────────────────────────────────────────┘
```

### Key Insight

**Traditional apps:**
```
Navigate → Fetch Data → Show Spinner → Render
          └─ 100-500ms ─┘  ← User sees loading
```

**FUSE apps:**
```
Navigate → Render (data already in store)
          └─ 0ms ─┘  ← Instant
```

---

## 📦 What Each Directory Does

### `/hydration/` - Store Population Infrastructure

**Purpose:** Gets data into the Zustand store

**Key Files:**
- **`ClientHydrator.tsx`** - React component that:
  - Reads `FUSE_5.0` cookie on mount
  - Decodes user data
  - Populates store via `useFuse.setState()`
  - Polls for cookie changes (detects Server Action updates)

- **`session/cookie.ts`** (Server-side)
  - `encodeFuseCookie()` - Serialize user data to cookie
  - `decodeFuseCookie()` - Deserialize cookie to user data
  - `setCookie()` - Set cookie in response headers

- **`session/cookieClient.ts`** (Client-side)
  - `getCookie()` - Read cookie from `document.cookie`
  - `decodeFuseCookie()` - Parse cookie data

- **`server/fetchUser.ts`** (Server-side)
  - Fetches user from Convex by Clerk ID
  - Used in layouts to get initial user data
  - Embeds data in cookie before sending HTML

### `/constants/` - Framework Configuration

**Purpose:** Single source of truth for framework defaults

**Key Files:**
- **`coreThemeConfig.ts`**
  - Theme defaults (`transtheme`, dark mode)
  - Storage keys (`FUSE_5.0`, `WARP_CACHE`)
  - DOM attributes for theme application

- **`ranks.ts`**
  - Naval rank system configuration
  - Rank hierarchy (Crew → Captain → Commodore → Admiral)
  - Default trial duration, subscription settings

### `/domains/` - Domain Registry

**Purpose:** Central configuration for all business domains (WARP/WRAP pattern)

**Key Files:**
- **`registry.ts`** - Domain configuration registry
  - `DOMAINS` object - All domain configurations (productivity, financial, clients, etc.)
  - Helper functions - `getDomain()`, `getDomainForRoute()`, `getDomainsForRank()`
  - Type exports - `DomainKey`, `DomainConfig`

- **`index.ts`** - Clean export interface
  - Re-exports all domain registry functions
  - Single import point for domain utilities

**Domain Configuration Structure:**
Each domain defines:
- Routing paths and aliases
- Hook names (`useProductivityData`, `useFinancialData`)
- Provider names (`ProductivityProvider`, `FinancesProvider`)
- Store slices (`productivity`, `finance`)
- Rank access control
- Feature lists

### `/warp/` - Background Preloading

**Purpose:** TRUE WARP - Wait-free Asynchronous Resource Preloading

**Key Files:**
- **`orchestrator.ts`** - WARP orchestration engine
  - `startBackgroundWARP()` - Initiates background data preload
  - `attachTTLRevalidation()` - Auto-refresh on window focus/online
  - `resetWarpTTL()` - Clear cache on sign-out
  - Uses `requestIdleCallback` for non-blocking execution
  - 5-minute TTL for cache freshness

**How WARP Works:**
1. User logs in → Rank detected
2. WARP triggers in idle time (non-blocking)
3. Fetches domain data based on rank (Admiral → admin data, etc.)
4. Hydrates store in background
5. User navigates → Data already there (0ms loading)

**TTL Revalidation:**
- Refreshes data if older than 5 minutes
- Triggers on window focus or online event
- Ensures fresh data without manual refresh

### `/providers/` - Framework Providers

**Purpose:** React context providers for framework services

**Future:**
- `ConvexProvider.tsx` - Convex client setup
- `AuthProvider.tsx` - Clerk authentication wrapper
- `ThemeProvider.tsx` - Theme mode switching

---

## 🔗 Integration with `/src/store/`

**The Division:**

| Directory | What | Responsibility |
|-----------|------|----------------|
| `/src/store/` | **The Store** | Zustand definition, state slices, actions |
| `/src/fuse/hydration/` | **The Hydrator** | Populating the store from cookies |

**Data Flow:**

```typescript
// 1. Server: Fetch user and embed in cookie
// /src/fuse/hydration/server/fetchUser.ts
import { fetchConvexUser } from '@/fuse/hydration/server/fetchUser';
const user = await fetchConvexUser(clerkId);
setCookie('FUSE_5.0', encodeFuseCookie(user));

// 2. Client: Hydrate store from cookie
// /src/fuse/hydration/ClientHydrator.tsx
const cookieData = decodeFuseCookie(getCookie('FUSE_5.0'));
useFuse.setState({ user: cookieData });

// 3. Components: Use store
// Anywhere in app
import { useFuse } from '@/store/fuse';
const user = useFuse((state) => state.user);
```

---

## 🚀 The WARP System

**WARP** = **W**ait-free **A**synchronous **R**esource **P**reloading

**Purpose:** Fetch next 3 likely pages in background while user reads current page

**Location:** `/src/lib/warp/` (separate from FUSE framework)

**How it works:**
1. User lands on page
2. WARP starts in background (idle time)
3. Predicts next 3 likely destinations based on rank/context
4. Prefetches those pages + Convex data
5. When user clicks → Page renders instantly (data already fetched)

**Integration with FUSE:**
- WARP fetches data → Stores in cache
- FUSE hydration → Populates store
- Navigation → Instant render (cache + store)

---

## 🎨 Theme System

**How FUSE handles themes:**

1. **Server-side:**
   - User preference stored in Convex `admin_users` table
   - Embedded in `FUSE_5.0` cookie
   - Applied via inline `<script>` in `<head>` (before paint)

2. **Client-side:**
   - ClientHydrator reads theme from cookie
   - Populates store via `hydrateThemeName()` and `hydrateThemeMode()`
   - Components use `useFuse((s) => s.theme)` for reactive updates

3. **Zero flash:**
   - Theme applied synchronously in `<head>` before React hydrates
   - No FOUC (Flash of Unstyled Content)
   - Matches server-rendered theme exactly

---

## 🏗️ Architecture Principles

### 1. **Zero Loading States**
Every navigation should feel instant. No spinners. No skeletons. Ever.

### 2. **Server-First Data**
Fetch data server-side, embed in HTML/cookies. Client never waits.

### 3. **Single Source of Truth**
All state lives in `/src/store/`. FUSE infrastructure just populates it.

### 4. **Progressive Enhancement**
Works with JavaScript disabled (server-rendered). Enhances with JS (instant nav).

### 5. **Framework, Not Library**
FUSE is a complete architecture. Hydration + State + Preloading + Themes.

---

## 📋 Developer Checklist

When working with FUSE:

### Adding New User Data to Cookie
1. Update `/src/fuse/hydration/session/cookie.ts`
   - Add field to `FuseCookieData` type
   - Update `encodeFuseCookie()` and `decodeFuseCookie()`

2. Update `/src/store/types.ts`
   - Add field to `FuseUser` interface

3. Update `/src/fuse/hydration/ClientHydrator.tsx`
   - Add hydration logic if needed (e.g., `hydrateNewField()`)

### Adding Server-Side Fetch
1. Add function to `/src/fuse/hydration/server/fetchUser.ts`
2. Call in layout (`app/layout.tsx`, `app/layout.tsx`)
3. Embed in cookie via `setCookie()`

### Adding Framework Constants
1. Add to `/src/fuse/constants/coreThemeConfig.ts` or `ranks.ts`
2. Use consistent naming: `CONSTANT_NAME` (SCREAMING_SNAKE_CASE)

---

## 🚨 Common Pitfalls

### ❌ Don't: Fetch data in components
```typescript
// BAD - Component fetches on mount
const MyComponent = () => {
  const data = useQuery(api.getData); // ❌ Shows loading spinner
  if (!data) return <Spinner />; // ❌ User sees flash
  return <div>{data.value}</div>;
};
```

### ✅ Do: Use FUSE store (data already there)
```typescript
// GOOD - Data already in store from server
const MyComponent = () => {
  const data = useFuse((s) => s.myData); // ✅ Instant
  return <div>{data.value}</div>; // ✅ No loading state
};
```

### ❌ Don't: Client-side only state for critical data
```typescript
// BAD - useState won't survive navigation
const [theme, setTheme] = useState('dark'); // ❌ Lost on navigation
```

### ✅ Do: Store critical state in FUSE
```typescript
// GOOD - Persists in store + cookie
const theme = useFuse((s) => s.theme); // ✅ Survives navigation
const setTheme = useFuse((s) => s.setTheme); // ✅ Updates cookie
```

---

## 🔍 Debugging FUSE

### Check Cookie
```javascript
// Browser console
document.cookie.split('; ').find(row => row.startsWith('FUSE_5.0'))
```

### Check Store State
```javascript
// Browser console
window.useFuse?.getState()
```

### Enable FUSE Logging
```typescript
// In ClientHydrator.tsx
console.log('[FUSE] Hydrating from cookie:', decoded);
```

---

## 📚 Related Documentation

- **`/src/store/README.md`** - Zustand store structure (coming soon)
- **`/_SDK(v1)/02-FUSE-STYLE-ARCHITECTURE.md`** - FUSE architecture deep dive
- **`/_SDK(v1)/01-FUSE-CORE-ARCHITECTURE.md`** - Core FUSE principles
- **`/CLAUDE.md`** - The FUSE vision narrative

---

## 🎯 TL;DR

**FUSE Framework (`/src/fuse/`) is the infrastructure that makes instant navigation possible.**

It handles:
- 🔄 **Hydration** - Populating store from cookies
- 🍪 **Cookies** - Encoding/decoding session data
- 📡 **Server fetching** - Getting user data server-side
- 🎨 **Themes** - Zero-flash theme application
- ⚙️ **Constants** - Framework defaults and configuration

**You use it by:**
- Importing `useFuse` from `/src/store/fuse` in components
- Server-side fetching via `/src/fuse/hydration/server/fetchUser`
- Never thinking about loading states again

**The result:** Web apps that feel like native apps. Zero loading. Forever.

---

**Version:** 5.0
**Last Updated:** 2025-11-23
**Maintained by:** FUSE Architecture Team
