// FUSE 6.0 SESSION COOKIE SYSTEM - The Bridge to Zero Loading States
// Following FUSE Doctrine: 2BA + TTT Ready (100K/10K/1K)
//
// This is the CORE of FUSE - the JWT session system that eliminates loading states

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';

export const SESSION_COOKIE = 'FUSE_5.0';
const ALG = 'HS256';
const isProd = process.env.NODE_ENV === 'production';

function getSecret() {
  const secret = process.env.SESSION_SECRET || 'FUSE_5_DEV_SECRET_CHANGE_IN_PROD';
  return new TextEncoder().encode(secret);
}

type SessionPayload = {
  _id: string;        // ✅ Convex user _id (CANONICAL, sovereign identity)
  clerkId: string;    // Clerk ID for auth handoff reference only
  iat: number;
  // Essential user data for instant render - the FUSE magic!
  email?: string;
  secondaryEmail?: string;
  emailVerified?: boolean;
  rank?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  brandLogoUrl?: string;
  setupStatus?: string;
  subscriptionStatus?: string;
  businessCountry?: string;
  entityName?: string;
  socialName?: string;
  phoneNumber?: string;
  // Theme preferences for zero-FOUC rendering
  themeName?: string;
  themeMode?: string;
  // Miror AI preferences
  mirorAvatarProfile?: AvatarOption;
  mirorEnchantmentEnabled?: boolean;
  mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
  // Dashboard preferences (WARP'd during login)
  dashboardLayout?: 'classic' | 'focus' | 'metrics';
  dashboardWidgets?: string[];
  // Professional Genome (persisted for zero-loading)
  genome?: {
    completionPercent: number;
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
  };
};

export async function mintSession(payload: Omit<SessionPayload, 'iat'>) {
  const startTime = Date.now();
  console.log('FUSE JWT: Minting session');

  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    _id: payload._id,           // ✅ Convex _id first (signals sovereignty)
    clerkId: payload.clerkId,
    iat: now,
    email: payload.email,
    secondaryEmail: payload.secondaryEmail,
    emailVerified: payload.emailVerified,
    rank: payload.rank,
    firstName: payload.firstName,
    lastName: payload.lastName,
    avatarUrl: payload.avatarUrl,
    brandLogoUrl: payload.brandLogoUrl,
    setupStatus: payload.setupStatus,
    businessCountry: payload.businessCountry,
    entityName: payload.entityName,
    socialName: payload.socialName,
    phoneNumber: payload.phoneNumber,
    themeName: payload.themeName,
    themeMode: payload.themeMode,
    mirorAvatarProfile: payload.mirorAvatarProfile,
    mirorEnchantmentEnabled: payload.mirorEnchantmentEnabled,
    mirorEnchantmentTiming: payload.mirorEnchantmentTiming,
    // Dashboard preferences (WARP'd during login)
    dashboardLayout: payload.dashboardLayout,
    dashboardWidgets: payload.dashboardWidgets,
    // Professional Genome
    genome: payload.genome
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());

  console.log(`FUSE JWT: ${Date.now() - startTime}ms (minting complete)`);
  return token;
}

export function setSessionCookie(res: import('next/server').NextResponse, token: string) {
  console.log('FUSE Cookie: Setting session cookie (FUSE_5.0)');
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: false, // Client-side readable for instant hydration (JWT is safe for client access)
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days TTT ready
  });
}

export function clearSessionCookie(res: import('next/server').NextResponse) {
  console.log('FUSE Cookie: Clearing session cookie');
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: false, // Match setSessionCookie setting
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

export async function readSessionCookie(): Promise<SessionPayload | null> {
  const startTime = Date.now();

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      console.log('FUSE Cookie: No session cookie found');
      return null;
    }

    const { payload } = await jwtVerify(token, getSecret());

    if (typeof payload?.clerkId !== 'string') {
      console.log('WARNING FUSE Cookie: Invalid session payload');
      return null;
    }

    const sessionData = {
      _id: payload._id as string,                  // ✅ Convex _id (required)
      clerkId: payload.clerkId,
      iat: Number(payload.iat ?? 0),
      email: payload.email as string | undefined,
      secondaryEmail: payload.secondaryEmail as string | undefined,
      emailVerified: payload.emailVerified as boolean | undefined,
      rank: payload.rank as string | undefined,
      firstName: payload.firstName as string | undefined,
      lastName: payload.lastName as string | undefined,
      avatarUrl: payload.avatarUrl as string | undefined,
      brandLogoUrl: payload.brandLogoUrl as string | undefined,
      setupStatus: payload.setupStatus as string | undefined,
      businessCountry: payload.businessCountry as string | undefined,
      entityName: payload.entityName as string | undefined,
      socialName: payload.socialName as string | undefined,
      phoneNumber: payload.phoneNumber as string | undefined,
      themeName: payload.themeName as string | undefined,
      themeMode: payload.themeMode as string | undefined,
      mirorAvatarProfile: payload.mirorAvatarProfile as AvatarOption | undefined,
      mirorEnchantmentEnabled: payload.mirorEnchantmentEnabled as boolean | undefined,
      mirorEnchantmentTiming: payload.mirorEnchantmentTiming as 'subtle' | 'magical' | 'playful' | undefined,
      // Dashboard preferences
      dashboardLayout: payload.dashboardLayout as 'classic' | 'focus' | 'metrics' | undefined,
      dashboardWidgets: payload.dashboardWidgets as string[] | undefined,
      // Professional Genome
      genome: payload.genome as SessionPayload['genome']
    };

    console.log(`FUSE Cookie: Session read ${Date.now() - startTime}ms (${sessionData.email})`);
    return sessionData;

  } catch (error) {
    console.log('ERROR FUSE Cookie: Session read failed -', error);
    return null;
  }
}

// Helper function to read theme preferences from cookie (for server-side rendering)
export async function readThemeFromCookie(): Promise<{ themeName: string; themeMode: string }> {
  try {
    const session = await readSessionCookie();
    return {
      themeName: session?.themeName || 'transtheme',
      themeMode: session?.themeMode || 'light'
    };
  } catch {
    return { themeName: 'transtheme', themeMode: 'light' };
  }
}

// Synchronous cookie reader for Edge Runtime (middleware)
export function getSessionFromCookie(cookieStore: { get: (name: string) => { value: string } | undefined }): SessionPayload | null {
  try {
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    // Simple JWT decode without verification (for middleware performance)
    // Full verification happens in API routes
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return {
      _id: payload._id,                        // ✅ Convex _id
      clerkId: payload.clerkId,
      iat: payload.iat || 0,
      email: payload.email,
      secondaryEmail: payload.secondaryEmail,
      emailVerified: payload.emailVerified,
      rank: payload.rank,
      firstName: payload.firstName,
      lastName: payload.lastName,
      avatarUrl: payload.avatarUrl,
      brandLogoUrl: payload.brandLogoUrl,
      setupStatus: payload.setupStatus,
      businessCountry: payload.businessCountry,
      entityName: payload.entityName,
      socialName: payload.socialName,
      phoneNumber: payload.phoneNumber,
      themeName: payload.themeName,
      themeMode: payload.themeMode,
      mirorAvatarProfile: payload.mirorAvatarProfile,
      mirorEnchantmentEnabled: payload.mirorEnchantmentEnabled,
      mirorEnchantmentTiming: payload.mirorEnchantmentTiming,
      // Dashboard preferences
      dashboardLayout: payload.dashboardLayout,
      dashboardWidgets: payload.dashboardWidgets,
      // Professional Genome
      genome: payload.genome
    };
  } catch {
    return null;
  }
}

// TTT Ready: JWT sessions scale to 100K users with <1ms cookie reads
// Store Brain: Session state bridge between server and client
// FUSE Core: The cookie that makes everything instant
