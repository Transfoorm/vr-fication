/**
 * 🛡️ S.I.D. COMPLIANT - User Profile API Route
 *
 * SID-9.1: Identity from FUSE session cookie, NOT Clerk auth()
 * SID-5.3: Convex mutations receive userId (sovereign _id), NOT clerkId
 */

import { NextRequest, NextResponse } from 'next/server';
import { readSessionCookie } from '@/fuse/hydration/session/cookie';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    // 🛡️ SID-9.1: Read sovereign identity from FUSE session cookie
    const session = await readSessionCookie();

    if (!session || !session._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🛡️ SID-5.3: Fetch user data using sovereign userId
    const user = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id as Id<"admin_users">,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🛡️ SID-9.1: Read sovereign identity from FUSE session cookie
    const session = await readSessionCookie();

    if (!session || !session._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      firstName,
      lastName,
      entityName,
      socialName,
      orgSlug,
      businessCountry,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !entityName || !socialName || !orgSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 🛡️ SID-5.3: Call Convex mutation with sovereign userId
    await convex.mutation(api.domains.admin.users.api.completeSetup, {
      userId: session._id as Id<"admin_users">,
      firstName,
      lastName,
      entityName,
      socialName,
      orgSlug,
      businessCountry,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 🛡️ SID-9.1: Read sovereign identity from FUSE session cookie
    const session = await readSessionCookie();

    if (!session || !session._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Handle profile updates (firstName, lastName)
    if (body.firstName !== undefined || body.lastName !== undefined) {
      // 🛡️ SID-5.3: Use sovereign userId
      await convex.mutation(api.domains.admin.users.api.updateProfile, {
        userId: session._id as Id<"admin_users">,
        firstName: body.firstName,
        lastName: body.lastName,
      });

      return NextResponse.json({ success: true });
    }

    // Handle entity updates (entityName, socialName, businessCountry)
    if (body.entityName !== undefined || body.socialName !== undefined || body.businessCountry !== undefined) {
      // 🛡️ SID-5.3: Use sovereign userId
      await convex.mutation(api.domains.admin.users.api.updateEntity, {
        userId: session._id as Id<"admin_users">,
        entityName: body.entityName,
        socialName: body.socialName,
        businessCountry: body.businessCountry,
      });

      return NextResponse.json({ success: true });
    }

    // Fallback: Handle businessCountry only (for backward compatibility)
    if (body.businessCountry) {
      // 🛡️ SID-5.3: Use sovereign userId
      await convex.mutation(api.domains.admin.users.api.updateBusinessCountry, {
        userId: session._id as Id<"admin_users">,
        businessCountry: body.businessCountry,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  } catch (error) {
    console.error('Profile patch error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
