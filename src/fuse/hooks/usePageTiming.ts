/**──────────────────────────────────────────────────────────────────────┐
│  ⏱️ usePageTiming - Click-to-Render Performance Measurement           │
│  /src/fuse/hooks/usePageTiming.ts                                      │
│                                                                        │
│  Measures time from sidebar click to page render completion.           │
│  Uses navClickTime from FUSE store set by Sidebar on navigation.       │
│                                                                        │
│  Usage:                                                                │
│  usePageTiming('/admin/users');                                        │
│                                                                        │
│  Console output:                                                       │
│  ⏱️ /admin/users rendered in 45.23ms (click-to-render)                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect } from 'react';
import { useFuse } from '@/store/fuse';

export function usePageTiming(pagePath: string) {
  const navClickTime = useFuse((s) => s.navClickTime);
  const clearNavClickTime = useFuse((s) => s.clearNavClickTime);

  useEffect(() => {
    if (navClickTime) {
      const renderTime = performance.now() - navClickTime;
      const status = renderTime < 300 ? '✅' : renderTime < 500 ? '⚠️' : '🐌';
      console.log(
        `%c⏱️ ${status} ${pagePath} %c${renderTime.toFixed(0)}ms`,
        'color: #00ff88; font-weight: bold; font-size: 14px;',
        `color: ${renderTime < 300 ? '#00ff88' : renderTime < 500 ? '#ffaa00' : '#ff4444'}; font-weight: bold; font-size: 14px;`
      );
      clearNavClickTime();
    }
  }, [navClickTime, clearNavClickTime, pagePath]);
}
