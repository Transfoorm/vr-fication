# Domain Preloading

> How each domain's data is fetched and stored.

## WARP Endpoints

Each domain has an API endpoint that returns all needed data:

```
/api/warp/admin
/api/warp/clients
/api/warp/finance
/api/warp/productivity
/api/warp/projects
/api/warp/settings
/api/warp/system
```

## Endpoint Structure

```typescript
// /api/warp/admin/route.ts
import { NextResponse } from 'next/server';
import { fetchAdminData } from '@/lib/data/admin';

export async function GET() {
  const data = await fetchAdminData();
  return NextResponse.json(data);
}
```

## Data Shape

Each endpoint returns domain-specific data:

```typescript
// /api/warp/admin returns:
{
  users: User[];
  plans: Plan[];
  features: Feature[];
}

// /api/warp/finance returns:
{
  invoices: Invoice[];
  payments: Payment[];
  transactions: Transaction[];
}

// etc.
```

## Preload Function

```typescript
async function preloadDomain(domain: string) {
  const response = await fetch(`/api/warp/${domain}`);
  const data = await response.json();

  // Hydrate the appropriate FUSE slice
  switch (domain) {
    case 'admin':
      useFuse.getState().setAdminData(data);
      break;
    case 'finance':
      useFuse.getState().setFinanceData(data);
      break;
    // ... etc
  }
}
```

## Full Orchestration

```typescript
async function runWarpPreload() {
  const domains = [
    'dashboard',
    'admin',
    'clients',
    'finance',
    'productivity',
    'projects',
    'settings',
    'system',
  ];

  for (const domain of domains) {
    await preloadDomain(domain);
    // Small delay to not hammer server
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('WARP: All domains preloaded');
}
```

## Cache Headers

WARP endpoints should set appropriate cache headers:

```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'private, max-age=60',  // Cache for 1 minute
  },
});
```

## Error Handling

If a domain fails to preload:

```typescript
try {
  await preloadDomain(domain);
} catch (error) {
  console.warn(`WARP: Failed to preload ${domain}`, error);
  // Continue with other domains
  // Data will be fetched on-demand if needed
}
```

Don't let one failure break the whole preload.

## Tracking Preload Status

```typescript
// In FUSE store
warp: {
  preloaded: {
    admin: boolean;
    clients: boolean;
    finance: boolean;
    // ...
  };
  lastPreload: number;  // timestamp
}
```

Views can check if data is preloaded:

```typescript
const isPreloaded = useFuse((s) => s.warp.preloaded.admin);
```
