# 🔥 VANISH Protocol 2.0

**Enterprise-grade user account deletion system**

Location: `/vanish` (root level, quarantined)

---

## Quick Reference (TL;DR)

**What is VANISH?**
Safe, compliant user account deletion with complete audit trails.

**Why is it at `/vanish` (root) instead of `/src/app`?**
To isolate Clerk SDK imports. Only `Quarantine.tsx` touches Clerk - it's dynamically loaded when needed, keeping FUSE pure.

**The Three Files:**
1. `Drawer.tsx` - Clean portal manager (no Clerk)
2. `Quarantine.tsx` - Deletion form (contains Clerk SDK - QUARANTINED)
3. `vanish.css` - Dark fire theme with 300ms animations

**How to use:**
```typescript
import { useVanish } from '@/vanish/Drawer';

const { openDrawer } = useVanish();
openDrawer({ target: userId }, (result) => {
  console.log(`Deleted ${result.successCount} users`);
});
```

**Backend cascade:**
Configure `/convex/deletionManifest.ts` with delete/anonymize/reassign/preserve strategies.

**Key safety features:**
Idempotent, fail-resume, chunked processing, complete audit trail, storage cleanup.

---

## What is VANISH?

VANISH is the system that **safely removes user accounts** from your application. Think of it like a smart demolition crew - it doesn't just delete the user account, it carefully removes every trace of that user across your entire system while keeping important records for legal and audit purposes.

### Why "VANISH"?

Because when you delete a user account, they should **completely disappear** from the active system - but leave behind a permanent record that proves the deletion happened (for legal compliance).

---

## The Big Picture

When you need to delete a user account (because they requested it, violated policies, or are no longer needed), VANISH:

1. **Opens a special deletion portal** - A dark-themed drawer that looks different from the rest of your app
2. **Shows you exactly what will be deleted** - User's name, email, role, and status
3. **Requires you to provide a reason** - For legal compliance and audit trails
4. **Makes you type "DELETE" to confirm** - This adds friction to prevent accidents
5. **Safely removes everything** - User data, files, related records
6. **Creates a permanent audit log** - Records who deleted whom, when, and why
7. **Cannot be undone** - Once confirmed, the deletion is irreversible

---

## The Three Main Parts

### 1. **Drawer.tsx** - The Portal Manager
- Creates the "drawer" (sliding panel) that opens from the right side
- Manages when the drawer is open or closed
- Uses dynamic loading to keep the main app fast
- Provides simple functions to trigger deletions:
  - `openDrawer()` - Show the deletion form
  - `closeDrawer()` - Hide the deletion form
  - `triggerComplete()` - Run actions after deletion finishes

### 2. **Quarantine.tsx** - The Deletion Form
- The actual UI that shows inside the drawer
- Called "Quarantine" because it contains Clerk SDK code (authentication service)
- Isolated from the rest of the app to maintain clean architecture
- Shows who will be deleted with all their details
- Requires a written reason for the deletion
- Requires typing "DELETE" to confirm
- Handles both single user and batch (multiple users) deletion
- Shows audit trail information

### 3. **vanish.css** - The Dark Theme Styles
- Makes the deletion portal look intentionally different
- Dark background with red accents (fire theme 🔥)
- Designed to create "intentional friction" - you should feel the weight of this action
- Responsive design works on mobile and desktop
- Uses `ft-vanish-*` prefix (WCCC protocol)
- State-based modifiers (`--visible`, `--hidden`, `--deleting`)

**Animation System:**
```css
/* Backdrop fades in/out */
.ft-vanish-backdrop {
  transition: opacity 300ms ease-out;
}
.ft-vanish-backdrop--visible { opacity: 1; }
.ft-vanish-backdrop--hidden { opacity: 0; }

/* Drawer slides in/out from right */
.ft-vanish-drawer {
  transition: transform 300ms ease-out;
}
.ft-vanish-drawer--visible { transform: translateX(0); }
.ft-vanish-drawer--hidden { transform: translateX(100%); }
```

All animations use a **single 300ms timing constant** for consistency.

---

## How VANISH Works (Step by Step)

### Opening the Portal

```
User clicks "Delete User" button somewhere in the admin panel
  ↓
openDrawer({ target: userId }, onComplete) is called
  ↓
Drawer.tsx sets isOpen=true in React Context
  ↓
VanishPortal component detects isOpen=true
  ↓
VanishPortal dynamically imports Quarantine.tsx (Clerk bundle loads now)
  ↓
Portal renders via React.createPortal to #vanish-drawer-portal
  ↓
Backdrop darkens the screen (ft-vanish-backdrop)
  ↓
Drawer slides in from right (transform: translateX(0))
```

### The Rendering Flow (Technical)

**Step 1: Context Provider (Drawer.tsx)**
```typescript
// Drawer.tsx provides context to entire app
<VanishProvider>
  {/* Your app */}
  <VanishPortal />
</VanishProvider>
```

**Step 2: Opening Drawer**
```typescript
// From admin panel or anywhere:
const { openDrawer } = useVanish();
openDrawer(
  { target: userId }, // or { targets: [id1, id2] } for batch
  (result) => { /* callback after deletion */ }
);
```

**Step 3: Portal Rendering**
```typescript
// VanishPortal renders into DOM element:
<div id="vanish-drawer-portal"></div>
```

**Step 4: Dynamic Loading**
```typescript
// Quarantine.tsx loads NOW (not before)
const VanishQuarantine = dynamic(
  () => import('./Quarantine').then(mod => ({ default: mod.VanishQuarantine })),
  { ssr: false }
);
```

**Step 5: Animation Trigger**
```typescript
// Quarantine.tsx manages its own visibility
useEffect(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setIsVisible(true); // Double RAF prevents flicker
    });
  });
}, []);
```

This creates smooth entrance animation without flicker.

### The Deletion Form

The form shows:
- **Target User Info**: Name, email, rank (role), setup status
- **Reason Field**: Why are you deleting this account? (required)
- **Confirmation Field**: Type "DELETE" to proceed (safety check)
- **Audit Notice**: Explains what will be logged

**Data Resolution:**
```typescript
// Quarantine.tsx queries all users to resolve target data
const allUsers = useQuery(api.domains.users.api.getAllUsers);

// Supports both Convex IDs and Clerk IDs
const targets = allUsers
  .filter((u) => targetIds.includes(u._id) || targetIds.includes(u.clerkId))
  .map((u) => ({
    clerkId: u.clerkId,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    rank: u.rank,
    setupStatus: u.setupStatus
  }));
```

### When You Click "Delete User Permanently"

**Client-Side Flow (Quarantine.tsx):**

1. **Validation**: Checks that you typed "DELETE" and provided a reason
   ```typescript
   if (confirmText !== 'DELETE') {
     alert('You must type DELETE to confirm');
     return;
   }
   ```

2. **API Call**: Sends deletion request via Convex Action
   ```typescript
   const deleteUser = useAction(api.domains.users.api.deleteAnyUserWithClerk);
   const result = await deleteUser({
     targetClerkId: target.clerkId,
     reason: deleteReason
   });
   ```

3. **Trigger Callback**: Pass result to completion handler
   ```typescript
   triggerComplete({
     success: true,
     successCount: 1,
     deletedUsers: [{ name: target.name, email: target.email }]
   });
   ```

4. **Close Portal**: Exit animation, then cleanup
   ```typescript
   setIsVisible(false); // Triggers exit animation (300ms)
   setTimeout(() => {
     closeDrawer(); // Clear state after animation
   }, 300);
   ```

**Server-Side Flow (Convex Backend):**

1. **Action Wrapper** (`deleteAnyUserAction.ts`):
   - Receives deletion request
   - Validates permissions (Admiral only)
   - Calls mutation to cascade delete

2. **Cascade Deletion** (`cascade.ts`):
   - Idempotency check (already deleted?)
   - Mark deletion start (tombstone)
   - Create audit log entry
   - Sweep storage files (avatars)
   - Process all tables in manifest
   - Delete user record
   - Update audit log (append pattern)

3. **Clerk Deletion** (Action wrapper):
   - Call Clerk API to delete auth account
   - Update audit log with Clerk status
   - Handle errors gracefully

4. **Return Result**: Success/failure back to client

**Callback Execution:**
```typescript
// Original caller receives result:
openDrawer(
  { target: userId },
  (result) => {
    if (result.success) {
      console.log(`Deleted ${result.successCount} users`);
      // Refresh user list, show toast, etc.
    }
  }
);
```

---

## The Cascade System (How Everything Gets Deleted)

VANISH uses a **cascade deletion system** defined in `/convex/deletionManifest.ts`. This is like a master checklist that lists every place in your database where a user might be referenced.

### Four Deletion Strategies

Every piece of user data follows one of these rules:

1. **Delete** - Completely remove it
   - Example: User's private files, personal projects

2. **Anonymize** - Replace user info with "deleted-user" placeholder
   - Example: Comments on shared documents (keep the comment, hide who wrote it)

3. **Reassign** - Transfer to another user
   - Example: Transfer project ownership to another team member

4. **Preserve** - Keep it unchanged
   - Example: Audit logs, financial records (needed for legal compliance)

### The Deletion Manifest

The manifest is a configuration file that tells VANISH:
- **Which tables** (database collections) to check
- **Which fields** in those tables reference users
- **Which strategy** to use for each field
- **Which files** to delete from storage (avatars, uploads)

Currently empty but ready to be populated as your app grows.

### Cascade Process

When deletion runs:

```
Mark user for deletion (sets a "tombstone" to prevent double-deletion)
  ↓
Create audit log entry (start recording)
  ↓
Delete storage files (avatars, attachments)
  ↓
Go through each table in the manifest
  ↓
Apply the appropriate strategy (delete/anonymize/reassign/preserve)
  ↓
Process in chunks (handles large datasets without timeout)
  ↓
Delete the user record itself
  ↓
Update audit log (mark as complete)
  ↓
Return success report
```

---

## The Audit Trail

Every deletion creates a **permanent record** in the `user_DeleteLogs` table.

### What Gets Logged

- **Who was deleted**: Name, email, role, subscription status
- **Who deleted them**: Was it an admin? Or did the user delete themselves?
- **When it happened**: Exact timestamp
- **Why it happened**: The reason you provided
- **What was deleted**: Number of records, list of affected tables, deleted files
- **Success/failure status**: Did it work? Or did something go wrong?

### The Deletions Tab

You can view all deletion logs in the admin panel under "Users → Deletions". This shows:
- List of all deletions
- Filter and search capabilities
- Click to view full details
- Option to delete old log entries (though usually kept for compliance)

---

## The Architecture

### Why VANISH Lives in `/vanish` (Root Level)

VANISH is **quarantined** at the root level (`/vanish`) instead of inside `/src/app` for critical architectural reasons:

#### 1. **Clerk SDK Isolation (The Primary Reason)**

**The Problem:**
- Clerk SDK (authentication) must be imported to delete user accounts from their service
- Importing Clerk SDK anywhere creates a dependency that can contaminate your entire codebase
- This violates clean architecture principles where FUSE (your main app) should be independent

**The Solution:**
- VANISH is isolated at `/vanish` (root level, outside `/src/app`)
- Only `Quarantine.tsx` imports Clerk SDK - this file is the "contaminated zone"
- `Drawer.tsx` dynamically imports `Quarantine.tsx` using Next.js dynamic loading
- The Clerk code only loads when the deletion drawer opens (lazy loading)
- FUSE remains pure - no Clerk dependencies leak into your feature code

**Code Evidence:**
```typescript
// From Drawer.tsx:
const VanishQuarantine = dynamic(
  () => import('./Quarantine').then(mod => ({ default: mod.VanishQuarantine })),
  { ssr: false }
);
```

This dynamic import creates a **hard boundary** - the Clerk SDK code is split into a separate JavaScript bundle that only downloads when needed.

#### 2. **Destructive Operations Should Be Isolated**

User deletion is irreversible and dangerous. By keeping it in a separate directory:
- Can't accidentally import deletion functions into feature code
- Visually clear this is a special, isolated system
- Different mental model: "entering VANISH" vs "using a feature"

#### 3. **Different UX Philosophy**

VANISH intentionally creates friction:
- Dark theme (vs light FUSE themes)
- Red warning colors
- Heavy confirmation steps
- Ceremonial feel ("you are leaving FUSE and entering VANISH")

This distinct UX deserves its own isolated directory.

### The Boundary Concept: FUSE vs VANISH

Your app has **two architectural realms**:

| Realm | Location | Purpose | Clerk SDK? |
|-------|----------|---------|------------|
| **FUSE** | `/src/features`, `/src/shell` | Living, productive app | ❌ No |
| **VANISH** | `/vanish`, `/src/app/(domains)/admin` | Destructive operations | ✅ Yes (isolated) |

**The Law:**
> "FUSE creates life. VANISH ends it. They must never mix."

This separation ensures:
- ✅ Feature code stays pure (no auth dependencies)
- ✅ Deletion logic is centralized and auditable
- ✅ Accidental deletion triggers are impossible
- ✅ Bundle size stays small (Clerk only loads when needed)
- ✅ Clean dependency graph

### The Quarantine Pattern

**What is "Quarantine"?**

`Quarantine.tsx` is named this way because it contains **contaminated code** - code that imports external SDKs (Clerk) and must be isolated from the rest of the app.

**The Isolation Strategy:**

```
┌─────────────────────────────────────────────────┐
│ /vanish/Drawer.tsx                             │
│ ✅ CLEAN - No Clerk SDK                         │
│ - React Context (VanishProvider)               │
│ - Portal management                             │
│ - State management                              │
│ - Dynamic import of Quarantine                  │
└──────────────┬──────────────────────────────────┘
               │
               │ Dynamic Import (code splitting)
               │
               ↓
┌─────────────────────────────────────────────────┐
│ /vanish/Quarantine.tsx                         │
│ ☢️ CONTAMINATED - Contains Clerk SDK            │
│ - Imports Clerk API functions                   │
│ - Deletion form UI                              │
│ - Direct API calls to Clerk                     │
│ - Only loads when drawer opens                  │
└─────────────────────────────────────────────────┘
```

**Why This Matters:**

1. **Build Size**: Clerk SDK is ~50KB+ - only downloaded when user needs to delete someone
2. **Dependency Management**: FUSE features never "see" Clerk imports
3. **Testing**: Can test FUSE without mocking Clerk
4. **Future Flexibility**: Can swap authentication providers without touching FUSE code

### Dynamic Loading (Code Splitting)

VANISH uses **lazy loading** to keep your main app fast:

**Without code splitting:**
- Clerk SDK loads on every page
- Main bundle is ~50KB larger
- Users who never delete accounts still download the code

**With code splitting (VANISH approach):**
- Clerk SDK only loads when drawer opens
- Main bundle stays light
- 99% of users never download deletion code

**Technical Implementation:**

```typescript
// Drawer.tsx uses Next.js dynamic()
const VanishQuarantine = dynamic(
  () => import('./Quarantine').then(mod => ({ default: mod.VanishQuarantine })),
  { ssr: false } // Don't run on server (Clerk is client-only)
);
```

This creates a separate JavaScript chunk: `Quarantine.[hash].js` that only loads when `VanishPortal` renders with `isOpen=true`.

### File Structure Breakdown

```
/vanish/                           ← Root level (quarantined)
  ├── Drawer.tsx                   ← Clean context/portal manager
  ├── Quarantine.tsx               ← Contaminated (Clerk SDK)
  ├── vanish.css                   ← Dark theme styles
  └── VANISH.md                    ← This SDK doc

/convex/                           ← Backend logic (Clerk-free)
  ├── deletionManifest.ts          ← Cascade configuration
  └── domains/users/delete/
      ├── cascade.ts               ← Cascade engine
      ├── deleteAnyUserAction.ts   ← Action wrapper (HTTP allowed)
      └── strategies/              ← Delete/anonymize/reassign/preserve

/src/app/(domains)/admin/          ← Admin UI (uses VANISH)
  └── users/_tabs/
      └── DeletionsTab.tsx         ← Audit log viewer
```

**Key Observations:**
- `/vanish` is at root, **not** inside `/src/app`
- Only `Quarantine.tsx` touches Clerk
- Backend (`/convex`) is completely Clerk-agnostic
- Admin UI imports from `/vanish/Drawer` (clean interface)

### The Quarantine Pattern (Reusable Architecture)

VANISH demonstrates a **reusable architectural pattern** for isolating third-party dependencies:

**Pattern Name:** Dynamic Quarantine

**Problem It Solves:**
- Need to use external SDK (Stripe, Clerk, Analytics, etc.)
- Don't want SDK contaminating main codebase
- Want to keep main bundle small
- Need clean testing boundaries

**Solution:**
1. Create root-level directory (e.g., `/payments`, `/analytics`)
2. Split into two files:
   - **Manager** (clean) - Context provider, dynamic loader
   - **Quarantine** (contaminated) - Actual SDK integration
3. Use Next.js `dynamic()` to code-split
4. Import Manager from features, never Quarantine directly

**Example Application:**

```
/payments/
  ├── Manager.tsx          ← Clean, no Stripe SDK
  ├── Quarantine.tsx       ← Contains Stripe SDK (isolated)
  └── payments.css

/analytics/
  ├── Manager.tsx          ← Clean, no analytics SDK
  ├── Quarantine.tsx       ← Contains analytics SDK (isolated)
  └── analytics.css

/vanish/
  ├── Drawer.tsx           ← Clean, no Clerk SDK
  ├── Quarantine.tsx       ← Contains Clerk SDK (isolated)
  └── vanish.css
```

**Benefits:**
- ✅ Main codebase stays pure
- ✅ Bundle size optimized (lazy loading)
- ✅ Easy to swap providers (change Quarantine, Manager stays same)
- ✅ Clear dependency boundaries
- ✅ Testable without mocking SDKs

This is **WCCC-compliant** and follows clean architecture principles.

---

## Key Safety Features

### 1. Idempotency
If you try to delete the same user twice, VANISH detects it and stops:
- Checks deletion status before starting
- Marks deletion as "in progress" immediately
- Prevents race conditions if two admins try to delete at once

### 2. Fail-Resume
If deletion crashes midway, VANISH can recover:
- Checks what's already been deleted
- Resumes from where it left off
- Updates audit log with failure info

### 3. Chunked Processing
For users with lots of data:
- Processes records in batches (default: 200 at a time)
- Prevents timeouts on large datasets
- Respects database limits

### 4. Complete Audit Trail
Every step is logged:
- Who initiated the deletion
- What was deleted
- When each step happened
- Any errors that occurred

### 5. Storage Cleanup
Automatically removes files:
- User avatars
- Uploaded files
- Attachments
- Distinguishes between hosted files and external URLs

---

## How to Use VANISH (For Developers)

### Basic Usage

```typescript
import { useVanish } from '@/vanish/Drawer';

function AdminPanel() {
  const { openDrawer } = useVanish();

  const handleDeleteUser = (userId: string) => {
    openDrawer(
      { target: userId },
      (result) => {
        if (result.success) {
          console.log('User deleted!');
          // Refresh your user list here
        }
      }
    );
  };
}
```

### Batch Deletion

```typescript
const handleDeleteMultiple = (userIds: string[]) => {
  openDrawer(
    { targets: userIds },
    (result) => {
      console.log(`Deleted ${result.successCount} users`);
      if (result.failCount > 0) {
        console.log('Some deletions failed:', result.errors);
      }
    }
  );
};
```

### Portal Setup

Add this to your root layout:

```typescript
import { VanishProvider, VanishPortal } from '@/vanish/Drawer';

<VanishProvider>
  <YourApp />
  <VanishPortal />
</VanishProvider>
```

And create the portal mount point:

```html
<div id="vanish-drawer-portal"></div>
```

---

## Files Reference

### Main Components
- **`/vanish/Drawer.tsx`** - Portal manager, context provider, dynamic loader
- **`/vanish/Quarantine.tsx`** - Deletion form UI (contains Clerk SDK)
- **`/vanish/vanish.css`** - Dark theme styles with fire aesthetics

### Backend Logic
- **`/convex/deletionManifest.ts`** - Master configuration for cascade deletion
- **`/convex/domains/users/delete/cascade.ts`** - Cascade execution engine
- **`/convex/domains/users/delete/strategies/`** - Individual strategy implementations
  - `deleteStrategy.ts` - Permanent removal
  - `anonymizeStrategy.ts` - PII scrubbing
  - `reassignStrategy.ts` - Ownership transfer
  - `preserveStrategy.ts` - Keep unchanged
- **`/convex/domains/users/api.ts`** - API endpoints for deletion
- **`/convex/schema.ts`** - Database schema with deletion fields

### Admin UI
- **`/src/app/(domains)/admin/users/_tabs/DeletionsTab.tsx`** - View deletion logs

### Build Tools
- **`/scripts/verifyCascadeCoverage.ts`** - Ensures all user references are in manifest
- **`/scripts/checkISV.ts`** - Verifies no inline styles (WCCC compliance)

---

## The Naming Convention (WCCC Protocol)

All VANISH CSS classes use the **`ft-vanish-*` prefix** (ft = feature):

- `ft-vanish-backdrop` - Dark overlay
- `ft-vanish-drawer` - Main portal container
- `ft-vanish-header` - Red warning header
- `ft-vanish-form` - Deletion form area
- `ft-vanish-button-delete` - Red destructive button
- etc.

This makes VANISH components easy to find and maintain.

---

## Legal & Compliance

### GDPR Compliance
VANISH helps satisfy "right to be forgotten" requirements:
- Complete data removal
- Audit trail for proof of deletion
- Reason tracking for compliance records

### Data Retention
The audit logs (`user_DeleteLogs`) are **preserved** forever:
- Immutable record of who was deleted
- When and why it happened
- Who performed the deletion
- Never automatically deleted (unless explicitly requested)

---

## Future Enhancements

### Planned Features
- **Scheduled Deletions** - Queue deletions for future execution
- **Soft Delete Option** - Mark as deleted but keep data for 30 days
- **Deletion Preview** - Show what will be deleted before confirming
- **Undo Window** - Brief period to cancel deletion
- **Export Before Delete** - Download user data before removal
- **Multi-tenant Cascade** - Handle organization-wide deletions

---

## Troubleshooting

### Common Issues

**Portal doesn't open**
- Check that `<div id="vanish-drawer-portal"></div>` exists
- Verify `VanishProvider` wraps your app
- Verify `VanishPortal` is rendered

**Deletion fails**
- Check server logs for specific error
- Verify user has Admiral rank (permission check)
- Check audit log for error message
- Ensure Clerk API keys are configured

**Storage files not deleted**
- VANISH only deletes files that start with storage IDs (not URLs)
- Check that `deleteStorageFiles` option isn't set to false
- Verify file IDs exist in storage

**Cascade incomplete**
- Check `deletionManifest.ts` for all tables
- Run `/scripts/verifyCascadeCoverage.ts` to find missing tables
- Review error in audit log

---

## Summary

**VANISH is your safe, compliant, auditable user deletion system.**

It's designed to be:
- **Safe** - Multiple confirmation steps
- **Complete** - Removes all traces across the system
- **Auditable** - Permanent logs for compliance
- **Recoverable** - Can resume from failures
- **Isolated** - Kept separate from main app
- **Intentional** - Heavy UX creates friction (this is a serious action)

When you need to delete a user, VANISH ensures it's done right - completely, safely, and with a permanent record.

---

**Version**: 2.0
**Status**: Production-ready
**TTT Certified**: 100K users → 10K tables → 1K developers
**Compliance**: GDPR, audit trail, legal requirements
