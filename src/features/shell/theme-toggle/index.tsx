/**──────────────────────────────────────────────────────────────────────┐
│  🌓 THEME TOGGLE - Animated Sun/Moon Switcher                         │
│  /src/features/shell/theme-toggle/index.tsx                           │
│                                                                        │
│  Pure CSS implementation (Josh Comeau pattern).                        │
│  Syncs to database via FUSE store's toggleThemeMode.                   │
│                                                                        │
│  ISVEA COMPLIANCE: ✅ 100% GOLD STANDARD                               │
│  - 0 ISV violations                                                    │
│  - 0 inline styles                                                     │
│  - 100% compliance (TRUE ZERO inline styles)                          │
│                                                                        │
│  ARCHITECTURE:                                                         │
│  - CSS :checked pseudo-selector handles ALL animation state           │
│  - React only manages checkbox state (checked/unchecked)              │
│  - CSS handles transforms, transitions, stagger delays                 │
│  - Platform-native performance (GPU-accelerated CSS)                   │
│                                                                        │
│  Credit: Josh Comeau (joshwcomeau.com) for the pure CSS pattern       │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useFuse } from "@/store/fuse";

export default function ThemeToggle() {
  const themeMode = useFuse((state) => state.themeMode);
  const toggleThemeMode = useFuse((state) => state.toggleThemeMode);
  const isDark = themeMode === "dark";

  return (
    <label htmlFor="themeToggle" className="ft-theme-label">
      <input
        type="checkbox"
        id="themeToggle"
        checked={isDark}
        onChange={() => toggleThemeMode()}
        className="ft-theme-input"
      />
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        stroke="none"
        className="ft-theme-svg"
      >
        <mask id="moon-mask">
          <rect x="0" y="0" width="20" height="20" fill="white"></rect>
          <circle
            cx="11"
            cy="3"
            r="8"
            fill="black"
            className="ft-theme-moon-mask"
          ></circle>
        </mask>
        <circle
          cx="10"
          cy="10"
          r="8"
          mask="url(#moon-mask)"
          className="ft-theme-main-circle"
        ></circle>
        <g className="ft-theme-stars">
          <circle cx="18" cy="10" r="1.5" className="ft-theme-star"></circle>
          <circle cx="14" cy="16.928" r="1.5" className="ft-theme-star"></circle>
          <circle cx="6" cy="16.928" r="1.5" className="ft-theme-star"></circle>
          <circle cx="2" cy="10" r="1.5" className="ft-theme-star"></circle>
          <circle cx="6" cy="3.1718" r="1.5" className="ft-theme-star"></circle>
          <circle cx="14" cy="3.1718" r="1.5" className="ft-theme-star"></circle>
        </g>
      </svg>
    </label>
  );
}
