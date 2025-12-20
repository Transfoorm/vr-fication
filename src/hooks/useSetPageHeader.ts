/**──────────────────────────────────────────────────────────────────────┐
│  🎯 USE SET PAGE HEADER HOOK                                           │
│  /src/hooks/useSetPageHeader.ts                                        │
│                                                                        │
│  Pages call this hook to set their title and optional subtitle        │
│                                                                        │
│  Examples:                                                             │
│  • Auto-generated: useSetPageHeader()        → Uses route title        │
│  • Static: useSetPageHeader("Dashboard")     → Custom title            │
│  • With subtitle: useSetPageHeader("Clients", "Manage your clients")   │
│  • Dynamic: useSetPageHeader(client.name, "Client details")            │
│  • No header: Don't call the hook at all                               │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useEffect } from 'react';
import { usePageHeaderContext, ActionPosition } from '@/shell/page-header/PageHeaderContext';
import { useRouteTitle } from '@/hooks/useRouteTitle';

/**
 * Sets the page header title and optional subtitle with action button
 *
 * @param title - Page title (if not provided, auto-generates from route)
 * @param subtitle - Optional subtitle below title
 * @param action - Optional action element (button, nav, etc.)
 * @param actionPosition - Position of action: 'top' (title level), 'middle', or 'bottom' (subtitle level)
 *
 * @example
 * // Auto-generated title from route
 * useSetPageHeader();
 *
 * @example
 * // With subtitle
 * useSetPageHeader("Clients", "Manage your clients");
 *
 * @example
 * // With action at bottom
 * useSetPageHeader("Edit User", "User details", <Button.danger>Close</Button.danger>, 'bottom');
 */
export function useSetPageHeader(
  title?: string,
  subtitle?: string,
  action?: React.ReactNode,
  actionPosition: ActionPosition = 'bottom'
) {
  const { setHeaderData } = usePageHeaderContext();
  const autoTitle = useRouteTitle();

  useEffect(() => {
    setHeaderData({
      title: title || autoTitle,
      subtitle: subtitle || null,
      action: action || undefined,
      actionPosition: action ? actionPosition : undefined,
    });

    // NO CLEANUP - Next page immediately sets its own header
    // Clearing causes unnecessary null → reappear flash
  }, [title, subtitle, action, actionPosition, autoTitle, setHeaderData]);
}
