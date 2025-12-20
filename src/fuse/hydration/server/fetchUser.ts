/**
 * 🛡️ S.I.D. COMPLIANT - FUSE 6.0 Server-Side User Fetch
 * Reads session cookie and fetches fresh data from Convex for SSR
 *
 * SID-5.3: Uses session._id (sovereign) for Convex lookups
 *
 * CRITICAL: If database has newer data (or cookie has storage IDs instead of URLs),
 * this function UPDATES THE COOKIE with fresh data from Convex.
 */

import { readSessionCookie, mintSession, SESSION_COOKIE } from '@/fuse/hydration/session/cookie';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';

export type ServerUser = {
  _id: string;           // ✅ Sovereign Convex _id
  clerkId: string;       // Reference only (for SID-12.1 Clerk API calls)
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  rank?: string;
  setupStatus?: string;
  businessCountry?: string;
  entityName?: string;
  socialName?: string;
  themeDark?: boolean;
  mirorAvatarProfile?: AvatarOption;
  mirorEnchantmentEnabled?: boolean;
  mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
};

export async function fetchUserServer(): Promise<ServerUser | null> {
  try {
    const session = await readSessionCookie();

    // 🛡️ SID-9.1: Identity from session._id (sovereign)
    if (!session || !session._id) {
      return null;
    }

    // 🛡️ SID-5.3: Validate Convex user exists using sovereign _id
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const convexUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">
    });

    if (!convexUser) {
      return null; // User deleted - will trigger redirect to /sign-in
    }

    // FUSE 6.0 Doctrine: Convex is the single source of truth
    // Use fresh data from Convex, not stale cookie
    // 🛡️ S.I.D. Phase 15: clerkId comes from session, not Convex query
    const userData: ServerUser = {
      _id: String(convexUser._id),        // ✅ Sovereign identity
      clerkId: session.clerkId,           // Preserve from session
      email: convexUser.email,
      firstName: convexUser.firstName,
      lastName: convexUser.lastName,
      avatarUrl: convexUser.avatarUrl ?? undefined,
      rank: convexUser.rank,
      setupStatus: convexUser.setupStatus,
      businessCountry: convexUser.businessCountry,
      entityName: convexUser.entityName,
      socialName: convexUser.socialName,
      themeDark: convexUser.themeDark,
      mirorAvatarProfile: convexUser.mirorAvatarProfile,
      mirorEnchantmentEnabled: convexUser.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: convexUser.mirorEnchantmentTiming,
    };

    // 🔄 CRITICAL: ALWAYS refresh cookie with fresh database data on every page load
    // Database is the source of truth - cookie is just a cache
    console.log('🔄 FUSE: Refreshing cookie with fresh Convex data');

    // Mint fresh session with latest database data
    const token = await mintSession({
      _id: String(convexUser._id),
      clerkId: session.clerkId,
      email: convexUser.email || session.email || '',
      secondaryEmail: convexUser.secondaryEmail ?? session.secondaryEmail,
      firstName: convexUser.firstName ?? session.firstName,
      lastName: convexUser.lastName ?? session.lastName,
      avatarUrl: convexUser.avatarUrl ?? undefined,
      brandLogoUrl: convexUser.brandLogoUrl ?? undefined,
      rank: convexUser.rank ?? session.rank,
      setupStatus: convexUser.setupStatus ?? session.setupStatus,
      businessCountry: convexUser.businessCountry ?? session.businessCountry,
      entityName: convexUser.entityName ?? session.entityName,
      socialName: convexUser.socialName ?? session.socialName,
      phoneNumber: session.phoneNumber,
      themeMode: convexUser.themeDark ? 'dark' : 'light',
      mirorAvatarProfile: convexUser.mirorAvatarProfile ?? session.mirorAvatarProfile,
      mirorEnchantmentEnabled: convexUser.mirorEnchantmentEnabled ?? session.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: convexUser.mirorEnchantmentTiming ?? session.mirorEnchantmentTiming,
      dashboardLayout: session.dashboardLayout,
      dashboardWidgets: session.dashboardWidgets,
      genome: session.genome,
    });

    // Update the cookie with fresh data
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    console.log('✅ FUSE: Cookie refreshed - avatarUrl:', convexUser.avatarUrl?.substring(0, 50));
    console.log('✅ FUSE: Cookie refreshed - brandLogoUrl:', convexUser.brandLogoUrl?.substring(0, 50));

    return userData;
  } catch (error) {
    console.error('FUSE: Failed to fetch user server-side:', error);
    return null;
  }
}
