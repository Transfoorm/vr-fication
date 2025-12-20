# DOMAIN AND FEATURES SETUP

## The Definitive Architecture Specification

This document defines how to structure **Domains** (pages) and **Features** (logic layers) in the FUSE stack. Follow this exactly. No exceptions. This is the blueprint for the next decade.

---

## THE GOLDEN RULE

```
DOMAIN = Clean (Page routes, structure, VR imports)
FEATURE = Dirty (Business logic, FUSE wiring, mutations, callbacks)
```

**If a VR needs logic → wrap it in a Feature.**
**If a VR is pure display → use it directly in Domain.**

---

## THE DECISION TREE

```
Building a new page?
│
├─ Does it need business logic (FUSE, mutations, callbacks)?
│   │
│   ├─ YES → Create a FEATURE, import it into DOMAIN
│   │
│   └─ NO → Use VRs directly in DOMAIN
│
└─ Does it have tabs?
    │
    ├─ YES → Create _tabs/ folder
    │
    └─ NO → Single page.tsx
```

---

## FOLDER STRUCTURE

### Domains (Clean - Page Layer)

```
src/app/domains/
└── {domain-name}/
    └── {section}/
        ├── page.tsx          ← Page component (clean)
        ├── layout.tsx        ← Optional layout
        └── _tabs/            ← Tab components (if tabbed)
            ├── TabOne.tsx
            ├── TabTwo.tsx
            └── TabThree.tsx
```

### Features (Dirty - Logic Layer)

```
src/features/
└── {domain-name}/
    └── {feature-name}/
        ├── index.tsx         ← Feature component (dirty)
        ├── {feature-name}.css
        └── _tabs/            ← Tab components (if tabbed)
            ├── TabOne.tsx
            ├── TabTwo.tsx
            └── TabThree.tsx
```

### Drawer Pattern (Feature with Tabs)

```
src/features/
└── {domain-name}/
    └── {thing}-drawer/       ← Drawer feature
        ├── index.tsx         ← Drawer content (dirty)
        ├── {thing}-drawer.css
        └── _tabs/
            ├── ProfileTab.tsx
            ├── SettingsTab.tsx
            └── ActivityTab.tsx
```

---

## CLEAN VS DIRTY: THE EXAMPLES

### CLEAN DOMAIN (No Logic Required)

When a page just displays VRs with no business logic:

```
src/app/domains/marketing/pricing/
├── page.tsx
└── _tabs/
    ├── Monthly.tsx
    └── Annual.tsx
```

**page.tsx** (Clean - just imports VRs):
```tsx
'use client';

import { Tabs } from '@/prebuilts';
import Monthly from './_tabs/Monthly';
import Annual from './_tabs/Annual';

export default function PricingPage() {
  return (
    <Tabs.panels
      tabs={[
        { id: 'monthly', label: 'Monthly', content: <Monthly /> },
        { id: 'annual', label: 'Annual', content: <Annual /> },
      ]}
    />
  );
}
```

**_tabs/Monthly.tsx** (Clean - just VRs):
```tsx
import { Card, Stack, Button } from '@/prebuilts';

export default function Monthly() {
  return (
    <Stack>
      <Card.pricing title="Basic" price="$9/mo" />
      <Card.pricing title="Pro" price="$29/mo" />
      <Button.fire href="/signup">Get Started</Button.fire>
    </Stack>
  );
}
```

**Why clean?** No FUSE. No mutations. No callbacks. Pure VR composition.

---

### DIRTY DOMAIN (Logic Required → Feature)

When a page needs business logic, FUSE wiring, or mutations:

```
src/app/domains/admin/users/
├── page.tsx                  ← Clean (imports Feature)
└── _tabs/
    ├── ActiveUsers.tsx       ← Clean (imports Feature)
    └── DeletedUsers.tsx      ← Clean (imports Feature)

src/features/admin/
├── users-tabs/
│   ├── active-users-tab/
│   │   └── index.tsx         ← DIRTY (FUSE, mutations, callbacks)
│   └── deleted-users-tab/
│       └── index.tsx         ← DIRTY (FUSE, mutations, callbacks)
└── user-drawer/
    ├── index.tsx             ← DIRTY (drawer content)
    ├── user-drawer.css
    └── _tabs/
        ├── ProfileTab.tsx    ← DIRTY (FUSE, mutations)
        ├── EmailTab.tsx      ← DIRTY (server actions)
        └── InvitesTab.tsx    ← DIRTY (FUSE)
```

**Domain page.tsx** (Clean - imports Features):
```tsx
'use client';

import { Tabs } from '@/prebuilts';
import ActiveUsers from './_tabs/ActiveUsers';
import DeletedUsers from './_tabs/DeletedUsers';

export default function UsersPage() {
  return (
    <Tabs.panels
      tabs={[
        { id: 'active', label: 'Active Users', content: <ActiveUsers /> },
        { id: 'deleted', label: 'Deleted Users', content: <DeletedUsers /> },
      ]}
    />
  );
}
```

**Domain _tabs/ActiveUsers.tsx** (Clean - one-line import):
```tsx
import { ActiveUsersFeature } from '@/features/admin/users-tabs/active-users-tab';

export default function ActiveUsers() {
  return <ActiveUsersFeature />;
}
```

**Feature index.tsx** (DIRTY - all the logic):
```tsx
'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Table, Search, Modal } from '@/prebuilts';
import { useSideDrawer } from '@/prebuilts/modal';
import { useAdminData } from '@/hooks/useAdminData';
import { useFuse } from '@/store/fuse';
import { UserDetailsFeature } from '@/features/admin/user-drawer';

export function ActiveUsersFeature() {
  const { data } = useAdminData();           // FUSE wiring
  const updateUser = useMutation(api...);    // Mutation
  const { openDrawer } = useSideDrawer();    // Drawer control

  const handleView = (row) => {              // Callback
    openDrawer({
      content: <UserDetailsFeature userId={row.id} />,
      title: row.name,
    });
  };

  const handleDelete = async (id) => {       // Callback
    await updateUser({ id, deleted: true });
  };

  return (
    <Table.sortable
      data={data.users}
      onView={handleView}
      onDelete={handleDelete}
    />
  );
}
```

**Why dirty?** FUSE hooks. Mutations. Callbacks. State management. The Feature absorbs ALL the dirt so the VRs stay clean.

---

## THE DRAWER PATTERN

Drawers are Features with their own tab structure:

```
src/features/admin/user-drawer/
├── index.tsx              ← UserDetailsFeature (wires FUSE, renders Tabs)
├── user-drawer.css        ← Feature CSS (ft-* prefix)
└── _tabs/
    ├── ProfileTab.tsx     ← FUSE + mutations for profile fields
    ├── EmailTab.tsx       ← Server actions for recovery links
    └── InvitesTab.tsx     ← FUSE for invite links
```

**Drawer index.tsx:**
```tsx
'use client';

import { useState } from 'react';
import { Tabs } from '@/prebuilts';
import { useAdminData } from '@/hooks/useAdminData';
import { ProfileTab } from './_tabs/ProfileTab';
import { EmailTab } from './_tabs/EmailTab';
import { InvitesTab } from './_tabs/InvitesTab';
import './user-drawer.css';

interface UserDetailsFeatureProps {
  userId: string;
}

export function UserDetailsFeature({ userId }: UserDetailsFeatureProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const { data } = useAdminData();
  const user = data.users?.find(u => String(u._id) === userId);

  if (!user) return <div>User not found</div>;

  return (
    <Tabs.panels
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: 'profile', label: 'Profile', content: <ProfileTab userId={userId} /> },
        { id: 'email', label: 'Email', content: <EmailTab userId={userId} /> },
        { id: 'invites', label: 'Invites', content: <InvitesTab /> },
      ]}
    />
  );
}
```

---

## NAMING CONVENTIONS

### Folders
- **kebab-case** for all folders: `user-drawer`, `active-users-tab`
- **_tabs** for tab subfolders (underscore prefix)

### Files
- **PascalCase** for components: `ProfileTab.tsx`, `EmailTab.tsx`
- **kebab-case** for CSS: `user-drawer.css`
- **index.tsx** for main exports

### CSS Classes
- **ft-** prefix for Feature CSS: `ft-profiletab`, `ft-emailtab__header`
- **vr-** prefix for VR CSS: `vr-field-live`, `vr-button-fire`

### Exports
- **Named exports** for Features: `export function ActiveUsersFeature()`
- **Default exports** for Domain tabs: `export default function ActiveUsers()`

---

## IMPORT RULES

### Domain → Feature (One-line import)
```tsx
// Domain tab file
import { SomeFeature } from '@/features/domain/some-feature';

export default function SomeTab() {
  return <SomeFeature />;
}
```

### Feature → VR (Direct import)
```tsx
// Feature file
import { Table, Modal, Field, Button } from '@/prebuilts';
```

### Feature → Feature (Allowed for composition)
```tsx
// Feature file
import { UserDetailsFeature } from '@/features/admin/user-drawer';
```

### VR → Feature (NEVER)
```
VRs NEVER import Features. Ever. This breaks the entire architecture.
```

---

## THE HIERARCHY

```
┌─────────────────────────────────────────────────────────┐
│  DOMAIN (Clean)                                         │
│  - Page routes and structure                            │
│  - Imports Features or VRs directly                     │
│  - No business logic                                    │
│  - _tabs/ for tabbed pages                              │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│  FEATURE (Dirty)                                        │
│  - Business logic layer                                 │
│  - FUSE wiring, mutations, callbacks                    │
│  - Transforms and state management                      │
│  - _tabs/ for tabbed features                           │
│  - The sponge that absorbs all dirt                     │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│  VR (Variant Robot - Pure)                              │
│  - Dumb visual components                               │
│  - Props in, render out                                 │
│  - Zero business logic                                  │
│  - Reusable across entire app                           │
└─────────────────────────────────────────────────────────┘
```

---

## QUICK REFERENCE

| Scenario | Location | Structure |
|----------|----------|-----------|
| Simple page, no logic | `domains/{area}/page.tsx` | Direct VR imports |
| Simple page with tabs | `domains/{area}/_tabs/*.tsx` | Direct VR imports |
| Page needs FUSE/mutations | `features/{area}/{feature}/` | Feature wraps VRs |
| Tabbed feature | `features/{area}/{feature}/_tabs/` | Feature tabs |
| Drawer content | `features/{area}/{thing}-drawer/` | Feature with _tabs |

---

## THE PHILOSOPHY

1. **Domains are addresses** - They define WHERE things live (routes)
2. **Features are workers** - They define WHAT happens (logic)
3. **VRs are bricks** - They define HOW things look (visuals)

Keep Domains clean. Keep VRs dumb. Let Features do the dirty work.

This is the way.

---

## CHECKLIST FOR NEW PAGE

- [ ] Create Domain folder in `src/app/domains/{area}/`
- [ ] Add `page.tsx`
- [ ] Does it need tabs? → Add `_tabs/` folder
- [ ] Does it need logic? → Create Feature in `src/features/{area}/`
- [ ] Does Feature need tabs? → Add `_tabs/` folder to Feature
- [ ] Wire Domain tabs to import Features (one-line imports)
- [ ] Add CSS with correct prefix (`ft-` for features)
- [ ] Export correctly (named for Features, default for Domain tabs)

---

*This document is law. Deviation is chaos. Structure is freedom.*

---

## YOUR TASK

You have been invoked with `/TTT-domain-features`. Apply this architecture to whatever domain/feature work is requested. Follow these rules exactly.
