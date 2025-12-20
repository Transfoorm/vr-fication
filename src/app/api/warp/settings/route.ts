/**──────────────────────────────────────────────────────────────────────┐
│  🚀 TRUE WARP - Settings Data Preload API                            │
│  /src/app/api/warp/settings/route.ts                                  │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 11                                       │
│  - SID-9.1: Identity from readSessionCookie(), NOT auth()              │
│  - SID-5.3: Convex queries use callerUserId (sovereign)                │
│                                                                        │
│  Server-side endpoint for Settings domain preloading                  │
│  Called by PRISM when user opens Settings dropdown                    │
│                                                                        │
│  Data: userSettings, genome                                           │
│  Access: All ranks (SELF-scoped in Convex query)                      │
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
    // ⚡ Fetch settings data using sovereign queries (self-scoped in Convex)
    const [userSettings, genome] = await Promise.all([
      convex.query(api.domains.settings.queries.getUserSettings, { callerUserId }),
      convex.query(api.domains.settings.queries.getUserGenome, { callerUserId }),
    ]);

    console.log('🚀 WARP API: Settings data fetched', {
      hasUserProfile: !!userSettings?.userProfile,
      genomeCompletion: genome?.completionPercent || 0,
    });

    return Response.json({
      userProfile: userSettings?.userProfile || null,
      preferences: userSettings?.preferences || [],
      notifications: userSettings?.notifications || [],
      genome: genome || null
    });
  } catch (error) {
    console.error('❌ WARP API: Failed to fetch settings data:', error);
    return Response.json({
      userProfile: null,
      preferences: [],
      notifications: [],
      genome: null
    });
  }
}
