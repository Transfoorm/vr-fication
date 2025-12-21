# TRANSFOORM DEV CHECK: MINIMUM MENTAL MODEL

**Purpose:** Before you touch ANY domain (Admin, Finance, Email, Clients, etc.), you must internalize these mental models.

**Context:** This app is designed for AI-developer maintenance at 100K+ user scale. The patterns exist to create systematic, predictable architecture that AI can maintain and humans can understand.

**Rule:** If you can't answer "yes" to the 15 questions at the bottom, you're not ready to write code.

---

## PART 1: CORE RUNTIME & UI ARCHITECTURE

You can't build correctly unless you understand these as **laws, not tools**.

### VR (Variant Robot)

**What it is:**
- Components are stateful variants, not ad-hoc JSX
- Props select behaviour; CSS variants define appearance
- No freeform components allowed

**Mental model:**
```
VR = Dumb UI shell
├─ Visual states only
├─ Callbacks passed from Feature
└─ ZERO business logic, ZERO FUSE access
```

**Forbidden:**
```tsx
// ❌ VR accessing FUSE
import { useFuse } from '@/store/fuse';
function Button() {
  const user = useFuse(s => s.user); // VIOLATION
}

// ❌ VR with business logic
function Button({ onClick }) {
  const handleClick = () => {
    if (someComplexCondition) { // VIOLATION
      onClick();
    }
  };
}
```

**Correct:**
```tsx
// ✅ VR is pure presentation
interface ButtonProps {
  onClick: () => void;
  variant: 'primary' | 'secondary';
}

export function Button({ onClick, variant }: ButtonProps) {
  return <button className={`vr-button vr-button--${variant}`} onClick={onClick} />;
}
```

---

### FUSE (Fetch-Update-Store-Everything)

**What it is:**
- Single Zustand store holding ALL application state
- Server data, user data, UI state, theme - everything
- No separate contexts, no provider soup

**Mental model:**
```
FUSE = Single source of truth
├─ Hydrated from server cookie (<1ms)
├─ Updated by WARP (background preload)
├─ Read by Features (never by VRs or Tabs)
└─ ONE store, ZERO sync issues
```

**The foundation truth:**
- FUSE isn't revolutionary tech - it's excellent Zustand architecture
- It's the **sturdy platform** that enables WARP, PRISM, and 0-5ms navigation
- Simple, systematic, AI-maintainable

**Laws:**
1. NO loading states in components (data arrives before render)
2. NO fetch() calls in components (all fetching via FUSE/WARP)
3. NO axios or external HTTP libraries (only Convex + cookies)

---

### WARP (Wholesale Anticipatory Resource Preloading)

**What it is:**
- Deterministic background preloading during idle time
- Fetches next 3 likely pages based on user rank/behavior
- Data arrives BEFORE navigation, not after

**Mental model:**
```
User loads Dashboard
    ↓
WARP starts (requestIdleCallback)
    ↓
Background fetch: Admin data, Settings data, Finance data
    ↓
User clicks "Finance"
    ↓
Data already in FUSE → Render immediately (0ms)
```

**Critical insight:**
- If the user can possibly click it, it should already be warm
- Navigation reveals data, not fetches it
- This is what enables "desktop app speed"

---

### Sovereign Router

**What it is:**
- Client-side routing ONLY
- Navigation never triggers server round-trips
- Sub-50ms navigation target

**Mental model:**
```
Traditional routing:
Click → Server → Fetch → Render → 200-500ms

Sovereign Router:
Click → FUSE lookup → Render → 0-5ms
```

**Law:** Navigation must not trigger server round-trips.

---

### PRISM (Predictive Reactive Intent-Signal Mechanism)

**What it is:**
- Reactive single-domain preload on dropdown/interaction hover
- Complements WARP (which is proactive batch)

**Mental model:**
```
User hovers over "Finance" dropdown
    ↓
PRISM triggers finance slice preload
    ↓
User opens dropdown
    ↓
Data already loaded → No spinner
```

**Law:** Dropdowns and selectors preload datasets before interaction. No spinner-on-open allowed.

---

### ISV (Inline Style Virus)

**What it is:**
- The use of `style={{}}` props
- Architectural violation that breaks theming, consistency, and maintainability

**Mental model:**
```
Inline styles = Runtime debt
├─ Can't be themed
├─ Can't be cached
├─ Can't be optimized
└─ Violates separation of concerns
```

**Forbidden:**
```tsx
// ❌ ISV INFECTION
<div style={{ color: 'red', fontSize: '16px' }} />
<div style={{ padding: '12px', margin: '8px' }} />
```

**Allowed (rare exceptions):**
```tsx
// ✅ Runtime-calculated positioning ONLY
<Tooltip style={{ top: `${position.y}px`, left: `${position.x}px` }} />

// ✅ CSS variable bridges ONLY
<div style={{ '--rank-color': meta.color } as React.CSSProperties} />
```

**Rule:** If it's not dynamic positioning or CSS variable bridging, use CSS classes.

---

## PART 2: IDENTITY & SECURITY BOUNDARIES

**If you get this wrong, the platform rots.**

### Clerk (Identity Provider)

**What it is:**
- Identity provider ONLY, not application logic
- Lives in a quarantine zone
- Never trusted for business rules

**Mental model:**
```
Clerk = Authentication (who are you?)
Transfoorm = Authorization (what can you do?)
```

**Forbidden:**
```tsx
// ❌ Business rules in Clerk callbacks
onUserCreated((user) => {
  assignDefaultRole(user); // VIOLATION - business logic in identity layer
});

// ❌ Clerk data in domain logic
if (user.clerkId === 'xyz') { // VIOLATION - using Clerk ID as meaning
  grantAccess();
}
```

**Correct:**
```tsx
// ✅ Clerk authenticates, Transfoorm authorizes
const user = await getUserFromClerk(clerkId);
const permissions = await getPermissionsFromTransfoorm(user.id);
```

**The doctrine:**
- Clerk authenticates
- Transfoorm authorizes
- Clerk IDs are foreign keys, never primary meaning

**See also:** `_sdk/_clerk-virus/` for comprehensive Clerk sovereignty doctrine.

---

### Sovereign Identity Doctrine (SID)

**What it is:**
- Your internal user, org, and role models are sovereign
- External identity providers (Clerk) are adapters, not masters

**Mental model:**
```
Identity ≠ User ≠ Role ≠ Permission

Clerk ID → Foreign key
User ID → Primary identity
Role → Capability set
Permission → Granular access
```

**Rule:** Clerk IDs reference users. User IDs define users. Never confuse the two.

---

### No Client Trust

**What it is:**
- Client UI may request, never decide
- All state mutations go through server actions or Convex
- Client-side "changes" are optimistic updates only

**Mental model:**
```
❌ Client decides:
User clicks "Delete" → Remove from FUSE → Done
(What if server rejects? State is corrupt)

✅ Server decides:
User clicks "Delete" → Request to server → Server validates → Server mutates → Client hydrates new state
```

**Law:** Client UI may request, never decide.

---

## PART 3: DATA & STATE DOCTRINE

**These are not optional patterns.**

### Derived State > Stored State

**What it is:**
- If state can be computed, it must not be persisted
- Thread state is computed, never stored
- Preferences are stored, filters are computed

**Mental model:**
```
❌ Storing derived state:
{
  messages: [...],
  unreadCount: 5  // ← VIOLATION (can be computed)
}

✅ Computing derived state:
{
  messages: [...]
}
// Compute: messages.filter(m => !m.read).length
```

**Why:**
- Derived state creates sync issues
- Source of truth becomes unclear
- Performance gain is negligible with modern reactivity

**Rule:** If it can be derived, it must not be stored.

---

### Single Source of Truth

**What it is:**
- One authoritative place per concept
- No duplicate storage
- No "convenience copies"

**Mental model:**
```
Concept: User's theme preference

❌ Multiple sources:
- localStorage.theme
- FUSE.theme
- Convex.users.theme
- Clerk.metadata.theme
→ Which one is correct? Sync nightmare.

✅ Single source:
- Convex.users.theme (authoritative)
- FUSE.theme (hydrated from Convex)
- No other copies
```

**Mapping:**
- Message state → Email index (Convex)
- Thread state → Pure function (computed)
- User preferences → Convex users table
- UI state → FUSE (ephemeral, non-critical)

---

## PART 4: CLIENT-SIDE STORAGE (MINOR DETAIL)

**What you need to know:** FUSE hydrates from client-side storage (currently cookies, may migrate to IndexedDB if needed). This enables 0-5ms navigation.

**Why it matters:** Client-side = instant. Server round-trip = 200-500ms.

**That's it. Don't overthink it.** Storage mechanism is 0.01% of the architecture. Focus on FUSE principles, not storage implementation.

---

## PART 5: AI-DEVELOPER CONTEXT (GAME-CHANGER)

**This changes how you evaluate complexity.**

### The App is Designed for AI Maintenance

**Context from Independent Technical Appraisal:**
- Transfoorm is explicitly architected for AI-developer maintenance
- Complexity is acceptable IF it's systematic
- Ad-hoc chaos is unacceptable (AI can't maintain it)

**What this means:**

**AI excels at:**
- Systematic patterns (VR variants, FUSE slices, domain boundaries)
- Consistent naming (vr-*, ft-*, domain prefixes)
- Declarative structures (manifests, schemas, config)
- Repetitive tasks (migrations, refactors, enforcement)

**AI struggles with:**
- Ad-hoc component structures
- Inconsistent naming
- Implicit conventions
- "You just have to know" patterns

**Why TTT exists:**
- Creates AI-friendly systematic patterns
- Enforces consistency (AI can navigate)
- Prioritizes reversibility (AI can undo)
- Values predictability (AI can reason)

**Mental model shift:**

```
Traditional team: "This abstraction is too complex"
AI team: "Is this abstraction systematic and predictable?"

Traditional: Simplicity = fewer files
AI: Simplicity = consistent patterns

Traditional: Avoid "over-engineering"
AI: Systematic engineering > ad-hoc simplicity
```

**Example:**

```
❌ Ad-hoc (humans like, AI struggles):
/components/
  UserButton.tsx (mixes styles, logic, rendering)
  AdminButton.tsx (different structure)
  DeleteButton.tsx (yet another pattern)

✅ Systematic (AI excels):
/vr/button/
  Primary.tsx (consistent structure)
  Secondary.tsx (same structure)
  Danger.tsx (same structure)
  index.tsx (registry)
```

**The law:**
- Complexity is okay if it's systematic
- Simplicity is NOT okay if it's ad-hoc
- AI maintains systematic complexity better than ad-hoc simplicity

---

## PART 6: PERFORMANCE INVARIANTS (NON-NEGOTIABLE)

**A dev must know these numbers.**

### The Numbers

```
Navigation: 0-5ms perceived
Inbox render: <50ms
Domain switch: ~0ms perceived
Data fetch: <200ms (background only)
```

### The Laws

1. **NO blocking spinners on primary flows**
   - Primary flow = any action in main navigation
   - Spinners allowed: File uploads, external API calls
   - Spinners forbidden: Navigation, domain switching, inbox loading

2. **NO "loading..." during navigation**
   - Data must arrive before navigation
   - WARP preloads, navigation reveals
   - If you see "Loading..." on click, you built it wrong

3. **NO fetch-on-view**
   - Data is fetched during idle time (WARP)
   - Data is fetched on hover/intent (PRISM)
   - Data is NEVER fetched on view render

**Mental model:**
```
❌ Traditional:
User clicks → Fetch → Wait → Render → 200-500ms

✅ Transfoorm:
Background: WARP fetches
User clicks → Data already in FUSE → Render → 0-5ms
```

**The test:**
- If it feels slower than a desktop app, you built it wrong
- If users see spinners during navigation, you built it wrong
- If data is fetched on render, you built it wrong

**The standard:**
> "If you accept slower, you are building Outlook."

---

## PART 7: FORBIDDEN MENTAL MODELS

**A dev must unlearn these.**

### The Forbidden List

You are **ABSOLUTELY FORBIDDEN** from these thoughts:

1. **"We'll fetch it when the page loads"**
   - ❌ Wrong: Fetch on load
   - ✅ Correct: WARP fetches during idle, page reveals data

2. **"Let's store this for convenience"**
   - ❌ Wrong: Duplicate storage
   - ✅ Correct: Single source of truth, compute derived state

3. **"We can fix performance later"**
   - ❌ Wrong: Performance is optimization
   - ✅ Correct: Performance is architecture

4. **"AI can just handle it"**
   - ❌ Wrong: AI is magic
   - ✅ Correct: AI needs systematic patterns

5. **"It's fine to add one more state"**
   - ❌ Wrong: State is free
   - ✅ Correct: State is debt (can it be derived?)

6. **"Users won't notice"**
   - ❌ Wrong: 200ms is fine
   - ✅ Correct: 200ms breaks desktop app feel

7. **"This is too complex for users to understand"**
   - ❌ Wrong: Dumb down the UI
   - ✅ Correct: Complexity is in implementation, not interface

8. **"Let's use a library for this"**
   - ❌ Wrong: Libraries are free
   - ✅ Correct: Every dependency is debt (justify it)

9. **"We need real-time updates everywhere"**
   - ❌ Wrong: WebSockets for everything
   - ✅ Correct: Real-time where needed, polling where sufficient

10. **"The standard way is better"**
    - ❌ Wrong: Follow framework defaults blindly
    - ✅ Correct: Understand WHY standard exists, then decide

**All of these violate Transfoorm doctrine.**

---

## PART 8: THE LAYER DISCIPLINE

**VR → Feature → Tab**

### The Three Layers

| Layer | Purpose | What belongs | What's forbidden |
|-------|---------|--------------|------------------|
| **VR** | Dumb UI shell | Visual states, callbacks | FUSE, business logic, data fetching |
| **Feature** | Business wiring | FUSE access, transforms, modals | Direct rendering in tabs |
| **Tab** | Pure declaration | One import, one render | State, FUSE, callbacks, logic, CSS |

### The Sponge Principle

**Features are the sponge.** All complexity goes there.

```
VRs stay dry → Dumb, reusable
Tabs stay dry → Pure declaration
Features get wet → Absorb all the dirt
```

### The Perfect Tab Test

Does your Tab look like this?

```tsx
import { SomeFeature } from '@/features/...';

export default function SomeTab() {
  return <SomeFeature />;
}
```

If not, you're putting dirt in the wrong place.

### Quick Checks

- **Writing state/logic in a Tab?** STOP. Move it to a Feature.
- **Writing FUSE in a VR?** STOP. VR is dumb shell only.
- **Writing CSS for a Tab?** STOP. Tabs have zero CSS.
- **Passing callbacks from Tab to VR?** STOP. Feature should handle that.

**See also:** `.claude/commands/VR-devcheck.md` for layer discipline checks.

---

## PART 9: THE ONE SENTENCE

**If you only remember one thing, it should be this:**

> **Transfoorm is a preloaded, state-driven operating system where data arrives before clicks, not after.**

If you build toward that sentence, everything aligns.

If you build away from it, you get a slow SaaS clone with good intentions.

---

## PART 10: TTT PHILOSOPHY (THE WHY)

### Triple Ton Test (100K → 10K → 1K)

Every decision is designed for:
- **100K Users** - Total platform users
- **10K Subscribers** - Paying customers
- **1K Monthly Joins** - New users per month

**These aren't "someday" numbers. They're day-one architecture decisions.**

### The 6 Core Tenets

1. **Simplicity Over Sophistication** - Complexity fails at scale
2. **Consistency Over Preference** - One clear way beats ten clever ones
3. **Predictability Over Magic** - If it surprises someone, it's not FUSE-grade
4. **Reversibility Over Perfection** - Any design must be reversible in one sprint
5. **Static Over Runtime** - Push computation to build time
6. **Temporal Stability** - Works today, tomorrow, and at 100K scale

### The TTT God Protocol

Before presenting options, ask:

> "Which is the ONLY TTT-compliant pathway?"

**NOT:**
```
"We could do X, Y, or Z..."
"Here are 5 different ways..."
```

**BUT:**
```
"This is the solution because it passes all TTT tests."
```

One pathway. Zero alternatives. Instant recognition.

**See also:** `_sdk/10-TTT-philosophy/` for comprehensive TTT doctrine.

---

## PART 11: DEVELOPER READINESS CHECKLIST

**Before you write a single line of code, answer these 15 questions.**

### Architecture Understanding (5 questions)

1. **Can you explain FUSE in one sentence?**
   - ✅ "Single Zustand store holding all app state, hydrated from cookies"
   - ❌ "A state management system" (too vague)

2. **What's the difference between WARP and PRISM?**
   - ✅ "WARP = proactive batch preload on mount. PRISM = reactive single-domain preload on hover"
   - ❌ "They both preload data" (missing the distinction)

3. **Why does Sovereign Router exist?**
   - ✅ "Client-side navigation to achieve 0-5ms perceived navigation without server round-trips"
   - ❌ "Custom routing system" (missing the WHY)

4. **What's the VR → Feature → Tab layer discipline?**
   - ✅ "VRs are dumb shells, Features wire FUSE + logic, Tabs are one import"
   - ❌ "It's how we organize components" (too vague)

5. **What's ISV and why is it forbidden?**
   - ✅ "Inline Style Virus - style={{}} breaks theming, consistency, caching, and separation of concerns"
   - ❌ "We don't use inline styles" (missing the WHY)

### Data & State (3 questions)

6. **Derived state vs stored state - which wins?**
   - ✅ "Derived always wins. If it can be computed, it must not be stored"
   - ❌ "Store only what you need" (doesn't understand the principle)

7. **Where does user theme preference live?**
   - ✅ "Convex users table (authoritative), FUSE (hydrated cache)"
   - ❌ "In FUSE" (missing single source of truth)

8. **Can the client decide to delete data?**
   - ✅ "No. Client requests, server decides. Optimistic updates allowed but server is authoritative"
   - ❌ "Yes, then sync to server" (violates No Client Trust)

### AI-Developer Context (2 questions)

9. **Why is systematic complexity better than ad-hoc simplicity?**
   - ✅ "AI maintains systematic patterns easily. Ad-hoc chaos breaks AI maintenance."
   - ❌ "It's not, simpler is always better" (missing AI context)

10. **What makes a pattern "AI-friendly"?**
    - ✅ "Consistent structure, predictable naming, declarative config, repetitive patterns"
    - ❌ "Simple code" (missing the systematic requirement)

### Performance (2 questions)

11. **What's the navigation performance target?**
    - ✅ "0-5ms perceived navigation. Desktop app speed."
    - ❌ "As fast as possible" (missing the specific number)

12. **When is a loading spinner allowed?**
    - ✅ "File uploads, external API calls. NEVER on navigation or primary flows"
    - ❌ "When data is loading" (violates the principle)

### Identity & Security (2 questions)

13. **What's Clerk's role?**
    - ✅ "Authentication only. Lives in quarantine. Never trusted for business rules."
    - ❌ "Identity provider" (missing the quarantine doctrine)

14. **Clerk ID vs User ID - which is primary?**
    - ✅ "User ID is primary identity. Clerk ID is foreign key reference."
    - ❌ "Both are IDs" (missing sovereignty)

### Philosophy (1 question)

15. **What's the one sentence that defines Transfoorm?**
    - ✅ "Transfoorm is a preloaded, state-driven operating system where data arrives before clicks, not after."
    - ❌ "A fast web app" (missing the core principle)

---

## PASS/FAIL

**15/15 correct:** You're ready to write code.

**12-14 correct:** Re-read the sections you missed, then retake the quiz.

**<12 correct:** You're not ready. Read the full `_sdk/` documentation, then come back.

---

## IF YOU WANT TO GO DEEPER

This document is the **minimum mental model**. For deeper understanding:

### Architecture
- `_sdk/05-fuse-store/` - FUSE store structure and hydration
- `_sdk/06-warp-orchestrator/` - WARP + PRISM preloading
- `_sdk/03-sovereign-router/` - Client-side routing architecture

### Conventions
- `_sdk/11-conventions/VR-DOCTRINE.md` - VR layer discipline
- `_sdk/11-conventions/FILE-NAMING.md` - File naming standards
- `_sdk/11-conventions/TYPOGRAPHY-AND-SPACING.md` - Typography system

### Philosophy
- `_sdk/10-TTT-philosophy/TTT-PHILOSOPHY.md` - Triple Ton Test doctrine
- `_sdk/00-dev-bible/README.md` - Complete FUSE Bible

### Protocols
- `_sdk/09-protocols/VRP.md` - Virgin Repo Protocol (code quality)
- `_sdk/_clerk-virus/` - Clerk sovereignty doctrine

### Commands
- `.claude/commands/` - Slash commands for doctrine checks

---

## FINAL WORD

**This isn't bureaucracy. This is survival at 100K users.**

Every principle exists because:
1. It enables desktop app speed (0-5ms navigation)
2. It supports AI maintenance (systematic patterns)
3. It prevents scaling collapse (TTT compliance)

**If you skip this foundation, you will build:**
- Slow navigation (200-500ms instead of 0-5ms)
- Ad-hoc chaos (AI can't maintain)
- Scaling failure (breaks at 10K users)

**If you internalize this foundation, you will build:**
- Desktop app speed (0-5ms navigation)
- Systematic architecture (AI maintains easily)
- Scale-ready platform (works at 100K users)

---

**Version:** 1.0
**Date:** 2025-12-21
**Context:** Post-Independent Technical Appraisal
**Source:** Email domain onboarding + Independent Report insights + TTT philosophy

---

**Ready to code? Run `/VR-devcheck` to verify layer discipline.**
