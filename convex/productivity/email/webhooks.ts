/**─────────────────────────────────────────────────────────────────────────┐
│  🔔 OUTLOOK WEBHOOK HANDLERS                                             │
│  /convex/productivity/email/webhooks.ts                                  │
│                                                                          │
│  Handles Microsoft Graph webhook notifications for real-time email sync. │
│  When Microsoft notifies us of a change, we fetch and store the message. │
└───────────────────────────────────────────────────────────────────────────*/

import { v } from "convex/values";
import { action, query, internalMutation, internalAction } from "@/convex/_generated/server";
import { api, internal } from "@/convex/_generated/api";

// Microsoft Graph API base URL
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

// Webhook subscription lifetime (max is 4230 minutes = ~3 days for mail)
const SUBSCRIPTION_LIFETIME_MINUTES = 4200; // ~2.9 days, renew before expiry

/**
 * Generate a random client state for webhook verification
 */
function generateClientState(): string {
  // Generate random string using crypto for webhook verification
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * 🔔 CREATE WEBHOOK SUBSCRIPTION
 *
 * Registers a webhook subscription with Microsoft Graph for an email account.
 * Microsoft will call our endpoint when emails are created/updated/deleted.
 *
 * Called when user connects an Outlook account.
 */
export const createOutlookWebhookSubscription = action({
  args: {
    accountId: v.id("productivity_email_Accounts"),
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; subscriptionId?: string; error?: string }> => {
    console.log(`🔔 Creating webhook subscription for account ${args.accountId}`);

    // Get the email account to retrieve access token
    const account = await ctx.runQuery(api.productivity.email.webhooks.getEmailAccount, {
      accountId: args.accountId,
    });

    if (!account) {
      throw new Error("Email account not found");
    }

    if (!account.accessToken) {
      throw new Error("No access token for email account");
    }

    // ─────────────────────────────────────────────────────────────────────
    // TOKEN REFRESH: Check if token is expired or expiring soon
    // ─────────────────────────────────────────────────────────────────────
    let accessToken = account.accessToken;
    const now = Date.now();
    const tokenExpiresSoon = (account.tokenExpiresAt || 0) < now + 5 * 60 * 1000;

    if (tokenExpiresSoon && account.refreshToken) {
      console.log(`🔔 Token expired/expiring, refreshing...`);
      try {
        const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.OUTLOOK_CLIENT_ID || '',
            client_secret: process.env.OUTLOOK_CLIENT_SECRET || '',
            refresh_token: account.refreshToken,
            grant_type: 'refresh_token',
            scope: 'https://graph.microsoft.com/.default offline_access',
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          accessToken = refreshData.access_token;

          // Update account with new tokens
          await ctx.runMutation(internal.productivity.email.webhooks.updateAccountTokens, {
            accountId: args.accountId,
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token || account.refreshToken,
            expiresAt: Date.now() + (refreshData.expires_in || 3600) * 1000,
          });
          console.log(`🔔 Token refreshed successfully`);
        } else {
          console.error(`🔔 Token refresh failed: ${refreshResponse.status}`);
          throw new Error("Token refresh failed - user may need to reconnect Outlook");
        }
      } catch (refreshError) {
        console.error(`🔔 Token refresh error:`, refreshError);
        throw new Error("Token refresh failed - user may need to reconnect Outlook");
      }
    }

    // Check if subscription already exists
    const existingSubscription = await ctx.runQuery(
      api.productivity.email.webhooks.getSubscriptionByAccount,
      { accountId: args.accountId }
    );

    if (existingSubscription && existingSubscription.status === "active") {
      console.log(`🔔 Active subscription already exists: ${existingSubscription.subscriptionId}`);
      return { success: true, subscriptionId: existingSubscription.subscriptionId };
    }

    // Generate client state for verification
    const clientState = generateClientState();

    // Calculate expiration (max 4230 minutes for mail resources)
    const expirationDateTime = new Date(
      Date.now() + SUBSCRIPTION_LIFETIME_MINUTES * 60 * 1000
    ).toISOString();

    // Get the webhook URL from environment
    const webhookUrl = process.env.CONVEX_SITE_URL
      ? `${process.env.CONVEX_SITE_URL}/webhooks/outlook`
      : null;

    if (!webhookUrl) {
      throw new Error("CONVEX_SITE_URL not configured - cannot create webhook");
    }

    console.log(`🔔 Registering webhook at: ${webhookUrl}`);

    // Create subscription with Microsoft Graph
    const subscriptionPayload = {
      changeType: "created,updated,deleted",
      notificationUrl: webhookUrl,
      resource: "me/messages",
      expirationDateTime,
      clientState,
    };

    const response = await fetch(`${GRAPH_API_BASE}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔔 Failed to create subscription: ${response.status}`, errorText);

      // Store the error
      await ctx.runMutation(internal.productivity.email.webhooks.storeWebhookError, {
        accountId: args.accountId,
        userId: args.userId,
        error: `Failed to create subscription: ${response.status} - ${errorText}`,
      });

      throw new Error(`Failed to create Microsoft Graph subscription: ${errorText}`);
    }

    const subscription = await response.json();
    console.log(`🔔 Subscription created: ${subscription.id}`);

    // Store subscription in Convex
    await ctx.runMutation(internal.productivity.email.webhooks.storeWebhookSubscription, {
      subscriptionId: subscription.id,
      accountId: args.accountId,
      userId: args.userId,
      resource: "me/messages",
      changeTypes: ["created", "updated", "deleted"],
      clientState,
      expirationDateTime: new Date(subscription.expirationDateTime).getTime(),
    });

    return { success: true, subscriptionId: subscription.id };
  },
});

/**
 * 🔔 HANDLE INCOMING NOTIFICATION
 *
 * Called when Microsoft sends a webhook notification.
 * Fetches the changed message and stores it in Convex.
 * Internal action - called from HTTP endpoint.
 */
export const handleOutlookNotification = internalAction({
  args: {
    subscriptionId: v.string(),
    clientState: v.string(),
    changeType: v.string(),
    resourceId: v.optional(v.string()),
    resourceOdataId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; messageId?: string }> => {
    console.log(`🔔 Processing notification: ${args.changeType} for ${args.resourceId}`);

    // Look up the subscription to verify clientState and get account info
    const subscription = await ctx.runQuery(
      api.productivity.email.webhooks.getSubscriptionById,
      { subscriptionId: args.subscriptionId }
    );

    if (!subscription) {
      console.error(`🔔 Unknown subscription: ${args.subscriptionId}`);
      return { success: false, error: "Unknown subscription" };
    }

    // Verify clientState matches (security check)
    if (subscription.clientState !== args.clientState) {
      console.error(`🔔 Invalid clientState for subscription ${args.subscriptionId}`);
      return { success: false, error: "Invalid clientState" };
    }

    // Update last notification timestamp
    await ctx.runMutation(internal.productivity.email.webhooks.updateLastNotification, {
      subscriptionId: args.subscriptionId,
    });

    // Get the email account for access token
    const account = await ctx.runQuery(api.productivity.email.webhooks.getEmailAccount, {
      accountId: subscription.accountId,
    });

    if (!account || !account.accessToken) {
      console.error(`🔔 No access token for account ${subscription.accountId}`);
      return { success: false, error: "No access token" };
    }

    // Handle based on change type
    if (args.changeType === "deleted") {
      // Mark message as deleted in our database
      if (args.resourceId) {
        await ctx.runMutation(internal.productivity.email.webhooks.markMessageDeleted, {
          externalMessageId: args.resourceId,
          accountId: subscription.accountId,
        });
      }
      return { success: true };
    }

    // For created/updated, fetch the message from Microsoft Graph
    if (!args.resourceId) {
      console.error("🔔 No resourceId for created/updated notification");
      return { success: false, error: "No resourceId" };
    }

    // Fetch the specific message
    const messageResponse = await fetch(
      `${GRAPH_API_BASE}/me/messages/${args.resourceId}?$select=id,conversationId,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments,isRead,isDraft,parentFolderId`,
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
        },
      }
    );

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error(`🔔 Failed to fetch message: ${messageResponse.status}`, errorText);
      return { success: false, error: `Failed to fetch message: ${errorText}` };
    }

    const message = await messageResponse.json();
    console.log(`🔔 Fetched message: ${message.subject}`);

    // Store the message using the existing sync infrastructure
    // We reuse storeOutlookMessages mutation but with a single message
    await ctx.runMutation(api.productivity.email.outlook.storeOutlookMessages, {
      userId: subscription.userId,
      messages: [message],
      folderMap: {}, // Will be resolved from existing folders
    });

    console.log(`🔔 Stored message: ${message.id}`);
    return { success: true, messageId: message.id };
  },
});

/**
 * 🔔 RENEW WEBHOOK SUBSCRIPTION
 *
 * Extends the expiration of a webhook subscription.
 * Must be called before subscription expires (~3 days).
 */
export const renewOutlookWebhookSubscription = action({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; expirationDateTime?: string; error?: string }> => {
    console.log(`🔔 Renewing webhook subscription: ${args.subscriptionId}`);

    // Get subscription from our database
    const subscription = await ctx.runQuery(
      api.productivity.email.webhooks.getSubscriptionById,
      { subscriptionId: args.subscriptionId }
    );

    if (!subscription) {
      throw new Error(`Subscription not found: ${args.subscriptionId}`);
    }

    // Get account for access token
    const account = await ctx.runQuery(api.productivity.email.webhooks.getEmailAccount, {
      accountId: subscription.accountId,
    });

    if (!account || !account.accessToken) {
      throw new Error("No access token for email account");
    }

    // Calculate new expiration
    const newExpirationDateTime = new Date(
      Date.now() + SUBSCRIPTION_LIFETIME_MINUTES * 60 * 1000
    ).toISOString();

    // Renew with Microsoft Graph
    const response = await fetch(
      `${GRAPH_API_BASE}/subscriptions/${args.subscriptionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expirationDateTime: newExpirationDateTime,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔔 Failed to renew subscription: ${response.status}`, errorText);

      // Mark subscription as error
      await ctx.runMutation(internal.productivity.email.webhooks.updateSubscriptionStatus, {
        subscriptionId: args.subscriptionId,
        status: "error",
        error: `Failed to renew: ${errorText}`,
      });

      throw new Error(`Failed to renew subscription: ${errorText}`);
    }

    const renewed = await response.json();
    console.log(`🔔 Subscription renewed until: ${renewed.expirationDateTime}`);

    // Update our database
    await ctx.runMutation(internal.productivity.email.webhooks.updateSubscriptionExpiration, {
      subscriptionId: args.subscriptionId,
      expirationDateTime: new Date(renewed.expirationDateTime).getTime(),
    });

    return { success: true, expirationDateTime: renewed.expirationDateTime };
  },
});

/**
 * 🔔 DELETE WEBHOOK SUBSCRIPTION
 *
 * Removes a webhook subscription from Microsoft Graph.
 * Called when user disconnects email account.
 */
export const deleteOutlookWebhookSubscription = action({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    console.log(`🔔 Deleting webhook subscription: ${args.subscriptionId}`);

    // Get subscription from our database
    const subscription = await ctx.runQuery(
      api.productivity.email.webhooks.getSubscriptionById,
      { subscriptionId: args.subscriptionId }
    );

    if (!subscription) {
      console.log(`🔔 Subscription not found, nothing to delete`);
      return { success: true };
    }

    // Get account for access token
    const account = await ctx.runQuery(api.productivity.email.webhooks.getEmailAccount, {
      accountId: subscription.accountId,
    });

    if (account?.accessToken) {
      // Delete from Microsoft Graph
      const response = await fetch(
        `${GRAPH_API_BASE}/subscriptions/${args.subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        console.error(`🔔 Failed to delete subscription from Microsoft: ${response.status}`);
        // Continue anyway - we'll mark it as deleted in our database
      }
    }

    // Delete from our database
    await ctx.runMutation(internal.productivity.email.webhooks.deleteSubscription, {
      subscriptionId: args.subscriptionId,
    });

    console.log(`🔔 Subscription deleted: ${args.subscriptionId}`);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES (for reading subscription data)
// ═══════════════════════════════════════════════════════════════════════════

export const getEmailAccount = query({
  args: {
    accountId: v.id("productivity_email_Accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.accountId);
  },
});

export const getEmailAccountByUser = query({
  args: {
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productivity_email_Accounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("provider"), "outlook"))
      .first();
  },
});

export const getSubscriptionByAccount = query({
  args: {
    accountId: v.id("productivity_email_Accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .first();
  },
});

/**
 * Debug: List all webhook subscriptions
 */
export const debugListAllSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .collect();

    return {
      count: subscriptions.length,
      subscriptions: subscriptions.map((s) => ({
        subscriptionId: s.subscriptionId?.substring(0, 20) + "...",
        status: s.status,
        expirationDateTime: new Date(s.expirationDateTime).toISOString(),
        lastNotificationAt: s.lastNotificationAt
          ? new Date(s.lastNotificationAt).toISOString()
          : null,
        createdAt: new Date(s.createdAt).toISOString(),
      })),
    };
  },
});

export const getSubscriptionById = query({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscriptionId))
      .first();
  },
});

export const getExpiringSubscriptions = query({
  args: {
    beforeTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Get subscriptions expiring before the given timestamp
    return await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("expirationDateTime"), args.beforeTimestamp))
      .collect();
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL MUTATIONS (for storing subscription data)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update account tokens after refresh
 */
export const updateAccountTokens = internalMutation({
  args: {
    accountId: v.id("productivity_email_Accounts"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

export const storeWebhookSubscription = internalMutation({
  args: {
    subscriptionId: v.string(),
    accountId: v.id("productivity_email_Accounts"),
    userId: v.id("admin_users"),
    resource: v.string(),
    changeTypes: v.array(v.string()),
    clientState: v.string(),
    expirationDateTime: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if we're updating an existing subscription
    const existing = await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        subscriptionId: args.subscriptionId,
        resource: args.resource,
        changeTypes: args.changeTypes,
        clientState: args.clientState,
        expirationDateTime: args.expirationDateTime,
        status: "active",
        lastError: undefined,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new
    return await ctx.db.insert("productivity_email_WebhookSubscriptions", {
      subscriptionId: args.subscriptionId,
      accountId: args.accountId,
      userId: args.userId,
      resource: args.resource,
      changeTypes: args.changeTypes,
      clientState: args.clientState,
      expirationDateTime: args.expirationDateTime,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const storeWebhookError = internalMutation({
  args: {
    accountId: v.id("productivity_email_Accounts"),
    userId: v.id("admin_users"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if subscription exists
    const existing = await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "error",
        lastError: args.error,
        updatedAt: now,
      });
    }
  },
});

export const updateLastNotification = internalMutation({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscriptionId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        lastNotificationAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const updateSubscriptionStatus = internalMutation({
  args: {
    subscriptionId: v.string(),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("error")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscriptionId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: args.status,
        lastError: args.error,
        updatedAt: Date.now(),
      });
    }
  },
});

export const updateSubscriptionExpiration = internalMutation({
  args: {
    subscriptionId: v.string(),
    expirationDateTime: v.number(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscriptionId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        expirationDateTime: args.expirationDateTime,
        status: "active",
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteSubscription = internalMutation({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("productivity_email_WebhookSubscriptions")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscriptionId))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
  },
});

/**
 * 🔔 PROCESS WEBHOOK RENEWAL QUEUE
 *
 * Called by cron job to renew expiring subscriptions.
 * Checks for subscriptions expiring in the next hour and renews them.
 */
export const processWebhookRenewalQueue = internalAction({
  args: {},
  handler: async (ctx): Promise<{ renewed: number; failed: number }> => {
    console.log("🔔 Processing webhook renewal queue...");

    // Find subscriptions expiring in the next 2 hours
    const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;

    const expiringSubscriptions = await ctx.runQuery(
      api.productivity.email.webhooks.getExpiringSubscriptions,
      { beforeTimestamp: twoHoursFromNow }
    );

    console.log(`🔔 Found ${expiringSubscriptions.length} expiring subscriptions`);

    let renewed = 0;
    let failed = 0;

    for (const subscription of expiringSubscriptions) {
      try {
        await ctx.runAction(api.productivity.email.webhooks.renewOutlookWebhookSubscription, {
          subscriptionId: subscription.subscriptionId,
        });
        renewed++;
        console.log(`🔔 Renewed subscription: ${subscription.subscriptionId}`);
      } catch (error) {
        failed++;
        console.error(`🔔 Failed to renew subscription ${subscription.subscriptionId}:`, error);
      }
    }

    console.log(`🔔 Renewal complete: ${renewed} renewed, ${failed} failed`);
    return { renewed, failed };
  },
});

export const markMessageDeleted = internalMutation({
  args: {
    externalMessageId: v.string(),
    accountId: v.id("productivity_email_Accounts"),
  },
  handler: async (ctx, args) => {
    // Find the message by external ID
    const message = await ctx.db
      .query("productivity_email_Index")
      .withIndex("by_external_message_id", (q) => q.eq("externalMessageId", args.externalMessageId))
      .first();

    if (message) {
      // Move to trash folder
      await ctx.db.patch(message._id, {
        canonicalFolder: "trash",
        updatedAt: Date.now(),
      });
    }
  },
});
