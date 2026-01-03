# 02 - FuseApp (The Sovereign Runtime)

> Mounts once. Never unmounts. Owns everything.

## Location

`/app/FuseApp.tsx`

## Role

FuseApp is the persistent client shell that:

1. **Mounts once** after server handover
2. **Never unmounts** during the entire session
3. **Contains the shell** - Sidebar, Topbar, AISidebar, PageArch, Footer
4. **Hosts the Sovereign Router** - All domain navigation happens inside
5. **Initializes FUSE** - Hydrates store, starts WARP

## Structure

```tsx
export default function FuseApp() {
  return (
    <>
      <ClientHydrator />        {/* Hydrate store from cookie */}
      <UserSyncProvider />      {/* Keep user data in sync */}

      <div className="modes-layout-app-container">
        <Sidebar />             {/* Left nav */}
        <div className="modes-layout-right-container">
          <Topbar />            {/* Top bar */}
          <div className="modes-layout-main-container">
            <main>
              <PageArch>        {/* Curved frame (optional) */}
                <PageHeader />  {/* Auto-generated title */}
                <Router />      {/* Sovereign Router */}
              </PageArch>
            </main>
            <AISidebar />       {/* Right AI panel */}
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
}
```

## Initialization Sequence

```
FuseApp mounts
      │
      ├─► 1. ClientHydrator reads session cookie
      │      └─► Populates FUSE store with user data
      │
      ├─► 2. sovereignHydrateSections()
      │      └─► Restores sidebar expanded/collapsed state
      │
      ├─► 3. Parse URL → navigate(route)
      │      └─► Sets initial sovereign.route
      │
      ├─► 4. Register popstate listener
      │      └─► Handles browser back/forward
      │
      └─► 5. requestIdleCallback → WARP preload
             └─► Starts background data fetching
```

## Why Never Unmount?

Traditional Next.js: Each page is a new component tree. Navigation = unmount old + mount new.

FUSE: The shell stays mounted. Only the inner view changes. This means:

- **No shell re-render** on navigation
- **No layout shift**
- **Sidebar state preserved**
- **0.4ms navigation** instead of 200ms+

## Shell Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Sidebar | `/shell/Sidebar/` | Left navigation |
| Topbar | `/shell/Topbar.tsx` | Top bar with breadcrumbs |
| AISidebar | `/shell/AISidebar.tsx` | AI assistant panel |
| PageArch | `/shell/PageArch.tsx` | Curved frame around content |
| PageHeader | `/shell/PageHeader/` | Auto-generated page title |
| Footer | `/shell/Footer.tsx` | Bottom bar |

## Configuration

```tsx
// In FuseApp.tsx
const USE_CURVES = true;  // Enable/disable PageArch
```

When `USE_CURVES = false`, content renders without the curved frame.
