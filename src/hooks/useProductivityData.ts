/**──────────────────────────────────────────────────────────────────────┐
│  ⚡ WRAP HOOK - Productivity Domain                                    │
│  /src/hooks/useProductivityData.ts                                     │
│                                                                        │
│  WRAP Pattern: { data, computed, actions, flags }                      │
│  Clean API for accessing productivity domain data                      │
│  Following FUSE Stack architectural contract                           │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';

/**
 * WRAP Hook - Productivity Domain
 *
 * Returns structured object following WRAP contract:
 * - data: Raw domain data from FUSE store
 * - computed: Calculated/derived values
 * - actions: Mutations and operations (future)
 * - flags: Status indicators (hydration, loading, etc.)
 *
 * Usage:
 * ```tsx
 * const { data, computed, flags } = useProductivityData();
 * const { emails, calendar, tasks } = data;
 * const { totalEmails } = computed;
 * const { isHydrated } = flags;
 * ```
 */
export function useProductivityData() {
  const productivity = useFuse((state) => state.productivity);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = productivity.status === 'hydrated';

  return {
    // DATA: Raw domain data from FUSE store
    data: {
      emails: productivity.emails,
      calendar: productivity.calendar,
      meetings: productivity.meetings,
      bookings: productivity.bookings,
      tasks: productivity.tasks,
    },

    // COMPUTED: Calculated/derived values
    computed: {
      totalEmails: productivity.emails.length,
      totalCalendarEvents: productivity.calendar.length,
      totalMeetings: productivity.meetings.length,
      totalBookings: productivity.bookings.length,
      totalTasks: productivity.tasks.length,
      hasData: productivity.emails.length > 0 || productivity.calendar.length > 0 || productivity.tasks.length > 0,
    },

    // ACTIONS: Mutations and operations
    // Future: Convex mutations wrapped as actions
    actions: {},

    // FLAGS: Status indicators
    flags: {
      isHydrated,
      isOnline: true, // WARP ensures data always available
    },
  };
}

// Type export for components
export type ProductivityData = ReturnType<typeof useProductivityData>;
