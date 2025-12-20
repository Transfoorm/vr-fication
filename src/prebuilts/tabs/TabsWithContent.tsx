/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Tabs with Content                                  │
│  /src/prebuilts/tabs/WithContent.tsx                                   │
│                                                                        │
│  TRUE VR: Tabs that handle EVERYTHING - navigation, URL, content.      │
│  The page just declares, the VR handles all complexity.                │
│                                                                        │
│  Usage:                                                               │
│  import { Tabs } from '@/prebuilts';                       │
│  <Tabs.withContent                                                    │
│    tabs={[                                                            │
│      { id: 'users', label: 'Users', content: <UsersPanel /> },        │
│      { id: 'settings', label: 'Settings', content: <Settings /> }     │
│    ]}                                                                 │
│  />                                                                   │
│  THAT'S IT. No state. No conditions. No logic in the page.            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export interface TabWithContent {
  id: string;
  label: string;
  content: React.ReactNode;
  count?: number;
}

export interface TabsWithContentProps {
  tabs: TabWithContent[];
  persistInUrl?: string;  // URL parameter name (defaults to 'tab')
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * TabsWithContent - TRUE VR that handles EVERYTHING
 *
 * This is what VR Architecture is about:
 * - Handles navigation
 * - Persists in URL automatically
 * - Manages content switching
 * - Survives refreshes
 * - Zero configuration
 * - Zero page logic needed
 *
 * The page becomes a simple declaration, not an implementation.
 * TTT Gap Model compliant - no external margins
 */
export default function TabsWithContent({
  tabs,
  persistInUrl = 'tab',
  actions,
  className = '',
  contentClassName = 'tab-content'
}: TabsWithContentProps) {
  const searchParams = useSearchParams();

  // Get valid tab IDs for validation
  const validTabIds = tabs.map(tab => tab.id);
  const defaultTab = tabs[0]?.id || '';

  // Read initial tab from URL or use first tab
  const getInitialTab = () => {
    const tabFromUrl = searchParams.get(persistInUrl);
    if (tabFromUrl && validTabIds.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return defaultTab;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Sync with URL changes (browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams.get(persistInUrl);
    if (tabFromUrl && validTabIds.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, persistInUrl, validTabIds, activeTab]);

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    // Update local state
    setActiveTab(tabId);

    // Update URL to persist selection
    const newSearchParams = new URLSearchParams(searchParams.toString());

    // Only set URL param if it's not the default tab (keeps URLs cleaner)
    if (tabId === defaultTab) {
      newSearchParams.delete(persistInUrl);
    } else {
      newSearchParams.set(persistInUrl, tabId);
    }

    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname;

    // Use pushState directly - no App Router involvement for query param changes
    window.history.pushState({}, '', newUrl);
  };

  // Find the active tab's content
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <>
      <div className={`vr-tabs vr-tabs-simple ${className}`}>
        <div className="vr-tabs-simple-tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`vr-tabs-simple-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="vr-tabs-simple-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
        {actions && (
          <div className="vr-tabs-simple-tabs-actions">
            {actions}
          </div>
        )}
      </div>

      {/* Content area - VR handles this too! */}
      <div className={contentClassName}>
        {activeTabContent}
      </div>
    </>
  );
}