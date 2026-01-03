# Creating New Domain Views

> Step-by-step guide to adding a new page.

## Steps

### 1. Create the Component

Create `/app/domains/{domain}/{PageName}.tsx`:

```tsx
'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';

export default function Invoices() {
  useSetPageHeader('Invoices', 'View and manage invoices');

  return (
    <div className="page-content">
      {/* Your content */}
    </div>
  );
}
```

### 2. Add to Router.tsx

Import and add the case:

```tsx
// Add import
import Invoices from './finance/Invoices';

// Add case in switch
case 'finance/invoices':
  return <Invoices />;
```

### 3. Add Sidebar Link (if needed)

In `/shell/Sidebar/` add the navigation item:

```tsx
{
  label: 'Invoices',
  route: 'finance/invoices',
  icon: <InvoiceIcon />,
}
```

### 4. Done

That's it. No middleware changes needed (unless new domain).

## Checklist

- [ ] Component file in `/app/domains/{domain}/`
- [ ] `'use client'` directive at top
- [ ] `useSetPageHeader()` called
- [ ] Import added to Router.tsx
- [ ] Case added to switch statement
- [ ] Sidebar link added (if applicable)

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| File | PascalCase.tsx | `Invoices.tsx` |
| Component | PascalCase | `export default function Invoices()` |
| Route | lowercase/lowercase | `'finance/invoices'` |
| URL | lowercase/lowercase | `/finance/invoices` |

## Reading Data

Domain views should read from FUSE store:

```tsx
export default function Invoices() {
  useSetPageHeader('Invoices', 'View and manage invoices');

  // Read from FUSE - data preloaded by WARP
  const invoices = useFuse((s) => s.finance.invoices);

  return (
    <div className="page-content">
      {invoices.map((inv) => (
        <InvoiceRow key={inv.id} invoice={inv} />
      ))}
    </div>
  );
}
```

## What NOT to Do

```tsx
// DON'T fetch on mount
useEffect(() => {
  fetchInvoices();  // NO!
}, []);

// DON'T show loading states
if (loading) return <Spinner />;  // NO!

// DON'T use Next.js navigation
import { useRouter } from 'next/navigation';  // NO!
```

Data should already be in FUSE store via WARP preloading.

## Adding a New Domain

If adding a completely new domain (not just a new page):

1. Create folder: `/app/domains/{newdomain}/`
2. Add to middleware matcher in `/middleware.ts`
3. Add sidebar section in `/shell/Sidebar/`
4. Add WARP preloader for the domain
5. Add FUSE store slice for the domain
