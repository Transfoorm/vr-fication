# CONVEX FOLDER RESTRUCTURE - PROJECT PLAN

## Executive Summary

The convex folder has evolved organically and now contains organizational inconsistencies that create confusion and break API path conventions. This refactor aligns convex structure with `src/features/` for clarity and consistency.

---

## THE WHY

### Problem Statement

The convex folder currently mixes three different organizational patterns:

1. **Domain folders** (`domains/productivity/`, `domains/admin/`) - For app domains
2. **Root-level features** (`productivity/email/`, `vanish/`) - Same purpose, different location
3. **Utilities disguised as domains** (`admin/dbCleanup.ts`, `system/`) - Dev tools at domain level

This creates:
- **Confusing API paths**: `api.domains.settings` vs `api.productivity.email` (inconsistent prefix)
- **Misleading folder names**: `admin/` at root is dev cleanup, not Admiral's admin domain
- **Scattered features**: Email lives at `productivity/email/` while its queries live at `domains/productivity/`

### Evidence

All convex calls originate from `src/features/` - zero from `src/app/domains/`:

```tsx
// Current inconsistent API paths:
api.domains.settings.mutations.updateUserSettings     // Has 'domains' prefix
api.domains.admin.users.api.updateProfile             // Has 'domains' prefix
api.productivity.email.outlookActions                 // NO 'domains' prefix!
api.vanish.deleteAnyUserAction                        // NO 'domains' prefix!
```

### Root Cause

The word "domains" was chosen to mirror `src/app/domains/` (Next.js routing). But:
- `src/app/domains/` is just routing - thin page wrappers
- `src/features/` contains all actual logic and makes all convex calls
- Convex structure should mirror the caller (`features/`), not the router (`domains/`)

---

## CURRENT STATE

```
convex/
├── domains/                    # App domains (queries, mutations)
│   ├── productivity/           # Productivity queries/mutations
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── actions.ts
│   │   └── helpers/
│   ├── admin/                  # Just users/ subfolder
│   │   └── users/
│   ├── settings/
│   ├── clients/
│   ├── projects/
│   └── finance/
│
├── productivity/               # Email feature (OUTSIDE domains!)
│   └── email/                  # 12 files: outlook.ts, webhooks.ts, etc.
│
├── admin/                      # Dev utility (MISLEADING NAME!)
│   └── dbCleanup.ts            # Database wipe tool for development
│
├── system/                     # Shared infrastructure (NOT a domain!)
│   ├── constants.ts            # Theme defaults
│   └── utils/
│       └── rankAuth.ts         # Auth utilities
│
├── vanish/                     # User deletion (OUTSIDE domains!)
│   ├── cascade.ts
│   ├── deleteAnyUser.ts
│   └── strategies/
│
├── identity/                   # Avatar/logo uploads
├── storage/                    # File storage utilities
├── _guards/                    # Cross-cutting auth guards
└── _generated/                 # Auto-generated (Convex)
```

### Problems with Current State

| Issue | Location | Problem |
|-------|----------|---------|
| Inconsistent paths | `productivity/email/` | Creates `api.productivity.email` instead of `api.domains.productivity.email` |
| Misleading name | `admin/` (root) | Looks like Admiral's domain, is actually dev cleanup tool |
| Misleading name | `system/` | Looks like Admiral's System domain, is actually shared infrastructure |
| Split features | `domains/productivity/` + `productivity/email/` | Same feature split across two locations |
| Wrong terminology | `domains/` | Should mirror `src/features/` since that's where calls originate |

---

## PROPOSED STATE

```
convex/
├── features/                   # Renamed from domains/ - mirrors src/features/
│   ├── productivity/
│   │   ├── queries.ts          # Existing
│   │   ├── mutations.ts        # Existing
│   │   ├── actions.ts          # Existing
│   │   ├── helpers/            # Existing
│   │   └── email/              # MOVED from convex/productivity/email/
│   │       ├── outlook.ts
│   │       ├── outlookActions.ts
│   │       ├── outlookFolderActions.ts
│   │       ├── outlookDiagnostics.ts
│   │       ├── outlookReconcile.ts
│   │       ├── outlookStore.ts
│   │       ├── bodyCache.ts
│   │       ├── cacheConfig.ts
│   │       ├── htmlNormalizer.ts
│   │       ├── sync.ts
│   │       ├── webhooks.ts
│   │       └── EMAIL-DOCTRINE.md
│   │
│   ├── admin/                  # Existing (users management)
│   │   └── users/
│   │       ├── mutations/
│   │       ├── queries/
│   │       └── api.ts
│   │
│   ├── vanish/                 # MOVED from convex/vanish/
│   │   ├── cascade.ts
│   │   ├── deleteAnyUser.ts
│   │   ├── deleteAnyUserAction.ts
│   │   ├── deleteCurrentUser.ts
│   │   ├── deleteDeletionLog.ts
│   │   ├── deletionManifest.ts
│   │   ├── getClerkIdForDeletion.ts
│   │   ├── updateClerkDeletionStatus.ts
│   │   └── strategies/
│   │
│   ├── settings/               # Existing
│   ├── clients/                # Existing
│   ├── projects/               # Existing
│   └── finance/                # Existing
│
├── _dev/                       # RENAMED from admin/ - dev utilities
│   └── dbCleanup.ts
│
├── _infra/                     # RENAMED from system/ - shared infrastructure
│   ├── constants.ts            # Theme defaults, etc.
│   └── rankAuth.ts             # MOVED from system/utils/
│
├── identity/                   # Keep (cross-cutting)
├── storage/                    # Keep (cross-cutting)
├── _guards/                    # Keep (cross-cutting)
└── _generated/                 # Keep (auto-generated)
```

### Benefits of Proposed State

| Benefit | Description |
|---------|-------------|
| Consistent API paths | All feature calls become `api.features.X.Y` |
| Clear naming | `_dev/` is obviously dev tools, `_infra/` is obviously infrastructure |
| Unified features | Email lives with productivity queries (same folder) |
| Mirror source | `convex/features/` mirrors `src/features/` |
| Underscore convention | `_dev/`, `_infra/` signal "internal/utility" (like `_generated/`) |

### New API Paths

```tsx
// Before (inconsistent):
api.domains.settings.mutations.updateUserSettings
api.domains.admin.users.api.updateProfile
api.productivity.email.outlookActions           // Different!
api.vanish.deleteAnyUserAction                  // Different!

// After (consistent):
api.features.settings.mutations.updateUserSettings
api.features.admin.users.api.updateProfile
api.features.productivity.email.outlookActions  // Same pattern!
api.features.vanish.deleteAnyUserAction         // Same pattern!
```

---

## IMPLEMENTATION PLAN

### Phase 1: Preparation

1. **Create new folder structure**
   - Create `convex/features/` directory
   - Create `convex/_dev/` directory
   - Create `convex/_infra/` directory

2. **Document all import paths**
   - Grep all `api.domains.` imports in `src/`
   - Grep all `api.productivity.` imports in `src/`
   - Grep all `api.vanish.` imports in `src/`
   - Grep all `api.system.` imports in `src/`
   - Create comprehensive list of files needing updates

### Phase 2: Move Files

3. **Rename domains/ to features/**
   - `convex/domains/*` → `convex/features/*`
   - This is a rename, not a move (preserves structure)

4. **Move productivity/email/ into features/productivity/**
   - `convex/productivity/email/*` → `convex/features/productivity/email/*`
   - Delete empty `convex/productivity/` folder

5. **Move vanish/ into features/**
   - `convex/vanish/*` → `convex/features/vanish/*`

6. **Rename admin/ to _dev/**
   - `convex/admin/dbCleanup.ts` → `convex/_dev/dbCleanup.ts`

7. **Rename system/ to _infra/**
   - `convex/system/constants.ts` → `convex/_infra/constants.ts`
   - `convex/system/utils/rankAuth.ts` → `convex/_infra/rankAuth.ts`
   - Delete empty `convex/system/` folder

### Phase 3: Update Imports

8. **Update all src/ imports**
   - `api.domains.` → `api.features.`
   - `api.productivity.email.` → `api.features.productivity.email.`
   - `api.vanish.` → `api.features.vanish.`
   - `api.system.` → `api._infra.` (if any)

9. **Update internal convex imports**
   - Any cross-references within convex files
   - Internal API references

### Phase 4: Validation

10. **Run Convex codegen**
    - `npx convex dev` to regenerate `_generated/`
    - Verify new API paths work

11. **Run TypeScript check**
    - `npx tsc --noEmit`
    - Fix any type errors from import changes

12. **Run ESLint**
    - Check for any linting issues

13. **Test application**
    - Verify email functionality works
    - Verify vanish functionality works
    - Verify admin user management works
    - Verify settings mutations work

### Phase 5: Cleanup

14. **Remove empty directories**
    - Delete `convex/productivity/` (now empty)
    - Delete `convex/system/` (now empty)
    - Delete `convex/admin/` (now empty)

15. **Update documentation**
    - Update any docs referencing old paths
    - Update CLAUDE.md if needed

---

## RISK ASSESSMENT

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing import updates | Medium | High | Comprehensive grep before starting |
| Convex codegen issues | Low | High | Run codegen immediately after moves |
| Breaking production | Medium | Critical | Test thoroughly before commit |
| Merge conflicts | Low | Medium | Do in single session, commit atomically |

---

## ROLLBACK PLAN

If issues arise:
1. `git stash` or `git reset --hard` to revert all changes
2. Re-run `npx convex dev` to regenerate original paths
3. Investigate issue before re-attempting

---

## SUCCESS CRITERIA

- [ ] All `api.features.*` paths resolve correctly
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Email send/receive works
- [ ] User deletion (vanish) works
- [ ] Settings mutations work
- [ ] Admin user management works
- [ ] No `api.domains.*` references remain
- [ ] No `api.productivity.*` references remain (should be `api.features.productivity.*`)
- [ ] No `api.vanish.*` references remain (should be `api.features.vanish.*`)

---

## ESTIMATED SCOPE

| Category | Count |
|----------|-------|
| Files to move | ~25 |
| Files to rename | ~5 |
| Import updates | ~30-50 lines across ~15 files |
| New directories | 3 (`features/`, `_dev/`, `_infra/`) |
| Deleted directories | 3 (`domains/`, `productivity/`, `system/`) |

---

## DECISION LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-03 | Rename `domains/` to `features/` | Mirrors `src/features/` where all calls originate |
| 2026-01-03 | Use `_dev/` for dev utilities | Underscore prefix signals "internal", matches `_generated/` |
| 2026-01-03 | Use `_infra/` for infrastructure | Clear purpose, not confused with app domains |
| 2026-01-03 | Move email into `features/productivity/email/` | Unifies feature with its domain queries |
| 2026-01-03 | Move vanish into `features/vanish/` | Consistent with other features |

---

*Document created: 2026-01-03*
*Status: PENDING APPROVAL*
