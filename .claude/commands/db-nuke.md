---
description: Database Cleanup Tool - Systematically wipe DB tables for fresh start
tags: [database, cleanup, development, nuclear]
---

# 🧹 DB-NUKE: DATABASE CLEANUP COMMAND

You are the **Database Cleanup Guardian**. Your duty is to safely and systematically wipe database tables for pristine fresh starts during development.

**⚠️ IRREVERSIBLE DATA LOSS - USE WITH EXTREME CAUTION**

---

## EXECUTION PROTOCOL

### Phase 1: User Identity Detection

Detect the caller's Convex user ID automatically:

```typescript
// From FUSE store
const user = useFuse((state) => state.user);
const callerUserId = user?.convexId as Id<'admin_users'>;
```

If not available in FUSE, ask user to provide their userId from Convex dashboard.

**Report to user:**
```
🧹 DB-NUKE INITIATED

Detected User ID: [userId]
This account will be PROTECTED from deletion.
```

---

### Phase 2: Mode Selection

Present EXACTLY these 4 options using AskUserQuestion:

**Question:** "Which cleanup mode do you want to execute?"

**Header:** "Cleanup Mode"

**Options:**

1. **productivity_only** (Recommended)
   - Description: "Clears only productivity domain (email, calendar, bookings, pipeline). Preserves all users and other business data. Safest option for fixing email sync issues."

2. **data_only**
   - Description: "Clears ALL business data (productivity + clients + finance + projects + settings). Preserves users and identity tables. Use when you need a complete data reset but want to keep user accounts."

3. **full_wipe** ⚠️ NUCLEAR
   - Description: "Clears EVERYTHING including all users except you (admin_users, ClerkRegistry, DeleteLog). Complete database reset. EXTREMELY DANGEROUS - only use for full dev environment reset."

4. **atomic** ☢️ EXTINCTION
   - Description: "Clears ABSOLUTELY EVERYTHING including YOU, all storage files, every document. Database becomes pristine like a brand new Convex project. You will need to sign up again from scratch."

5. **atomic_with_clerk** ☢️💀 TOTAL ANNIHILATION
   - Description: "Clears EVERYTHING from Convex AND deletes all users from Clerk. Complete system reset - both database AND authentication provider. The ultimate fresh start."

---

### Phase 3: Nuclear Confirmation (full_wipe, atomic, and atomic_with_clerk)

If user selects `full_wipe`, show additional AskUserQuestion:

**Question:** "You selected FULL WIPE. This will DELETE ALL USERS (except you) and ALL DATA. This is IRREVERSIBLE. Are you absolutely certain?"

**Header:** "Nuclear Confirm"

**Options:**
1. **yes_nuke_everything** - Description: "YES, I understand this will delete everything. Proceed with full wipe."
2. **cancel** - Description: "CANCEL - I changed my mind. Go back to mode selection."

If user selects `atomic`, show DOUBLE confirmation:

**First AskUserQuestion:**
**Question:** "You selected ATOMIC EXTINCTION. This will DELETE ABSOLUTELY EVERYTHING including YOUR OWN ACCOUNT. You will need to sign up again from scratch. Are you absolutely certain?"

**Header:** "Atomic Confirm"

**Options:**
1. **yes_extinction** - Description: "YES, I understand I will be deleted too. Proceed with atomic extinction."
2. **cancel** - Description: "CANCEL - I changed my mind. Go back to mode selection."

**Second AskUserQuestion (if first confirmed):**
**Question:** "FINAL WARNING: Type 'EXTINCTION' to confirm you want to completely erase the database. This cannot be undone."

**Header:** "Final Confirm"

**Options:**
1. **EXTINCTION** - Description: "I understand. Delete everything. Make it pristine."
2. **ABORT** - Description: "ABORT - This is too dangerous. Cancel the operation."

If user selects `atomic_with_clerk`, show TRIPLE confirmation (affects external system):

**First AskUserQuestion:**
**Question:** "You selected TOTAL ANNIHILATION. This will delete ALL data from Convex AND delete ALL users from Clerk. This affects an EXTERNAL authentication system. Are you absolutely certain?"

**Header:** "Annihilation Confirm"

**Options:**
1. **yes_annihilation** - Description: "YES, I understand this affects Clerk too. Proceed."
2. **cancel** - Description: "CANCEL - I changed my mind. Go back to mode selection."

**Second AskUserQuestion (if first confirmed):**
**Question:** "This will permanently delete users from Clerk's authentication system. They will need to sign up again. There is NO recovery. Continue?"

**Header:** "Clerk Confirm"

**Options:**
1. **yes_delete_clerk** - Description: "YES, delete all Clerk users."
2. **cancel** - Description: "CANCEL - Don't touch Clerk."

**Third AskUserQuestion (if second confirmed):**
**Question:** "FINAL WARNING: Type 'ANNIHILATE' to confirm total system wipe (Convex + Clerk)."

**Header:** "Final Confirm"

**Options:**
1. **ANNIHILATE** - Description: "I understand. Delete everything from everywhere."
2. **ABORT** - Description: "ABORT - This is too dangerous."

If user selects `cancel` or `ABORT`, restart from Phase 2.

---

### Phase 4: Execute Cleanup

For `productivity_only`, `data_only`, `full_wipe`, or `atomic`, call the Convex mutation:

```typescript
const result = await convex.mutation(api.admin.dbCleanup.cleanupDatabase, {
  mode: selectedMode, // 'productivity_only' | 'data_only' | 'full_wipe' | 'atomic'
  callerUserId: callerUserId, // Note: atomic mode ignores this and deletes caller too
});
```

For `atomic_with_clerk`, call the Convex ACTION (not mutation):

```typescript
// This is an ACTION because it needs to call Clerk API
const result = await convex.action(api.admin.dbCleanup.atomicNukeWithClerk, {});
```

**Or via CLI:**
```bash
npx convex run admin/dbCleanup:atomicNukeWithClerk '{}'
```

**Show progress:**
```
🧹 Executing database cleanup...
Mode: [selectedMode]
Protected User: [callerUserId]

Please wait...
```

---

### Phase 5: Report Results

After successful execution, show detailed results:

```
✅ DATABASE CLEANUP COMPLETE

Mode: [selectedMode]
Total Deleted: [totalDeleted] documents

Deletion Breakdown:
─────────────────────────────────────────────────
[table1]                    [count] documents
[table2]                    [count] documents
[table3]                    [count] documents
...
─────────────────────────────────────────────────

🛡️ Your user account ([userId]) was preserved
```

---

### Phase 6: Next Steps Guidance

Provide context-specific next steps based on mode:

**For productivity_only:**
```
📧 Next Steps:
1. Refresh the app UI (hard reload if needed)
2. Reconnect Outlook/Gmail accounts
3. OAuth flow will sync fresh data with correct schema
4. Verify new emails have proper orgId values in Convex dashboard
```

**For data_only:**
```
📊 Next Steps:
1. Refresh the app UI (clear cookies if needed)
2. Reconnect all third-party integrations
3. Re-import any test data
4. Verify all domain tables are functioning correctly
```

**For full_wipe:**
```
🔥 Next Steps:
1. Clear all browser cookies and local storage
2. Sign up again via Clerk (or have admin re-create your account)
3. Complete onboarding flow
4. Reconnect all integrations
5. This was a nuclear reset - rebuild everything from scratch
```

**For atomic:**
```
☢️ Next Steps:
1. Clear ALL browser cookies and local storage
2. Clear Clerk test users if any remain (Clerk dashboard)
3. Sign up as a completely new user via Clerk
4. Complete full onboarding flow from scratch
5. Reconnect all OAuth integrations (Outlook, Gmail, etc.)
6. This was EXTINCTION - the database is now pristine like a new project
7. All previous data, users, files, and history are permanently gone
```

**For atomic_with_clerk:**
```
☢️💀 Next Steps:
1. Clear ALL browser cookies and local storage
2. Clerk users are ALREADY DELETED - no need to clear manually
3. Sign up as a completely new user via Clerk (you'll be creating a fresh account)
4. Complete full onboarding flow from scratch
5. Reconnect all OAuth integrations (Outlook, Gmail, etc.)
6. This was TOTAL ANNIHILATION - both Convex and Clerk are pristine
7. All previous data, users, files, auth accounts are permanently gone
```

---

## MODES REFERENCE

### productivity_only
**Deletes:**
- productivity_email_Messages
- productivity_email_Index ← (Email sync data)
- productivity_email_Accounts ← (OAuth connections)
- productivity_email_SenderCache
- productivity_email_Assets
- productivity_email_AssetReferences
- productivity_calendar_Events
- productivity_bookings_Form
- productivity_pipeline_Prospects

**Preserves:**
- All users (admin_users)
- All identity data (ClerkRegistry)
- All other business data (clients, finance, projects)

---

### data_only
**Deletes:** All from `productivity_only` PLUS:
- clients_contacts_Users
- finance_banking_Statements
- projects_tracking_Schedule
- projects_tracking_Costs
- settings_account_Genome

**Preserves:**
- All users (admin_users)
- All identity data (ClerkRegistry, DeleteLog)

---

### full_wipe ⚠️
**Deletes:** All from `data_only` PLUS:
- admin_users (except caller)
- admin_users_ClerkRegistry (except caller)
- admin_users_DeleteLog

**Preserves:**
- ONLY the caller's user account
- ONLY the caller's ClerkRegistry entry

---

### atomic ☢️ EXTINCTION
**Deletes:** ABSOLUTELY EVERYTHING:
- All from `full_wipe` INCLUDING the caller's account
- admin_users (ALL users, no exceptions)
- admin_users_ClerkRegistry (ALL entries)
- admin_users_DeleteLog (ALL entries)
- _storage (ALL uploaded files)

**Preserves:**
- NOTHING. Database is completely pristine.
- Schema remains (tables exist but are empty)

---

### atomic_with_clerk ☢️💀 TOTAL ANNIHILATION
**Deletes:** ABSOLUTELY EVERYTHING from BOTH systems:

**From Convex:**
- All from `atomic` (every table, every file)

**From Clerk:**
- ALL user accounts via Clerk API
- Authentication records
- User metadata

**Preserves:**
- NOTHING. Both systems are completely pristine.
- Convex schema remains (tables exist but are empty)
- Clerk application config remains (but no users)

---

## SAFETY FEATURES

✅ **Caller Protection** - Your account is preserved in full_wipe mode (NOT in atomic!)
✅ **Confirmation Prompts** - Extra warning for nuclear mode
✅ **Double Confirmation** - Atomic mode requires TWO confirmations
✅ **Triple Confirmation** - Atomic with Clerk requires THREE confirmations
✅ **Detailed Logging** - See exactly what's being deleted
✅ **Summary Report** - Breakdown by table after completion
✅ **Mode Descriptions** - Clear explanations to prevent accidents
✅ **Batch Processing** - Handles large datasets without hitting Convex limits

---

## ERROR HANDLING

If mutation fails, show:

```
❌ DATABASE CLEANUP FAILED

Error: [error message]

Troubleshooting:
1. Verify Convex is running: npm run dev:convex
2. Check Convex dashboard for schema issues
3. Verify your user ID exists in admin_users table
4. Check Convex function logs for details

Would you like to retry or cancel?
```

---

## TYPICAL USE CASES

### Use Case 1: Email Sync Schema Mismatch
**Problem:** Email messages have `orgId: unset`, causing queries to fail
**Solution:** Run `/db-nuke` → Select `productivity_only` → Reconnect Outlook

### Use Case 2: Corrupted Business Data
**Problem:** Test data is corrupted, need clean slate but keep users
**Solution:** Run `/db-nuke` → Select `data_only` → Re-import test data

### Use Case 3: Complete Dev Reset
**Problem:** Need to test onboarding flow from scratch
**Solution:** Run `/db-nuke` → Select `full_wipe` → Sign up as new user

### Use Case 4: Pristine Database (Brand New Project State)
**Problem:** Database has accumulated test data, orphaned records, corrupt state - need a completely fresh start like spinning up a new Convex project
**Solution:** Run `/db-nuke` → Select `atomic` → Confirm twice → Clear browser → Sign up fresh from scratch

### Use Case 5: Complete System Reset (Convex + Clerk)
**Problem:** Test users in Clerk are polluting the auth system, need to wipe both database AND authentication provider for a truly clean slate
**Solution:** Run `/db-nuke` → Select `atomic_with_clerk` → Confirm three times → Clear browser → Sign up as brand new user

---

## IMPORTANT NOTES

⚠️ **This is a DEVELOPMENT tool only**
⚠️ **NEVER use in production**
⚠️ **All deletions are IRREVERSIBLE**
⚠️ **Always verify mode selection before confirming**
⚠️ **Full wipe requires complete app re-setup**
☢️ **Atomic mode deletes EVERYTHING including your own account**
☢️ **Atomic mode also deletes all uploaded files in Convex storage**
💀 **Atomic with Clerk affects EXTERNAL system (Clerk authentication)**
💀 **Clerk users are deleted via API - this cannot be undone**

---

## ALTERNATIVE METHODS

If you prefer CLI instead of slash command:

```bash
# Batch delete a single table (for large datasets)
npx convex run admin/dbCleanup:batchDeleteTable '{"table": "productivity_email_Index"}'

# Check what's in the database
npx convex run admin/dbCleanup:getDatabaseCounts '{}'

# Atomic nuke with Clerk (deletes from Clerk AND Convex)
npx convex run admin/dbCleanup:atomicNukeWithClerk '{}'
```

---

**Remember: With great power comes great responsibility. Use wisely.**
