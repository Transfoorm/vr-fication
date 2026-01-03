# Shell Components

> The persistent UI frame that wraps all domain views.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                           Topbar                                │
├───────────┬─────────────────────────────────────────┬───────────┤
│           │              PageHeader                 │           │
│           ├─────────────────────────────────────────┤           │
│  Sidebar  │                                         │ AISidebar │
│           │              Router                     │           │
│           │           (Domain View)                 │           │
│           │                                         │           │
├───────────┴─────────────────────────────────────────┴───────────┤
│                           Footer                                │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Sidebar (`/shell/Sidebar/`)

Left navigation panel with:
- Domain sections (Admin, Clients, Finance, etc.)
- Expandable/collapsible sections
- Active state highlighting
- Persisted expand state in localStorage

Width: `--sidebar-width: 200px`

### Topbar (`/shell/Topbar.tsx`)

Top navigation bar with:
- Logo
- Breadcrumbs
- User menu

Height: `--topbar-height: 50px`

### AISidebar (`/shell/AISidebar.tsx`)

Right panel for AI assistant:
- Closed: Avatar only (`--ai-sidebar-closed: 45px`)
- Open: Default chat (`--ai-sidebar-open: 256px`)
- Expanded: Full chat (`--ai-sidebar-expanded: 512px`)

### PageArch (`/shell/PageArch.tsx`)

Curved frame around content area:
- Controlled by `USE_CURVES` in FuseApp
- Radius: `--curved-radius: 20px`
- Foundation color: `--page-arch-foundation`

### PageHeader (`/shell/PageHeader/`)

Auto-generated page title and subtitle:
- Reads from `useSetPageHeader()` hook
- Top margin: `--page-header-margin-top: 30px`
- Bottom margin: `--page-header-margin-bottom: 25px`

### Footer (`/shell/Footer.tsx`)

Bottom bar:
- Height: `--footer-height: 20px`

## CSS Variables

All shell dimensions are controlled via CSS variables in `/styles/layout.css`:

```css
:root {
  /* Topbar */
  --topbar-height: 50px;
  --topbar-logo-padding: 10px;

  /* Sidebar */
  --sidebar-width: 200px;

  /* AI Sidebar */
  --ai-sidebar-closed: 45px;
  --ai-sidebar-open: 256px;
  --ai-sidebar-expanded: 512px;

  /* Page Header */
  --page-header-margin-top: 30px;
  --page-header-margin-bottom: 25px;
  --page-title-size: 30px;
  --page-subtitle-size: 14px;

  /* Content Padding */
  --page-content-padding-left: 25px;
  --page-content-padding-right: 25px;
  --page-content-padding-bottom: 60px;

  /* Footer */
  --footer-height: 20px;
}
```

## Shell Never Re-renders

When navigation happens:
- Sidebar stays exactly as is
- Topbar stays exactly as is
- AISidebar stays exactly as is
- Footer stays exactly as is
- **Only Router content changes**

This is why navigation is 0.4ms instead of 200ms.
