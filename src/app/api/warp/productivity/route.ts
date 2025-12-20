/**──────────────────────────────────────────────────────────────────────┐
│  🚀 TRUE WARP - Productivity Data Preload API                        │
│  /src/app/api/warp/productivity/route.ts                              │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 11                                       │
│  - SID-9.1: Identity from readSessionCookie(), NOT auth()              │
│  - SID-5.3: Convex queries use callerUserId (sovereign)                │
│                                                                        │
│  Server-side endpoint for Productivity domain preloading              │
│  Called by PRISM when user opens Productivity dropdown                │
│                                                                        │
│  Data: emails, calendar, bookings, meetings                           │
│  Access: All ranks (rank-scoped in Convex query)                      │
└────────────────────────────────────────────────────────────────────────┘ */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { readSessionCookie } from '@/fuse/hydration/session/cookie';
import type { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  // 🛡️ SID-9.1: Identity from FUSE session cookie
  const session = await readSessionCookie();

  if (!session || !session._id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 🛡️ SID-5.3: Sovereign userId for Convex queries
  const callerUserId = session._id as Id<"admin_users">;

  try {
    // ⚡ Fetch productivity data using sovereign queries (rank-scoped in Convex)
    const [emails, calendar, bookings, meetings] = await Promise.all([
      convex.query(api.domains.productivity.queries.listEmails, { callerUserId }),
      convex.query(api.domains.productivity.queries.listCalendarEvents, { callerUserId }),
      convex.query(api.domains.productivity.queries.listBookings, { callerUserId }),
      convex.query(api.domains.productivity.queries.listMeetings, { callerUserId }),
    ]);

    console.log('🚀 WARP API: Productivity data fetched', {
      emails: emails?.length || 0,
      calendar: calendar?.length || 0,
      bookings: bookings?.length || 0,
      meetings: meetings?.length || 0,
    });

    return Response.json({
      emails: emails || [],
      calendar: calendar || [],
      bookings: bookings || [],
      meetings: meetings || [],
    });
  } catch (error) {
    console.error('❌ WARP API: Failed to fetch productivity data:', error);
    return Response.json({
      emails: [],
      calendar: [],
      bookings: [],
      meetings: []
    });
  }
}
