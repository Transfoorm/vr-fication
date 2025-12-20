/**──────────────────────────────────────────────────────────────────────┐
│  🧭 USE ROUTE TITLE HOOK                                               │
│  /src/hooks/useRouteTitle.ts                                           │
│                                                                        │
│  Auto-generates page titles from Next.js routes (PoLR pattern)        │
│                                                                        │
│  ⚠️  APPLICATION LAYER - NOT FUSE                                      │
│  This hook is Next.js-specific and lives in /src/, not /fuse/         │
│  FUSE = framework-agnostic primitives only (store + style)            │
│                                                                        │
│  Examples:                                                             │
│  /home              → "Home"                                           │
│  /clients           → "Clients"                                        │
│  /reports/analytics → "Analytics"                                      │
│  /user-profile      → "User Profile"                                   │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { usePathname } from 'next/navigation';

/**
 * Converts route path to human-readable title
 *
 * @returns Auto-generated title from current route
 *
 * @example
 * const title = useRouteTitle();
 * // On /reports/analytics → returns "Analytics"
 */
export function useRouteTitle(): string {
  const pathname = usePathname();

  if (!pathname || pathname === '/') {
    return 'Home';
  }

  // Get last segment of path (e.g., /reports/analytics → analytics)
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Convert kebab-case or snake_case to Title Case
  // user-profile → User Profile
  // analytics_dashboard → Analytics Dashboard
  const title = lastSegment
    .replace(/[-_]/g, ' ')  // Replace dashes/underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return title;
}
