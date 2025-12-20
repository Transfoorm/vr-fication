# VR-FICATION REPOSITORY

**Developer Orientation, Mission & Operating Rules**

---

## START HERE: What Is This Repo?

**You are in a deliberately created parallel repository.**

This repo exists to complete a major architectural language change without risking the production-ready codebase.

**There are TWO repositories:**

### 1. `prod-test2` (MAIN branch)
- Refactored, stable, ready to ship
- **Intentionally frozen**
- Uses `src/prebuilts` folder
- Imports from `@/prebuilts`
- All documentation references "prebuilts"

### 2. `vr-fication` (THIS repo)
- Clean-slate language reboot
- VR is the native language from day one
- Uses `src/vr` folder
- Imports from `@/vr`
- All documentation uses VR terminology with zero legacy references

---

## Why Does This Repo Exist?

### The Problem: Language Became Architecture

We discovered that calling our component system "prebuilts" instead of "VR" (Variant Robots) wasn't just naming—it was **architectural identity**.

**What we thought was a naming issue:**
- `src/prebuilts` folder should be `src/vr`
- `@/prebuilts` imports should be `@/vr`
- Documentation should say "VR" not "prebuilts"

**What it actually was:**
- The language shapes how developers think
- "Prebuilts" sounds optional, like templates
- "VR" (Variant Robot) sounds like a **system with authority**
- Half-measures create cognitive dissonance

### The Decision: Dimensional Isolation

Instead of in-place refactoring (which would contaminate the stable codebase), we chose **dimensional isolation**:

1. **MAIN stays frozen** → Production-ready, pristine, shippable
2. **VR-fication starts clean** → VR is native from line one
3. **No backwards compatibility** → No "formerly known as prebuilts"
4. **Complete language reboot** → Documentation, imports, folder structure

---

## What Happened to MAIN?

**MAIN (prod-test2) is intentionally frozen.**

It is:
- ✅ Refactored and stable
- ✅ Ready to ship
- ✅ The pristine truth

MAIN will NOT receive:
- ❌ The prebuilts → vr rename
- ❌ Documentation rewrites
- ❌ Import path changes

**Why?**
- Because MAIN is production-ready and shouldn't be destabilized for language changes
- Because dimensional isolation prevents contamination
- Because you can't do major surgery on a beating heart

---

## What Is VR-fication?

**VR-fication is a complete language reboot, not a refactor.**

### What Changes:

| Aspect | MAIN (prod-test2) | VR-fication (this repo) |
|--------|-------------------|-------------------------|
| **Folder** | `src/prebuilts` | `src/vr` |
| **Imports** | `@/prebuilts` | `@/vr` |
| **CSS** | `styles/prebuilts.css` | `styles/vr.css` |
| **Docs** | References "prebuilts" | Pure VR terminology |
| **Mental Model** | "Pre-built components" | "Variant Robot System" |

### What Stays the Same:

- ✅ All component APIs (props, variants, behavior)
- ✅ All architectural patterns (VR → Feature → Page)
- ✅ All design principles (zero margins, single responsibility)
- ✅ The actual UI (pixel-perfect identical)

**This is NOT a rewrite. This is a language evolution.**

---

## The VR Philosophy: What You're Building With

### 🚀 THE CODER'S CATCHPHRASE

> **"There's a VR for that!"**

Before building ANY UI component, ask:

**"Is there a VR for that?"**

Need a table? **There's a VR for that!**
Need a search bar? **There's a VR for that!**
Need a button? **There's a VR for that!**
Need a form field? **There's a VR for that!**
Need a modal? **There's a VR for that!**
Need a card? **There's a VR for that!**

**VRs are the backbone and foundation of everything you build.**

### The Three-Layer Stack

```
🤖 VR (Variant Robot)
   ↓ Pre-built, perfect UI component

🔧 Feature
   ↓ Connects VR to your business data/logic

📄 Page/Tab
   ↓ Just declares which Feature to show
```

**VR** = The Lego brick (complete, works immediately)
**Feature** = Connects the brick to your data
**Page** = Places it on screen

### The Golden Rule

**Before you write ANY UI component, ask:**

> **"Is there a VR for that?"**

If the answer is yes (and it usually is), USE THE VR. Don't build it from scratch.

VRs are:
- ✅ Already styled perfectly
- ✅ Already work on mobile
- ✅ Already consistent with the app
- ✅ Already tested
- ✅ Ready to use immediately

### Anti-Patterns (FORBIDDEN)

❌ **NEVER** add `className` to style a VR
❌ **NEVER** create CSS files for pages
❌ **NEVER** wrap VRs in styled divs
❌ **NEVER** build UI from scratch when a VR exists
❌ **NEVER** fight the VR system

---

## Features: The Sponge

**VRs stay dry. Features get wet.**

### What This Means:

**VRs are pristine:**
- Zero business logic
- Zero data fetching
- Zero side effects
- Just rendering with variants

**Features absorb complexity:**
- ✅ Data fetching
- ✅ State management
- ✅ Event handlers
- ✅ Business logic
- ✅ FUSE integration

### The Critical Distinction:

**Features get messy with LOGIC, stay disciplined with VISUALS.**

**Features may have:**
- ✅ Complex state logic
- ✅ Multiple data sources
- ✅ Event orchestration
- ✅ Feature-specific CSS for **layout and spacing**

**Features must NEVER have:**
- ❌ Custom visual primitives (buttons, cards, tables)
- ❌ Font-size rules (Typography VR owns all text)
- ❌ Color definitions (use CSS variables)
- ❌ Reinvented UI patterns

### Class Prefix Rules:

```css
/* VRs use .vr-* prefix */
.vr-button-primary { }
.vr-table-sortable { }

/* Features use .ft-* prefix */
.ft-user-profile-container { }
.ft-invoice-list-layout { }
```

---

## Your Mission as a Developer

### When Building Features:

1. **Ask first:** "Is there a VR for that?"
2. **Import from `@/vr`** (not `@/prebuilts`)
3. **Use VRs for all UI** (buttons, tables, text, cards)
4. **Features handle logic** (data, state, events)
5. **Pages stay thin** (just declare which Feature to show)

### When Writing Documentation:

- ✅ Say "VR" or "Variant Robot"
- ✅ Reference `src/vr` folder
- ✅ Show imports from `@/vr`
- ❌ Never say "prebuilts" or "formerly known as"

### When Creating New VRs:

- Use `.vr-*` class prefix
- Zero external margins (TTT Gap Model)
- Single responsibility
- Variant-driven API
- Accept `className` for layout overrides

---

## Success Criteria

**VR-fication is complete when:**

1. ✅ All imports use `@/vr` (zero `@/prebuilts` references)
2. ✅ All documentation uses VR terminology
3. ✅ All CSS files reference VR system
4. ✅ New developers naturally say "VR" not "prebuilts"
5. ✅ The UI is pixel-perfect identical to MAIN
6. ✅ All tests pass
7. ✅ Zero regressions

**At that point:**
- VR-fication becomes the new MAIN
- Old MAIN is archived
- The language reboot is complete

---

## Quick Reference

### Import Syntax
```tsx
// ✅ CORRECT (VR-fication)
import { Button, Table, T } from '@/vr';

// ❌ WRONG (old MAIN syntax)
import { Button, Table, Typography } from '@/prebuilts';
```

### File Structure
```
src/
├── vr/              ← VRs live here (not prebuilts)
│   ├── button/
│   ├── table/
│   └── typography/
├── features/        ← Features use VRs
└── domains/         ← Pages use Features
```

### Typography
```tsx
// ✅ CORRECT
import { T } from '@/vr';
<T.body size="md">Text here</T.body>

// ❌ WRONG
import { Typography } from '@/prebuilts';
```

---

## The Bottom Line

**You're not refactoring. You're rebooting the language.**

Every file you touch, every component you build, every line you write—it should reinforce that **VR is the native system**, not a renamed folder.

This is architectural conscience. This is dimensional isolation. This is the clean slate.

**Welcome to VR-fication.**

---

*"There's a VR for that!"* - The coder's catchphrase
