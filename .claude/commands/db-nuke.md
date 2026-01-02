---
description: NUKE - Total system reset (Convex + Clerk)
tags: [database, nuclear, development]
---

# ☢️ DB-NUKE: TOTAL ANNIHILATION

**NUKE IS NUKE.**

One command. One outcome. Brand new repo.

---

## WHAT IT DOES

Deletes EVERYTHING:

- **Convex:** Every document in every table
- **Convex:** Every file in storage
- **Clerk:** Every user account

After nuke: Database is pristine. You sign up fresh.

---

## EXECUTION PROTOCOL

### Step 1: Single Confirmation

Show ONE confirmation using AskUserQuestion:

**Question:** "☢️ NUKE will delete EVERYTHING - all Convex data, all storage files, all Clerk users. You will sign up again from scratch. Proceed?"

**Header:** "NUKE"

**Options:**
1. **NUKE** - Description: "Delete everything. Make it pristine."
2. **ABORT** - Description: "Cancel - don't touch anything."

If ABORT, stop immediately.

---

### Step 2: Execute

Run the atomic nuke with Clerk:

```bash
npx convex run admin/dbCleanup:atomicNukeWithClerk '{}'
```

Show progress:
```
☢️ NUKING...

Deleting all Clerk users...
Deleting all Convex documents...
Deleting all storage files...
```

---

### Step 3: Report

```
☢️ NUKE COMPLETE

Clerk users deleted: [count]
Convex documents deleted: [count]
Storage files deleted: [count]

Database is pristine.
```

---

### Step 4: Next Steps

```
☢️ Next Steps:
1. Clear browser cookies and local storage
2. Sign up as a new user via Clerk
3. Complete onboarding
4. Reconnect OAuth integrations (Outlook, Gmail)
```

---

## NO OPTIONS. NO MODES. NUKE IS NUKE.
