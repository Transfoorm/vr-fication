/**──────────────────────────────────────────────────────────────────────┐
│  🔌 PRODUCTIVITY DOMAIN API - SRS Layer 4                             │
│  /convex/domains/productivity/api.ts                                   │
│                                                                        │
│  Central export point for productivity domain Convex functions.        │
│  Aggregates queries and mutations for productivity tools.              │
│                                                                        │
│  SRS Commandment #4: Data scoping via Convex (rank-based filtering)   │
└────────────────────────────────────────────────────────────────────────┘ */

// Export queries
export {
  listEmails,
  listCalendarEvents,
  listBookings,
  listMeetings,
} from "./queries";

// Export mutations
export {
  createEmail,
  updateEmail,
  deleteEmail,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createBooking,
  updateBooking,
  deleteBooking,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "./mutations";
