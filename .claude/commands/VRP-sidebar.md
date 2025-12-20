# 🔄 VRP-SIDEBAR: Comprehensive Sidebar Navigation Rename Protocol

You are initiating a **Sidebar Navigation Rename** operation. This is a cascading change that affects multiple interconnected systems. NO STONE LEFT UNTURNED.

---

## STEP 1: GATHER INFORMATION

Ask the user:

```
🔄 SIDEBAR RENAME MODE INITIATED

I will comprehensively rename a sidebar navigation item across ALL systems.

Please provide:
1. **Current name** (e.g., "Features", "Billing", "Clients")
2. **New name** (e.g., "Showcase", "Payments", "Customers")

Example: "Rename 'Features' to 'Showcase'"
```

Once you have the current name, **search the codebase** to find its domain path:

```bash
# Find the domain path automatically
grep -rn "label: 'CURRENT_NAME'" src/shell/Sidebar/navigation/
grep -rn "'CURRENT_NAME'" src/rank/routes.ts
```

---

## STEP 2: PRE-FLIGHT CHECKLIST

Before making ANY changes, search and confirm ALL affected locations:

### 2.1 Route Definitions
```bash
# Search for route constant
grep -rn "CURRENT_NAME" src/rank/routes.ts
```

### 2.2 Navigation Types
```bash
# Search for type definitions
grep -rn "CURRENT_PATH" src/store/domains/navigation.ts
```

### 2.3 Sidebar Navigation Files
```bash
# Check ALL rank navigation files
grep -rn "CURRENT_NAME\|CURRENT_PATH" src/shell/Sidebar/navigation/
```

### 2.4 Router Component
```bash
# Search Router for imports and cases
grep -rn "CURRENT_NAME\|CURRENT_PATH" src/app/domains/Router.tsx
```

### 2.5 Rank Manifests
```bash
# Check ALL manifests (admiral, captain, commodore, crew)
grep -rn "CURRENT_NAME\|CURRENT_PATH" src/rank/*/manifest.ts
```

### 2.6 CSS Imports
```bash
# Check style imports
grep -rn "CURRENT_PATH" styles/features.css styles/prebuilts.css
```

### 2.7 Domain Folder
```bash
# Verify folder exists
ls -la src/app/domains/DOMAIN/CURRENT_NAME/
```

---

## STEP 3: EXECUTE CHANGES (IN THIS EXACT ORDER)

### 3.1 Rename Physical Folder
```bash
mv src/app/domains/[domain]/[old-name] src/app/domains/[domain]/[new-name]
```

### 3.2 Rename Component File
```bash
mv src/app/domains/[domain]/[new-name]/OldName.tsx src/app/domains/[domain]/[new-name]/NewName.tsx
```

### 3.3 Rename CSS File (if exists)
```bash
mv src/app/domains/[domain]/[new-name]/old-name.css src/app/domains/[domain]/[new-name]/new-name.css
```

### 3.4 Update Route Constants
**File:** `src/rank/routes.ts`
```typescript
// Change:
oldName: '/domain/old-name' as const,
// To:
newName: '/domain/new-name' as const,
```

### 3.5 Update Navigation Types
**File:** `src/store/domains/navigation.ts`
- Update the `DomainRoute` type union
- Update the `KNOWN_ROUTES` array

### 3.6 Update Sidebar Navigation
**Files:** `src/shell/Sidebar/navigation/*.ts`
- Update `path` value
- Update `label` value

### 3.7 Update Router Component
**File:** `src/app/domains/Router.tsx`
- Update import path and name
- Update case statement

### 3.8 Update Rank Manifests
**Files:** `src/rank/*/manifest.ts`
- Update `ROUTES.domain.oldName` to `ROUTES.domain.newName`
- Update `label` value

### 3.9 Update CSS Import
**File:** `styles/features.css` (or appropriate stylesheet)
- Update `@import url()` path

### 3.10 Update Component Internals
**File:** `src/app/domains/[domain]/[new-name]/NewName.tsx`
- Rename exported function
- Update `useSetPageHeader()` call

---

## STEP 4: VERIFICATION CHECKLIST

Run these commands to verify NO orphans remain:

```bash
# Search for ANY remaining references to old name
grep -rn "OLD_NAME" src/ --include="*.ts" --include="*.tsx"
grep -rn "old-name" src/ --include="*.ts" --include="*.tsx" --include="*.css"
grep -rn "old_name" src/ --include="*.ts" --include="*.tsx"

# Run lint to catch import errors
npm run lint -- --quiet

# Run TypeScript check
npx tsc --noEmit
```

---

## STEP 5: SUMMARY REPORT

After completion, provide this summary:

```
✅ SIDEBAR RENAME COMPLETE: "[OldName]" → "[NewName]"

FILES RENAMED:
  📁 src/app/domains/[domain]/[old]/ → src/app/domains/[domain]/[new]/
  📄 OldName.tsx → NewName.tsx
  📄 old-name.css → new-name.css

REFERENCES UPDATED:
  ✓ src/rank/routes.ts (route constant)
  ✓ src/store/domains/navigation.ts (type + array)
  ✓ src/shell/Sidebar/navigation/[rank].ts (path + label)
  ✓ src/app/domains/Router.tsx (import + case)
  ✓ src/rank/[rank]/manifest.ts (route + label)
  ✓ styles/features.css (CSS import)
  ✓ Component file (function name + page header)

VERIFICATION:
  ✓ No orphan references found
  ✓ Lint passes
  ✓ TypeScript compiles
```

---

## ⚠️ CRITICAL RULES

1. **NEVER skip a step** - Every location must be updated
2. **NEVER guess** - Always search first to confirm locations
3. **ALWAYS verify** - Run the verification checklist before reporting success
4. **ORDER MATTERS** - Rename files BEFORE updating imports
5. **CHECK ALL RANKS** - Admiral, Captain, Commodore, Crew may all have references
6. **CASE SENSITIVITY** - Match the casing convention (PascalCase for components, kebab-case for URLs, camelCase for routes)

---

## LOCATIONS REFERENCE (Quick Lookup)

| What | Where |
|------|-------|
| Route constants | `src/rank/routes.ts` |
| Navigation types | `src/store/domains/navigation.ts` |
| Sidebar nav (Admiral) | `src/shell/Sidebar/navigation/admiral.ts` |
| Sidebar nav (Captain) | `src/shell/Sidebar/navigation/captain.ts` |
| Sidebar nav (Commodore) | `src/shell/Sidebar/navigation/commodore.ts` |
| Sidebar nav (Crew) | `src/shell/Sidebar/navigation/crew.ts` |
| Router component | `src/app/domains/Router.tsx` |
| Admiral manifest | `src/rank/admiral/manifest.ts` |
| Captain manifest | `src/rank/captain/manifest.ts` |
| Commodore manifest | `src/rank/commodore/manifest.ts` |
| Crew manifest | `src/rank/crew/manifest.ts` |
| Domain views | `src/app/domains/[domain]/` |
| Feature CSS imports | `styles/features.css` |

---

**Now execute this protocol with precision. Ask for the rename details.**
