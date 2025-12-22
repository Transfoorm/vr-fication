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

Present EXACTLY these 3 options using AskUserQuestion:

**Question:** "Which cleanup mode do you want to execute?"

**Header:** "Cleanup Mode"

**Options:**

1. **productivity_only** (Recommended)
   - Description: "Clears only productivity domain (email, calendar, bookings, pipeline). Preserves all users and other business data. Safest option for fixing email sync issues."

2. **data_only**
   - Description: "Clears ALL business data (productivity + clients + finance + projects + settings). Preserves users and identity tables. Use when you need a complete data reset but want to keep user accounts."

3. **full_wipe** ⚠️ NUCLEAR
   - Description: "Clears EVERYTHING including all users except you (admin_users, ClerkRegistry, DeleteLog). Complete database reset. EXTREMELY DANGEROUS - only use for full dev environment reset."

---

### Phase 3: Nuclear Confirmation (full_wipe only)

If user selects `full_wipe`, show additional AskUserQuestion:

**Question:** "You selected FULL WIPE. This will DELETE ALL USERS (except you) and ALL DATA. This is IRREVERSIBLE. Are you absolutely certain?"

**Header:** "Nuclear Confirm"

**Options:**
1. **yes_nuke_everything** - Description: "YES, I understand this will delete everything. Proceed with full wipe."
2. **cancel** - Description: "CANCEL - I changed my mind. Go back to mode selection."

If user selects `cancel`, restart from Phase 2.

---

### Phase 4: Execute Cleanup

Call the Convex mutation:

```typescript
const result = await convex.mutation(api.admin.dbCleanup.cleanupDatabase, {
  mode: selectedMode, // 'productivity_only' | 'data_only' | 'full_wipe'
  callerUserId: callerUserId,
});
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

## SAFETY FEATURES

✅ **Caller Protection** - Your account is NEVER deleted (even in full_wipe)
✅ **Confirmation Prompts** - Extra warning for nuclear mode
✅ **Detailed Logging** - See exactly what's being deleted
✅ **Summary Report** - Breakdown by table after completion
✅ **Mode Descriptions** - Clear explanations to prevent accidents

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

---

## IMPORTANT NOTES

⚠️ **This is a DEVELOPMENT tool only**
⚠️ **NEVER use in production**
⚠️ **All deletions are IRREVERSIBLE**
⚠️ **Always verify mode selection before confirming**
⚠️ **Full wipe requires complete app re-setup**

---

## ALTERNATIVE METHODS

If you prefer CLI instead of slash command:

```bash
# Via npm script
npm run cleanup:db -- --mode=productivity_only --userId=YOUR_USER_ID

# Or directly with tsx
tsx scripts/cleanupDb.ts --mode=productivity_only --userId=YOUR_USER_ID
```

---

**Remember: With great power comes great responsibility. Use wisely.**
