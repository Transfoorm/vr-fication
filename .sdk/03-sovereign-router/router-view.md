# Router.tsx (RouterView)

> The switch statement that renders domain views.

## Location

`/app/domains/Router.tsx`

## How It Works

Router.tsx is a simple component that:
1. Reads `sovereign.route` from FUSE store
2. Returns the matching component

```tsx
export default function Router() {
  const route = useFuse((s) => s.sovereign.route);

  switch (route) {
    // Dashboard
    case 'dashboard':
      return <Dashboard />;

    // Admin
    case 'admin/users':
      return <Users />;
    case 'admin/plans':
      return <Plans />;
    case 'admin/feature':
      return <Feature />;

    // Finance
    case 'finance/overview':
      return <Overview />;
    case 'finance/invoices':
      return <Invoices />;

    // ... all other routes

    default:
      return <Dashboard />;
  }
}
```

## All Routes

| Route | Component | File |
|-------|-----------|------|
| `dashboard` | `<Dashboard />` | `/app/domains/Dashboard.tsx` |
| `admin/users` | `<Users />` | `/app/domains/admin/Users.tsx` |
| `admin/plans` | `<Plans />` | `/app/domains/admin/Plans.tsx` |
| `admin/feature` | `<Feature />` | `/app/domains/admin/Feature.tsx` |
| `clients/contacts` | `<Contacts />` | `/app/domains/clients/Contacts.tsx` |
| `clients/teams` | `<Teams />` | `/app/domains/clients/Teams.tsx` |
| `clients/sessions` | `<Sessions />` | `/app/domains/clients/Sessions.tsx` |
| `clients/pipeline` | `<Pipeline />` | `/app/domains/clients/Pipeline.tsx` |
| `clients/reports` | `<Reports />` | `/app/domains/clients/Reports.tsx` |
| `finance/overview` | `<Overview />` | `/app/domains/finance/Overview.tsx` |
| `finance/invoices` | `<Invoices />` | `/app/domains/finance/Invoices.tsx` |
| `finance/payments` | `<Payments />` | `/app/domains/finance/Payments.tsx` |
| `finance/transactions` | `<Transactions />` | `/app/domains/finance/Transactions.tsx` |
| `finance/reports` | `<FinanceReports />` | `/app/domains/finance/Reports.tsx` |
| `productivity/calendar` | `<Calendar />` | `/app/domains/productivity/Calendar.tsx` |
| `productivity/bookings` | `<Bookings />` | `/app/domains/productivity/Bookings.tsx` |
| `productivity/tasks` | `<Tasks />` | `/app/domains/productivity/Tasks.tsx` |
| `productivity/email` | `<Email />` | `/app/domains/productivity/Email.tsx` |
| `productivity/meetings` | `<Meetings />` | `/app/domains/productivity/Meetings.tsx` |
| `projects/charts` | `<Charts />` | `/app/domains/projects/Charts.tsx` |
| `projects/locations` | `<Locations />` | `/app/domains/projects/Locations.tsx` |
| `projects/tracking` | `<Tracking />` | `/app/domains/projects/Tracking.tsx` |
| `settings/account` | `<Account />` | `/app/domains/settings/Account.tsx` |
| `settings/preferences` | `<Preferences />` | `/app/domains/settings/Preferences.tsx` |
| `settings/security` | `<Security />` | `/app/domains/settings/Security.tsx` |
| `settings/billing` | `<Billing />` | `/app/domains/settings/Billing.tsx` |
| `settings/plan` | `<Plan />` | `/app/domains/settings/Plan.tsx` |
| `system/ai` | `<AI />` | `/app/domains/system/AI.tsx` |
| `system/ranks` | `<Ranks />` | `/app/domains/system/Ranks.tsx` |

## Adding a New Route

1. Create component in `/app/domains/{domain}/{Page}.tsx`
2. Import in Router.tsx
3. Add case to switch statement
4. Add sidebar link (if needed)

That's it. No middleware changes (unless new domain).

## Why Switch Instead of Object Map?

Switch is:
- Explicit - You see every route
- Type-safe - TypeScript catches missing cases
- Fast - Simple comparison
- Debuggable - Easy to add logging per route

Could use object map, but switch is clearer for this use case.
