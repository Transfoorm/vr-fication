/**
 * 🛡️ S.I.D. COMPLIANT Server Actions - Sovereign Identity User Mutations
 * Purpose: Update user profile in Convex
 * These server actions wrap Convex mutations and automatically update session cookies,
 * eliminating the need for manual session refresh calls.
 *
 * 🛡️ S.I.D. PHASE 4 COMPLETE: Pipeline Purification
 * - All auth() calls REMOVED (Phase 1)
 * - All mutations accept userId (Phase 2)
 * - All call-sites pass userId (Phase 4)
 *
 * ARCHITECTURE:
 * Component → Server Action → FUSE Cookie → Convex Mutation + Cookie Update → ClientHydrator → FUSE State
 *
 * SID Rules Enforced:
 * - SID-3.1: auth() does NOT appear here (outside auth boundary)
 * - SID-3.3: Server Actions do NOT call Clerk to determine identity
 * - SID-5.3: userId (sovereign) passed to all Convex mutations
 * - SID-9.1: Identity originates from readSessionCookie()
 *
 * REF: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
 */

'use server';

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { readSessionCookie, mintSession, SESSION_COOKIE } from '@/fuse/hydration/session/cookie';
import { cookies } from 'next/headers';
import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Cookie settings - centralized for consistency
const COOKIE_OPTIONS = {
  httpOnly: false, // Must be false for client-side hydration
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Update business country and auto-update session cookie
 * 🛡️ SID-5.3: Uses session._id (sovereign) for all Convex calls
 */
export async function updateBusinessCountryAction(businessCountry: string) {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?._id) throw new Error('Unauthorized');

    // 🛡️ SID-5.3: Pass sovereign userId to Convex mutation
    await convex.mutation(api.domains.admin.users.api.updateBusinessCountry, {
      userId: session._id as Id<"admin_users">,
      businessCountry,
    });

    // 🛡️ SID-5.3: Fetch fresh user data using sovereign _id
    const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">,
    });

    if (!freshUser) throw new Error('User not found');

    // Mint new session with updated data
    // 🛡️ S.I.D. Phase 15: clerkId comes from existing session, not Convex query
    const token = await mintSession({
      _id: String(freshUser._id),
      clerkId: session.clerkId, // Preserve from existing session
      email: freshUser.email || session.email || '',
      emailVerified: freshUser.emailVerified,
      secondaryEmail: freshUser.secondaryEmail || undefined,
      firstName: freshUser.firstName || session.firstName,
      lastName: freshUser.lastName || session.lastName,
      avatarUrl: freshUser.avatarUrl || undefined,
      brandLogoUrl: freshUser.brandLogoUrl || undefined,
      rank: freshUser.rank as string,
      setupStatus: freshUser.setupStatus as string,
      businessCountry: freshUser.businessCountry as string,
      entityName: freshUser.entityName as string,
      socialName: freshUser.socialName as string,
      themeMode: freshUser.themeDark ? 'dark' : 'light',
      mirorAvatarProfile: freshUser.mirorAvatarProfile as AvatarOption | undefined,
      mirorEnchantmentEnabled: freshUser.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: freshUser.mirorEnchantmentTiming as 'subtle' | 'magical' | 'playful' | undefined,
    });

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return { success: true };
  } catch (error) {
    console.error('updateBusinessCountryAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Complete setup and auto-update session cookie
 * 🛡️ SID-5.3: Uses session._id (sovereign) for all Convex calls
 */
export async function completeSetupAction(data: {
  firstName: string;
  lastName: string;
  entityName: string;
  socialName: string;
  orgSlug: string;
  businessCountry?: string;
}) {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?._id) throw new Error('Unauthorized');

    // 🛡️ SID-5.3: Pass sovereign userId to Convex mutation
    await convex.mutation(api.domains.admin.users.api.completeSetup, {
      userId: session._id as Id<"admin_users">,
      ...data,
    });

    // 🛡️ SID-5.3: Fetch fresh user data using sovereign _id
    const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">,
    });

    if (!freshUser) throw new Error('User not found');

    // Mint new session with updated data
    // 🛡️ S.I.D. Phase 15: clerkId comes from existing session, not Convex query
    const token = await mintSession({
      _id: String(freshUser._id),
      clerkId: session.clerkId, // Preserve from existing session
      email: freshUser.email || session.email || '',
      emailVerified: freshUser.emailVerified,
      secondaryEmail: freshUser.secondaryEmail || undefined,
      firstName: freshUser.firstName || session.firstName,
      lastName: freshUser.lastName || session.lastName,
      avatarUrl: freshUser.avatarUrl || undefined,
      brandLogoUrl: freshUser.brandLogoUrl || undefined,
      rank: freshUser.rank as string,
      setupStatus: freshUser.setupStatus as string,
      businessCountry: freshUser.businessCountry as string,
      entityName: freshUser.entityName as string,
      socialName: freshUser.socialName as string,
      themeMode: freshUser.themeDark ? 'dark' : 'light',
      mirorAvatarProfile: freshUser.mirorAvatarProfile as AvatarOption | undefined,
      mirorEnchantmentEnabled: freshUser.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: freshUser.mirorEnchantmentTiming as 'subtle' | 'magical' | 'playful' | undefined,
    });

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return { success: true, user: freshUser };
  } catch (error) {
    console.error('completeSetupAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update theme preferences in database only (no cookie refresh)
 * 🛡️ SID-5.3: Uses session._id (sovereign) for all Convex calls
 *
 * FUSE Pattern: UI updates via store + localStorage (instant)
 * DB sync is fire-and-forget for persistence across devices/sessions
 * Cookie will sync on next login - no need to refresh mid-session
 */
export async function updateThemeAction(themeDark: boolean) {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?._id) throw new Error('Unauthorized');

    // 🛡️ SID-5.3: Pass sovereign userId to Convex mutation
    await convex.mutation(api.domains.admin.users.api.updateThemePreferences, {
      userId: session._id as Id<"admin_users">,
      themeDark,
    });

    return { success: true };
  } catch (error) {
    console.error('updateThemeAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update user profile settings and auto-update session cookie
 * 🛡️ SID-5.3: Uses session._id (sovereign) for all Convex calls
 * TTT-LiveField pattern: Called from FUSE store action on field blur
 */
export async function updateProfileAction(data: {
  firstName?: string;
  lastName?: string;
  entityName?: string;
  socialName?: string;
  phoneNumber?: string;
  businessCountry?: string;
}) {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?._id) throw new Error('Unauthorized');

    // 🛡️ SID-5.3: Pass sovereign userId to Convex mutation
    await convex.mutation(api.domains.admin.users.api.updateProfile, {
      userId: session._id as Id<"admin_users">,
      ...data,
    });

    // 🛡️ SID-5.3: Fetch fresh user data using sovereign _id
    const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">,
    });

    if (!freshUser) throw new Error('User not found');

    // Mint new session with updated data
    // 🛡️ S.I.D. Phase 15: clerkId comes from existing session, not Convex query
    const token = await mintSession({
      _id: String(freshUser._id),
      clerkId: session.clerkId, // Preserve from existing session
      email: freshUser.email || session.email || '',
      emailVerified: freshUser.emailVerified,
      secondaryEmail: freshUser.secondaryEmail || undefined,
      firstName: freshUser.firstName || session.firstName,
      lastName: freshUser.lastName || session.lastName,
      avatarUrl: freshUser.avatarUrl || undefined,
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
    });

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return { success: true };
  } catch (error) {
    console.error('updateProfileAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update genome fields and refresh session cookie (FUSE doctrine: instant persistence)
 * 🛡️ SID-5.3: Uses session._id (sovereign) for all Convex calls
 * TTT-LiveField pattern: Called from FUSE store action on field blur
 */
export async function updateGenomeAction(data: {
  jobTitle?: string;
  department?: string;
  seniority?: string;
  industry?: string;
  companySize?: string;
  companyWebsite?: string;
  transformationGoal?: string;
  transformationStage?: string;
  transformationType?: string;
  timelineUrgency?: string;
  howDidYouHearAboutUs?: string;
  teamSize?: number;
  annualRevenue?: string;
  successMetric?: string;
}) {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?._id) throw new Error('Unauthorized');

    // 🛡️ SID-5.3: Pass sovereign userId to Convex mutation
    await convex.mutation(api.domains.settings.mutations.updateGenome, {
      userId: session._id as Id<"admin_users">,
      ...data,
    });

    // 🛡️ SID-5.3: Fetch fresh genome data using sovereign _id
    const freshGenome = await convex.query(api.domains.settings.queries.getUserGenome, {
      callerUserId: session._id as Id<"admin_users">,
    });

    // Mint new session with updated genome (FUSE doctrine: cookie = truth)
    const token = await mintSession({
      _id: session._id,
      clerkId: session.clerkId,
      email: session.email,
      secondaryEmail: session.secondaryEmail,
      emailVerified: session.emailVerified,
      firstName: session.firstName,
      lastName: session.lastName,
      avatarUrl: session.avatarUrl,
      brandLogoUrl: session.brandLogoUrl,
      rank: session.rank,
      setupStatus: session.setupStatus,
      businessCountry: session.businessCountry,
      entityName: session.entityName,
      socialName: session.socialName,
      phoneNumber: session.phoneNumber,
      themeName: session.themeName,
      themeMode: session.themeMode,
      mirorAvatarProfile: session.mirorAvatarProfile,
      mirorEnchantmentEnabled: session.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: session.mirorEnchantmentTiming,
      dashboardLayout: session.dashboardLayout,
      dashboardWidgets: session.dashboardWidgets,
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

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return { success: true };
  } catch (error) {
    console.error('updateGenomeAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Refresh session after file upload
 * 🛡️ SID-5.3: Uses session._id (sovereign) for all Convex calls
 */
export async function refreshSessionAfterUpload() {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?._id) throw new Error('Unauthorized');

    // 🛡️ SID-5.3: Fetch fresh user data using sovereign _id
    const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">,
    });

    if (!freshUser) throw new Error('User not found');

    console.log('🔍 refreshSessionAfterUpload - brandLogoUrl from Convex:', freshUser.brandLogoUrl);
    console.log('🔍 refreshSessionAfterUpload - avatarUrl from Convex:', freshUser.avatarUrl);

    // getCurrentUser already converts storage IDs to URLs (or null if conversion fails)
    // No additional conversion needed here

    // Mint new session with updated avatar and brandLogo (URLs, not storage IDs)
    // 🛡️ S.I.D. Phase 15: clerkId comes from existing session, not Convex query
    const token = await mintSession({
      _id: String(freshUser._id),
      clerkId: session.clerkId, // Preserve from existing session
      email: freshUser.email || session.email || '',
      emailVerified: freshUser.emailVerified,
      secondaryEmail: freshUser.secondaryEmail || undefined,
      firstName: freshUser.firstName || session.firstName,
      lastName: freshUser.lastName || session.lastName,
      avatarUrl: freshUser.avatarUrl || undefined,
      brandLogoUrl: freshUser.brandLogoUrl || undefined,
      rank: freshUser.rank as string,
      setupStatus: freshUser.setupStatus as string,
      businessCountry: freshUser.businessCountry as string,
      entityName: freshUser.entityName as string,
      socialName: freshUser.socialName as string,
      themeMode: freshUser.themeDark ? 'dark' : 'light',
      mirorAvatarProfile: freshUser.mirorAvatarProfile as AvatarOption | undefined,
      mirorEnchantmentEnabled: freshUser.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: freshUser.mirorEnchantmentTiming as 'subtle' | 'magical' | 'playful' | undefined,
    });

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return { success: true };
  } catch (error) {
    console.error('refreshSessionAfterUpload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update Miror AI settings and auto-update session cookie
 * 🛡️ SID-5.3: Uses session._id (sovereign) for all Convex calls
 * TTT-LiveField pattern: Called from FUSE store action on change
 */
export async function updateMirorAction(data: {
  mirorAvatarProfile?: AvatarOption;
  mirorEnchantmentEnabled?: boolean;
  mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
}) {
  try {
    // 🛡️ SID-9.1: Identity originates from readSessionCookie()
    const session = await readSessionCookie();
    if (!session?._id) throw new Error('Unauthorized');

    // 🛡️ SID-5.3: Pass sovereign userId to Convex mutation
    await convex.mutation(api.domains.settings.mutations.updateMirorSettings, {
      callerUserId: session._id as Id<"admin_users">,
      ...data,
    });

    // 🛡️ SID-5.3: Fetch fresh user data using sovereign _id
    const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">,
    });

    if (!freshUser) throw new Error('User not found');

    // Mint new session with updated data
    const token = await mintSession({
      _id: String(freshUser._id),
      clerkId: session.clerkId,
      email: freshUser.email || session.email || '',
      secondaryEmail: freshUser.secondaryEmail || undefined,
      emailVerified: freshUser.emailVerified,
      firstName: freshUser.firstName || session.firstName,
      lastName: freshUser.lastName || session.lastName,
      avatarUrl: freshUser.avatarUrl || undefined,
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
    });

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return { success: true };
  } catch (error) {
    console.error('updateMirorAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
