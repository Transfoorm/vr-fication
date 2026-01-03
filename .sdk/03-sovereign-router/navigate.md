# The navigate() Function

> How to trigger navigation in FUSE.

## Location

`/store/fuse.ts` → `navigate` action

## Usage

```typescript
// Get navigate from store
const navigate = useFuse((s) => s.navigate);

// Navigate to a route
navigate('admin/users');
navigate('finance/invoices');
navigate('dashboard');
```

## What navigate() Does

```typescript
navigate: (route: string) => {
  // 1. Update store state
  set((state) => ({
    sovereign: {
      ...state.sovereign,
      route,
    },
  }));

  // 2. Update browser URL
  const urlPath = routeToUrlPath(route);
  window.history.pushState({ route }, '', urlPath);
}
```

Two things happen:
1. **FUSE store updates** → Router re-renders
2. **Browser URL updates** → User can bookmark/share

## Route → URL Conversion

```typescript
// routeToUrlPath() in /store/domains/navigation.ts
'dashboard'        → '/'
'admin/users'      → '/admin/users'
'finance/invoices' → '/finance/invoices'
```

## Using in Sidebar

```tsx
// In sidebar item
<button onClick={() => navigate('admin/users')}>
  Users
</button>
```

## Using in Components

```tsx
// In any component
function MyComponent() {
  const navigate = useFuse((s) => s.navigate);

  return (
    <button onClick={() => navigate('settings/account')}>
      Go to Settings
    </button>
  );
}
```

## Browser Back/Forward

Handled by FuseApp's popstate listener:

```typescript
const handlePopState = (event: PopStateEvent) => {
  if (event.state?.route) {
    navigate(event.state.route);
  } else {
    const route = urlPathToRoute(window.location.pathname);
    navigate(route);
  }
};

window.addEventListener('popstate', handlePopState);
```

## Do NOT Use

- `next/link` - Bypasses Sovereign Router
- `next/navigation` - Triggers full page navigation
- `window.location.href` - Reloads the page

Always use `navigate()` for in-app navigation.
