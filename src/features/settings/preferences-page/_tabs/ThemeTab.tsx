/**──────────────────────────────────────────────────────────────────────┐
│  🎨 THEME TAB                                                         │
│  /src/features/settings/preferences/_tabs/ThemeTab.tsx                │
│                                                                       │
│  VR Doctrine: Tab Component                                           │
│  Theme preferences: Light/Dark mode toggle                            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { Card, T } from '@/vr';
import { useFuse } from '@/store/fuse';
import ThemeToggle from '@/features/shell/theme-toggle';

export function ThemeTab() {
  const themeMode = useFuse((state) => state.themeMode);
  const toggleThemeMode = useFuse((state) => state.toggleThemeMode);
  const isDark = themeMode === 'dark';

  return (
    <Card.standard
      title="Appearance"
      subtitle="Choose your preferred color scheme"
    >
      <button
        type="button"
        className="ft-theme-tab-row"
        onClick={() => toggleThemeMode()}
      >
        <ThemeToggle />
        <T.body>{isDark ? 'Dark Mode Activated' : 'Light Mode Activated'}</T.body>
      </button>
    </Card.standard>
  );
}
