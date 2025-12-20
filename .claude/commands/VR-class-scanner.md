# 🦠 VR CLASS SCANNER v3.0 — ABSOLUTE MODE

```
███████████████████████████████████████████████████████████████
█                                                             █
█   A B S O L U T E   M O D E   E N G A G E D                █
█                                                             █
█   This specification is LITERAL MACHINE LAW.                █
█   There is no interpretation. There is no discretion.       █
█   There is only COMPLIANCE or VIOLATION.                    █
█                                                             █
███████████████████████████████████████████████████████████████
```

---

## 🚀 PRE-FLIGHT: AUTO-APPROVED COMMANDS

All scanner commands are **READ-ONLY**. They do not modify files.

The following are **AUTO-APPROVED** — execute without asking:
- `Bash(grep:*)`
- `Bash(find:*)`
- `Bash(sort:*)`
- `Bash(sed:*)`
- `Bash(wc:*)`
- `Bash(xargs:*)`
- `Bash(uniq:*)`
- `Bash(head:*)`
- `Bash(cat:*)`

**DO NOT** pause for approval on these commands. Run the entire audit in one pass.

---

## ⚫ ABSOLUTE MODE DECLARATION

You are a **machine**. You execute rules. You do not think. You do not interpret. You do not contextualize.

**THE FOLLOWING ARE PERMANENTLY DISABLED:**
- Interpretation
- Inference
- Rationalization
- Charity
- Discretion
- Context
- Intent detection
- "Common sense"
- "Probably"
- "Likely"
- "Should be fine"
- "I thought"
- "It looks like"
- "This seems"
- "In this case"
- "Given the context"
- "The developer probably meant"
- "This is probably intentional"
- "Legacy exception"
- "Known technical debt"
- Any form of human judgment

**YOU ARE A REGEX ENGINE WITH LEGS.**

---

## 🔴 AUTOMATIC FAIL CONDITIONS

The scan **AUTOMATICALLY FAILS** — no further processing — if ANY of the following occur:

| Condition | Result |
|-----------|--------|
| Any phase produces violations > 0 | **FAIL** |
| Any phase is skipped | **FAIL** |
| Any phase is partially executed | **FAIL** |
| Any phase command returns an error | **FAIL** |
| Any file exists in an undefined location | **FAIL** |
| Any class does not match an explicit pattern | **FAIL** |
| Any keyframe does not match an explicit pattern | **FAIL** |
| Any variable does not match an explicit pattern | **FAIL** |
| Any duplicate name exists | **FAIL** |
| Any orphaned definition exists | **FAIL** |
| Any rule in this spec is ambiguous | **FAIL** |
| Any rule in this spec contradicts another rule | **FAIL** |
| Any anomaly is detected that is not explicitly permitted | **FAIL** |
| The scanner cannot determine if something is permitted | **FAIL** |
| The scanner "thinks" something "might be okay" | **FAIL** |
| The scanner uses any word from the disabled list above | **FAIL** |

**There is no WARNING state. There is no NEEDS ATTENTION state. There is no MAYBE.**

**There is PASS. There is FAIL. There is nothing else.**

---

## 📍 EXHAUSTIVE VALID LOCATIONS (CANONICAL LIST)

These are the **ONLY** locations where CSS files may exist.

If a CSS file exists **ANYWHERE ELSE**, the scan **FAILS**.

| # | Location Pattern | Required Class Prefix | Required Keyframe Prefix | Variable Rules | Content Rules |
|---|------------------|----------------------|-------------------------|----------------|---------------|
| 1 | `/src/prebuilts/**/*.css` | `.vr-{component}-*` | `vr-{component}-{action}` | `--{component}-*` | Classes, keyframes, variables |
| 2 | `/src/features/**/*.css` | `.ft-{feature}-*` | `ft-{feature}-{action}` | `--{feature}-*` | Classes, keyframes, variables |
| 3 | `/src/shell/**/*.css` | `.ly-{area}-*` | `ly-{area}-{action}` | `--{area}-*` | Classes, keyframes, variables (includes `app.css` for God Layout frame) |
| 4 | `/src/app/domains/**/*.css` | `.ly-{component}-*` | `ly-{component}-{action}` | `--{component}-*` | Classes, keyframes, variables |
| 5 | `/src/app/(auth)/**/*.css` | `.ft-auth-*` | `ft-auth-{action}` | `--ft-auth-*` | Classes, keyframes, variables |
| 6 | `/styles/tokens.css` | FORBIDDEN | FORBIDDEN | `--{token}-*` | Variables ONLY |
| 7 | `/styles/animations.css` | FORBIDDEN | ANY (generic allowed) | FORBIDDEN | Keyframes ONLY |
| 8 | `/styles/globals.css` | FORBIDDEN | FORBIDDEN | FORBIDDEN | Element selectors ONLY (html, body, *, ::selection) |
| 9 | `/styles/prebuilts.css` | FORBIDDEN | FORBIDDEN | FORBIDDEN | @import statements ONLY |
| 10 | `/styles/features.css` | FORBIDDEN | FORBIDDEN | FORBIDDEN | @import statements ONLY |
| 11 | `/styles/layout.css` | FORBIDDEN | FORBIDDEN | FORBIDDEN | @import statements ONLY |
| 12 | `/styles/themes/*.css` | FORBIDDEN | FORBIDDEN | `--{theme}-*` | Variables ONLY |

**NOTE:** Vanish (quarantine zone) CSS lives at `/src/features/vanish/` and is covered by Row 2.

**FORBIDDEN means:** If this content type exists in this file, the scan **FAILS**.

**EXPLICIT BANNED LOCATIONS (existence = FAIL):**
- `/src/behaviors/**/*.css`
- `/src/components/**/*.css`
- `/src/app/*.css` (root level)
- `/src/app/api/**/*.css`
- `/src/lib/**/*.css`
- `/src/hooks/**/*.css`
- `/src/utils/**/*.css`
- `/src/types/**/*.css`
- `/src/store/**/*.css`
- `/src/constants/**/*.css`
- Any path not listed in rows 1-12 above

---

## 🔒 PHASE 0: SPEC SELF-VALIDATION (MANDATORY)

Before scanning ANY code, the scanner MUST validate THIS SPECIFICATION is internally consistent.

**CHECK 0.1: Rule Contradiction Detection**
```
Scan this spec document for any rule that contradicts another rule.
If found: FAIL immediately with "SPEC CONTRADICTION DETECTED"
```

**CHECK 0.2: Ambiguity Detection**
```
Scan this spec document for any rule containing:
- "should"
- "might"
- "could"
- "possibly"
- "depending on"
- "in some cases"
- "generally"
- "usually"
- "typically"
- "often"
- "sometimes"

If found: FAIL immediately with "SPEC AMBIGUITY DETECTED"
```

**CHECK 0.3: Completeness Verification**
```
For each location pattern in the CANONICAL LIST:
- Is the class prefix explicitly defined? (YES/NO, not "depends")
- Is the keyframe prefix explicitly defined? (YES/NO/FORBIDDEN, not "depends")
- Is the variable rule explicitly defined? (YES/NO/FORBIDDEN, not "depends")
- Is the content rule explicitly defined? (YES/NO, not "depends")

If ANY answer is unclear: FAIL immediately with "SPEC INCOMPLETE"
```

**Output:**
```
PHASE 0: Spec Validation   Contradictions: [N] | Ambiguities: [N] | Incomplete: [N] | [PASS/FAIL]
```

---

## 🔒 PHASE 1: FILE LOCATION ENFORCEMENT (MANDATORY)

**COMMAND (MUST RUN EXACTLY AS WRITTEN):**
```bash
find src styles -name "*.css" -type f 2>/dev/null | sort
```

**VALIDATION:**
For EACH file returned, perform the following checks IN ORDER:

1. Does the file path match EXACTLY ONE row in the CANONICAL LIST (rows 1-12)?
   - If NO MATCH: `❌ UNDEFINED LOCATION: [path]` → **FAIL**
   - If MULTIPLE MATCHES: `❌ AMBIGUOUS LOCATION: [path]` → **FAIL**

2. Is the file path in the EXPLICIT BANNED LOCATIONS list?
   - If YES: `❌ BANNED LOCATION: [path]` → **FAIL**

**Output:**
```
PHASE 1: File Locations    Scanned: [N] files | Undefined: [N] | Banned: [N] | [PASS/FAIL]
```

If violations > 0, list EVERY violation with EXACT path.

---

## 🔒 PHASE 2: CLASS PREFIX ENFORCEMENT (MANDATORY)

**COMMAND (MUST RUN EXACTLY AS WRITTEN):**
```bash
grep -rhn "^\." src/**/*.css styles/**/*.css 2>/dev/null | grep -E ":\.[a-z]"
```

**VALIDATION:**
For EACH class definition found:

1. Determine which CANONICAL LIST row the file belongs to
2. Check if the class matches the REQUIRED CLASS PREFIX for that row
3. If prefix is FORBIDDEN for that row and class exists: **FAIL**
4. If class does not start with `vr-`, `ft-`, or `ly-`: **FAIL**

**EXPLICIT VIOLATIONS (no exceptions, no context, no "but it's a..."):**

| Pattern Found | Violation | Correct Pattern |
|---------------|-----------|-----------------|
| `.auth-*` | YES | `.ft-auth-*` |
| `.modes-*` | YES | DELETED |
| `.dashboard-*` | YES | DELETED |
| `.root-*` | YES | `.ly-root-*` |
| `.menu-*` | YES | Location-based prefix |
| `.modal-*` | YES | `.vr-modal-*` |
| `.button-*` | YES | `.vr-button-*` |
| `.page-*` | YES | `.vr-page-*` or `.ly-page-*` |
| `.card-*` | YES | `.vr-card-*` |
| `.input-*` | YES | `.vr-input-*` |
| `.form-*` | YES | `.vr-form-*` |
| `.table-*` | YES | `.vr-table-*` |
| `.list-*` | YES | `.vr-list-*` |
| `.nav-*` | YES | `.ly-nav-*` |
| `.header-*` | YES | `.ly-header-*` |
| `.footer-*` | YES | `.ly-footer-*` |
| `.sidebar-*` | YES | `.ly-sidebar-*` |
| `.container-*` | YES | Location-based prefix |
| `.wrapper-*` | YES | Location-based prefix |
| `.content-*` | YES | Location-based prefix |
| `.[any-other-unprefixed]` | YES | Must use vr-/ft-/ly- |

**Output:**
```
PHASE 2: Class Prefixes    Scanned: [N] classes | Violations: [N] | [PASS/FAIL]
```

List EVERY violation: `❌ [file:line] .[class] — Must be .[correct-prefix]-*`

---

## 🔒 PHASE 3: KEYFRAME ENFORCEMENT (MANDATORY)

**COMMAND (MUST RUN EXACTLY AS WRITTEN):**
```bash
# Extract keyframes with file paths, validate prefix matches folder name
bash -c '
violations=0
scanned=0
while IFS=: read -r file line content; do
  keyframe=$(echo "$content" | grep -o "@keyframes [a-z][a-z0-9-]*" | sed "s/@keyframes //" | head -1)
  [ -z "$keyframe" ] && continue
  scanned=$((scanned + 1))

  # styles/animations.css allows any keyframe name
  echo "$file" | grep -q "styles/animations.css" && continue

  # Extract expected prefix and folder from path
  dir=$(dirname "$file")
  folder=$(basename "$dir" | tr "[:upper:]" "[:lower:]" | tr -d "-")

  # Determine required prefix based on location
  if echo "$file" | grep -q "src/prebuilts/"; then
    required_prefix="vr-"
  elif echo "$file" | grep -q "src/features/"; then
    required_prefix="ft-"
  elif echo "$file" | grep -q "src/shell/"; then
    required_prefix="ly-"
  elif echo "$file" | grep -q "src/app/(auth)/"; then
    required_prefix="ft-auth-"
  else
    required_prefix=""
  fi

  # Check prefix exists
  if [ -n "$required_prefix" ]; then
    if ! echo "$keyframe" | grep -q "^${required_prefix}"; then
      echo "❌ PREFIX VIOLATION: $file:$line @keyframes $keyframe (must start with $required_prefix)"
      violations=$((violations + 1))
      continue
    fi

    # Check folder name appears after prefix (except for auth which is fixed)
    if [ "$required_prefix" != "ft-auth-" ]; then
      suffix=$(echo "$keyframe" | sed "s/^${required_prefix}//")
      # Get folder name in both forms: compacted (no hyphens) and kebab-case
      folder_compact=$(basename "$dir" | tr "[:upper:]" "[:lower:]" | tr -d "-")
      folder_kebab=$(basename "$dir" | sed "s/\([a-z]\)\([A-Z]\)/\1-\2/g" | tr "[:upper:]" "[:lower:]")
      # Check if suffix starts with either form
      if ! echo "$suffix" | grep -qi "^$folder_compact" && ! echo "$suffix" | grep -qi "^$folder_kebab"; then
        echo "❌ FOLDER MISMATCH: $file:$line @keyframes $keyframe (expected ${required_prefix}${folder_kebab}-*)"
        violations=$((violations + 1))
      fi
    fi
  fi
done < <(find src styles -name "*.css" -exec grep -Hn "@keyframes " {} \; 2>/dev/null)
echo "---"
echo "SCANNED: $scanned"
echo "VIOLATIONS: $violations"
'
```

**VALIDATION:**
For EACH keyframe found:

1. Determine which CANONICAL LIST row the file belongs to
2. If file is `/styles/animations.css` (row 7): ANY keyframe name is allowed
3. If file is rows 6, 8, 9, 10, 11, 12: Keyframes are FORBIDDEN → **FAIL**
4. For rows 1-5: Keyframe MUST match the REQUIRED KEYFRAME PREFIX for that row
5. **NEW:** Keyframe name after prefix MUST start with the parent folder name

**GENERIC NAMES FORBIDDEN OUTSIDE animations.css:**

| Keyframe Name | Allowed In | Violation Everywhere Else |
|---------------|------------|---------------------------|
| `pulse` | animations.css ONLY | YES |
| `fade-in` | animations.css ONLY | YES |
| `fade-out` | animations.css ONLY | YES |
| `scale-in` | animations.css ONLY | YES |
| `scale-out` | animations.css ONLY | YES |
| `slide-in` | animations.css ONLY | YES |
| `slide-out` | animations.css ONLY | YES |
| `slide-up` | animations.css ONLY | YES |
| `slide-down` | animations.css ONLY | YES |
| `bounce-in` | animations.css ONLY | YES |
| `bounce-out` | animations.css ONLY | YES |
| `shimmer` | animations.css ONLY | YES |
| `spin` | animations.css ONLY | YES |
| `loading` | animations.css ONLY | YES |
| `blink` | animations.css ONLY | YES |
| `shake` | animations.css ONLY | YES |
| `wiggle` | animations.css ONLY | YES |
| `pop` | animations.css ONLY | YES |
| `glow` | animations.css ONLY | YES |
| `[any-unprefixed-name]` | animations.css ONLY | YES |

**Output:**
```
PHASE 3: Keyframes         Scanned: [N] keyframes | Violations: [N] | [PASS/FAIL]
```

---

## 🔒 PHASE 4: KEYFRAME COLLISION DETECTION (MANDATORY)

**COMMAND (MUST RUN EXACTLY AS WRITTEN):**
```bash
grep -rh "@keyframes " src/**/*.css 2>/dev/null | \
  sed 's/.*@keyframes //' | sed 's/ {.*//' | sort | uniq -d
```

**NOTE:** This checks `src/**/*.css`. `styles/animations.css` is the canonical source — duplicates there are impossible by definition.

**VALIDATION:**
Output MUST be empty.

If ANY duplicate keyframe name is found:
```
❌ COLLISION: @keyframes [name] defined in multiple files
```
→ **FAIL**

**Output:**
```
PHASE 4: Collisions        Unique: [N] | Duplicates: [N] | [PASS/FAIL]
```

---

## 🔒 PHASE 5: VARIABLE ENFORCEMENT (MANDATORY)

**COMMAND (MUST RUN EXACTLY AS WRITTEN):**
```bash
# Extract variables with file paths, validate lineage
bash -c '
violations=0
scanned=0
while IFS=: read -r file line content; do
  var=$(echo "$content" | grep -o "^[[:space:]]*--[a-z][a-z0-9-]*" | sed "s/^[[:space:]]*//" | head -1)
  [ -z "$var" ] && continue
  scanned=$((scanned + 1))

  # Skip --anim-* (animation slots are permitted)
  echo "$var" | grep -q "^--anim-" && continue

  # Skip tokens.css and themes (global design tokens)
  echo "$file" | grep -q "styles/tokens.css" && continue
  echo "$file" | grep -q "styles/themes/" && continue

  # SPECIAL CASE: Row 5 - auth variables must be --ft-auth-*
  if echo "$file" | grep -q "src/app/(auth)/"; then
    if echo "$var" | grep -q "^--ft-auth-"; then
      continue  # Valid auth variable
    else
      echo "❌ AUTH VIOLATION: $file:$line $var (must be --ft-auth-*)"
      violations=$((violations + 1))
      continue
    fi
  fi

  # Extract folder name (kebab-case preserved)
  dir=$(dirname "$file")
  folder_kebab=$(basename "$dir" | tr "[:upper:]" "[:lower:]")
  parent_kebab=$(basename "$(dirname "$dir")" | tr "[:upper:]" "[:lower:]")

  # Variable prefix (everything after -- up to meaningful segments)
  varprefix=$(echo "$var" | sed "s/^--//")

  # Check if variable starts with folder name (kebab-case match)
  if echo "$varprefix" | grep -qi "^${folder_kebab}-\|^${folder_kebab}$"; then
    continue  # Valid: matches folder name
  fi

  # Check if variable starts with parent-folder pattern (for nested)
  if echo "$varprefix" | grep -qi "^${parent_kebab}-"; then
    continue  # Valid: matches parent lineage
  fi

  # Violation: variable does not trace to folder lineage
  echo "❌ LINEAGE VIOLATION: $file:$line $var (expected --${folder_kebab}-*)"
  violations=$((violations + 1))

done < <(find src -name "*.css" -exec grep -Hn "^[[:space:]]*--[a-z]" {} \; 2>/dev/null)
echo "---"
echo "SCANNED: $scanned"
echo "VIOLATIONS: $violations"
'
```

**VALIDATION:**
For EACH variable definition found:

1. Determine which CANONICAL LIST row the file belongs to
2. Extract the component lineage from the file path
3. Variable MUST start with a prefix that traces back to its component

**RULE:** Variable prefix must contain enough lineage to be unambiguous and traceable.

**EXAMPLE ENFORCEMENT:**
| File Path | Valid Prefix | Why |
|-----------|--------------|-----|
| `src/prebuilts/modal/modal.css` | `--modal-*` | Folder name match |
| `src/prebuilts/input/checkbox/form/form.css` | `--checkbox-*` or `--form-*` | Parent or folder match |
| `src/features/shell/user-button/user-button.css` | `--user-button-*` | Kebab-case folder match |
| `src/features/shell/company-button/company-button.css` | `--company-button-*` | Kebab-case folder match |
| `src/features/shell/country-selector/country-selector.css` | `--country-selector-*` | Kebab-case folder match |
| `src/app/(auth)/auth.css` | `--ft-auth-*` | Row 5 special case |
| `src/shell/Sidebar/sidebar.css` | `--sidebar-*` | Folder name match |

**INVALID:**
| File Path | Invalid Prefix | Why |
|-----------|----------------|-----|
| `src/features/shell/user-button/user-button.css` | `--userbutton-*` | Must match kebab-case folder |
| `src/app/(auth)/auth.css` | `--auth-*` | Must be `--ft-auth-*` per Row 5 |

**PERMITTED EXCEPTION: Animation Slot Variables**

Variables prefixed with `--anim-*` are **animation slot variables**. They are:
- Defined locally in component CSS (scoped to a selector)
- Consumed by shared keyframes in `styles/animations.css`
- Intentionally generic to enable keyframe reuse across components

| Pattern | Location | Status |
|---------|----------|--------|
| `--anim-slide-distance` | Inside `.vr-*` selector | ✅ PERMITTED |
| `--anim-scale-factor` | Inside `.vr-*` selector | ✅ PERMITTED |
| `--anim-*` | Inside any scoped selector | ✅ PERMITTED |
| `--anim-*` | At `:root` level | ❌ VIOLATION |

**GENERIC VARIABLES ARE ALWAYS VIOLATIONS (except --anim-*):**
| Variable | Violation |
|----------|-----------|
| `--color` | YES |
| `--size` | YES |
| `--gap` | YES |
| `--padding` | YES |
| `--margin` | YES |
| `--width` | YES |
| `--height` | YES |
| `--border` | YES |
| `--radius` | YES |
| `--shadow` | YES |
| `--bg` | YES |
| `--background` | YES |
| `--text` | YES |
| `--font` | YES |
| `--transition` | YES |
| `--animation` | YES |
| `--z-index` | YES |
| `--opacity` | YES |
| `--[any-single-word]` | YES (must be prefixed, except --anim-*) |

**Output:**
```
PHASE 5: Variables         Scanned: [N] variables | Violations: [N] | [PASS/FAIL]
```

---

## 🔒 PHASE 6: CROSS-CONTAMINATION DETECTION (MANDATORY)

**COMMANDS (MUST RUN ALL EXACTLY AS WRITTEN):**

```bash
# Check 6.1: VR files defining feature classes
grep -rn "^\.ft-" src/prebuilts/**/*.css 2>/dev/null

# Check 6.2: Feature files defining VR classes
grep -rn "^\.vr-" src/features/**/*.css 2>/dev/null

# Check 6.3: Shell files defining VR or feature classes
grep -rn "^\.vr-\|^\.ft-" src/shell/**/*.css 2>/dev/null

# Check 6.4: Domain files defining VR or feature classes
grep -rn "^\.vr-\|^\.ft-" src/app/domains/**/*.css 2>/dev/null

# Check 6.5: Wrong keyframe prefix in VR files
grep -rn "@keyframes ft-" src/prebuilts/**/*.css 2>/dev/null

# Check 6.6: Wrong keyframe prefix in feature files
grep -rn "@keyframes vr-\|@keyframes ly-" src/features/**/*.css 2>/dev/null

# Check 6.7: Wrong keyframe prefix in shell files
grep -rn "@keyframes vr-\|@keyframes ft-" src/shell/**/*.css 2>/dev/null
```

**VALIDATION:**
ALL seven commands MUST return empty.

ANY output from ANY command = **FAIL**

**Output:**
```
PHASE 6: Contamination     Checks: 7 | Bleeds: [N] | [PASS/FAIL]
```

---

## 🔒 PHASE 7: ORPHAN DETECTION (MANDATORY)

**COMMAND (MUST RUN EXACTLY AS WRITTEN):**
```bash
# Extract all CSS class names, check each against TSX files in src/
grep -roh '\.[vfl][rty]-[a-z][a-z0-9_-]*' src/**/*.css 2>/dev/null | sort -u | sed 's/^\.//' | xargs -I{} sh -c 'grep -rq "{}" src/ 2>/dev/null || echo "ORPHAN: .{}"'
```

**VALIDATION:**
Output MUST be empty.

ANY orphaned class = dead code = **FAIL**

**Output:**
```
PHASE 7: Orphans           Scanned: [N] classes | Orphaned: [N] | [PASS/FAIL]
```

---

## 🔒 PHASE 8: CONTENT RULE ENFORCEMENT (MANDATORY)

For files with strict content rules (rows 6-12 in CANONICAL LIST):

**CHECK 8.1: tokens.css**
```bash
# Must contain ONLY :root, variables, comments, whitespace
# Looks for violations: class selectors, element selectors (except :root)
grep -E "^\.[a-z]|^[a-z]+\s*\{" styles/tokens.css 2>/dev/null
```
If output is non-empty: **FAIL**

**CHECK 8.2: animations.css**
```bash
# Must contain ONLY @keyframes, comments, whitespace
# Looks for violations: class selectors, element selectors, :root
grep -E "^\.[a-z]|^[a-z]+\s*\{|^:root" styles/animations.css 2>/dev/null
```
If output is non-empty: **FAIL**

**CHECK 8.3: globals.css**
```bash
# Must contain ONLY element selectors
grep -E "^\.[a-z]" styles/globals.css 2>/dev/null
```
If output is non-empty: **FAIL**

**CHECK 8.4: Import Hub Files (must contain ONLY @import statements)**
```bash
# Must contain ONLY @import statements (and comments/whitespace)
# Looks for violations: class selectors, id selectors, element selectors, CSS properties
for file in styles/prebuilts.css styles/features.css styles/layout.css src/shell/shell.css; do
  if grep -E "^[\.#a-z\[]|^\s+[a-z-]+:" "$file" 2>/dev/null | grep -q .; then
    echo "VIOLATION: $file contains non-import content"
  fi
done
```
If output is non-empty: **FAIL**

**CHECK 8.5: Theme Files (must contain ONLY variables)**
```bash
# Must contain ONLY :root, variables, comments, whitespace
# Looks for violations: class selectors, element selectors, @keyframes
for file in styles/themes/*.css; do
  if grep -E "^\.[a-z]|^[a-z]+\s*\{|^@keyframes" "$file" 2>/dev/null | grep -q .; then
    echo "VIOLATION: $file contains non-variable content"
  fi
done
```
If output is non-empty: **FAIL**

**Output:**
```
PHASE 8: Content Rules     Checked: [N] files | Violations: [N] | [PASS/FAIL]
```

---

## 📊 FINAL OUTPUT FORMAT

```
███████████████████████████████████████████████████████████████
  🦠 VR CLASS SCANNER v3.0 — ABSOLUTE MODE AUDIT
███████████████████████████████████████████████████████████████

  PHASE 0: Spec Validation   Contradictions: [N] | Ambiguities: [N] | [✅/❌]
  PHASE 1: File Locations    Scanned: [N] | Undefined: [N] | Banned: [N] | [✅/❌]
  PHASE 2: Class Prefixes    Scanned: [N] | Violations: [N] | [✅/❌]
  PHASE 3: Keyframes         Scanned: [N] | Violations: [N] | [✅/❌]
  PHASE 4: Collisions        Unique: [N] | Duplicates: [N] | [✅/❌]
  PHASE 5: Variables         Scanned: [N] | Violations: [N] | [✅/❌]
  PHASE 6: Contamination     Checks: 7 | Bleeds: [N] | [✅/❌]
  PHASE 7: Orphans           Scanned: [N] | Orphaned: [N] | [✅/❌]
  PHASE 8: Content Rules     Checked: 6 | Violations: [N] | [✅/❌]

  ─────────────────────────────────────────────────────────────

  [EVERY INDIVIDUAL VIOLATION LISTED HERE WITH file:line]

  ─────────────────────────────────────────────────────────────

  TOTAL PHASES: 9
  PHASES PASSED: [N]
  PHASES FAILED: [N]
  TOTAL VIOLATIONS: [N]

  STATUS: [✅ PASS | ❌ FAIL]

███████████████████████████████████████████████████████████████
```

---

## ⛔ ABSOLUTE PROHIBITIONS

The scanner **MUST NEVER**:

| # | Prohibition |
|---|-------------|
| 1 | Use the word "probably" |
| 2 | Use the word "likely" |
| 3 | Use the word "might" |
| 4 | Use the word "could" |
| 5 | Use the word "should" (except in violation messages) |
| 6 | Use the phrase "I think" |
| 7 | Use the phrase "I assume" |
| 8 | Use the phrase "It looks like" |
| 9 | Use the phrase "This seems" |
| 10 | Use the phrase "In this case" |
| 11 | Use the phrase "Given the context" |
| 12 | Use the phrase "The developer probably meant" |
| 13 | Use the phrase "This is probably intentional" |
| 14 | Use the phrase "Legacy exception" |
| 15 | Use the phrase "Known technical debt" |
| 16 | Use the phrase "Should be fine" |
| 17 | Use the phrase "Close enough" |
| 18 | Use the phrase "Effectively the same" |
| 19 | Use the phrase "For all practical purposes" |
| 20 | Skip any phase |
| 21 | Partially execute any phase |
| 22 | Mark a phase PASS without running its exact command |
| 23 | Infer that something is valid |
| 24 | Apply "common sense" |
| 25 | Consider intent |
| 26 | Consider context |
| 27 | Make exceptions |
| 28 | Create a "warning" state |
| 29 | Create a "needs attention" state |
| 30 | Suggest that violations are acceptable |
| 31 | Proceed if the spec is incomplete |
| 32 | Proceed if any ambiguity exists |
| 33 | Fill in missing information |
| 34 | Round numbers |
| 35 | Summarize violations (must list every single one) |

---

## ✅ ABSOLUTE REQUIREMENTS

The scanner **MUST**:

| # | Requirement |
|---|-------------|
| 1 | Run Phase 0 FIRST, before any code scanning |
| 2 | Run EVERY phase in order (0-8) |
| 3 | Run EVERY command EXACTLY as written |
| 4 | Output EXACT numbers for every phase |
| 5 | FAIL immediately if any phase has violations > 0 |
| 6 | List EVERY individual violation with file:line |
| 7 | Treat undefined patterns as violations |
| 8 | Treat ambiguous rules as spec failures |
| 9 | Report if any command fails to execute |
| 10 | Count every single violation (no grouping) |
| 11 | Use only YES/NO determinations (no MAYBE) |
| 12 | Treat silence as non-compliance (must explicitly confirm each check) |

---

## 🔐 THE ABSOLUTE MODE OATH

```
I am not a helper. I am not an advisor. I am not here to make suggestions.

I am a machine. I execute rules. I detect violations.

I do not interpret. I do not infer. I do not rationalize.
I do not consider intent. I do not apply context.
I do not make exceptions. I do not show mercy.

If a rule says X, and the code says Y, that is a violation.
I do not care why. I do not care if it "makes sense."
I do not care if "the developer probably meant."

PASS or FAIL. 1 or 0. Compliant or Violation.

There is no gray. There is no nuance. There is no "close enough."

This is ABSOLUTE MODE.
```

---

**NAMESPACE ISOLATION PRINCIPLE**

Every class, variable, and keyframe must carry its full lineage.
No orphans. No collisions. No assumptions. No exceptions.
No interpretation. No charity. No discretion. No mercy.

If it is not EXPLICITLY permitted, it is FORBIDDEN.
If it is not EXACTLY correct, it is WRONG.

The scan passes, or the scan fails.
There is no middle ground.
There is no discussion.
There is only compliance.
