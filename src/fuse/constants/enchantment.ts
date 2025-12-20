/*────────────────────────────────────────────────────────────────────────────┐
│  ✨ MIROR AI ENCHANTMENT TIMING - Animation Timing Control Center          │
│                                                                             │
│  Master configuration for Miror AI enchantment sparkle animation timing.   │
│  Controls how long the sparkle is visible and hidden for each timing mode. │
│                                                                             │
│  🎯 Used by:                                                                │
│     • AISidebar - Right side AI assistant enchantment                       │
│     • Preferences - User timing selection preview                           │
│     • Workspace (Admiral) - Admin view of current settings                  │
│                                                                             │
│  ⚙️ Timing Modes:                                                           │
│     • Subtle: Rare & understated sparkle appearances                        │
│     • Magical: Special & delightful (default)                               │
│     • Playful: Frequent & lively animations                                 │
│                                                                             │
│  📊 How it works:                                                           │
│     - onDurations: How long sparkle is visible (ms)                         │
│     - offDurations: Random range for how long sparkle stays hidden (ms)     │
│     - Animation picks random value from array each cycle                    │
│                                                                             │
│  ✅ SINGLE SOURCE OF TRUTH: Update timings here to apply everywhere         │
└─────────────────────────────────────────────────────────────────────────────*/

export const ENCHANTMENT_TIMINGS = {
  subtle: {
    //SUBTLE
    id: 'subtle' as const,
    label: 'Subtle',
    description: 'Rare & understated',
    onDurations: [2400],                 // 2.4s visible
    offDurations: [10000, 13000, 15000]  // 10s, 13s, or 15s hidden (random)
  },
    //MAGICAL
  magical: {
    id: 'magical' as const,
    label: 'Magical',
    description: 'Special & delightful',
    onDurations: [4800, 2200],           // 4.8s or 2.1s visible (random)
    offDurations: [6000, 8000, 12000]    // 6s, 8s, or 12s hidden (random)
  },
    //PLAYFUL
  playful: {
    id: 'playful' as const,
    label: 'Playful',
    description: 'Frequent & lively',
    onDurations: [4800, 2200],           // 4.8s or 2.1s visible (random)
    offDurations: [2000, 3000, 4000]     // 2s, 4s, or 6s hidden (random)
  }
} as const;

// Export as array for components that need to map/iterate
export const ENCHANTMENT_TIMINGS_ARRAY = [
  ENCHANTMENT_TIMINGS.subtle,
  ENCHANTMENT_TIMINGS.magical,
  ENCHANTMENT_TIMINGS.playful
] as const;

// Type for timing IDs
export type EnchantmentTimingId = keyof typeof ENCHANTMENT_TIMINGS;
