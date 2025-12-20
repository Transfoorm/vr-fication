/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Simple Tabs (FUSE-Enhanced)                        │
│  /src/components/prebuilts/tabs/simple/index.tsx                       │
│                                                                        │
│  Inconspicuous tabs with built-in FUSE stay-mounted pattern.           │
│  Narrow, full-width, subtle navigation.                                │
│                                                                        │
│  Usage (Auto-managed):                                                │
│  <Tabs.simple                                                         │
│    tabs={[                                                            │
│      { id: 'users', label: 'Users', content: <UsersTab /> },          │
│      { id: 'log', label: 'Log', content: <LogTab /> }                 │
│    ]}                                                                 │
│  />                                                                   │
│                                                                        │
│  Usage (Manual control):                                              │
│  <Tabs.simple                                                         │
│    tabs={[{ id: 'people', label: 'People' }, ...]}                    │
│    activeTab="people"                                                 │
│    onTabChange={(id) => setActiveTab(id)}                             │
│  />                                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  content?: ReactNode;
}

export interface SimpleTabsProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: ReactNode;
  className?: string;
}

/**
 * SimpleTabs - FUSE-Enhanced Tabs with Stay-Mounted Pattern
 *
 * Features:
 * - Minimal, clean design
 * - Full-width narrow band
 * - Subtle active state
 * - Optional count badges
 * - Optional actions slot on right side
 * - **FUSE Pattern:** Auto-managed stay-mounted panels when content provided
 *
 * Modes:
 * 1. Auto-managed (content provided): VR manages state, renders stay-mounted panels
 * 2. Manual control (no content): Parent controls rendering (backward compatible)
 *
 * Perfect for:
 * - Tabbed tables (FUSE-fast switching)
 * - Card navigation
 * - Section switching
 * - Multi-view panels
 */
export default function SimpleTabs({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange,
  actions,
  className = ''
}: SimpleTabsProps) {
  // Auto-managed mode: VR manages state when content is provided
  const hasContent = tabs.some(tab => tab.content);
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');

  // Use controlled state if provided, otherwise use internal state
  const activeTab = controlledActiveTab || internalActiveTab;
  const onTabChange = controlledOnTabChange || setInternalActiveTab;

  return (
    <>
      <div className={`vr-tabs vr-tabs-simple ${className}`}>
        <div className="vr-tabs-simple-tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`vr-tabs-simple-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="vr-tabs-simple-tab-count">{tab.count.toLocaleString()}</span>
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

      {/* FUSE Stay-Mounted Panels (when content is provided) */}
      {hasContent && tabs.map((tab) => (
        <div
          key={tab.id}
          className={activeTab === tab.id ? '' : 'vr-hidden'}
        >
          {tab.content}
        </div>
      ))}
    </>
  );
}
