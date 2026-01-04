/**
 * Outlook Persistence Layer
 *
 * Message and folder storage mutations.
 * Called by sync orchestrator, never contains Graph API calls.
 */

import { v } from 'convex/values';
import { mutation } from '@/convex/_generated/server';
import { Id } from '@/convex/_generated/dataModel';

// Canonical folder taxonomy (shared with outlook.ts)
const CanonicalFolder = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  ARCHIVE: 'archive',
  SPAM: 'spam',
  TRASH: 'trash',
  OUTBOX: 'outbox',
  SCHEDULED: 'scheduled',
  SYSTEM: 'system',
} as const;

const CanonicalState = {
  UNREAD: 'unread',
  STARRED: 'starred',
  IMPORTANT: 'important',
  SNOOZED: 'snoozed',
  MUTED: 'muted',
  FOCUSED: 'focused',
  OTHER: 'other',
} as const;

type CanonicalFolderType = (typeof CanonicalFolder)[keyof typeof CanonicalFolder];
type CanonicalStateType = (typeof CanonicalState)[keyof typeof CanonicalState];

const OUTLOOK_FOLDER_MAP: Record<string, CanonicalFolderType> = {
  inbox: CanonicalFolder.INBOX,
  sentitems: CanonicalFolder.SENT,
  drafts: CanonicalFolder.DRAFTS,
  deleteditems: CanonicalFolder.TRASH,
  junkemail: CanonicalFolder.SPAM,
  archive: CanonicalFolder.ARCHIVE,
  outbox: CanonicalFolder.OUTBOX,
  'sent items': CanonicalFolder.SENT,
  sent: CanonicalFolder.SENT,
  'deleted items': CanonicalFolder.TRASH,
  trash: CanonicalFolder.TRASH,
  'junk email': CanonicalFolder.SPAM,
  junk: CanonicalFolder.SPAM,
  spam: CanonicalFolder.SPAM,
  scheduled: CanonicalFolder.SCHEDULED,
  'conversation history': CanonicalFolder.INBOX,
  clutter: CanonicalFolder.INBOX,
  'sync issues': CanonicalFolder.SYSTEM,
  conflicts: CanonicalFolder.SYSTEM,
  'local failures': CanonicalFolder.SYSTEM,
  'server failures': CanonicalFolder.SYSTEM,
};

function extractOutlookCanonicalStates(message: {
  isRead?: boolean;
  flag?: { flagStatus?: string };
  importance?: string;
  inferenceClassification?: string;
}): CanonicalStateType[] {
  const states: CanonicalStateType[] = [];
  if (message.isRead === false) states.push(CanonicalState.UNREAD);
  if (message.flag?.flagStatus === 'flagged') states.push(CanonicalState.STARRED);
  if (message.importance === 'high') states.push(CanonicalState.IMPORTANT);
  if (message.inferenceClassification === 'focused') states.push(CanonicalState.FOCUSED);
  else if (message.inferenceClassification === 'other') states.push(CanonicalState.OTHER);
  return states;
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE STORAGE
// ═══════════════════════════════════════════════════════════════════════════

export const storeOutlookMessages = mutation({
  args: {
    userId: v.id('admin_users'),
    messages: v.array(v.any()),
    bodyStorageMap: v.optional(v.record(v.string(), v.string())),
    folderMap: v.optional(v.record(v.string(), v.object({
      displayName: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    let messagesStored = 0;
    let messagesDeleted = 0;
    let foldersMigrated = 0;
    const folderDistribution: Record<string, number> = {};
    const now = Date.now();

    for (const message of args.messages) {
      // Handle @removed (Microsoft delta API)
      if (message['@removed']) {
        console.log(`🗑️ Delta @removed: ${message.id} (reason: ${message['@removed'].reason || 'unknown'})`);

        const existing = await ctx.db
          .query('productivity_email_Index')
          .withIndex('by_external_message_id', (q) => q.eq('externalMessageId', message.id))
          .filter((q) => q.eq(q.field('accountId'), account._id))
          .first();

        if (existing) {
          console.log(`🗑️ Found in DB, deleting: ${existing.subject?.substring(0, 30)}...`);
          const cacheEntry = await ctx.db
            .query('productivity_email_BodyCache')
            .withIndex('by_message', (q) => q.eq('messageId', message.id))
            .first();
          if (cacheEntry) {
            await ctx.storage.delete(cacheEntry.storageId);
            await ctx.db.delete(cacheEntry._id);
          }
          await ctx.db.delete(existing._id);
          messagesDeleted++;
        } else {
          console.log(`🗑️ Not found in DB (already deleted or never synced)`);
        }
        continue;
      }

      // Check if exists
      const existing = await ctx.db
        .query('productivity_email_Index')
        .withIndex('by_external_message_id', (q) => q.eq('externalMessageId', message.id))
        .filter((q) => q.eq(q.field('accountId'), account._id))
        .first();

      if (existing) {
        // Delete orphaned blob
        const orphanedStorageId = args.bodyStorageMap?.[message.id];
        if (orphanedStorageId) {
          await ctx.storage.delete(orphanedStorageId as Id<'_storage'>);
        }

        // Sync read state
        const newIsRead = message.isRead ?? false;
        if (existing.isRead !== newIsRead) {
          await ctx.db.patch(existing._id, { isRead: newIsRead, updatedAt: now });
        }

        // Update folder info
        if (message.parentFolderId && args.folderMap?.[message.parentFolderId]) {
          const folder = args.folderMap[message.parentFolderId];
          const mapped = OUTLOOK_FOLDER_MAP[folder.displayName.toLowerCase().trim()];

          if (mapped && existing.canonicalFolder !== mapped) {
            await ctx.db.patch(existing._id, {
              canonicalFolder: mapped,
              providerFolderId: message.parentFolderId,
              providerFolderName: folder.displayName,
              updatedAt: now,
            });
            foldersMigrated++;
          } else if (!existing.providerFolderId && message.parentFolderId) {
            await ctx.db.patch(existing._id, {
              providerFolderId: message.parentFolderId,
              providerFolderName: folder.displayName,
              updatedAt: now,
            });
            foldersMigrated++;
          }
        }
        continue;
      }

      // Parse recipients
      const toRecipients = (message.toRecipients || []).map((r: unknown) => {
        const recipient = r as { emailAddress?: { name?: string; address?: string } };
        return {
          name: recipient.emailAddress?.name || '',
          email: recipient.emailAddress?.address || '',
        };
      });

      const ccRecipients = (message.ccRecipients || []).map((r: unknown) => {
        const recipient = r as { emailAddress?: { name?: string; address?: string } };
        return {
          name: recipient.emailAddress?.name || '',
          email: recipient.emailAddress?.address || '',
        };
      });

      // Resolution state
      const isFromMe = message.from?.emailAddress?.address === user.email;
      const isUnread = !message.isRead;
      let resolutionState: 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none' = 'none';
      if (isUnread && !isFromMe) resolutionState = 'awaiting_me';
      else if (isFromMe) resolutionState = 'awaiting_them';

      // Body asset
      let bodyAssetId: Id<'productivity_email_Assets'> | undefined = undefined;
      let assetCount = 0;
      const bodyStorageId = args.bodyStorageMap?.[message.id];

      if (bodyStorageId) {
        const bodyContent = message.body?.content || '';
        const contentType = message.body?.contentType === 'html' ? 'text/html' : 'text/plain';
        const hash = `outlook-body-${message.id}`;
        const key = `email-assets/body/${hash}`;

        const assetId = await ctx.db.insert('productivity_email_Assets', {
          hash,
          key,
          contentType,
          size: new TextEncoder().encode(bodyContent).length,
          source: 'body',
          storageId: bodyStorageId as Id<'_storage'>,
          lastAccessedAt: now,
          referenceCount: 1,
          createdAt: now,
          updatedAt: now,
        });

        bodyAssetId = assetId;
        assetCount = 1;
      }

      // Canonical folder
      let canonicalFolder: CanonicalFolderType = CanonicalFolder.INBOX;
      let providerFolderName: string | undefined;

      if (message.parentFolderId && args.folderMap?.[message.parentFolderId]) {
        const folder = args.folderMap[message.parentFolderId];
        providerFolderName = folder.displayName;
        const mapped = OUTLOOK_FOLDER_MAP[folder.displayName.toLowerCase().trim()];
        if (mapped) canonicalFolder = mapped;
      } else if (message.isDraft) {
        canonicalFolder = CanonicalFolder.DRAFTS;
      }

      const canonicalStates = extractOutlookCanonicalStates({
        isRead: message.isRead,
        flag: message.flag,
        importance: message.importance,
        inferenceClassification: message.inferenceClassification,
      });

      const providerCategories: string[] = message.categories || [];

      await ctx.db.insert('productivity_email_Index', {
        externalMessageId: message.id,
        externalThreadId: message.conversationId,
        subject: message.subject || '(No subject)',
        snippet: message.bodyPreview || '',
        from: {
          name: message.from?.emailAddress?.name || '',
          email: message.from?.emailAddress?.address || '',
        },
        to: toRecipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        receivedAt: new Date(message.receivedDateTime).getTime(),
        hasAttachments: message.hasAttachments,
        isRead: message.isRead || false,
        accountId: account._id,
        ownerEmail: account.emailAddress, // For dashboard visibility
        resolutionState,
        canonicalFolder,
        canonicalStates,
        providerFolderId: message.parentFolderId || undefined,
        providerFolderName,
        providerCategories: providerCategories.length > 0 ? providerCategories : undefined,
        bodyAssetId,
        assetsProcessed: !!bodyAssetId,
        assetsProcessedAt: bodyAssetId ? now : undefined,
        assetCount,
        orgId: user._id as string,
        createdAt: now,
        updatedAt: now,
      });

      messagesStored++;
      folderDistribution[canonicalFolder] = (folderDistribution[canonicalFolder] || 0) + 1;
    }

    if (foldersMigrated > 0) console.log(`Migrated ${foldersMigrated} messages`);
    if (messagesDeleted > 0) console.log(`Removed ${messagesDeleted} deleted messages`);
    if (messagesStored > 0) {
      const dist = Object.entries(folderDistribution).map(([f, c]) => `${f}:${c}`).join(', ');
      console.log(`Stored ${messagesStored} messages (${dist})`);
    }

    return { messagesStored, messagesDeleted, foldersMigrated };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// STALE MESSAGE CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

export const removeStaleMessages = mutation({
  args: {
    userId: v.id('admin_users'),
    folderId: v.string(),
    validMessageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    const ourMessages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .filter((q) => q.eq(q.field('providerFolderId'), args.folderId))
      .collect();

    const validSet = new Set(args.validMessageIds);
    let deleted = 0;

    for (const message of ourMessages) {
      if (!validSet.has(message.externalMessageId)) {
        const cacheEntry = await ctx.db
          .query('productivity_email_BodyCache')
          .withIndex('by_message', (q) => q.eq('messageId', message.externalMessageId))
          .first();
        if (cacheEntry) {
          await ctx.storage.delete(cacheEntry.storageId);
          await ctx.db.delete(cacheEntry._id);
        }
        await ctx.db.delete(message._id);
        deleted++;
      }
    }

    if (deleted > 0) console.log(`Removed ${deleted} stale messages from folder`);
    return { deleted };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER STORAGE
// ═══════════════════════════════════════════════════════════════════════════

export const storeOutlookFolders = mutation({
  args: {
    userId: v.id('admin_users'),
    folders: v.array(v.object({
      externalFolderId: v.string(),
      displayName: v.string(),
      canonicalFolder: v.string(),
      parentFolderId: v.optional(v.string()),
      childFolderCount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    const now = Date.now();
    let created = 0;
    let updated = 0;

    // Build set of incoming folder IDs from Microsoft (source of truth)
    const incomingFolderIds = new Set(args.folders.map(f => f.externalFolderId));

    for (const folder of args.folders) {
      const existing = await ctx.db
        .query('productivity_email_Folders')
        .withIndex('by_account', (q) => q.eq('accountId', account._id))
        .filter((q) => q.eq(q.field('externalFolderId'), folder.externalFolderId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          displayName: folder.displayName,
          canonicalFolder: folder.canonicalFolder,
          parentFolderId: folder.parentFolderId,
          childFolderCount: folder.childFolderCount,
          updatedAt: now,
        });
        if (existing.deltaToken) {
          await ctx.db.patch(existing._id, { deltaToken: '' });
        }
        updated++;
      } else {
        await ctx.db.insert('productivity_email_Folders', {
          externalFolderId: folder.externalFolderId,
          displayName: folder.displayName,
          canonicalFolder: folder.canonicalFolder,
          parentFolderId: folder.parentFolderId,
          childFolderCount: folder.childFolderCount,
          accountId: account._id,
          provider: 'outlook',
          ownerEmail: account.emailAddress, // For dashboard visibility
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    // RECONCILIATION: Delete folders that exist in our DB but not on Microsoft
    // Microsoft is the source of truth - if it's gone there, remove it here
    let deleted = 0;
    const allLocalFolders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    for (const localFolder of allLocalFolders) {
      if (!incomingFolderIds.has(localFolder.externalFolderId)) {
        // Folder exists locally but not on Microsoft - delete it
        await ctx.db.delete(localFolder._id);
        deleted++;
        console.log(`🗑️ Reconciled: Deleted stale folder "${localFolder.displayName}" (not on Microsoft)`);
      }
    }

    console.log(`Folders: ${created} created, ${updated} updated, ${deleted} reconciled`);
    return { created, updated, deleted };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// TRASH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

// IMMEDIATE Convex update - call BEFORE Outlook API to prevent sync duplicates
export const batchMoveToTrashInDb = mutation({
  args: {
    userId: v.id('admin_users'),
    messageIds: v.array(v.id('productivity_email_Index')),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    let trashFolderId: string | undefined;
    let movedCount = 0;

    for (const messageId of args.messageIds) {
      const message = await ctx.db.get(messageId);
      if (!message) continue;

      // Find trash folder (cache after first lookup)
      if (!trashFolderId) {
        const trashFolder = await ctx.db
          .query('productivity_email_Folders')
          .withIndex('by_account', (q) => q.eq('accountId', message.accountId))
          .filter((q) => q.eq(q.field('canonicalFolder'), 'trash'))
          .first();
        trashFolderId = trashFolder?.externalFolderId;
      }

      // Update record to be in trash IMMEDIATELY
      // This prevents sync from creating duplicates while Outlook processes
      await ctx.db.patch(messageId, {
        canonicalFolder: 'trash',
        providerFolderId: trashFolderId ?? message.providerFolderId,
      });
      movedCount++;
    }

    console.log(`🗑️ Convex: Moved ${movedCount} messages to trash (before Outlook)`);
    return { moved: movedCount };
  },
});

export const moveMessageToTrash = mutation({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
    newExternalMessageId: v.optional(v.string()),
    newProviderFolderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    // Find the trash folder for this account
    const trashFolder = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', message.accountId))
      .filter((q) => q.eq(q.field('canonicalFolder'), 'trash'))
      .first();

    // RACE CONDITION FIX: If sync already created a record with the new ID, delete it
    // This happens when sync runs between Outlook move and our update
    const newExtId = args.newExternalMessageId;
    if (newExtId) {
      const duplicate = await ctx.db
        .query('productivity_email_Index')
        .withIndex('by_external_message_id', (q) => q.eq('externalMessageId', newExtId))
        .filter((q) => q.eq(q.field('accountId'), message.accountId))
        .first();

      if (duplicate && duplicate._id !== args.messageId) {
        console.log(`🧹 Deleting duplicate created by sync race: ${duplicate._id}`);
        await ctx.db.delete(duplicate._id);
      }
    }

    // UPDATE the record with new Outlook ID (Outlook assigns new ID when moving)
    // This prevents duplicates - we keep our record and update its externalMessageId
    await ctx.db.patch(args.messageId, {
      canonicalFolder: 'trash',
      providerFolderId: args.newProviderFolderId ?? trashFolder?.externalFolderId ?? message.providerFolderId,
      // Update externalMessageId if Outlook gave us a new one
      ...(args.newExternalMessageId ? { externalMessageId: args.newExternalMessageId } : {}),
    });

    return { success: true };
  },
});
