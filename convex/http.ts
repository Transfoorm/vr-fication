/**─────────────────────────────────────────────────────────────────────────┐
│  🌐 CONVEX HTTP ENDPOINTS                                                │
│  /convex/http.ts                                                         │
│                                                                          │
│  Public HTTP endpoints for webhooks and external integrations.           │
│  Microsoft Graph webhook notifications land here.                        │
└───────────────────────────────────────────────────────────────────────────*/

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * 🔔 MICROSOFT GRAPH WEBHOOK ENDPOINT
 *
 * Handles two types of requests:
 * 1. GET with ?validationToken= - Microsoft validates our endpoint exists
 * 2. POST with JSON body - Microsoft notifies us of changes
 *
 * Microsoft Graph Webhook Flow:
 * 1. We register subscription → Microsoft calls GET to validate
 * 2. Microsoft returns subscription ID
 * 3. When email changes → Microsoft calls POST with notification
 * 4. We fetch changed messages and store in Convex
 *
 * @see https://learn.microsoft.com/en-us/graph/webhooks
 */
http.route({
  path: "/webhooks/outlook",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Microsoft validation handshake
    // When we create a subscription, Microsoft sends a GET request
    // with ?validationToken=<token> to verify our endpoint exists.
    // We must echo back the token as plain text.

    const url = new URL(request.url);
    const validationToken = url.searchParams.get("validationToken");

    if (validationToken) {
      console.log("🔔 Microsoft Graph webhook validation request received");

      // Echo back the validation token as plain text
      return new Response(validationToken, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // No validation token = invalid request
    return new Response("Missing validationToken", { status: 400 });
  }),
});

http.route({
  path: "/webhooks/outlook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Microsoft sends change notifications as POST requests
    // Body contains array of notifications with resource IDs

    try {
      const body = await request.json();
      console.log("🔔 Microsoft Graph webhook notification received:", JSON.stringify(body, null, 2));

      // Microsoft Graph notification format:
      // {
      //   "value": [
      //     {
      //       "subscriptionId": "...",
      //       "clientState": "our-secret",
      //       "changeType": "created",
      //       "resource": "me/messages/{messageId}",
      //       "resourceData": {
      //         "@odata.type": "#Microsoft.Graph.Message",
      //         "@odata.id": "me/messages/{messageId}",
      //         "id": "{messageId}"
      //       }
      //     }
      //   ]
      // }

      const notifications = body.value || [];

      if (notifications.length === 0) {
        console.log("🔔 Empty notification batch, acknowledging");
        return new Response("OK", { status: 200 });
      }

      // Process each notification
      for (const notification of notifications) {
        const { subscriptionId, clientState, changeType, resourceData } = notification;

        console.log(`🔔 Processing notification: subscriptionId=${subscriptionId}, changeType=${changeType}`);

        // Schedule the handler action to process this notification
        // We do this async so we can respond to Microsoft quickly (< 3 seconds)
        await ctx.runAction(internal.productivity.email.webhooks.handleOutlookNotification, {
          subscriptionId,
          clientState,
          changeType,
          resourceId: resourceData?.id,
          resourceOdataId: resourceData?.["@odata.id"],
        });
      }

      // Must respond with 200 within 3 seconds or Microsoft will retry
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("🔔 Webhook error:", error);

      // Return 200 anyway to prevent Microsoft from retrying
      // Log the error for debugging
      return new Response("OK", { status: 200 });
    }
  }),
});

export default http;
