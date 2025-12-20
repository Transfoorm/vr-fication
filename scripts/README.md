# Build Scripts

Collection of maintenance and verification scripts for the FUSE project.

---

## 🧹 Cleanup Scripts

### `cleanBuildinfo.ts`

Removes stale TypeScript buildinfo files that accumulate during builds and commits.

**What it cleans:**
- Files matching `tsconfig.*.tsbuildinfo` (random suffix)
- Keeps the main `tsconfig.tsbuildinfo` (always needed)

**Usage:**
```bash
# Preview what would be deleted (dry run)
npm run clean:buildinfo -- --dry

# Actually delete stale files
npm run clean:buildinfo
```

**When to use:**
- After multiple `/purecommit` runs
- When project root gets cluttered
- Before pushing to git (these are gitignored anyway)

**Safe to run:**
- ✅ Only deletes files with random suffixes
- ✅ Never deletes the main buildinfo
- ✅ Dry run mode available
- ✅ Shows what will be deleted before confirmation

---

## 🔍 Virgin Repo Protocol (VRP) Scripts

### `checkISV.ts`

Validates Inline Style Violations (ISV). Ensures no inline styles except documented exceptions.

```bash
npm run vrp:isv
```

### `checkNaming.ts`

Validates WCCC naming conventions (ft-*, ly-*, pb-* prefixes).

```bash
npm run vrp:naming
```

### `validateManifest.ts`

Validates deletion manifest structure and coverage.

```bash
npm run vrp:manifest
```

### `verifyCascadeCoverage.ts`

Verifies all user references are covered in deletion manifest.

```bash
npm run vrp:cascade
```

### Run All VRP Checks

```bash
npm run vrp:all
```

---

## 📋 Build Integration

Some scripts run automatically during builds:

- **`prebuild`**: Runs `vrp:cascade` before every build
- **`lint-staged`**: Runs ISV and naming checks on commit

---

## Tips

**Run cleanup regularly:**
```bash
# Check what would be cleaned
npm run clean:buildinfo -- --dry

# Clean if files found
npm run clean:buildinfo
```

**Before commits:**
```bash
# Full VRP check
npm run vrp:all

# Clean build artifacts
npm run clean:buildinfo
```
