/**──────────────────────────────────────────────────────────────────────┐
│  📍 PAGE HEADER - Layout-Owned Slot (WCCC ly-* Compliant)             │
│  /src/shell/PageHeader.tsx                                             │
│                                                                        │
│  Renders page title and optional subtitle in nano-precise position    │
│  Reads data from PageHeaderContext (set by pages via hook)            │
│                                                                        │
│  Layout Integration:                                                   │
│  • Placed in FuseApp.tsx after PageArch (Sovereign Router)              │
│  • Every page gets identical positioning automatically                 │
│  • Spacing controlled by layout.css Control Panel                      │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { usePageHeaderContext } from '@/shell/page-header/PageHeaderContext';
import { useRef, useEffect } from 'react';
import { T } from '@/prebuilts';

/**
 * PageHeader Component
 *
 * Layout-owned component that renders page title/subtitle
 * Reads data from context set by pages via useSetPageHeader hook
 *
 * Do not use directly in pages - ***THIS IS RENDERED IN LAYOUT***
 */
export default function PageHeader() {
  const { headerData } = usePageHeaderContext();

  // Optimistic rendering: Keep last non-null title to prevent blinks during navigation
  const lastValidTitle = useRef<string | null>(null);
  const lastValidSubtitle = useRef<string | null>(null);

  useEffect(() => {
    if (headerData.title) {
      lastValidTitle.current = headerData.title;
      lastValidSubtitle.current = headerData.subtitle;
    }
  }, [headerData.title, headerData.subtitle]);

  // Use current title if available, fallback to last valid title
  const displayTitle = headerData.title || lastValidTitle.current;
  const displaySubtitle = headerData.subtitle || lastValidSubtitle.current;

  // Don't render if we've never had a title (initial page load to non-header page)
  if (!displayTitle) {
    return null;
  }

  // Determine alignment class based on action position
  const getAlignmentClass = () => {
    if (!headerData.action) return 'ly-page-header-container--top';
    switch (headerData.actionPosition) {
      case 'top': return 'ly-page-header-container--top';
      case 'middle': return 'ly-page-header-container--middle';
      case 'bottom': return 'ly-page-header-container--bottom';
      default: return 'ly-page-header-container--bottom';
    }
  };

  return (
    <div className={`ly-page-header-container ${getAlignmentClass()}`}>
      {/* Left: Title and Subtitle */}
      <div className="ly-page-header-left">
        <T.title className="ly-page-header-title">
          {displayTitle}
        </T.title>
        {displaySubtitle && (
          <T.caption className="ly-page-header-subtitle">
            {displaySubtitle}
          </T.caption>
        )}
      </div>

      {/* Right: Action */}
      {headerData.action && (
        <div className="ly-page-header-action">
          {headerData.action}
        </div>
      )}
    </div>
  );
}
