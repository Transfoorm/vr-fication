---
description: ISV Full Codebase Scanner - Inline Style Virus Detection
tags: [vrp, isv, css, style, audit]
---

# 🛡️ ISV FULL CODEBASE SCANNER

**Scans the entire codebase for Inline Style Virus violations**

This scanner detects `style={{}}` inline styles that violate FUSE-STYLE architecture.

---

## SCAN INSTRUCTIONS

Use the Grep tool (NOT bash grep) to find ALL inline style occurrences:

```
pattern: style\s*=\s*\{\{
glob: **/*.tsx
output_mode: content
```

This will find EVERY `style={{` in the codebase.

---

## EXCEPTION FILES (ALLOWED)

These files have legitimate Dynamic Law exceptions - inline styles ARE permitted here:

| File | Reason |
|------|--------|
| `src/features/setup/flying-button/index.tsx` | Phoenix Animation - runtime CSS custom properties |
| `src/prebuilts/tooltip/TooltipBasic.tsx` | Portal positioning via getBoundingClientRect |
| `src/prebuilts/input/range/index.tsx` | Runtime percentage positioning for slider |
| `src/features/shell/user-button/index.tsx` | react-easy-crop library requires style prop |
| `src/prebuilts/modal/drawer/portal.tsx` | Portal dynamic positioning |
| `src/prebuilts/rank/card/index.tsx` | CSS custom property bridges from metadata |

---

## CLASSIFICATION RULES

**IMPORTANT**: For EVERY match found by grep:

1. Check if the file path is in the EXCEPTION FILES list above
2. If YES → classify as ✅ EXCEPTION (allowed)
3. If NO → classify as 🦠 VIOLATION (must fix)

**You MUST report ALL matches.** Do not skip any. Do not assume patterns didn't match.

---

## REPORT FORMAT

For each match found, report:

```
File: [path]:[line]
Code: [the line with style={{}}]
Status: ✅ EXCEPTION (in allowed list) / 🦠 VIOLATION (must fix)
```

---

## SCAN RESULTS TEMPLATE

After scanning, provide this summary:

```
═══════════════════════════════════════════════════════════════
  🛡️ ISV FULL CODEBASE SCAN RESULTS
═══════════════════════════════════════════════════════════════

📊 SUMMARY
   Total matches found: [X]
   Exceptions (allowed): [X]
   Violations (must fix): [X]

✅ KNOWN EXCEPTIONS:
   - [file:line] - [reason from table]
   - [file:line] - [reason from table]

🦠 VIOLATIONS REQUIRING FIX:
   - [file:line] - NEEDS CSS EXTRACTION
   (or "None - codebase is clean!" if no violations)

═══════════════════════════════════════════════════════════════
```

---

## FIX INSTRUCTIONS

For each violation:

1. **Extract to CSS class** - Move the inline styles to the component's CSS file
2. **Use CSS custom properties** - For dynamic values, use `--var-name` pattern
3. **Add to exceptions** - If truly dynamic (runtime positioning), add to `scripts/checkISV.ts`

Example fix:
```tsx
// ❌ BEFORE (violation)
<div style={{ marginTop: 20, color: 'red' }} />

// ✅ AFTER (compliant)
<div className="my-component-box" />
```

```css
/* In component.css */
.my-component-box {
  margin-top: 20px;
  color: var(--color-error);
}
```
