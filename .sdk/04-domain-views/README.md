# 04 - Domain Views

> The page components that render inside the Sovereign Router.

## Location

`/app/domains/`

## Structure

```
/app/domains/
├── Router.tsx           # The switch statement
├── Dashboard.tsx        # Home view
├── admin/
│   ├── Users.tsx
│   ├── Plans.tsx
│   └── Feature.tsx
├── clients/
│   ├── Contacts.tsx
│   ├── Teams.tsx
│   ├── Sessions.tsx
│   ├── Pipeline.tsx
│   └── Reports.tsx
├── finance/
│   ├── Overview.tsx
│   ├── Invoices.tsx
│   ├── Payments.tsx
│   ├── Transactions.tsx
│   └── Reports.tsx
├── productivity/
│   ├── Calendar.tsx
│   ├── Bookings.tsx
│   ├── Tasks.tsx
│   ├── Email.tsx
│   └── Meetings.tsx
├── projects/
│   ├── Charts.tsx
│   ├── Locations.tsx
│   └── Tracking.tsx
├── settings/
│   ├── Account.tsx
│   ├── Preferences.tsx
│   ├── Security.tsx
│   ├── Billing.tsx
│   └── Plan.tsx
└── system/
    ├── AI.tsx
    └── Ranks.tsx
```

## Domain View Pattern

Every domain view follows this pattern:

```tsx
'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';

export default function Users() {
  // Set the page header (title + subtitle)
  useSetPageHeader('Users', 'Manage system users');

  // Render the view
  return (
    <div className="page-content">
      {/* View content */}
    </div>
  );
}
```

## Key Rules

1. **Always `'use client'`** - Domain views are client components
2. **Always call `useSetPageHeader()`** - Sets the auto-generated title
3. **Read data from FUSE store** - Never fetch on mount
4. **No loading states** - Data should be preloaded by WARP

## Files

- [creating-views.md](./creating-views.md) - How to add new pages
- [domains/](./domains/) - Per-domain documentation
