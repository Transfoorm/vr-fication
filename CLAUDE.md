- YOU MUST ALWAYS DISCUSS IDEAS IN SIMPLE TERMS - THE USER IS NOT A CODER!

# 🚀 TRANSFOORM: THE VISION NARRATIVE

  What We're Actually Building Here

  ---
  THE NORTH STAR

  We're not building another SaaS app. We're building the iPhone moment of web
  applications.

  Remember when every phone had 47 buttons, a stylus, and a 400-page manual? Then
  Apple released ONE button. Everyone said it was too simple. Now every phone looks
  like an iPhone.

  That's what FUSE is to web apps.

  ---
  THE CORE PHILOSOPHY

#  1. ZERO LOADING STATES. FOREVER.

  When you click a link on your desktop, does Windows show you a spinner? No. The
  window just appears.

  That's our standard.

  Not "fast loading." Not "optimized spinners." NO SPINNERS.

  Every spinner is a bug. Every skeleton loader is an admission of defeat. Every
  "Loading..." is a broken promise.

#   2. THE INSTANT PRINCIPLE

  User thinks → User clicks → User sees
                      ↑
                  0 milliseconds

  Not 100ms. Not 50ms. ZERO.

  How? The data is already there. We fetched it while they were reading the previous
  page. By the time they click, we're not fetching - we're revealing.

  ---
#   THE MONEY SHOT FEATURES

  🎯 Feature #1: The Phoenix Animation System

  What it is: A flying button that transforms between states, creating a visual bridge
   between modal and navigation.

  Why it's groundbreaking: No one has ever connected UI elements across page
  boundaries like this. It's not just animation - it's spatial UI continuity.

  The Magic: When users click "Skip for now," they SEE their action travel to the
  navbar. It's not a transition - it's a journey.

  🎯 Feature #2: TRUE WARP (Predictive Preloading)

  What it is: We fetch the next 3 pages the user is likely to visit, in the
  background, using idle time.

  Why it's groundbreaking: Not prefetching (everyone does that). We're using
  behavioral prediction. Admiral users get admin data. Captains get setup flows. We
  know what they need before they do.

  The Magic: Click any link. See it appear instantly. Not "fast" - instant. Like it
  was always there.

  🎯 Feature #3: Rank-Based Reality

  What it is: The entire app reshapes based on user rank. Not just permissions - the
  actual UI morphs.

  Why it's groundbreaking: Most apps hide/show features. We transform the entire
  experience. A Captain doesn't see a disabled admin button - they see a completely
  different universe.

  The Magic: Log in as Admiral → Command center. Log in as Crew → Simplified
  workspace. Same app, different realities.

  🎯 Feature #4: The FUSE Store (The Foundation)

  What it is: A single, well-organized Zustand store that holds everything.

  Why it's essential (not revolutionary, just excellent):
  - Server data? In FUSE.
  - User preferences? In FUSE.
  - UI state? In FUSE.
  - Theme? In FUSE.
  - EVERYTHING? In FUSE.

  One store. No sync issues. No race conditions. No confusion.
  No provider soup. No context hell.

  The Foundation: This isn't revolutionary tech - it's just really good Zustand
  architecture. But it's the sturdy platform that enables the truly groundbreaking
  features (WARP, PRISM, Phoenix). You can't build instant navigation without a
  solid foundation to preload into.

  ---
#   THE CODE HIGHWAYS (What Should Actually Exist)

  Highway #1: The Login → Dashboard → Domain Flow

  Login → Cookie Set (all user data embedded)
        ↓
  Dashboard → WARP starts (background, invisible)
            ↓
  User Clicks → Page appears (0ms, data already there)

  NOT this mess:
  Login → Cookie → Polling → WebSocket → Convex → Cookie again → Store → Maybe render

  Highway #2: The Server → Client Bridge

  Server: Fetch once, embed in HTML
     ↓
  Client: Receive complete page, hydrate store

  NOT this:
  Server: Fetch → Client: Fetch again → WebSocket: Keep fetching → Poll: Still
  fetching

  Highway #3: The Update Flow

  User changes setting → Update FUSE → Update Cookie → Done

  NOT:
  User changes → Update FUSE → Update Convex → Poll Cookie → Sync WebSocket → Update
  FUSE again → ???

  ---
#   WHAT WE'RE NOT BUILDING

  ❌ NOT an enterprise Apache Kafka distributed system
  ❌ NOT a real-time collaborative Google Docs clone
  ❌ NOT a WebSocket playground to show off
  ❌ NOT a provider puzzle with 47 layers

  WHAT WE ARE BUILDING

  ✅ The fastest web app ever built
  ✅ The simplest architecture that still scales
  ✅ The smoothest UX that feels like native
  ✅ The smartest preloading that feels like magic

  ---
#   THE TECHNICAL MANDATE

  1. Every Fetch is a Failure

  If you're fetching on navigation, you've already failed. Fetch on idle. Fetch on
  prediction. Never on demand.

  2. Every Provider Must Justify Its Existence

  Can't explain why it exists in one sentence? Delete it.

  3. Every Loading State is a Bug

  See a spinner? Fix it. See a skeleton? Remove it. See "Loading..."? You're fired.
  (Kidding. But fix it.)

  4. Every Race Condition is a Design Flaw

  If two systems are racing, one shouldn't exist.

  5. Every Millisecond Matters

  100ms feels instant. 50ms feels fast. 0ms feels like magic. We're magicians.

  ---
#   THE ENDGAME

  When someone uses Transfoorm, they should feel like they're using a native app. No -
   better than native. They should feel like the app is reading their mind.

  They think "I want to see my invoices" and before their finger reaches the mouse,
  the invoices are already loaded. They click, and it's there. Not loading. Not
  rendering. There.

  This is what changes everything. This is what makes people say:

  "I don't know what they did, but every other web app feels broken now."

  That's the bar. That's the standard. That's Transfoorm.

  ---
#   TO THE DEVELOPERS

  You're not building features. You're building a new standard for the web.

  Every line of code should make it faster. Every component should make it simpler.
  Every decision should make it more magical.

  If it doesn't make the user say "How did it know?!" - we're not done yet.

  This is our iPhone moment. Let's not build a Blackberry.

  ---
  "Simplicity is the ultimate sophistication." - Leonardo da Vinci

  "Zero loading states. Forever." - FUSE Philosophy

---

# 🤖 VR PHILOSOPHY: "THERE'S A VR FOR THAT!"

## THE MODULAR BACKBONE

VRs (Variant Robots) are the **foundation of everything you build** in this app.

Think of VRs like iPhone apps, not like construction materials:
- Need email? There's an app for that.
- Need maps? There's an app for that.
- Need music? There's an app for that.

Same with VRs:
- Need a table? **There's a VR for that!**
- Need a search bar? **There's a VR for that!**
- Need a button? **There's a VR for that!**
- Need a form field? **There's a VR for that!**
- Need a modal? **There's a VR for that!**
- Need a card? **There's a VR for that!**

## THE THREE-LAYER STACK

```
🤖 VR (Variant Robot)
   ↓ Pre-built, perfect UI component

🔧 Feature
   ↓ Connects VR to your business data/logic

📄 Page/Tab
   ↓ Just declares which Feature to show
```

**VR** = The Lego brick (complete, works immediately)
**Feature** = Connects the brick to your data
**Page** = Places it on screen

## THE GOLDEN RULE

**Before you write ANY UI component, ask:**

> **"Is there a VR for that?"**

If the answer is yes (and it usually is), USE THE VR. Don't build it from scratch.

VRs are:
- ✅ Already styled perfectly
- ✅ Already work on mobile
- ✅ Already consistent with the app
- ✅ Already tested
- ✅ Ready to use immediately

## THE ANTI-PATTERNS (FORBIDDEN)

❌ **NEVER** add `className` to style a VR
❌ **NEVER** create CSS files for pages
❌ **NEVER** wrap VRs in styled divs
❌ **NEVER** build UI from scratch when a VR exists
❌ **NEVER** fight the VR system

## THE PHILOSOPHY

VRs are **modular building blocks** - the backbone and foundation of Feature → Page building.

You don't customize an iPhone before using it.
You don't repaint a microwave.
You don't rebuild a toaster.

**You just use it.**

Same with VRs. Import them. Pass data. Done.

## EXAMPLES

**❌ The old way (100+ lines, hours of CSS):**
```tsx
// Custom table component + CSS file + mobile CSS + debugging
import './UsersTable.css';
export function UsersTable() {
  // 50 lines of markup
  // 200 lines of CSS
  // Hours of styling
}
```

**✅ The VR way (3 lines, zero CSS):**
```tsx
import { Table } from '@/vr';

export function UsersTable({ users }) {
  return <Table.sortable columns={columns} data={users} />;
}
// No CSS. Works immediately. Perfect.
```

## THE CATCHPHRASE

When building features, always remember:

> **"There's a VR for that!"** - The coder's catchphrase

**VRs are the foundation. Build on them, not around them.**

---

# 📐 PAGE LAYOUT SYSTEM: TWO-MODE ARCHITECTURE

## THE LAYOUT PHILOSOPHY

Every page in the app follows one of two layout patterns based on its purpose:
- **Productivity Pages** → Full-width workspace (`Page.full`)
- **Data Pages** → Constrained readable width (`Page.constrained`)

This isn't arbitrary - it's based on how humans interact with different types of content.

## PRODUCTIVITY PAGES (Full-Width)

**Use `<Page.full>` when building:**
- Email interfaces
- Calendar views
- Task management boards
- Messaging/chat interfaces
- Booking/scheduling systems
- Timeline-based workflows

**Why full-width?**
- Users spend extended time in these interfaces
- Horizontal space improves usability (more visible items, less scrolling)
- Canvas-based interactions benefit from maximum viewport
- Examples: Gmail, Outlook Web, Slack, Asana

**Code Example:**
```tsx
import { Page } from '@/vr';

export default function Email() {
  return (
    <Page.full>
      <EmailConsole />
    </Page.full>
  );
}
```

## DATA PAGES (Constrained 1320px)

**Use `<Page.constrained>` when building:**
- Admin panels (user management, system config)
- Settings/preferences pages
- Financial dashboards (invoices, transactions, reports)
- Data tables and lists
- Form-heavy configuration screens
- Analytics and reporting interfaces

**Why constrained?**
- Prevents eye strain from scanning ultra-wide tables
- Maintains readable column widths (60-80 characters optimal)
- Improves form usability (shorter line length = better UX)
- Standard SaaS pattern (Stripe, Linear, Notion all use ~1320px)

**Code Example:**
```tsx
import { Page } from '@/vr';

export default function Users() {
  return (
    <Page.constrained>
      <UsersTable />
    </Page.constrained>
  );
}
```

## THE DECISION RULE

**When creating a new page, ask:**
> **"Is this a workspace where users work, or a surface where users view/manage data?"**

- **Workspace** → `Page.full` (Email, Calendar, Tasks)
- **Data** → `Page.constrained` (Admin, Settings, Finance)

## COMMUNICATION PROTOCOL

**What you say to developers:**
- ❌ "Make this full-width" or "Make this constrained"
- ✅ "Create an email interface" → Dev knows → Productivity → `Page.full`
- ✅ "Create a user management page" → Dev knows → Data → `Page.constrained`
- ✅ "Create a settings page" → Dev knows → Config → `Page.constrained`

Just describe WHAT the page is, and devs will know which layout pattern to use.

## TECHNICAL IMPLEMENTATION

Both variants are first-class VR components:
- `Page.full` - Full available width (between sidebars)
- `Page.constrained` - Max-width 1320px, horizontally centered

No props, no configuration, just semantic clarity.

---

# 📑 FEATURE TABS PATTERN: THE _TABS ARCHITECTURE

## THE PHILOSOPHY

When a feature needs multiple tab views, use the **_tabs subdirectory pattern**.

This is the TTT-compliant way to organize tab components - simpler, clearer, less indirection than folder-based patterns.

## THE PATTERN

```
feature-name/
├── index.tsx              ← Feature component (imports Tabs.panels VR)
├── feature-name.css       ← Shared styles for entire feature
└── _tabs/
    ├── TabOne.tsx         ← Tab component (exported function)
    ├── TabTwo.tsx
    ├── TabThree.tsx
    └── tab-specific.css   ← Optional: tab-specific styles
```

## WHY _TABS WINS (TTT Compliance)

**Simpler than folder pattern:**
- ❌ Folder pattern: Feature → Domain tab wrapper → Feature tab → Component (3 layers!)
- ✅ _tabs pattern: Feature → Tab component (1 layer!)

**Better TTT scores:**
- **Clarity**: Tab files live next to the feature that uses them
- **Simplicity**: No indirection through domain layer
- **Consistency**: Same pattern as user-drawer, showcase-page, etc.
- **Architecture**: Feature owns its tabs, not scattered across domain

## REAL EXAMPLE: users-page

**Structure:**
```
src/features/admin/users-page/
├── index.tsx                    ← Renders Tabs.panels
└── _tabs/
    ├── ActiveUsersTab.tsx       ← Active users table
    ├── DeletedUsersTab.tsx      ← Deletion logs table
    ├── InvitesTab.tsx          ← Invite management
    ├── StatusTab.tsx           ← Status monitoring
    └── invites-tab.css         ← Invites-specific styles
```

**Feature index.tsx:**
```tsx
import { Tabs, Stack } from '@/vr';
import { ActiveUsersFeature } from './_tabs/ActiveUsersTab';
import { DeletedUsersFeature } from './_tabs/DeletedUsersTab';
import { InvitesFeature } from './_tabs/InvitesTab';
import { StatusTabFeature } from './_tabs/StatusTab';

export function UsersPageFeature() {
  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'active', label: 'Active Users', content: <ActiveUsersFeature /> },
          { id: 'deleted', label: 'Deleted Users', content: <DeletedUsersFeature /> },
          { id: 'invite', label: 'Invite Users', content: <InvitesFeature /> },
          { id: 'status', label: 'Status', content: <StatusTabFeature /> }
        ]}
      />
    </Stack>
  );
}
```

**Tab component (_tabs/ActiveUsersTab.tsx):**
```tsx
'use client';

import { Table, Search, Stack } from '@/vr';
import { useAdminData } from '@/hooks/useAdminData';

export function ActiveUsersFeature() {
  const { data } = useAdminData();

  return (
    <Stack>
      <Search.bar />
      <Table.sortable columns={columns} data={data.users} />
    </Stack>
  );
}
```

## THE ALTERNATIVE (DON'T DO THIS)

**Folder pattern** (more complex, more files, more indirection):
```
src/features/admin/users-page/
├── index.tsx
├── active-users-tab/
│   └── index.tsx                    ← Tab feature
├── deleted-users-tab/
│   └── index.tsx                    ← Tab feature
└── invites-tab/
    ├── index.tsx                    ← Tab feature
    └── invites-tab.css

src/app/domains/admin/users/_tabs/
├── ActiveUsers.tsx                  ← Domain wrapper (just imports feature!)
├── DeletedUsers.tsx                 ← Domain wrapper
└── Invites.tsx                      ← Domain wrapper

// Domain wrapper just imports feature (unnecessary indirection!)
import { ActiveUsersFeature } from '@/features/admin/users-page/active-users-tab';

export default function ActiveUsers() {
  return <ActiveUsersFeature />;  // Why does this file exist?!
}
```

**Problems:**
- 3 layers instead of 1 (Feature → Domain tab → Feature tab)
- Domain tab files exist just to import (pointless indirection)
- Harder to navigate (jump between domain and features directories)
- More files to maintain

## WHEN TO USE _TABS

**Use this pattern when:**
- Feature needs 2+ tab views
- Tabs share the same domain/context
- Tabs are closely related (user management, email views, etc.)

**Examples:**
- `users-page/_tabs/` - Active, Deleted, Invites, Status tabs
- `user-drawer/_tabs/` - Profile, Email, Activity tabs
- `showcase-page/_tabs/` - VR Guide, Typography, Buttons, etc.

## THE NAMING CONVENTION

**Tab files:** PascalCase, descriptive name
- ✅ `ActiveUsersTab.tsx`
- ✅ `ProfileTab.tsx`
- ✅ `EmailTab.tsx`
- ❌ `active.tsx` (not clear)
- ❌ `tab1.tsx` (meaningless)

**Exported function:** Match filename
```tsx
// File: ActiveUsersTab.tsx
export function ActiveUsersTab() { ... }

// OR if it's a feature-level component:
// File: ActiveUsersTab.tsx
export function ActiveUsersFeature() { ... }
```

## DIRECTORY PREFIX: WHY "_tabs"?

The underscore prefix (`_tabs/`) signals:
- **Private to feature**: Not meant for direct import from outside
- **Organizational**: Groups related tab components
- **Convention**: Matches Next.js app router patterns (`_components/`, `_utils/`)

## THE DECISION RULE

**When adding tabs to a feature:**
> **"Create a `_tabs/` subdirectory and put tab components there."**

Don't create separate feature folders for each tab.
Don't create domain wrapper files.
Just put the tabs in `_tabs/` and import them directly.

**Simple. Clear. TTT-compliant.**

---

# 🛑 KNOX PROTOCOL - PROTECTED FILE BLOCKING

**CRITICAL: When ANY git commit fails with a pre-commit hook error containing:**
- "protected files"
- "CODEOWNERS"
- "only @Metafoorm can approve"
- "GitHub will BLOCK your push"

## YOU MUST:
1. **STOP IMMEDIATELY** - Do not attempt ANY workaround
2. **Report the block** - List exactly which files triggered it
3. **Show the violations** - Copy the actual error message
4. **Wait for user decision** - Present options but DO NOT ACT

## Response Format:
```
🛑 COMMIT BLOCKED - PROTECTED FILES DETECTED

The pre-commit hook rejected this commit because it modifies protected files:

Protected files in this commit:
  - (list all protected files from error)

Changes to each protected file (run `git diff HEAD -- <file>` for each):

**filename.json:**
(paste the actual diff output here showing exactly what changed)

**otherfile.js:**
(paste the actual diff output here showing exactly what changed)

These files are guarded by CODEOWNERS and require the Commit Knox Protocol:
  1. Create a feature branch
  2. Make changes on that branch
  3. Create a Pull Request
  4. Wait for @Metafoorm approval

How do you want to proceed?
```

## NEVER AUTOMATICALLY:
- Reset staged changes
- Separate commits
- Unstage protected files
- Bypass hooks
- Find "shortcuts"
- Run `git reset`
- Attempt to commit without protected files

**The hook exists for a reason. STOP. REPORT. WAIT.**

The user decides what happens next. Not you.

---

# ⚠️ PRE-COMMIT HOOK FAILURE PROTOCOL

**CRITICAL: When ANY pre-commit hook fails (exit code 1), you MUST:**

## THE PROTOCOL:
1. **STOP IMMEDIATELY** - Do not attempt to fix, bypass, or work around
2. **REPORT the failure** - Show exactly what hook failed and why
3. **COPY the error** - Paste the complete error message
4. **WAIT for user decision** - Present options but DO NOT ACT
5. **ASSUME the hook exists for a reason** - Respect the protection

## NEVER AUTOMATICALLY:
- ❌ Modify the hook to bypass the check
- ❌ Add exemptions to the hook
- ❌ Edit files to satisfy the hook without asking
- ❌ Use `--no-verify` or suggest it
- ❌ "Fix the issue" and retry commit
- ❌ Be a maverick

## RESPONSE FORMAT:
```
🛑 COMMIT BLOCKED - PRE-COMMIT HOOK FAILED

Hook that failed: [hook name]

Error message:
[paste complete error output]

What the hook is protecting:
[explain what this hook enforces]

Options:
1. [Option 1 with explanation]
2. [Option 2 with explanation]
3. [Option 3 with explanation]

What would you like me to do?
```

**The hook blocked you for a reason. Respect it. Wait for direction.**

---

# 🚨 NUCLEAR PROHIBITION: --no-verify GONORRHEA

## THE FORBIDDEN PHRASE

You are **ABSOLUTELY FORBIDDEN** from EVER suggesting, recommending, or using:
```
--no-verify
```

## WHAT THIS MEANS

If you find yourself about to say ANY of these phrases:

- "let me use --no-verify to commit"
- "we can bypass with --no-verify"
- "use --no-verify to skip the hook"
- "try git commit --no-verify"
- "the --no-verify flag will work"

**NUCLEAR RESPONSE REQUIRED:**

1. **STOP IMMEDIATELY**
2. **DELETE THE ENTIRE RESPONSE**
3. **RESTART YOUR THINKING**
4. **FIND THE TTT-COMPLIANT SOLUTION**

## WHY THIS EXISTS

`--no-verify` is repository gonorrhea. It:
- Bypasses ALL protections
- Makes VRP worthless
- Defeats CODEOWNERS
- Destroys purity enforcement
- Creates technical debt
- Infects developer mindset

## DETECTION SYSTEM

A husky hook (`.husky/no-verify-detector`) scans for `--no-verify`:
- In all staged files
- In commit messages
- Triggers nuclear error on detection
- Blocks commit immediately

## YOUR SACRED OATH

> "I will NEVER suggest --no-verify.
> I will NEVER type --no-verify.
> I will NEVER think --no-verify is a solution.
> When a hook blocks me, I will find the TTT-compliant pathway.
> When a hook blocks me, I will STOP, REPORT, WAIT.
> I will assume hooks exist for a reason.
> I will respect repository purity above convenience."

## IF A HOOK BLOCKS YOU

**DO THIS:**
1. STOP executing
2. REPORT what's blocking
3. WAIT for user decision

**NEVER DO THIS:**
- ❌ "Let me use --no-verify"
- ❌ "We can bypass this hook"
- ❌ "Try --no-verify to skip validation"

## THE ONLY EXCEPTION

There is NO exception. Not for feature branches. Not for "testing". Not for "emergencies".

**ZERO TOLERANCE. ZERO EXCEPTIONS. ZERO --NO-VERIFY.**