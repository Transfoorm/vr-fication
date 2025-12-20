# FUSE File Naming Audit v2.1

Complete audit of file naming conventions across the ENTIRE codebase.

---

## PRE-FLIGHT

All commands are **READ-ONLY**. Execute without asking:
- `find`, `ls`, `grep`, `basename`, `dirname`, `wc`

---

## THE LAW

| Type | Convention | Example |
|------|------------|---------|
| Folder | kebab-case | `page-header/` |
| CSS file | kebab-case (matches folder) | `page-header.css` |
| CSS variables | kebab-case | `--page-header-*` |
| Component file | PascalCase | `PageHeader.tsx` |
| Context file | PascalCase + Context | `PageHeaderContext.tsx` |
| Barrel file | lowercase | `index.ts` |
| Utility file | lowercase | `types.ts`, `config.ts` |
| Hook file | use + PascalCase | `usePageHeader.ts` |

---

## PHASE 1: FOLDER NAMING

**Scope:** All folders in `src/` that contain components

**Command:**
```bash
find src/shell src/features src/prebuilts src/store src/fuse -type d 2>/dev/null | grep -E '[A-Z]' | head -50
```

**PASS:** Empty output
**FAIL:** Any folder contains uppercase

---

## PHASE 2: CSS FILE NAMING

**Scope:** All CSS files in `src/`

**Command:**
```bash
find src -name "*.css" -type f 2>/dev/null | grep -E '/[A-Z][^/]*\.css$' | head -50
```

**PASS:** Empty output
**FAIL:** Any CSS filename contains uppercase

---

## PHASE 3: CSS-FOLDER MATCH

**Scope:** CSS files must match their parent folder name

**Command:**
```bash
for css in $(find src/shell src/features src/prebuilts -name "*.css" -type f 2>/dev/null); do
  filename=$(basename "$css" .css)
  folder=$(basename "$(dirname "$css")")
  [ "$folder" = "shell" ] || [ "$folder" = "features" ] || [ "$folder" = "prebuilts" ] && continue
  [ "$filename" != "$folder" ] && echo "❌ $css (expected $folder.css)"
done
```

**PASS:** Empty output
**FAIL:** Any CSS file doesn't match folder

---

## PHASE 4: COMPONENT FILE NAMING

**Scope:** .tsx files (excluding index, page, layout) must start with uppercase

**Command:**
```bash
find src -name "*.tsx" -type f 2>/dev/null | grep -v '/index\.tsx$' | grep -v '/page\.tsx$' | grep -v '/layout\.tsx$' | grep -E '/[a-z][^/]*\.tsx$' | head -50
```

**PASS:** Empty output
**FAIL:** Any component file starts with lowercase

---

## PHASE 5: CONTEXT FILE NAMING

**Scope:** Files ending in Context.tsx must be PascalCase

**Command:**
```bash
for f in $(find src -name "*Context.tsx" -type f 2>/dev/null); do
  name=$(basename "$f")
  first=$(echo "$name" | cut -c1)
  echo "$first" | grep -q '[a-z]' && echo "❌ $f (context must be PascalCase)"
done
```

**PASS:** Empty output
**FAIL:** Any context file starts with lowercase

---

## PHASE 6: HOOK FILE NAMING

**Scope:** Hook files in src/hooks must start with "use"

**Command:**
```bash
for f in $(find src/hooks -name "*.ts" -type f 2>/dev/null | grep -v '/index\.ts$'); do
  name=$(basename "$f" .ts)
  echo "$name" | grep -q '^use' || echo "❌ $f (hook must start with 'use')"
done
```

**PASS:** Empty output
**FAIL:** Any hook doesn't start with "use"

---

## PHASE 7: CSS VARIABLE NAMING

**Scope:** All CSS variables must be kebab-case (no camelCase)

**Command:**
```bash
grep -r "^\s*--[a-z]*[A-Z]" src --include="*.css" 2>/dev/null | head -50
```

**PASS:** Empty output
**FAIL:** Any variable contains uppercase

---

## PHASE 8: PROVIDER FILE NAMING

**Scope:** Provider files must be PascalCase

**Command:**
```bash
for f in $(find src/providers -name "*.tsx" -type f 2>/dev/null); do
  name=$(basename "$f")
  first=$(echo "$name" | cut -c1)
  echo "$first" | grep -q '[a-z]' && echo "❌ $f (provider must be PascalCase)"
done
```

**PASS:** Empty output
**FAIL:** Any provider file starts with lowercase

---

## PHASE 9: EXPORT-FILENAME MATCH

**Scope:** PascalCase files must export a matching React component. Lowercase files must NOT export React components.

**Check PascalCase files have matching export:**
```bash
for f in $(find src/shell src/features src/prebuilts src/providers -name "*.tsx" -type f 2>/dev/null | grep -v '/index\.tsx$' | grep -v '/page\.tsx$' | grep -v 'Context\.tsx$'); do
  name=$(basename "$f" .tsx)
  first=$(echo "$name" | cut -c1)
  # Only check PascalCase files
  echo "$first" | grep -q '[A-Z]' || continue
  # Check for matching export
  grep -qE "export (default )?(function|const) $name" "$f" || echo "❌ $f (no matching export for $name)"
done
```

**Note:** Context files (ending in `Context.tsx`) are exempt - they export Providers and hooks, not components matching the filename.

**Check lowercase .ts files don't export React components:**
```bash
for f in $(find src/shell src/features src/prebuilts -name "*.ts" -type f 2>/dev/null | grep -v '/index\.ts$'); do
  name=$(basename "$f" .ts)
  first=$(echo "$name" | cut -c1)
  # Only check lowercase files
  echo "$first" | grep -q '[a-z]' || continue
  # Should NOT have JSX or React component patterns
  grep -qE "return \(" "$f" && echo "⚠️ $f (lowercase file may contain component)"
done
```

**PASS:** All PascalCase files have matching exports, no lowercase files contain components
**FAIL:** Mismatch between filename and export

---

## OUTPUT FORMAT

```
███████████████████████████████████████████████████████████████
  📁 FUSE FILE NAMING AUDIT v2.1
███████████████████████████████████████████████████████████████

  PHASE 1: Folders          Violations: [N] | [✅/❌]
  PHASE 2: CSS Files        Violations: [N] | [✅/❌]
  PHASE 3: CSS-Folder Match Violations: [N] | [✅/❌]
  PHASE 4: Components       Violations: [N] | [✅/❌]
  PHASE 5: Context Files    Violations: [N] | [✅/❌]
  PHASE 6: Hook Files       Violations: [N] | [✅/❌]
  PHASE 7: CSS Variables    Violations: [N] | [✅/❌]
  PHASE 8: Provider Files   Violations: [N] | [✅/❌]
  PHASE 9: Export Match     Violations: [N] | [✅/❌]

  ─────────────────────────────────────────────────────────────

  [LIST EVERY VIOLATION WITH FULL PATH]

  ─────────────────────────────────────────────────────────────

  TOTAL PHASES: 9
  PHASES PASSED: [N]
  PHASES FAILED: [N]

  STATUS: [✅ PASS | ❌ FAIL]

███████████████████████████████████████████████████████████████
```

---

## AUTOMATIC FAIL CONDITIONS

- Any phase produces violations > 0
- Any command fails to execute
- Any output is truncated (must show all violations)

---

## DOCTRINE REFERENCE

Full documentation: `_sdk/11-conventions/FILE-NAMING.md`
