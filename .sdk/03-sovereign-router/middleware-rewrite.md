# Middleware Rewrite

> How domain URLs get routed to FuseApp.

## The Problem

User types `https://app.com/admin/users` directly in browser.

Without middleware, Next.js would look for `/app/admin/users/page.tsx` and 404.

## The Solution

Middleware intercepts domain URLs and rewrites them to `/`:

```typescript
// middleware.ts

// Define which routes are domain routes
const isDomainRoute = createRouteMatcher([
  '/admin(.*)',
  '/clients(.*)',
  '/finance(.*)',
  '/productivity(.*)',
  '/projects(.*)',
  '/settings(.*)',
  '/system(.*)'
]);

// In the handler
if (isDomainRoute(req)) {
  return NextResponse.rewrite(new URL('/', req.url));
}
```

## What Happens

```
Browser: GET /admin/users
         │
         ▼
┌─────────────────────────┐
│      Middleware         │
│  isDomainRoute? YES     │
│  Rewrite to /           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Next.js renders /     │
│   Returns FuseApp       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Browser URL stays     │
│   /admin/users          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   FuseApp reads URL     │
│   Sets route state      │
│   Renders <Users />     │
└─────────────────────────┘
```

## Rewrite vs Redirect

- **Rewrite**: URL stays the same, content changes (what we use)
- **Redirect**: URL changes, user sees new URL

We use rewrite so `/admin/users` stays in the browser.

## Adding a New Domain

If you add a completely new domain (e.g., `/inventory`):

```typescript
const isDomainRoute = createRouteMatcher([
  '/admin(.*)',
  '/clients(.*)',
  '/finance(.*)',
  '/productivity(.*)',
  '/projects(.*)',
  '/settings(.*)',
  '/system(.*)',
  '/inventory(.*)',  // Add new domain
]);
```

New pages within existing domains don't need middleware changes.

## What Routes Are NOT Rewritten

- `/` - Already renders FuseApp
- `/sign-in`, `/sign-up`, `/forgot` - Auth pages
- `/api/*` - API routes
- `/_next/*` - Next.js internals
- Static files (images, fonts, etc.)

## Build Output

With this approach, build only shows:

```
Route (app)                          Size
┌ ƒ /                             41.1 kB
├ ƒ /forgot                       2.53 kB
├ ƒ /sign-in                      1.57 kB
├ ƒ /sign-up                      1.33 kB
└ /api/* routes
```

All domain routes are invisible to Next.js - FUSE owns them.
