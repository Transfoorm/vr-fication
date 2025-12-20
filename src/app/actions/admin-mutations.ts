/**
 * 🛡️ FUSE Stack Server Actions - Admin Domain Mutations
 * Purpose: Admin operations on users
 * Server actions for admin operations that don't affect user session.
 * These wrap Convex mutations to keep domain views Convex-free (SRB-4 compliant).
 *
 * 🛡️ S.I.D. PHASE 4 COMPLETE: Pipeline Purification
 * - All mutations accept userId (sovereign)
 * - Identity flows from FUSE session cookie
 *
 * ARCHITECTURE:
 * Component → Server Action → Convex Mutation → FUSE re-hydrates via WARP
 */

'use server';

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { readSessionCookie } from '@/fuse/hydration/session/cookie';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Delete a deletion log entry (VANISH journal cleanup)
 *
 * ⚠️ QUARANTINED: VANISH requires clerkId for cross-system integrity.
 * This is an exception to SID-5.3 - see S.I.D. doctrine on VANISH quarantine.
 */
export async function deleteDeletionLogAction(logId: Id<"admin_users_DeleteLog">) {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?.clerkId) throw new Error('Unauthorized: No valid session');

    // ⚠️ QUARANTINED: VANISH mutation requires clerkId
    const result = await convex.mutation(api.domains.admin.users.api.deleteDeletionLog, {
      logId,
      callerClerkId: session.clerkId,
    });

    return result;
  } catch (error) {
    console.error('deleteDeletionLogAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
