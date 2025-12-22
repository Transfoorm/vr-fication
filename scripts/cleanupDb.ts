/**─────────────────────────────────────────────────────────────────────────┐
│  🧹 DATABASE CLEANUP CLI SCRIPT                                           │
│  /scripts/cleanupDb.ts                                                    │
│                                                                           │
│  Usage:                                                                   │
│    npm run cleanup:db -- --mode=productivity_only                         │
│    npm run cleanup:db -- --mode=data_only                                 │
│    npm run cleanup:db -- --mode=full_wipe                                 │
│                                                                           │
│  ⚠️ REQUIRES: User to be logged in (cookies must be set)                 │
└───────────────────────────────────────────────────────────────────────────┘ */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

// Get Convex deployment URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL not found in environment');
  console.error('   Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode='));
const userIdArg = args.find((arg) => arg.startsWith('--userId='));

if (!modeArg) {
  console.error('❌ Error: --mode argument required');
  console.error('\nUsage:');
  console.error('  npm run cleanup:db -- --mode=productivity_only');
  console.error('  npm run cleanup:db -- --mode=data_only');
  console.error('  npm run cleanup:db -- --mode=full_wipe');
  console.error('\nModes:');
  console.error('  productivity_only - Clears only productivity domain (email, calendar, etc.)');
  console.error('  data_only         - Clears all business data (clients, finance, projects, productivity)');
  console.error('  full_wipe         - ⚠️  NUCLEAR: Clears EVERYTHING including users (except you)');
  process.exit(1);
}

const mode = modeArg.split('=')[1] as 'productivity_only' | 'data_only' | 'full_wipe';

if (!['productivity_only', 'data_only', 'full_wipe'].includes(mode)) {
  console.error(`❌ Error: Invalid mode "${mode}"`);
  console.error('   Valid modes: productivity_only, data_only, full_wipe');
  process.exit(1);
}

if (!userIdArg) {
  console.error('❌ Error: --userId argument required');
  console.error('\nUsage:');
  console.error('  npm run cleanup:db -- --mode=productivity_only --userId=YOUR_USER_ID');
  console.error('\nTo find your userId, check the Convex dashboard admin_users table');
  process.exit(1);
}

const userId = userIdArg.split('=')[1];

// Confirm with user
console.log('\n⚠️  DATABASE CLEANUP CONFIRMATION');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Mode:         ${mode}`);
console.log(`User ID:      ${userId} (will be preserved)`);
console.log(`Convex URL:   ${CONVEX_URL}`);
console.log('═══════════════════════════════════════════════════════════════');

if (mode === 'full_wipe') {
  console.log('\n🔥 WARNING: FULL WIPE MODE SELECTED');
  console.log('   This will delete ALL users except you!');
  console.log('   This action is IRREVERSIBLE!');
}

console.log('\nStarting cleanup in 3 seconds...');
console.log('Press Ctrl+C to cancel\n');

// Run cleanup after delay
setTimeout(async () => {
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    console.log('🧹 Executing database cleanup...\n');

    const result = await client.mutation(api.admin.dbCleanup.cleanupDatabase, {
      mode,
      callerUserId: userId as Id<'admin_users'>,
    });

    console.log('\n✅ CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total deleted: ${result.totalDeleted} documents`);
    console.log('\nDeletion summary:');
    Object.entries(result.deletionLog).forEach(([table, count]) => {
      console.log(`  ${table.padEnd(40)} ${count} docs`);
    });
    console.log('═══════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ CLEANUP FAILED');
    console.error(error);
    process.exit(1);
  }
}, 3000);
