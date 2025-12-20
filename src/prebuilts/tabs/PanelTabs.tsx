/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Panels Tabs (FUSE-Enhanced)                       │
│  /src/components/prebuilts/tabs/Panels.tsx                            │
│                                                                        │
│  Modern elevated tabs with rounded pill container design.              │
│  Smooth transitions and clean aesthetic.                               │
│                                                                        │
│  Usage (Auto-managed):                                                │
│  <Tabs.panels                                                         │
│    tabs={[                                                            │
│      { id: 'account', label: 'Account', content: <AccountTab /> },    │
│      { id: 'password', label: 'Password', content: <PasswordTab /> }  │
│    ]}                                                                 │
│  />                                                                   │
│                                                                        │
│  Usage (Manual control):                                              │
│  <Tabs.panels                                                         │
│    tabs={[{ id: 'account', label: 'Account' }, ...]}                  │
│    activeTab="account"                                                │
│    onTabChange={(id) => setActiveTab(id)}                             │
│  />                                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect, ReactNode } from 'react';

export interface PanelTabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
  content?: ReactNode;
  disabled?: boolean;
  /** Breathing animation between current color and --color-primary-light */
  highlight?: boolean;
}

export interface PanelTabsProps {
  tabs: PanelTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  /** Show faint border around tab triggers (default: true) */
  bordered?: boolean;
}

/**
 * PanelTabs - FUSE-Enhanced Tabs with Elevated Panel Design
 *
 * Features:
 * - Modern elevated design with rounded pill container
 * - Smooth transitions and hover states
 * - Disabled state support
 * - **FUSE Pattern:** Auto-managed stay-mounted panels when content provided
 *
 * Design:
 * - Rounded gray background container
 * - Individual triggers with white background when active
 * - Subtle shadow and border effects
 * - Clean, modern aesthetic
 *
 * Modes:
 * 1. Auto-managed (content provided): VR manages state, renders stay-mounted panels
 * 2. Manual control (no content): Parent controls rendering (backward compatible)
 *
 * Perfect for:
 * - Settings pages
 * - Multi-step forms
 * - Profile sections
 * - Dashboard panels
 */
export default function PanelTabs({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange,
  className = '',
  bordered = true
}: PanelTabsProps) {
  // Auto-managed mode: VR manages state when content is provided
  const hasContent = tabs.some(tab => tab.content);
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');

  // Read tab from URL hash (e.g., #deletelog) - on mount AND hash changes
  useEffect(() => {
    if (typeof window === 'undefined' || controlledActiveTab) return;

    const readHash = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (hash && tabs.some(tab => tab.id === hash)) {
        setInternalActiveTab(hash);
      }
    };

    // Read on mount
    readHash();

    // Listen for hash changes (for in-app navigation)
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [tabs, controlledActiveTab]);

  // Use controlled state if provided, otherwise use internal state
  const activeTab = controlledActiveTab || internalActiveTab;
  const onTabChange = controlledOnTabChange || setInternalActiveTab;

  const handleTabClick = (tab: PanelTabItem) => {
    if (!tab.disabled) {
      onTabChange(tab.id);
      // Persist tab selection in URL hash for refresh persistence
      if (typeof window !== 'undefined' && !controlledActiveTab) {
        window.history.replaceState(null, '', `${window.location.pathname}#${tab.id}`);
      }
    }
  };

  return (
    <div className="vr-tabs-panels-container">
      <div className={`vr-tabs vr-tabs-panels ${bordered ? 'vr-tabs-panels--bordered' : ''} ${className}`}>
        <div className="vr-tabs-panels-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`vr-tabs-panels-trigger ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''} ${tab.highlight ? 'vr-tabs-panels-trigger--highlight' : ''}`}
              type="button"
              disabled={tab.disabled}
            >
              {tab.icon && <span className="vr-tabs-panels-icon">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className="vr-tabs-panels-tab-count">{tab.count.toLocaleString()}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* FUSE Stay-Mounted Panels (when content is provided) */}
      {hasContent && tabs.map((tab) => (
        <div
          key={tab.id}
          className={activeTab === tab.id ? 'vr-tabs-panels-content' : 'vr-hidden'}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
