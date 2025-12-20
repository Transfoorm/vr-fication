/**
 * 🛡️ S.I.D. COMPLIANT - FUSE 6.0 SESSION REFRESH API
 * Updates session cookie with fresh Convex data (e.g., after avatar upload)
 *
 * SID-5.3: Uses session._id (sovereign) for Convex lookups
 */

import { NextResponse } from 'next/server';
import { readSessionCookie, mintSession, setSessionCookie } from '@/fuse/hydration/session/cookie';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';

// POST /api/session/refresh — Refresh session cookie with fresh Convex data
export async function POST() {
  try {
    // 🛡️ SID-9.1: Read sovereign _id from session
    const session = await readSessionCookie();

    if (!session || !session._id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 🛡️ SID-5.3: Fetch fresh user data using sovereign _id
    const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const freshUser = await convexClient.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">
    });

    if (!freshUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // 🧬 Fetch genome data for cookie persistence
    const freshGenome = await convexClient.query(api.domains.settings.queries.getUserGenome, {
      callerUserId: session._id as Id<"admin_users">
    });

    // Mint new session cookie with fresh data
    // 🛡️ S.I.D. Phase 15: clerkId comes from existing session, not Convex query
    const token = await mintSession({
      _id: String(freshUser._id),
      clerkId: session.clerkId, // Preserve from existing session
      email: freshUser.email || session.email,
      secondaryEmail: freshUser.secondaryEmail || undefined,
      firstName: freshUser.firstName || session.firstName,
      lastName: freshUser.lastName || session.lastName,
      avatarUrl: freshUser.avatarUrl || undefined, // Convert null to undefined
      brandLogoUrl: freshUser.brandLogoUrl || undefined,
      rank: freshUser.rank as string,
      setupStatus: freshUser.setupStatus as string,
      businessCountry: freshUser.businessCountry as string,
      entityName: freshUser.entityName as string,
      socialName: freshUser.socialName as string,
      phoneNumber: freshUser.phoneNumber as string,
      themeMode: freshUser.themeDark ? 'dark' : 'light',
      mirorAvatarProfile: freshUser.mirorAvatarProfile as AvatarOption | undefined,
      mirorEnchantmentEnabled: freshUser.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: freshUser.mirorEnchantmentTiming as 'subtle' | 'magical' | 'playful' | undefined,
      // 🧬 Include genome in cookie for persistence
      genome: freshGenome ? {
        completionPercent: freshGenome.completionPercent ?? 0,
        jobTitle: freshGenome.jobTitle,
        department: freshGenome.department,
        seniority: freshGenome.seniority,
        industry: freshGenome.industry,
        companySize: freshGenome.companySize,
        companyWebsite: freshGenome.companyWebsite,
        transformationGoal: freshGenome.transformationGoal,
        transformationStage: freshGenome.transformationStage,
        transformationType: freshGenome.transformationType,
        timelineUrgency: freshGenome.timelineUrgency,
        howDidYouHearAboutUs: freshGenome.howDidYouHearAboutUs,
        teamSize: freshGenome.teamSize,
        annualRevenue: freshGenome.annualRevenue,
        successMetric: freshGenome.successMetric,
      } : undefined,
    });

    // Set the refreshed cookie
    const res = new NextResponse(null, { status: 200 });
    setSessionCookie(res, token);

    console.log(`FUSE Session: Cookie refreshed - avatarUrl: ${freshUser.avatarUrl?.substring(0, 60)}...`);
    return res;

  } catch (error) {
    console.error('ERROR Session refresh failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
