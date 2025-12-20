/**──────────────────────────────────────────────────────────────────────┐
│  🍪 FUSE Cookie Client Utilities                                       │
│  /fuse/store/session/cookieClient.ts                                   │
│                                                                        │
│  Client-side cookie reading and JWT decoding utilities                 │
│  Used by ClientHydrator for cookie change detection                    │
│                                                                        │
│  ⚠️  SECURITY NOTE: These utilities are for FUSE_5.0 cookie only.     │
│      Do NOT use for httpOnly cookies (they can't be read client-side) │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';

/**
 * Get cookie value by name from document.cookie
 *
 * @param name - Cookie name to retrieve
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  // Server-side guard
  if (typeof document === 'undefined') return null;

  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];

  return value || null;
}

/**
 * FUSE Cookie Payload Type
 * Matches ServerUser structure from server-side fetch
 *
 * 🛡️ SOVEREIGNTY: _id is the canonical identity (Convex), clerkId is auth reference
 */
export interface FuseCookiePayload {
  _id: string;         // ✅ Convex user _id (CANONICAL, sovereign identity)
  clerkId: string;     // Clerk ID for auth handoff reference only
  email?: string;
  secondaryEmail?: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  brandLogoUrl?: string;
  rank?: 'crew' | 'captain' | 'commodore' | 'admiral' | null;
  setupStatus?: 'pending' | 'complete' | null;
  businessCountry?: string;
  entityName?: string;
  socialName?: string;
  phoneNumber?: string;
  mirorAvatarProfile?: AvatarOption;
  mirorEnchantmentEnabled?: boolean;
  mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
  themeMode?: 'light' | 'dark';
  themeName?: 'transtheme';
  // Dashboard preferences (WARP'd during login)
  dashboardLayout?: 'classic' | 'focus' | 'metrics';
  dashboardWidgets?: string[];
  // Professional Genome (baked during genome save)
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
}

/**
 * Decode base64url string to UTF-8 text
 * JWT uses base64url encoding and may contain multi-byte UTF-8 characters (emojis, etc.)
 *
 * Steps:
 * 1. Convert base64url to standard base64
 * 2. Decode base64 to binary string
 * 3. Convert binary string to proper UTF-8
 */
function decodeBase64Url(base64url: string): string {
  // Step 1: Convert base64url to standard base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }

  // Step 2: Decode base64 to binary string
  const binaryString = atob(base64);

  // Step 3: Convert binary string to UTF-8 using TextDecoder
  // Each character in binaryString is a byte, so we convert to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // TextDecoder properly handles multi-byte UTF-8 sequences (emojis, etc.)
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Decode FUSE cookie (JWT format) to extract payload
 *
 * FUSE_5.0 cookie structure: header.payload.signature
 * We only need the payload for client-side state sync
 *
 * @param cookieValue - JWT-formatted cookie value
 * @returns Decoded payload object or null if invalid
 */
export function decodeFuseCookie(cookieValue: string): FuseCookiePayload | null {
  try {
    const parts = cookieValue.split('.');

    // JWT must have 3 parts: header.payload.signature
    if (parts.length !== 3) {
      console.warn('FUSE: Invalid cookie format - expected JWT with 3 parts');
      return null;
    }

    // Decode base64url payload with proper UTF-8 handling for emojis
    const jsonString = decodeBase64Url(parts[1]);
    const payload = JSON.parse(jsonString);
    return payload;
  } catch (error) {
    console.error('FUSE: Failed to decode cookie:', error);
    return null;
  }
}

/**
 * Get and decode FUSE_5.0 cookie in one call
 *
 * @returns Decoded FUSE cookie payload or null
 */
export function getFuseSession(): FuseCookiePayload | null {
  const cookieValue = getCookie('FUSE_5.0');
  if (!cookieValue) return null;

  return decodeFuseCookie(cookieValue);
}
