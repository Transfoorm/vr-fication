/**─────────────────────────────────────────────────────────────────────────┐
│  ⚡ FUSE READER - Productivity Domain                                      │
│  /src/hooks/useProductivityData.ts                                        │
│                                                                           │
│  TTTS-2 COMPLIANT: Reads from FUSE only.                                  │
│  NO useQuery here - sync happens in useProductivitySync().                │
│                                                                           │
│  Usage:                                                                   │
│  const { data, computed, flags } = useProductivityData();                 │
└───────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';

/**
 * Productivity Domain FUSE Reader
 *
 * Returns structured object for reading productivity data from FUSE:
 * - data: Raw domain data from FUSE store
 * - computed: Calculated/derived values
 * - flags: Status indicators
 *
 * Data hydration happens via useProductivitySync() in ProductivityProvider.
 */
export function useProductivityData() {
  const email = useFuse((state) => state.productivity.email);
  const calendar = useFuse((state) => state.productivity.calendar);
  const meetings = useFuse((state) => state.productivity.meetings);
  const bookings = useFuse((state) => state.productivity.bookings);
  const tasks = useFuse((state) => state.productivity.tasks);
  const status = useFuse((state) => state.productivity.status);

  // TTTS-1 compliant: status === 'hydrated' means data is ready
  const isHydrated = status === 'hydrated';

  return {
    // DATA: Raw domain data from FUSE store
    data: {
      email,
      calendar,
      meetings,
      bookings,
      tasks,
    },

    // COMPUTED: Calculated/derived values
    computed: {
      totalEmailThreads: email?.threads?.length || 0,
      totalEmailMessages: email?.messages?.length || 0,
      totalCalendarEvents: calendar?.length || 0,
      totalMeetings: meetings?.length || 0,
      totalBookings: bookings?.length || 0,
      totalTasks: tasks?.length || 0,
      hasData: (email?.threads?.length || 0) > 0 ||
               (calendar?.length || 0) > 0 ||
               (tasks?.length || 0) > 0,
    },

    // FLAGS: Status indicators
    flags: {
      isHydrated,
      isReady: status === 'hydrated',
    },
  };
}

// Type export for components
export type ProductivityData = ReturnType<typeof useProductivityData>;
