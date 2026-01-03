# PAGE & TAB SETUP GUIDE

> The definitive guide to building pages with tabs in the FUSE architecture.
> Read this. Follow the pattern. Ship features in minutes, not hours.

---

## 📚 REQUIRED READING FIRST

Before you start, read these in order:

1. **VR-DOCTRINE.md** - Understand the VR → Feature → Tab stack
2. **TYPOGRAPHY-AND-SPACING.md** - Master Typography VR usage (`T.body`, `T.h3`, etc.)
3. **DOMAIN-AND-FEATURES-SETUP.md** - Understand domain/feature architecture

If you haven't read those, **stop now and read them**. This guide builds on those foundations.

---

## 🎯 THE PATTERNS (REVERSE-ENGINEERED)

We have **TWO patterns** based on your use case:

### Pattern 1: Feature-Based Tabs (Functional Pages)
**Use when:** Tabs have state, FUSE wiring, or business logic
**Examples:** `/admin/users`, `/settings/account`

### Pattern 2: Direct Composition (Documentation/Static)
**Use when:** Tabs are pure content with zero state/logic
**Example:** `/admin/showcase`

---

## 📂 PATTERN 1: FEATURE-BASED TABS (FUNCTIONAL)

**Use this 95% of the time.** This is the standard.

### File Structure

```
src/
├── app/
│   └── domains/
│       └── admin/
│           └── users/
│               ├── Users.tsx              ← Page (Domain Layer)
│               └── _tabs/
│                   ├── ActiveUsers.tsx    ← Tab (imports Feature)
│                   ├── DeletedUsers.tsx   ← Tab (imports Feature)
│                   └── Invites.tsx        ← Tab (imports Feature)
└── features/
    └── admin/
        ├── users-page-tabs/
        │   └── index.tsx                  ← Page Feature (wires tabs)
        └── users-tabs/
            ├── active-users-tab/
            │   ├── index.tsx              ← Tab Feature (logic + VRs)
            │   └── active-users-tab.css   ← Feature CSS (layout only)
            ├── deleted-users-tab/
            │   └── index.tsx
            └── invites-tab/
                └── index.tsx
```

### Layer 1: The Page (Domain)

**File:** `src/app/domains/admin/users/Users.tsx`

```tsx
/**──────────────────────────────────────────────────────────────────────┐
│  🔱 USERS - Sovereign Domain                                           │
│  /src/app/domains/admin/users/Users.tsx                                │
│                                                                        │
│  VR Doctrine: Domain Layer (Clean)                                     │
│  - Page route and structure only                                       │
│  - Imports Feature (UsersPageTabsFeature)                              │
│  - No FUSE wiring, no business logic                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { UsersPageTabsFeature } from '@/features/admin/users-page-tabs';

export default function Users() {
  useSetPageHeader("User Management", 'Invite, view, amend and delete active platform users');
  usePageTiming('/admin/users');

  return <UsersPageTabsFeature />;
}
```

**CRITICAL RULES:**
- ✅ ONE Feature import only
- ✅ Page header setup (`useSetPageHeader`, `usePageTiming`)
- ❌ NO useState
- ❌ NO useFuse
- ❌ NO business logic
- ❌ NO VR composition (that's in the Feature)

### Layer 2: The Page Feature (Wires Tabs)

**File:** `src/features/admin/users-page-tabs/index.tsx`

```tsx
/**──────────────────────────────────────────────────────────────────────┐
│  🔱 USERS PAGE TABS FEATURE                                          │
│  /src/features/admin/users-page-tabs/index.tsx                       │
│                                                                       │
│  VR Doctrine: Feature Layer                                          │
│  - Wires FUSE (useAdminData for tab counts, useAdminSync for live)   │
│  - Imports VRs (Stack, Tabs.panels)                                  │
│  - Wraps tab content (ActiveUsers, DeletedUsers, Invites Features)   │
│  - The sponge that absorbs FUSE wiring from Domain                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useAdminData } from '@/hooks/useAdminData';
import { useAdminSync } from '@/hooks/useAdminSync';
import { Tabs, Stack } from '@/vr';
import ActiveUsers from '@/app/domains/admin/users/_tabs/ActiveUsers';
import DeletedUsers from '@/app/domains/admin/users/_tabs/DeletedUsers';
import Invites from '@/app/domains/admin/users/_tabs/Invites';
import Status from '@/app/domains/admin/users/_tabs/Status';

export function UsersPageTabsFeature() {
  // 🔄 Real-time sync: Convex → FUSE (live subscription)
  useAdminSync();

  // 🚀 WARP: Get counts from FUSE store (server-preloaded)
  const { computed } = useAdminData();

  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'active', label: 'Active Users', count: computed.usersCount, content: <ActiveUsers /> },
          { id: 'deleted', label: 'Deleted Users', count: computed.deletionLogsCount, content: <DeletedUsers /> },
          { id: 'invite', label: 'Invite Users', content: <Invites /> },
          { id: 'status', label: 'Status', content: <Status /> }
        ]}
      />
    </Stack>
  );
}
```

**FEATURE RESPONSIBILITIES:**
- ✅ Wire FUSE (get data from store)
- ✅ Real-time subscriptions (`useAdminSync`)
- ✅ Tab counts from computed data
- ✅ Import VRs (`Stack`, `Tabs.panels`)
- ✅ Pass data to tabs via FUSE (tabs read from store)
- ❌ NO direct data transforms (that's in Tab Features)

### Layer 3: The Tab (Imports Tab Feature)

**File:** `src/app/domains/admin/users/_tabs/ActiveUsers.tsx`

```tsx
/**──────────────────────────────────────────────────────────────────────┐
│  👥 ACTIVE USERS TAB - Pure Declaration                               │
│  /src/app/domains/admin/users/_tabs/ActiveUsers.tsx                   │
│                                                                       │
│  VR Doctrine: Tab Layer                                               │
│  - Feature imports only                                               │
│  - ZERO FUSE                                                          │
│  - ZERO callbacks                                                     │
│  - ZERO state                                                         │
│  - Pure declaration                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

import { ActiveUsersFeature } from '@/features/admin/users-tabs/active-users-tab';

export default function ActiveUsers() {
  return <ActiveUsersFeature />;
}
```

**THE PERFECT TAB:**
- 3 lines total
- ONE Feature import
- ZERO state
- ZERO logic
- ZERO FUSE

### Layer 4: The Tab Feature (Logic + VRs)

**File:** `src/features/admin/users-tabs/active-users-tab/index.tsx`

```tsx
/**──────────────────────────────────────────────────────────────────────┐
│  👥 ACTIVE USERS FEATURE                                              │
│  /src/features/admin/users-tabs/active-users-tab/index.tsx            │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Wires FUSE (user state, admin data)                                │
│  - Handles all callbacks and transforms                               │
│  - The sponge that absorbs all dirt                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useMemo } from 'react';
import { Search, Table, Badge, Modal, Stack } from '@/vr';
import { useSideDrawer } from '@/vr/modal';
import { useTableSearch } from '@/vr/table';
import { useVanish } from '@/features/vanish/VanishContext';
import { useAdminData } from '@/hooks/useAdminData';
import { useFuse } from '@/store/fuse';
import { UserDetailsFeature } from '@/features/admin/user-drawer';

export function ActiveUsersFeature() {
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set());

  // 🚀 WARP: Instant data access from FUSE store (server-preloaded)
  const { data } = useAdminData();
  const users = data.users;
  const { openDrawer: openVanishDrawer } = useVanish();
  const { openDrawer } = useSideDrawer();

  // Get current user for self-deletion protection
  const fuseUser = useFuse((state) => state.user);

  const handleViewUser = (row) => {
    openDrawer({
      content: <UserDetailsFeature userId={row.id} />,
      title: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      subtitle: row.email
    });
  };

  const handleDeleteUser = (row) => {
    openVanishDrawer({ target: row.id }, (result) => {
      // Handle result...
    });
  };

  // Column definitions
  const columns = [
    { key: 'select', variant: 'checkbox', checked: checkedRows, onCheck: handleRowCheckbox },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'firstName', header: 'First', sortable: true },
    { key: 'rank', header: 'Rank', sortable: true, render: (v, row) => <Badge.rank rank={row.rank} /> },
    { key: 'actions', variant: 'view', onView: handleViewUser, onDelete: handleDeleteUser },
  ];

  // Transform data
  const tableData = useMemo(() => users?.map(user => ({
    id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    rank: user.rank
  })) || [], [users]);

  // Auto-search
  const { searchTerm, setSearchTerm, filteredData, resultsCount, totalCount } = useTableSearch({
    data: tableData,
    columns,
  });

  return (
    <Stack>
      <Table.toolbar
        search={
          <Search.bar
            value={searchTerm}
            onChange={setSearchTerm}
            resultsCount={resultsCount}
            totalCount={totalCount}
          />
        }
      />

      <Table.sortable
        columns={columns}
        data={filteredData}
        striped
        bordered
      />
    </Stack>
  );
}
```

**TAB FEATURE RESPONSIBILITIES:**
- ✅ All state management (`useState`)
- ✅ All FUSE wiring (`useFuse`, `useAdminData`)
- ✅ All callbacks (`handleViewUser`, `handleDeleteUser`)
- ✅ All data transforms (`useMemo`)
- ✅ All VR composition (`Stack`, `Table`, `Search`)
- ✅ Optional CSS file for layout (`.ft-*` prefix)

**FEATURE CSS (if needed):**
**File:** `src/features/admin/users-tabs/active-users-tab/active-users-tab.css`

```css
/* Feature CSS controls LAYOUT only - never typography */

.ft-activeuserstab-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.ft-activeuserstab-header {
  padding: var(--space-lg);
  background: var(--bg-secondary);
}

/* NO font-size, NO color, NO typography overrides */
```

---

## 📂 PATTERN 2: DIRECT COMPOSITION (STATIC/DOCS)

**Use this rarely.** Only for pure documentation/showcase tabs with **ZERO state/logic**.

### File Structure

```
src/
└── app/
    └── domains/
        └── admin/
            └── showcase/
                ├── Showcase.tsx           ← Page (composes tabs directly)
                └── _tabs/
                    ├── Guide.tsx          ← Tab (VR composition)
                    ├── Buttons.tsx        ← Tab (VR composition)
                    └── Typography.tsx     ← Tab (VR composition)
```

### The Page (Direct Composition)

**File:** `src/app/domains/admin/showcase/Showcase.tsx`

```tsx
'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Tabs } from '@/vr/tabs';
import Buttons from './_tabs/Buttons';
import Cards from './_tabs/Cards';
import Guide from './_tabs/Guide';
import Typography from './_tabs/Typography';

export default function Showcase() {
  useSetPageHeader('Showcase', 'Variant Robots (VR) - Discover the sites VRs component registry');

  return (
    <Tabs.panels
      tabs={[
        { id: 'guide', label: 'VR Guide', content: <Guide /> },
        { id: 'buttons', label: 'Buttons', content: <Buttons /> },
        { id: 'cards', label: 'Cards', content: <Cards /> },
        { id: 'typography', label: 'Typography', content: <Typography /> },
      ]}
    />
  );
}
```

**WHEN TO USE DIRECT COMPOSITION:**
- ✅ Zero state
- ✅ Zero FUSE wiring
- ✅ Pure content/documentation
- ✅ No reusability needed
- ✅ Showcase/demo pages

**WHEN NOT TO USE:**
- ❌ Any useState
- ❌ Any useFuse
- ❌ Any data fetching
- ❌ Any business logic
- ❌ Functional pages (Users, Invoices, etc.)

### Static Tab Example

**File:** `src/app/domains/admin/showcase/_tabs/Guide.tsx`

```tsx
'use client';

import { Card, Divider, T } from '@/vr';

export default function Guide() {
  return (
    <Card.standard
      title="The VR Doctrine"
      subtitle="Everything you need to know about Variant Robots"
    >
      <div className="ft-showcasetabs-guide">
        <T.body size="sm">
          <strong>Variant Robots (VRs)</strong> are the DNA of this application.
        </T.body>

        <Divider.line />

        <T.h3 weight="bold">The Stack</T.h3>
        <T.title size="sm">VR → Feature → Tab</T.title>

        <ul>
          <li>
            <T.body size="sm"><strong>VR</strong> — Pure UI. No FUSE. No logic.</T.body>
          </li>
          <li>
            <T.body size="sm"><strong>Feature</strong> — Wires VRs to FUSE.</T.body>
          </li>
        </ul>
      </div>
    </Card.standard>
  );
}
```

**STATIC TAB RULES:**
- ✅ Use Typography VRs (`T.body`, `T.h3`, `T.title`)
- ✅ Use Layout VRs (`Card`, `Divider`, `Stack`)
- ✅ Domain CSS for layout (`.ft-showcasetabs-*`)
- ❌ NO state
- ❌ NO FUSE
- ❌ NO callbacks

---

## 🎨 TYPOGRAPHY VR MASTERY

**REQUIRED:** Every text node must use Typography VR.

### The Typography VR Palette

```tsx
// Headings (Pure Level System - shortcuts)
<T.h2>Main Section</T.h2>           // 2xl, bold
<T.h3>Subsection</T.h3>              // xl, semibold
<T.h4>Smaller Section</T.h4>         // lg, medium
<T.h5>Minor Heading</T.h5>           // md, normal
<T.h6>Inline Label</T.h6>            // md, normal

// Body Text
<T.body size="lg">Large body</T.body>
<T.body size="md">Standard body</T.body>
<T.body size="sm">Small body</T.body>

// Title (special emphasis)
<T.title size="xl">Page Title</T.title>
<T.title size="lg">Section Title</T.title>
<T.title size="sm">Flow Diagram</T.title>

// Caption (muted text)
<T.caption size="sm">Supporting text</T.caption>
<T.caption>Metadata</T.caption>
```

### Typography Examples

```tsx
// ✅ CORRECT - Typography VR usage
<Card.standard title="User Profile" subtitle="Edit your details">
  <Stack>
    <T.h3 weight="bold">Personal Information</T.h3>
    <T.body size="sm">Update your name and contact details below.</T.body>

    <Field.live
      label="First Name"
      value={user.firstName}
      onSave={handleSave}
    />

    <T.caption color="secondary">
      Changes are saved automatically
    </T.caption>
  </Stack>
</Card.standard>

// ❌ WRONG - Native HTML tags
<div>
  <h3>Personal Information</h3>  {/* NO! Use T.h3 */}
  <p>Update your name...</p>      {/* NO! Use T.body */}
  <span>Changes saved...</span>   {/* NO! Use T.caption */}
</div>
```

### Typography Props Reference

```tsx
// Size (variant-dependent)
<T.body size="xs" | "sm" | "md" | "lg" | "xl" />
<T.title size="sm" | "md" | "lg" | "xl" | "2xl" | "3xl" />
<T.caption size="xs" | "sm" />

// Level (Heading only - Pure Level System)
<T.heading level={2} />  // OR use shortcut: <T.h2>
<T.heading level={3} />  // OR use shortcut: <T.h3>

// Weight (all variants)
<T.body weight="normal" | "medium" | "semibold" | "bold" />

// Color (all variants)
<T.body color="primary" | "secondary" | "tertiary" | "quaternary" />
<T.body color="error" | "success" | "warning" />

// Alignment (Title only)
<T.title align="left" | "center" | "right" />
```

---

## 🚀 STEP-BY-STEP: CREATE A NEW PAGE WITH TABS

### Scenario: Create `/admin/invoices` with 3 tabs

**Step 1: Create Domain Page**

```bash
# Create page file
touch src/app/domains/admin/invoices/Invoices.tsx
```

**File:** `src/app/domains/admin/invoices/Invoices.tsx`

```tsx
'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { InvoicesPageTabsFeature } from '@/features/admin/invoices-page-tabs';

export default function Invoices() {
  useSetPageHeader("Invoices", 'Manage and track all platform invoices');
  usePageTiming('/admin/invoices');

  return <InvoicesPageTabsFeature />;
}
```

**Step 2: Create Page Feature (wires tabs)**

```bash
mkdir -p src/features/admin/invoices-page-tabs
touch src/features/admin/invoices-page-tabs/index.tsx
```

**File:** `src/features/admin/invoices-page-tabs/index.tsx`

```tsx
'use client';

import { Tabs, Stack } from '@/vr';
import PendingInvoices from '@/app/domains/admin/invoices/_tabs/PendingInvoices';
import PaidInvoices from '@/app/domains/admin/invoices/_tabs/PaidInvoices';
import Overdue from '@/app/domains/admin/invoices/_tabs/Overdue';

export function InvoicesPageTabsFeature() {
  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'pending', label: 'Pending', content: <PendingInvoices /> },
          { id: 'paid', label: 'Paid', content: <PaidInvoices /> },
          { id: 'overdue', label: 'Overdue', content: <Overdue /> },
        ]}
      />
    </Stack>
  );
}
```

**Step 3: Create Tab Files**

```bash
mkdir -p src/app/domains/admin/invoices/_tabs
touch src/app/domains/admin/invoices/_tabs/PendingInvoices.tsx
touch src/app/domains/admin/invoices/_tabs/PaidInvoices.tsx
touch src/app/domains/admin/invoices/_tabs/Overdue.tsx
```

**File:** `src/app/domains/admin/invoices/_tabs/PendingInvoices.tsx`

```tsx
import { PendingInvoicesFeature } from '@/features/admin/invoices-tabs/pending-invoices-tab';

export default function PendingInvoices() {
  return <PendingInvoicesFeature />;
}
```

Repeat for `PaidInvoices.tsx` and `Overdue.tsx`.

**Step 4: Create Tab Features**

```bash
mkdir -p src/features/admin/invoices-tabs/pending-invoices-tab
touch src/features/admin/invoices-tabs/pending-invoices-tab/index.tsx
```

**File:** `src/features/admin/invoices-tabs/pending-invoices-tab/index.tsx`

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Search, Table, Badge, Stack, T } from '@/vr';
import { useTableSearch } from '@/vr/table';
import { useFuse } from '@/store/fuse';

export function PendingInvoicesFeature() {
  // Get data from FUSE
  const invoices = useFuse((s) => s.admin.invoices.pending);

  // Define columns
  const columns = [
    { key: 'id', header: 'Invoice #', sortable: true },
    { key: 'client', header: 'Client', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true },
    { key: 'dueDate', header: 'Due Date', sortable: true },
    { key: 'status', header: 'Status', render: (v) => <Badge.status status={v} /> },
  ];

  // Transform data
  const tableData = useMemo(() => invoices?.map(inv => ({
    id: inv.invoiceNumber,
    client: inv.clientName,
    amount: `$${inv.amount}`,
    dueDate: new Date(inv.dueDate).toLocaleDateString(),
    status: inv.status
  })) || [], [invoices]);

  // Search
  const { searchTerm, setSearchTerm, filteredData, resultsCount, totalCount } = useTableSearch({
    data: tableData,
    columns,
  });

  return (
    <Stack>
      <T.body size="sm" color="secondary">
        Invoices awaiting payment
      </T.body>

      <Table.toolbar
        search={
          <Search.bar
            value={searchTerm}
            onChange={setSearchTerm}
            resultsCount={resultsCount}
            totalCount={totalCount}
          />
        }
      />

      <Table.sortable
        columns={columns}
        data={filteredData}
        striped
      />
    </Stack>
  );
}
```

Repeat for other tab features.

**Step 5: Add Route to SRS Manifest**

```ts
// Add to appropriate rank manifest
{
  path: '/admin/invoices',
  label: 'Invoices',
  icon: 'receipt',
  badge: computed.pendingInvoicesCount
}
```

**Done!** You now have a functional page with 3 tabs, following VR Doctrine.

---

## 🎯 WHEN TO USE A FEATURE

### ✅ ALWAYS Use a Feature When:

1. **Tab has ANY state**
   ```tsx
   const [search, setSearch] = useState('');  // → Feature needed
   ```

2. **Tab wires FUSE**
   ```tsx
   const users = useFuse(s => s.users);  // → Feature needed
   ```

3. **Tab has callbacks**
   ```tsx
   const handleDelete = (id) => {...};  // → Feature needed
   ```

4. **Tab has data transforms**
   ```tsx
   const tableData = useMemo(() => users.map(...), [users]);  // → Feature needed
   ```

5. **Tab uses hooks**
   ```tsx
   useAdminSync();  // → Feature needed
   ```

6. **Tab component is reused**
   - If the same tab appears in multiple pages → Feature needed

### ❌ ONLY Skip Feature When:

1. **Pure static content** (documentation, showcase)
2. **ZERO state**
3. **ZERO FUSE wiring**
4. **ZERO callbacks**
5. **ZERO hooks** (except `useSetPageHeader` in page)

**Rule of thumb:** If you're asking "Do I need a Feature?", the answer is **YES**.

---

## 🧠 THE DECISION TREE

```
Need to build a page with tabs?
│
├─ Does ANY tab have state/logic/FUSE?
│  ├─ YES → Use Pattern 1 (Feature-Based Tabs)
│  │        ✅ Page → Page Feature → Tab → Tab Feature
│  │
│  └─ NO → Are all tabs pure static content?
│           ├─ YES → Use Pattern 2 (Direct Composition)
│           │        ✅ Page → Tabs.panels → Tab (VR composition)
│           │
│           └─ UNSURE → Use Pattern 1 (safer default)
```

---

## 📋 CHECKLIST: BEFORE YOU COMMIT

### Page Checklist
- [ ] Page imports ONLY Feature (no direct VR composition)
- [ ] `useSetPageHeader` called
- [ ] `usePageTiming` called
- [ ] NO useState
- [ ] NO useFuse
- [ ] NO business logic
- [ ] File header comment present

### Page Feature Checklist
- [ ] Wires FUSE (if needed)
- [ ] Imports VRs (`Stack`, `Tabs.panels`)
- [ ] Imports tab components
- [ ] NO data transforms (that's in Tab Features)
- [ ] File header comment present

### Tab Checklist (Feature-Based)
- [ ] 3 lines maximum
- [ ] ONE Feature import
- [ ] NO state
- [ ] NO logic
- [ ] NO FUSE
- [ ] File header comment present

### Tab Feature Checklist
- [ ] All state management here
- [ ] All FUSE wiring here
- [ ] All callbacks here
- [ ] All data transforms here
- [ ] VR composition (not native HTML)
- [ ] Typography VRs (`T.body`, `T.h3`, etc.)
- [ ] Optional `.css` file (layout only, `.ft-*` prefix)
- [ ] File header comment present

### Typography Checklist
- [ ] Every text node uses Typography VR
- [ ] NO native HTML tags (`<h1>`, `<p>`, `<span>`)
- [ ] Correct VR for context (`T.body` for text, `T.h3` for headings)
- [ ] Size prop specified (`size="sm"`, `size="md"`, etc.)
- [ ] NO font-size in CSS
- [ ] NO Typography overrides in CSS

---

## 🚨 COMMON MISTAKES

### ❌ WRONG: State in Tab

```tsx
// ❌ Tab has state - violates doctrine
export default function ActiveUsers() {
  const [search, setSearch] = useState('');  // NO!
  return <ActiveUsersFeature search={search} />;
}
```

**✅ CORRECT:** State in Tab Feature

```tsx
// ✅ Tab is pure declaration
export default function ActiveUsers() {
  return <ActiveUsersFeature />;
}

// ✅ State in Feature
export function ActiveUsersFeature() {
  const [search, setSearch] = useState('');
  // ...
}
```

### ❌ WRONG: FUSE in Page

```tsx
// ❌ Page wires FUSE - violates doctrine
export default function Users() {
  const users = useFuse(s => s.admin.users);  // NO!
  return <UsersPageTabsFeature users={users} />;
}
```

**✅ CORRECT:** FUSE in Feature

```tsx
// ✅ Page imports Feature only
export default function Users() {
  return <UsersPageTabsFeature />;
}

// ✅ Feature wires FUSE
export function UsersPageTabsFeature() {
  const users = useFuse(s => s.admin.users);
  // ...
}
```

### ❌ WRONG: VR Composition in Page

```tsx
// ❌ Page composes VRs with state - violates doctrine
export default function Users() {
  const [activeTab, setActiveTab] = useState('active');  // NO!
  return (
    <Stack>
      <Tabs.panels tabs={...} />
    </Stack>
  );
}
```

**✅ CORRECT:** VR Composition in Feature

```tsx
// ✅ Page imports Feature only
export default function Users() {
  return <UsersPageTabsFeature />;
}

// ✅ Feature composes VRs
export function UsersPageTabsFeature() {
  return (
    <Stack>
      <Tabs.panels tabs={...} />
    </Stack>
  );
}
```

### ❌ WRONG: Native HTML Typography

```tsx
// ❌ Native HTML tags
<div>
  <h3>User Profile</h3>
  <p>Edit your details</p>
</div>
```

**✅ CORRECT:** Typography VRs

```tsx
// ✅ Typography VRs
<Stack>
  <T.h3 weight="bold">User Profile</T.h3>
  <T.body size="sm">Edit your details</T.body>
</Stack>
```

### ❌ WRONG: Feature-Based Tab for Static Content

```tsx
// ❌ Unnecessary Feature for static showcase
export default function Guide() {
  return <GuideFeature />;  // Overkill for static content
}
```

**✅ CORRECT:** Direct VR Composition

```tsx
// ✅ Static content uses direct composition
export default function Guide() {
  return (
    <Card.standard title="VR Guide">
      <T.body>Content here...</T.body>
    </Card.standard>
  );
}
```

---

## 📚 REFERENCE EXAMPLES

### Full Examples in Codebase

**Pattern 1 Examples:**
- `/admin/users` - Complex functional page with data tables
- `/settings/account` - User profile with form fields

**Pattern 2 Examples:**
- `/admin/showcase` - Documentation/demo page

**Study these files:**
1. `src/app/domains/admin/users/Users.tsx`
2. `src/features/admin/users-page-tabs/index.tsx`
3. `src/app/domains/admin/users/_tabs/ActiveUsers.tsx`
4. `src/features/admin/users-tabs/active-users-tab/index.tsx`
5. `src/app/domains/admin/showcase/Showcase.tsx`
6. `src/app/domains/admin/showcase/_tabs/Guide.tsx`

---

## 🎓 SUMMARY

### The Golden Rules

1. **Pages import Features** (never compose VRs directly unless static)
2. **Tabs import Tab Features** (3 lines max)
3. **Features absorb ALL dirt** (state, FUSE, callbacks, transforms)
4. **Every text uses Typography VR** (`T.body`, `T.h3`, `T.title`)
5. **Features use VRs, not HTML** (`<Stack>` not `<div>`, `<T.body>` not `<p>`)

### The Perfect Flow

```
Page → imports Feature
  ↓
Page Feature → wires FUSE, imports VRs, imports Tabs
  ↓
Tab → imports Tab Feature
  ↓
Tab Feature → state + FUSE + callbacks + VRs + Typography
```

### The Command

> "Claude, set up a page at `/admin/invoices` with 3 tabs: Pending, Paid, Overdue. Follow the VR Doctrine pattern from `PAGE-AND-TAB-SETUP-GUIDE.md`."

Now you know exactly what to do. Read the guide, follow the pattern, ship features.

---

**End Guide.**
