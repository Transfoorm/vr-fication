/**──────────────────────────────────────────────────────────────────────┐
│  🚀 TRUE WARP - Admin Data Preload API                                │
│  /src/app/api/warp/admin/route.ts                                      │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 11                                       │
│  - SID-9.1: Identity from readSessionCookie(), NOT auth()              │
│  - SID-5.3: Convex queries use callerUserId (sovereign)                │
│                                                                        │
│  Server-side endpoint for Admin domain preloading                      │
│  Called by PRISM when user opens Admin dropdown                        │
│                                                                        │
│  Data: users, deletionLogs                                             │
│  Access: Admiral only (rank check in Convex query)                     │
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
    // ⚡ Fetch admin data using sovereign queries (Admiral-only enforced in Convex)
    const [users, deletionLogs] = await Promise.all([
      convex.query(api.domains.admin.users.api.getAllUsers, { callerUserId }),
      convex.query(api.domains.admin.users.api.getAllDeletionLogs, { callerUserId }),
    ]);

    console.log('🚀 WARP API: Admin data fetched', {
      users: users?.length || 0,
      deletionLogs: deletionLogs?.length || 0,
    });

    return Response.json({
      users: users || [],
      deletionLogs: deletionLogs || []
    });
  } catch (error) {
    console.error('❌ WARP API: Failed to fetch admin data:', error);
    // Return empty arrays on error (likely not Admiral rank)
    return Response.json({
      users: [],
      deletionLogs: []
    });
  }
}
