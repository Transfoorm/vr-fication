/**─────────────────────────────────────────────────────────────────────────┐
│  🧹 DATABASE CLEANUP UTILITY                                              │
│  /convex/admin/dbCleanup.ts                                               │
│                                                                           │
│  Systematically wipes database tables for fresh start during development  │
│  ⚠️ USE WITH EXTREME CAUTION - IRREVERSIBLE DATA LOSS                     │
└───────────────────────────────────────────────────────────────────────────┘ */

import { mutation, query, action } from '@/convex/_generated/server';
import { v } from 'convex/values';
import { api } from '@/convex/_generated/api';
import type { TableNames, Id } from '@/convex/_generated/dataModel';
import type { GenericId } from 'convex/values';

// Type for documents with potential storage fields
type DocWithStorage = {
  _id: GenericId<TableNames>;
  storageId?: Id<'_storage'>;
  avatarUrl?: string | Id<'_storage'>;
  brandLogoUrl?: string | Id<'_storage'>;
};

// Batch size to stay well under Convex's 4096 read limit
const BATCH_SIZE = 500;

/**
 * 🔍 CHECK DATABASE STATUS
 * Returns counts for all tables to see what needs cleaning
 */
export const getDatabaseCounts = query({
  args: {},
  handler: async (ctx) => {
    const counts: Record<string, number> = {};

    // Productivity domain
    counts['productivity_email_Messages'] = (await ctx.db.query('productivity_email_Messages').collect()).length;
    counts['productivity_email_Index'] = (await ctx.db.query('productivity_email_Index').collect()).length;
    counts['productivity_email_Accounts'] = (await ctx.db.query('productivity_email_Accounts').collect()).length;
    counts['productivity_email_SenderCache'] = (await ctx.db.query('productivity_email_SenderCache').collect()).length;
    counts['productivity_email_AssetReferences'] = (await ctx.db.query('productivity_email_AssetReferences').collect()).length;
    counts['productivity_email_Assets'] = (await ctx.db.query('productivity_email_Assets').collect()).length;
    counts['productivity_calendar_Events'] = (await ctx.db.query('productivity_calendar_Events').collect()).length;
    counts['productivity_bookings_Form'] = (await ctx.db.query('productivity_bookings_Form').collect()).length;
    counts['productivity_pipeline_Prospects'] = (await ctx.db.query('productivity_pipeline_Prospects').collect()).length;

    // Other domains
    counts['clients_contacts_Users'] = (await ctx.db.query('clients_contacts_Users').collect()).length;
    counts['finance_banking_Statements'] = (await ctx.db.query('finance_banking_Statements').collect()).length;
    counts['projects_tracking_Schedule'] = (await ctx.db.query('projects_tracking_Schedule').collect()).length;
    counts['projects_tracking_Costs'] = (await ctx.db.query('projects_tracking_Costs').collect()).length;
    counts['settings_account_Genome'] = (await ctx.db.query('settings_account_Genome').collect()).length;

    // Admin domain
    counts['admin_users'] = (await ctx.db.query('admin_users').collect()).length;
    counts['admin_users_ClerkRegistry'] = (await ctx.db.query('admin_users_ClerkRegistry').collect()).length;
    counts['admin_users_DeleteLog'] = (await ctx.db.query('admin_users_DeleteLog').collect()).length;

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return { counts, total };
  },
});

/**
 * 🧹 BATCH DELETE - Deletes up to BATCH_SIZE documents from a single table
 * Call repeatedly until hasMore is false
 */
export const batchDeleteTable = mutation({
  args: {
    table: v.string(),
    includeStorage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tableName = args.table as TableNames;
    let deleted = 0;
    let storageDeleted = 0;

    // Get batch of documents
    const docs = await ctx.db.query(tableName).take(BATCH_SIZE) as DocWithStorage[];

    for (const doc of docs) {
      // Handle storage files for assets table
      if (args.includeStorage && tableName === 'productivity_email_Assets' && doc.storageId) {
        try {
          await ctx.storage.delete(doc.storageId);
          storageDeleted++;
        } catch {
          // Already deleted or doesn't exist
        }
      }

      // Handle storage files for admin_users (avatars/logos)
      if (args.includeStorage && tableName === 'admin_users') {
        if (doc.avatarUrl && typeof doc.avatarUrl === 'string' && doc.avatarUrl.startsWith('k')) {
          try {
            await ctx.storage.delete(doc.avatarUrl as Id<'_storage'>);
            storageDeleted++;
          } catch { /* ignore */ }
        }
        if (doc.brandLogoUrl && typeof doc.brandLogoUrl === 'string' && doc.brandLogoUrl.startsWith('k')) {
          try {
            await ctx.storage.delete(doc.brandLogoUrl as Id<'_storage'>);
            storageDeleted++;
          } catch { /* ignore */ }
        }
      }

      await ctx.db.delete(doc._id);
      deleted++;
    }

    // Check if more remain
    const remaining = await ctx.db.query(tableName).take(1);
    const hasMore = remaining.length > 0;

    console.log(`🗑️  ${tableName}: deleted ${deleted} (storage: ${storageDeleted}), hasMore: ${hasMore}`);

    return { deleted, storageDeleted, hasMore, table: args.table };
  },
});

/**
 * 🧹 DATABASE CLEANUP MUTATION
 *
 * Systematically deletes documents from database tables.
 *
 * MODES:
 * - "productivity_only" - Clears only productivity domain tables
 * - "data_only" - Clears all domain data (productivity, clients, finance, projects) but preserves admin_users
 * - "full_wipe" - ⚠️ NUCLEAR: Clears EVERYTHING including users (except caller)
 * - "atomic" - ☢️ EXTINCTION: Clears EVERYTHING including caller + storage files. Pristine DB like new project.
 *
 * SAFETY:
 * - Caller's user account is preserved in full_wipe mode
 * - In atomic mode, NO protection - everything is deleted including caller
 * - Provides detailed logging of deletions
 * - Returns summary of deleted records
 */
export const cleanupDatabase = mutation({
  args: {
    mode: v.union(
      v.literal('productivity_only'),
      v.literal('data_only'),
      v.literal('full_wipe'),
      v.literal('atomic')
    ),
    callerUserId: v.optional(v.id('admin_users')),
  },
  handler: async (ctx, args) => {
    console.log(`🧹 DATABASE CLEANUP STARTED - Mode: ${args.mode}`);
    if (args.callerUserId) {
      console.log(`🛡️  Protected User: ${args.callerUserId}`);
    } else {
      console.log(`🔥 TRUE NUKE MODE - NO PROTECTION - DELETING EVERYTHING`);
    }

    const deletionLog: Record<string, number> = {};
    let totalDeleted = 0;

    // Helper to log and track deletions
    const logDeletion = (table: string, count: number) => {
      deletionLog[table] = count;
      totalDeleted += count;
      console.log(`  ✅ ${table}: ${count} documents deleted`);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PRODUCTIVITY DOMAIN TABLES
    // ═══════════════════════════════════════════════════════════════════════

    console.log('\n📧 Clearing Productivity Domain...');

    // productivity_email_Messages
    const emailMessages = await ctx.db.query('productivity_email_Messages').collect();
    for (const doc of emailMessages) await ctx.db.delete(doc._id);
    logDeletion('productivity_email_Messages', emailMessages.length);

    // productivity_email_Index
    const emailIndex = await ctx.db.query('productivity_email_Index').collect();
    for (const doc of emailIndex) await ctx.db.delete(doc._id);
    logDeletion('productivity_email_Index', emailIndex.length);

    // productivity_email_Accounts
    const emailAccounts = await ctx.db.query('productivity_email_Accounts').collect();
    for (const doc of emailAccounts) await ctx.db.delete(doc._id);
    logDeletion('productivity_email_Accounts', emailAccounts.length);

    // productivity_email_SenderCache
    const senderCache = await ctx.db.query('productivity_email_SenderCache').collect();
    for (const doc of senderCache) await ctx.db.delete(doc._id);
    logDeletion('productivity_email_SenderCache', senderCache.length);

    // productivity_email_AssetReferences
    const assetRefs = await ctx.db.query('productivity_email_AssetReferences').collect();
    for (const doc of assetRefs) await ctx.db.delete(doc._id);
    logDeletion('productivity_email_AssetReferences', assetRefs.length);

    // productivity_email_Assets
    const assets = await ctx.db.query('productivity_email_Assets').collect();
    for (const doc of assets) await ctx.db.delete(doc._id);
    logDeletion('productivity_email_Assets', assets.length);

    // productivity_calendar_Events
    const calendarEvents = await ctx.db.query('productivity_calendar_Events').collect();
    for (const doc of calendarEvents) await ctx.db.delete(doc._id);
    logDeletion('productivity_calendar_Events', calendarEvents.length);

    // productivity_bookings_Form
    const bookingsForm = await ctx.db.query('productivity_bookings_Form').collect();
    for (const doc of bookingsForm) await ctx.db.delete(doc._id);
    logDeletion('productivity_bookings_Form', bookingsForm.length);

    // productivity_pipeline_Prospects
    const prospects = await ctx.db.query('productivity_pipeline_Prospects').collect();
    for (const doc of prospects) await ctx.db.delete(doc._id);
    logDeletion('productivity_pipeline_Prospects', prospects.length);

    // Stop here if productivity_only mode
    if (args.mode === 'productivity_only') {
      console.log(`\n✅ PRODUCTIVITY CLEANUP COMPLETE - ${totalDeleted} documents deleted`);
      return { mode: args.mode, totalDeleted, deletionLog };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // OTHER DOMAIN TABLES (data_only and full_wipe)
    // ═══════════════════════════════════════════════════════════════════════

    console.log('\n💼 Clearing Clients Domain...');
    const clientsUsers = await ctx.db.query('clients_contacts_Users').collect();
    for (const doc of clientsUsers) await ctx.db.delete(doc._id);
    logDeletion('clients_contacts_Users', clientsUsers.length);

    console.log('\n💰 Clearing Finance Domain...');
    const statements = await ctx.db.query('finance_banking_Statements').collect();
    for (const doc of statements) await ctx.db.delete(doc._id);
    logDeletion('finance_banking_Statements', statements.length);

    console.log('\n📊 Clearing Projects Domain...');
    const schedule = await ctx.db.query('projects_tracking_Schedule').collect();
    for (const doc of schedule) await ctx.db.delete(doc._id);
    logDeletion('projects_tracking_Schedule', schedule.length);

    const costs = await ctx.db.query('projects_tracking_Costs').collect();
    for (const doc of costs) await ctx.db.delete(doc._id);
    logDeletion('projects_tracking_Costs', costs.length);

    console.log('\n⚙️  Clearing Settings Domain...');
    const genome = await ctx.db.query('settings_account_Genome').collect();
    for (const doc of genome) await ctx.db.delete(doc._id);
    logDeletion('settings_account_Genome', genome.length);

    // Stop here if data_only mode
    if (args.mode === 'data_only') {
      console.log(`\n✅ DATA CLEANUP COMPLETE - ${totalDeleted} documents deleted`);
      return { mode: args.mode, totalDeleted, deletionLog };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN/IDENTITY TABLES (full_wipe only - NUCLEAR)
    // ═══════════════════════════════════════════════════════════════════════

    console.log('\n⚠️  FULL WIPE MODE - Clearing Admin/Identity Domain...');
    console.log('⚠️  WARNING: This will delete all users except caller!');

    // admin_users_DeleteLog
    const deleteLog = await ctx.db.query('admin_users_DeleteLog').collect();
    for (const doc of deleteLog) await ctx.db.delete(doc._id);
    logDeletion('admin_users_DeleteLog', deleteLog.length);

    // admin_users (with caller protection)
    const adminUsers = await ctx.db.query('admin_users').collect();
    let usersDeleted = 0;
    for (const doc of adminUsers) {
      if (args.callerUserId && doc._id === args.callerUserId) {
        console.log(`🛡️  Skipping deletion of caller user: ${doc._id}`);
        continue;
      }
      await ctx.db.delete(doc._id);
      usersDeleted++;
    }
    logDeletion('admin_users', usersDeleted);

    // admin_users_ClerkRegistry (with caller protection)
    const clerkRegistry = await ctx.db.query('admin_users_ClerkRegistry').collect();
    let registryDeleted = 0;
    for (const doc of clerkRegistry) {
      if (args.callerUserId && doc.userId === args.callerUserId) {
        console.log(`🛡️  Skipping deletion of caller ClerkRegistry: ${doc._id}`);
        continue;
      }
      await ctx.db.delete(doc._id);
      registryDeleted++;
    }
    logDeletion('admin_users_ClerkRegistry', registryDeleted);

    // Stop here if full_wipe mode
    if (args.mode === 'full_wipe') {
      console.log(`\n🔥 FULL WIPE COMPLETE - ${totalDeleted} documents deleted`);
      if (args.callerUserId) {
        console.log(`🛡️  Your user account (${args.callerUserId}) was preserved`);
      }
      return { mode: args.mode, totalDeleted, deletionLog };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATOMIC MODE - PRISTINE DATABASE (NO PROTECTION, NO SURVIVORS)
    // ═══════════════════════════════════════════════════════════════════════

    console.log('\n☢️  ATOMIC MODE - DELETING EVERYTHING INCLUDING CALLER...');
    console.log('☢️  WARNING: This will make the database completely pristine!');

    // Delete ALL files from _storage BEFORE deleting user records
    console.log('\n💾 Clearing Convex File Storage...');
    let storageFilesDeleted = 0;

    // 1. Delete email asset files (from productivity_email_Assets we collected earlier)
    for (const asset of assets.filter(a => a.storageId)) {
      try {
        await ctx.storage.delete(asset.storageId!);
        storageFilesDeleted++;
      } catch {
        // Storage file may already be deleted or not exist
      }
    }

    // 2. Delete avatar and brand logo files from ALL users (including caller)
    // We need to re-query admin_users since some may have been deleted in full_wipe
    // but caller was preserved - now we delete their files too
    const allUsersForFiles = await ctx.db.query('admin_users').collect();
    for (const user of allUsersForFiles) {
      // Delete avatar if it's a storage ID (not a URL string)
      if (user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.startsWith('k')) {
        try {
          // Storage IDs start with certain prefixes - try to delete
          await ctx.storage.delete(user.avatarUrl as Id<'_storage'>);
          storageFilesDeleted++;
        } catch {
          // Not a valid storage ID or already deleted
        }
      }
      // Delete brand logo if it's a storage ID
      if (user.brandLogoUrl && typeof user.brandLogoUrl === 'string' && user.brandLogoUrl.startsWith('k')) {
        try {
          await ctx.storage.delete(user.brandLogoUrl as Id<'_storage'>);
          storageFilesDeleted++;
        } catch {
          // Not a valid storage ID or already deleted
        }
      }
    }

    if (storageFilesDeleted > 0) {
      logDeletion('_storage (files)', storageFilesDeleted);
    }

    // Delete the caller's account (if we skipped it earlier in full_wipe logic)
    if (args.callerUserId) {
      const callerUser = await ctx.db.get(args.callerUserId);
      if (callerUser) {
        await ctx.db.delete(args.callerUserId);
        deletionLog['admin_users'] = (deletionLog['admin_users'] || 0) + 1;
        totalDeleted += 1;
        console.log(`☢️  Deleted caller user: ${args.callerUserId}`);
      }

      // Delete caller's ClerkRegistry entry
      const callerRegistry = await ctx.db.query('admin_users_ClerkRegistry')
        .filter((q) => q.eq(q.field('userId'), args.callerUserId))
        .first();
      if (callerRegistry) {
        await ctx.db.delete(callerRegistry._id);
        deletionLog['admin_users_ClerkRegistry'] = (deletionLog['admin_users_ClerkRegistry'] || 0) + 1;
        totalDeleted += 1;
        console.log(`☢️  Deleted caller ClerkRegistry: ${callerRegistry._id}`);
      }
    }

    console.log(`\n☢️  ATOMIC NUKE COMPLETE - ${totalDeleted} documents deleted`);
    console.log('☢️  Database is now PRISTINE. You will need to re-create your account.');
    console.log('💡 Note: Convex system logs are not deletable via API - clear via dashboard if needed.');

    return { mode: args.mode, totalDeleted, deletionLog };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// ATOMIC NUKE WITH CLERK DELETION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ☢️ ATOMIC NUKE ACTION - Deletes EVERYTHING including Clerk accounts
 *
 * This is an ACTION (not mutation) because it needs to call Clerk API.
 *
 * Process:
 * 1. Get all Clerk IDs from ClerkRegistry
 * 2. Delete each user from Clerk via API
 * 3. Batch delete all Convex tables
 * 4. Delete all storage files
 *
 * WARNING: This is IRREVERSIBLE and affects EXTERNAL systems (Clerk)!
 */
export const atomicNukeWithClerk = action({
  args: {},
  handler: async (ctx) => {
    console.log('☢️ ATOMIC NUKE WITH CLERK DELETION INITIATED');
    console.log('☢️ This will delete ALL users from Clerk AND all Convex data');

    const results = {
      clerkUsersDeleted: 0,
      clerkUsersFailed: 0,
      clerkErrors: [] as string[],
      convexTablesCleared: [] as string[],
      totalConvexDeleted: 0,
      storageFilesDeleted: 0,
    };

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Get all Clerk IDs from registry
    // ═══════════════════════════════════════════════════════════════

    console.log('\n📋 Step 1: Getting all Clerk IDs from registry...');

    const clerkRegistry = await ctx.runQuery(api.admin.dbCleanup.getAllClerkIds);

    console.log(`   Found ${clerkRegistry.length} Clerk accounts to delete`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Delete each user from Clerk
    // ═══════════════════════════════════════════════════════════════

    console.log('\n🔥 Step 2: Deleting users from Clerk...');

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.error('❌ CLERK_SECRET_KEY not found - skipping Clerk deletion');
      results.clerkErrors.push('CLERK_SECRET_KEY not found in environment');
    } else {
      for (const entry of clerkRegistry) {
        try {
          console.log(`   Deleting Clerk user: ${entry.externalId}`);

          // Using globalThis.fetch for server-side Clerk API call (ESLint rule is for client components)
          const response = await globalThis.fetch(`https://api.clerk.com/v1/users/${entry.externalId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${clerkSecretKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok || response.status === 404) {
            console.log(`   ✅ Deleted: ${entry.externalId}`);
            results.clerkUsersDeleted++;
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.errors?.[0]?.message || `HTTP ${response.status}`;
            console.error(`   ❌ Failed: ${entry.externalId} - ${errorMsg}`);
            results.clerkUsersFailed++;
            results.clerkErrors.push(`${entry.externalId}: ${errorMsg}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`   ❌ Error: ${entry.externalId} - ${errorMsg}`);
          results.clerkUsersFailed++;
          results.clerkErrors.push(`${entry.externalId}: ${errorMsg}`);
        }
      }
    }

    console.log(`\n   Clerk deletion complete: ${results.clerkUsersDeleted} deleted, ${results.clerkUsersFailed} failed`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Batch delete all Convex tables
    // ═══════════════════════════════════════════════════════════════

    console.log('\n💾 Step 3: Deleting all Convex data...');

    // Order matters - delete references before parents
    const tablesToDelete = [
      // Productivity (with storage)
      { table: 'productivity_email_AssetReferences', includeStorage: false },
      { table: 'productivity_email_Assets', includeStorage: true },
      { table: 'productivity_email_Index', includeStorage: false },
      { table: 'productivity_email_Messages', includeStorage: false },
      { table: 'productivity_email_Accounts', includeStorage: false },
      { table: 'productivity_email_SenderCache', includeStorage: false },
      { table: 'productivity_calendar_Events', includeStorage: false },
      { table: 'productivity_bookings_Form', includeStorage: false },
      { table: 'productivity_pipeline_Prospects', includeStorage: false },
      // Business data
      { table: 'clients_contacts_Users', includeStorage: false },
      { table: 'finance_banking_Statements', includeStorage: false },
      { table: 'projects_tracking_Costs', includeStorage: false },
      { table: 'projects_tracking_Schedule', includeStorage: false },
      { table: 'settings_account_Genome', includeStorage: false },
      // Admin (with storage for avatars/logos)
      { table: 'admin_users_DeleteLog', includeStorage: false },
      { table: 'admin_users', includeStorage: true },
      { table: 'admin_users_ClerkRegistry', includeStorage: false },
    ];

    for (const { table, includeStorage } of tablesToDelete) {
      let hasMore = true;
      let tableTotal = 0;

      while (hasMore) {
        const result = await ctx.runMutation(api.admin.dbCleanup.batchDeleteTable, {
          table,
          includeStorage,
        });

        tableTotal += result.deleted;
        results.storageFilesDeleted += result.storageDeleted;
        hasMore = result.hasMore;
      }

      if (tableTotal > 0) {
        console.log(`   ✅ ${table}: ${tableTotal} deleted`);
        results.convexTablesCleared.push(table);
        results.totalConvexDeleted += tableTotal;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // FINAL REPORT
    // ═══════════════════════════════════════════════════════════════

    console.log('\n☢️ ═══════════════════════════════════════════════════════════════');
    console.log('☢️ ATOMIC NUKE COMPLETE');
    console.log('☢️ ═══════════════════════════════════════════════════════════════');
    console.log(`☢️ Clerk accounts deleted: ${results.clerkUsersDeleted}`);
    console.log(`☢️ Clerk accounts failed: ${results.clerkUsersFailed}`);
    console.log(`☢️ Convex documents deleted: ${results.totalConvexDeleted}`);
    console.log(`☢️ Storage files deleted: ${results.storageFilesDeleted}`);
    console.log('☢️ ═══════════════════════════════════════════════════════════════');

    return results;
  },
});

/**
 * Helper query to get all Clerk IDs from registry
 * (Queries don't count against mutation limits)
 */
export const getAllClerkIds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('admin_users_ClerkRegistry').collect();
  },
});
