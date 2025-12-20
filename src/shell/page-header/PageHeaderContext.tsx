/**──────────────────────────────────────────────────────────────────────┐
│  📍 PAGE HEADER CONTEXT                                                │
│  /src/contexts/PageHeaderContext.tsx                                   │
│                                                                        │
│  Enterprise Pattern: Layout owns slot, pages own data                  │
│                                                                        │
│  Architecture:                                                         │
│  • Layout renders <PageHeader /> in exact nano-precise position        │
│  • Pages call useSetPageHeader("Title", "Subtitle") to feed data       │
│  • Every page gets identical header positioning automatically          │
│                                                                        │
│  Usage:                                                                │
│  • Static pages: useSetPageHeader() auto-uses route title              │
│  • Dynamic pages: useSetPageHeader(client.name, "Client details")      │
│  • No header: Don&apos;t call the hook                                      │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export type ActionPosition = 'top' | 'middle' | 'bottom';

interface PageHeaderData {
  title: string | null;
  subtitle: string | null;
  action?: ReactNode;
  actionPosition?: ActionPosition;
}

interface PageHeaderContextValue {
  headerData: PageHeaderData;
  setHeaderData: (data: PageHeaderData) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

/**
 * PageHeaderProvider - Wraps the app to provide header state
 *
 * Place this in FuseApp.tsx to enable page header system (Sovereign Router)
 */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerData, setHeaderData] = useState<PageHeaderData>({
    title: null,
    subtitle: null,
  });

  return (
    <PageHeaderContext.Provider value={{ headerData, setHeaderData }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

/**
 * usePageHeaderContext - Internal hook to access context
 *
 * Do not use directly - use useSetPageHeader or PageHeader component
 */
export function usePageHeaderContext() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeaderContext must be used within PageHeaderProvider');
  }
  return context;
}
