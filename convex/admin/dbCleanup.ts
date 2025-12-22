/**─────────────────────────────────────────────────────────────────────────┐
│  🧹 DATABASE CLEANUP UTILITY                                              │
│  /convex/admin/dbCleanup.ts                                               │
│                                                                           │
│  Systematically wipes database tables for fresh start during development  │
│  ⚠️ USE WITH EXTREME CAUTION - IRREVERSIBLE DATA LOSS                     │
└───────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from '@/convex/_generated/server';
import { v } from 'convex/values';

/**
 * 🧹 DATABASE CLEANUP MUTATION
 *
 * Systematically deletes documents from database tables.
 *
 * MODES:
 * - "productivity_only" - Clears only productivity domain tables
 * - "data_only" - Clears all domain data (productivity, clients, finance, projects) but preserves admin_users
 * - "full_wipe" - ⚠️ NUCLEAR: Clears EVERYTHING including users (except caller)
 *
 * SAFETY:
 * - Caller's user account is NEVER deleted (even in full_wipe mode)
 * - Provides detailed logging of deletions
 * - Returns summary of deleted records
 */
export const cleanupDatabase = mutation({
  args: {
    mode: v.union(
      v.literal('productivity_only'),
      v.literal('data_only'),
      v.literal('full_wipe')
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

    console.log(`\n🔥 FULL WIPE COMPLETE - ${totalDeleted} documents deleted`);
    if (args.callerUserId) {
      console.log(`🛡️  Your user account (${args.callerUserId}) was preserved`);
    }

    return { mode: args.mode, totalDeleted, deletionLog };
  },
});
