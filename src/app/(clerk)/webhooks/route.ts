import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  console.log(`[CLERK WEBHOOK] Received event: ${eventType}`);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // Get primary email
    const primaryEmail = email_addresses?.find((email) => email.id === evt.data.primary_email_address_id);

    // Get secondary email (verified only)
    const secondaryEmail = email_addresses?.find((email) =>
      email.id !== evt.data.primary_email_address_id &&
      email.verification?.status === 'verified'
    );

    // Check if primary email is verified
    const isEmailVerified = primaryEmail?.verification?.status === 'verified';

    console.log(`[CLERK WEBHOOK] Syncing user ${id}: primary=${primaryEmail?.email_address}, verified=${isEmailVerified}, secondary=${secondaryEmail?.email_address || 'none'}`);

    try {
      // Sync user data to Convex
      await convex.mutation(api.domains.admin.users.api.syncUserFromClerk, {
        clerkId: id,
        email: primaryEmail?.email_address,
        emailVerified: isEmailVerified,
        secondaryEmail: secondaryEmail?.email_address || undefined,
        firstName: first_name || undefined,
        lastName: last_name || undefined,
        avatarUrl: image_url || undefined,
      });

      console.log(`[CLERK WEBHOOK] Successfully synced user ${id}`);
    } catch (error) {
      console.error(`[CLERK WEBHOOK] Error syncing user ${id}:`, error);
      return new Response('Error syncing user to Convex', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}
