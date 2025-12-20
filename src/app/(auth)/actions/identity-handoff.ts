'use server';

/**
 * 🛡️ S.I.D. PHASE 0 — IDENTITY HANDOFF CEREMONY
 *
 * This is the ONE and ONLY place where Clerk identity enters the system.
 * This is the ONE and ONLY place where auth() is permitted (outside middleware).
 * This is where Convex becomes the SOVEREIGN identity source.
 *
 * Called ONCE during:
 * - Login (after Clerk redirect)
 * - Signup (after Clerk account creation)
 *
 * NEVER called from business logic.
 *
 * SID Rules Enforced:
 * - SID-1.1: Identity originates from Convex, not auth()
 * - SID-1.5: Identity handoff ceremony occurs exactly once
 * - SID-1.6: No session minted without valid Convex _id
 * - SID-1.7: FUSE is source of truth after handoff
 * - SID-12.2: Auth flows mint Clerk identity → handoff to Convex immediately
 *
 * REF: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
 */

import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { mintSession, SESSION_COOKIE } from '@/fuse/hydration/session/cookie';
import { cookies } from 'next/headers';
import { DEFAULT_WIDGETS_BY_RANK } from '@/store/domains/dashboard';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Type for the ensureUser response - the sovereign user document
type SovereignUser = Doc<"admin_users">;

export type IdentityHandoffResult = {
  success: boolean;
  userId?: string; // Convex _id — THE SOVEREIGN IDENTITY
  error?: string;
};

/**
 * 🛡️ IDENTITY HANDOFF CEREMONY
 *
 * The sacred ritual where Clerk identity is translated to Convex sovereignty.
 *
 * Flow:
 * 1. Get clerkId from auth() — ONLY permitted HERE
 * 2. Call Convex ensureUser — Convex returns SOVEREIGN _id
 * 3. Mint FUSE session with Convex _id as PRIMARY
 * 4. clerkId becomes REFERENCE ONLY (for Clerk API calls like email/password)
 * 5. Return Convex _id — NEVER return clerkId to callers
 */
export async function performIdentityHandoff(): Promise<IdentityHandoffResult> {
  const startTime = Date.now();
  console.log('🛡️ SID: Identity Handoff Ceremony — BEGIN');

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Get Clerk identity (ONLY PERMITTED HERE — SID-1.1)
    // ═══════════════════════════════════════════════════════════════
    const step1 = Date.now();
    const { userId: clerkId } = await auth();
    console.log(`  ├─ auth() → ${Date.now() - step1}ms`);

    if (!clerkId) {
      console.error('🛡️ SID: HANDOFF FAILED — No Clerk session');
      return { success: false, error: 'No Clerk session' };
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Get Clerk user data (for initial population only)
    // ═══════════════════════════════════════════════════════════════
    const step2 = Date.now();
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    console.log(`  ├─ clerkClient.getUser() → ${Date.now() - step2}ms`);

    const email = clerkUser.primaryEmailAddress?.emailAddress ?? '';
    const firstName = clerkUser.firstName || '';
    const lastName = clerkUser.lastName || '';

    // FUSE Doctrine: Only save user-uploaded avatars, not Clerk's defaults
    const clerkImageUrl = clerkUser.imageUrl || '';
    const isClerkDefault = clerkImageUrl.includes('eyJ0eXBlIjoiZGVmYXVsdCI');
    const avatarToSave = (clerkImageUrl && !isClerkDefault) ? clerkImageUrl : undefined;

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Ensure Convex user exists — GET SOVEREIGN _id
    // This is the IDENTITY BIRTH POINT — SID-1.2, SID-1.6
    // ═══════════════════════════════════════════════════════════════
    const step3 = Date.now();
    const convexUser = await convex.mutation(api.domains.admin.users.api.ensureUser, {
      clerkId,
      email,
      emailVerified: false, // Default to false - set to true during setup completion
      firstName,
      lastName,
      avatarUrl: avatarToSave,
    }) as SovereignUser | null;
    console.log(`  ├─ ensureUser() → ${Date.now() - step3}ms`);

    if (!convexUser || !convexUser._id) {
      console.error('🛡️ SID: HANDOFF FAILED — ensureUser returned no _id');
      return { success: false, error: 'Failed to establish Convex identity' };
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Fetch genome for cookie persistence — FUSE doctrine
    // ═══════════════════════════════════════════════════════════════
    const step4a = Date.now();
    const freshGenome = await convex.query(api.domains.settings.queries.getUserGenome, {
      callerUserId: convexUser._id
    });
    console.log(`  ├─ getUserGenome() → ${Date.now() - step4a}ms`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4.5: Fetch user with converted URLs — WARP/PRISM ready
    // getCurrentUser converts storage IDs to URLs for instant render
    // ═══════════════════════════════════════════════════════════════
    const step4b = Date.now();
    const userWithUrls = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: convexUser._id
    });
    console.log(`  ├─ getCurrentUser() → ${Date.now() - step4b}ms`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Mint FUSE session with CONVEX _id as PRIMARY — SID-1.7
    // clerkId becomes REFERENCE ONLY (for Clerk API calls)
    // Cookie contains URLs (not storage IDs) for instant render
    // ═══════════════════════════════════════════════════════════════
    const step4 = Date.now();
    const userRank = convexUser.rank ?? 'captain';

    // Use URLs from getCurrentUser (already converted from storage IDs)
    const avatarUrlString = userWithUrls?.avatarUrl || undefined;
    const brandLogoUrlString = userWithUrls?.brandLogoUrl || undefined;

    const token = await mintSession({
      _id: String(convexUser._id),      // ✅ SOVEREIGN IDENTITY — Convex _id
      clerkId: clerkId,                  // Reference only — for Clerk API calls
      email: convexUser.email || email,
      emailVerified: convexUser.emailVerified,
      secondaryEmail: convexUser.secondaryEmail ?? undefined,
      firstName: convexUser.firstName ?? firstName,
      lastName: convexUser.lastName ?? lastName,
      rank: userRank,
      setupStatus: convexUser.setupStatus ?? 'pending',
      subscriptionStatus: convexUser.subscriptionStatus ?? 'trial',
      businessCountry: convexUser.businessCountry ?? 'AU',
      entityName: convexUser.entityName,
      socialName: convexUser.socialName,
      phoneNumber: convexUser.phoneNumber,
      avatarUrl: avatarUrlString,
      brandLogoUrl: brandLogoUrlString,
      themeMode: convexUser.themeDark ? 'dark' : 'light',
      mirorAvatarProfile: convexUser.mirorAvatarProfile,
      mirorEnchantmentEnabled: convexUser.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: convexUser.mirorEnchantmentTiming,
      dashboardLayout: 'classic',
      dashboardWidgets: DEFAULT_WIDGETS_BY_RANK[userRank] || DEFAULT_WIDGETS_BY_RANK['captain'],
      // 🧬 Include genome in cookie for persistence on refresh
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
    console.log(`  ├─ mintSession() → ${Date.now() - step4}ms`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Set the sovereign cookie — SID-7.2
    // ═══════════════════════════════════════════════════════════════
    const step5 = Date.now();
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: false, // Client needs to read for instant hydration
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    console.log(`  └─ setCookie() → ${Date.now() - step5}ms`);

    console.log(`✅ SID: Identity Handoff Ceremony — COMPLETE in ${Date.now() - startTime}ms`);
    console.log(`   Sovereign _id: ${convexUser._id}`);
    console.log(`   clerkId (ref only): ${clerkId}`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Return Convex _id — NEVER return clerkId — SID-10.2
    // ═══════════════════════════════════════════════════════════════
    return {
      success: true,
      userId: String(convexUser._id), // The ONE TRUE IDENTITY
    };

  } catch (error) {
    console.error('🛡️ SID: Identity Handoff Ceremony — CATASTROPHIC FAILURE:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Identity handoff failed',
    };
  }
}
