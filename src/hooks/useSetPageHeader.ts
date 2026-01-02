/**─────────────────────────────────────────────────────────────────────────┐
│  🎯 USE SET PAGE HEADER HOOK                                              │
│  /src/hooks/useSetPageHeader.ts                                           │
│                                                                           │
│  Pages call this hook to set their title and optional subtitle            │
│                                                                           │
│  Examples:                                                                │
│  • Auto-generated: useSetPageHeader()        → Uses route title           │
│  • Static: useSetPageHeader("Dashboard")     → Custom title               │
│  • With subtitle: useSetPageHeader("Clients", "Manage your clients")      │
│  • Dynamic: useSetPageHeader(client.name, "Client details")               │
│  • No header: Don't call the hook at all                                  │
└───────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useEffect } from 'react';
import { usePageHeaderContext, ActionPosition } from '@/shell/page-header/PageHeaderContext';
import { useRouteTitle } from '@/hooks/useRouteTitle';
import { useUserRank } from '@/hooks/useUserRank';
import { isAdmiral } from '@/rank/checks';

/**
 * Sets the page header title and optional subtitle with action button
 *
 * @param title - Page title (if not provided, auto-generates from route)
 * @param subtitle - Optional subtitle below title
 * @param options - Optional configuration object
 * @param options.action - Action element (button, nav, etc.)
 * @param options.actionPosition - Position of action: 'top' (title level), 'middle', or 'bottom' (subtitle level)
 * @param options.hidden - If true, hides the page header entirely
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
 * useSetPageHeader("Edit User", "User details", { action: <Button.danger>Close</Button.danger> });
 *
 * @example
 * // Hidden header
 * useSetPageHeader("Email", "", { hidden: true });
 */
export function useSetPageHeader(
  title?: string,
  subtitle?: string,
  options?: {
    action?: React.ReactNode;
    actionPosition?: ActionPosition;
    hidden?: boolean;
  }
) {
  const { setHeaderData } = usePageHeaderContext();
  const autoTitle = useRouteTitle();
  const rank = useUserRank();

  const action = options?.action;
  const actionPosition = options?.actionPosition ?? 'bottom';
  const hidden = options?.hidden ?? false;

  useEffect(() => {
    const pageTitle = title || autoTitle;

    // Set browser tab title (Admiral sees "SAAS ADMIN", everyone else sees "Transfoorm")
    const appName = isAdmiral(rank) ? 'SAAS ADMIN' : 'Transfoorm';
    document.title = `${appName} | ${pageTitle}`;

    setHeaderData({
      title: pageTitle,
      subtitle: subtitle || null,
      action: action || undefined,
      actionPosition: action ? actionPosition : undefined,
      hidden,
    });

    // NO CLEANUP - Next page immediately sets its own header
    // Clearing causes unnecessary null → reappear flash
  }, [title, subtitle, action, actionPosition, hidden, autoTitle, setHeaderData, rank]);
}
