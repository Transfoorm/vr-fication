# PREBUILTS → VR TRANSFORMATION PLAN

## SCOPE SUMMARY

**Complete language reboot from "prebuilts" to "VR" (Variant Robots)**

- **207 source files** with `@/vr` imports
- **133 internal VR** cross-references within src/vr/
- **22 documentation files** with prebuilts terminology
- **6 configuration files** (tsconfig, eslint, husky, etc.)
- **19 CSS @import** statements in styles/vr.css
- **1 folder rename** (src/vr → src/vr)

## REPOSITORY STRUCTURE

**Two completely separate repositories:**

- `/Users/ken/App/v1` = **prod-test2** (189 commits, frozen forever)
- `/Users/ken/App/vr` = **vr-fication** (2 commits total: seed + transformation)

## EXECUTION STRATEGY

**Single atomic commit** - This is a language change, not a feature. Partial states don't make semantic sense.

**Git history:** Fresh start with just 2 commits:
1. Commit 1 (already exists): README.md seed commit
2. Commit 2 (will create): Full transformed codebase

**Estimated time:** 3-5 hours (including validation)

## PHASE 0: SETUP VR REPOSITORY

```bash
# Clone vr-fication to separate location
cd /Users/ken/App
git clone https://github.com/Transfoorm/vr-fication.git vr

# Verify seed commit exists
cd vr
git log --oneline
# Should show: 511c702 (tag: VR-SEED) chore(VR): establish vr as...
```

**Checkpoint:** vr-fication cloned to /Users/ken/App/vr

## PHASE 1: COPY CODEBASE FROM PROD-TEST2

```bash
cd /Users/ken/App/v1

# Copy complete codebase to /Users/ken/App/vr
cp -R src styles eslint scripts .husky .claude _sdk /Users/ken/App/vr/
cp tsconfig.json tsconfig.VRP.json eslint.config.mjs package.json package-lock.json /Users/ken/App/vr/
cp .gitignore next.config.ts next-env.d.ts CLAUDE.md /Users/ken/App/vr/
cp -R convex vanish /Users/ken/App/vr/
```

**Checkpoint:** All prod-test2 files copied to vr repo

## PHASE 1.5: INSTALL DEPENDENCIES

```bash
cd /Users/ken/App/vr
npm install
```

**Checkpoint:** node_modules installed, ready to build

## PHASE 2: FOLDER RENAME

```bash
cd /Users/ken/App/vr
mv src/vr src/vr
```

**Checkpoint:** src/vr/ exists, src/vr/ gone

## PHASE 3: TYPESCRIPT PATH ALIASES

### Update tsconfig.json (line 23)
```json
"@/vr/*": ["./src/vr/*"],
```

### Update tsconfig.VRP.json (lines 15-16)
```json
"src/vr/**/*.ts",
"src/vr/**/*.tsx",
```

**Checkpoint:** TypeScript resolves @/vr paths

## PHASE 4: CSS HUB TRANSFORMATION

### Rename CSS file
```bash
cd /Users/ken/App/vr/styles
mv prebuilts.css vr.css
```

### Update all 19 @import paths in styles/vr.css
```bash
# Replace all occurrences
sed -i '' 's|../src/vr/|../src/vr/|g' vr.css
```

**Verify:**
```bash
grep "src/vr" vr.css | wc -l
# Should show: 19
```

**Checkpoint:** CSS hub points to src/vr/

## PHASE 5: UPDATE ALL IMPORTS

### Internal VR references (within src/vr/)
```bash
cd /Users/ken/App/vr
find src/vr -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|@/vr|@/vr|g' {} +
```

### External consumer imports (features, pages, etc.)
```bash
find src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "src/vr/*" -exec sed -i '' 's|from ['\''"]@/vr|from '\''@/vr|g' {} +
```

**Verify:**
```bash
# Should be 0
grep -r "@/vr" src/ | wc -l

# Should be ~340+
grep -r "@/vr" src/ | wc -l
```

**Checkpoint:** All imports use @/vr

## PHASE 6: ESLINT CONFIGURATION

### Update eslint.config.mjs

**Line 324-335:** Update WCCC violation message
- Change "prebuilts" → "VR"
- Change "/styles/vr.css" → "/styles/vr.css"
- Change "/src/vr/" → "/src/vr/"

**Lines 365-383:** Update ISVEA exception paths
```bash
sed -i '' 's|src/vr/|src/vr/|g' eslint.config.mjs
```

### Update ESLint custom rules

**eslint/class-prefix.js (line 33):**
```javascript
if (filename.includes('/vr/') || filename.includes('/src/vr/')) {
```

**eslint/no-component-css.js (lines 9, 34):**
- Change "prebuilts.css" → "vr.css"

**Checkpoint:** ESLint rules reference src/vr/

## PHASE 7: SCRIPTS AND HOOKS

### Update validation scripts

**scripts/checkVRClasses.ts (line 36):**
```typescript
const validPatterns = [
  /^src\/vr\/.+\.css$/,
  // ...
];
```

**scripts/checkTypography.ts (line 41, 56):**
- Change exclusion path to `src/vr/typography/`

### Update git hooks

**.husky/pre-commit (lines 24, 30):**
- Line 24: "/styles/vr.css (vr-* components)"
- Line 30: "Create new VR variant in /src/vr/"

**Checkpoint:** Scripts and hooks use VR terminology

## PHASE 8: CLAUDE CODE PERMISSIONS

### Update .claude/settings.local.json

Replace all prebuilts references in bash command permissions:
```bash
sed -i '' 's|src/vr|src/vr|g' .claude/settings.local.json
```

**Checkpoint:** Claude permissions reference src/vr

## PHASE 9: DOCUMENTATION TRANSFORMATION

### Critical files requiring manual review (22 files):

**SDK Documentation:**
1. `_sdk/00-dev-bible/README.md` - Directory structure, import examples
2. `_sdk/08-architecture/DOMAIN-AND-FEATURES-SETUP.md` - All import examples
3. `_sdk/11-conventions/VR-DOCTRINE.md` - Core doctrine, file paths
4. `_sdk/11-conventions/FILE-NAMING.md` - File naming table
5. `_sdk/11-conventions/PAGE-AND-TAB-SETUP-GUIDE.md` - Import examples
6. `_sdk/11-conventions/TYPOGRAPHY-AND-SPACING.md` - Typography VR references
7. `_sdk/11-conventions/Typography-Migration-Completion-Statement.md` - References
8. `styles/WCCC-PROTOCOL.md` - CSS architecture documentation

**Claude Commands:**
9. `.claude/commands/VR-guru.md` - VR doctrine references
10. `.claude/commands/T-VR.md` - Typography VR documentation
11. `.claude/commands/VRP-naming-scan.md` - File naming guidance
12. `.claude/commands/VRP-dante-scan.md` - Scanning patterns
13. `.claude/commands/VRP-isv-scan.md` - ISV detection paths
14. `.claude/commands/VRP-sidebar.md` - Sidebar protocol
15. `.claude/commands/VR-class-scanner.md` - Class scanning rules
16. `.claude/commands/TTT-domain-features.md` - Import examples

**Component Documentation:**
17. `src/vr/typography/README.md` - Typography import examples

**Root Documentation:**
18. `CLAUDE.md` - VR philosophy section

**Find and replace patterns:**
- "prebuilts" → "VR" or "VRs" (context-dependent)
- "@/vr" → "@/vr"
- "src/vr" → "src/vr"
- "styles/vr.css" → "styles/vr.css"
- "/vr/" → "/vr/"
- "prebuilt components" → "VR components"
- "pre-built" → "VR"

**Automated scan:**
```bash
# Find all remaining references
grep -ril "prebuilts" . --include="*.md" | grep -v node_modules | grep -v .next
```

**Checkpoint:** Zero "prebuilts" in documentation

## PHASE 10: VALIDATION

### Comprehensive verification
```bash
cd /Users/ken/App/vr

# 1. No prebuilts references
grep -r "prebuilts" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git | wc -l
# Expected: 0

# 2. VR imports exist
grep -r "@/vr" src/ | wc -l
# Expected: ~340+

# 3. TypeScript compiles
npm run typecheck
# Expected: No errors

# 4. ESLint passes
npx eslint . --max-warnings=0
# Expected: No violations

# 5. Build succeeds
npm run build
# Expected: Successful build

# 6. VRP checks pass
npm run vrp:all
# Expected: All checks pass
```

**Checkpoint:** All validations pass

## PHASE 11: COMMIT

### Single atomic commit
```bash
cd /Users/ken/App/vr

git add .
git commit -m "feat: Complete prebuilts → VR language transformation

BREAKING CHANGE: Complete architectural language reboot from 'prebuilts' to 'VR' (Variant Robots)

Transformations:
- Renamed: src/vr → src/vr
- Renamed: styles/vr.css → styles/vr.css
- Updated: All 340+ imports from @/vr to @/vr
- Updated: TypeScript path aliases in tsconfig files
- Updated: ESLint rules and custom plugins
- Updated: npm scripts and validation scripts
- Updated: Git hooks (.husky/pre-commit)
- Updated: Claude Code permissions
- Updated: 22 documentation files with VR terminology

Scope:
- 207 source files (external imports)
- 133 VR internal references
- 19 CSS @import statements
- 7 ESLint rule files
- 6 configuration files
- 4 validation scripts

Verification:
- ✅ TypeScript compiles (npm run typecheck)
- ✅ ESLint passes (npx eslint . --max-warnings=0)
- ✅ Build succeeds (npm run build)
- ✅ VRP suite passes (npm run vrp:all)
- ✅ Zero 'prebuilts' references remaining
- ✅ UI pixel-perfect identical to MAIN

This is a language evolution, not a rewrite. All component APIs, architectural patterns, and UI behavior remain identical. Only the terminology and import paths have changed.

Ref: README.md - Dimensional Isolation Protocol

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

**Checkpoint:** Transformation committed and pushed

## CRITICAL FILES

### Must be updated correctly (in order):
1. `/Users/ken/App/vr/tsconfig.json` (line 23)
2. `/Users/ken/App/vr/src/vr/index.tsx` (central export hub)
3. `/Users/ken/App/vr/styles/vr.css` (19 @import statements)
4. `/Users/ken/App/vr/eslint.config.mjs` (WCCC rules + ISVEA)
5. `/Users/ken/App/vr/scripts/checkVRClasses.ts` (validation)

## SUCCESS CRITERIA

✅ Fresh git history (2 commits total)
✅ Zero "prebuilts" references in code
✅ Zero "@/vr" imports
✅ src/vr/ folder exists (src/vr/ gone)
✅ styles/vr.css exists (styles/vr.css gone)
✅ TypeScript compiles
✅ ESLint passes
✅ Build succeeds
✅ VRP checks pass
✅ Documentation uses VR terminology
✅ UI pixel-perfect identical to MAIN
✅ Same lint rules and configs as prod-test2

## ROLLBACK STRATEGY

If critical issues arise:
```bash
cd /Users/ken/App/vr
git reset --hard HEAD~1  # Undo transformation commit, back to seed
# Or delete entire /Users/ken/App/vr and start over
```

## RISK MITIGATION

**High risk:** Internal VR cross-references (Phase 5)
→ Use automated sed, verify with grep

**Medium risk:** CSS import chain (Phase 4)
→ Update all 19 atomically, verify paths exist

**Low risk:** Documentation (Phase 9)
→ Manual review prevents context errors

## EXECUTION ORDER (DO NOT DEVIATE)

0. Clone vr-fication to /Users/ken/App/vr
1. Copy codebase from prod-test2
2. npm install
3. Rename folder (src/vr → src/vr)
4. Update TypeScript paths
5. Update CSS hub
6. Update all imports (internal first, external second)
7. Update ESLint
8. Update scripts/hooks
9. Update Claude permissions
10. Update documentation
11. Validate everything
12. Commit and push

**Why this order:** Each phase depends on the previous. Changing imports before TypeScript paths = broken module resolution. Changing external imports before internal VR structure = broken component system.
