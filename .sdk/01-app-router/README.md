# 01 - App Router (Next.js)

> The server layer that handles authentication and hands off to FUSE.

## Role

The App Router is **only** responsible for:

1. **Authentication pages** - `/sign-in`, `/sign-up`, `/forgot`
2. **Public pages** - `/landing` (if any)
3. **Initial shell render** - Server-side HTML for `/`
4. **API routes** - `/api/*` endpoints

After the user is authenticated and lands on `/`, Next.js hands control to FuseApp and **gets out of the way**.

## File Structure

```
/app/
├── (auth)/
│   ├── sign-in/page.tsx      # Clerk sign-in
│   ├── sign-up/page.tsx      # Clerk sign-up
│   └── forgot/page.tsx       # Password reset
├── api/
│   ├── session/              # Session cookie management
│   ├── warp/                 # WARP data endpoints
│   └── webhooks/             # Clerk webhooks
├── page.tsx                  # Root - renders FuseApp
├── layout.tsx                # Root layout with providers
└── FuseApp.tsx               # The sovereign runtime (client)
```

## What Happens on `/`

```tsx
// /app/page.tsx
export default function Home() {
  return <FuseApp />;
}
```

That's it. The server renders the shell, then FuseApp takes over.

## Middleware Rewriting

All domain routes (`/admin/*`, `/clients/*`, etc.) are rewritten to `/` by middleware:

```typescript
// middleware.ts
const isDomainRoute = createRouteMatcher([
  '/admin(.*)',
  '/clients(.*)',
  '/finance(.*)',
  // ...
]);

// In handler:
if (isDomainRoute(req)) {
  return NextResponse.rewrite(new URL('/', req.url));
}
```

This means:
- URL stays as `/admin/users` in browser
- Next.js renders `/page.tsx` (FuseApp)
- FuseApp reads URL, sets route in FUSE store
- Sovereign Router renders the correct view

## What NOT to Do

- Don't add new `page.tsx` files for domain routes
- Don't use App Router for navigation within domains
- Don't fetch data in server components for domain pages
- Don't add loading.tsx or error.tsx for domain routes

All domain navigation is client-side through Sovereign Router.
