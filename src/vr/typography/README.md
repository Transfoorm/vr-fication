# Typography VR (T-VR)

> "Typography is content, not layout. Spacing is responsibility, not decoration."

---

## What Is Typography VR?

**Typography VR** (or **T-VR** in slang) is the Typography Component Namespace that contains all text-rendering components in the Transfoorm application.

**Technically:** It's a **namespace containing multiple VRs**, not a single VR itself.

**Practically:** We call it "Typography VR" because it's easier to say and conceptually groups all typography components under one system.

---

## The Naming Truth

### The Technical Reality

Typography is **NOT** a Variant Robot by strict definition.

A true VR has **variants of the same thing**:
- `Button.primary`, `Button.secondary`, `Button.danger` → All buttons, different styles
- `Icon.check`, `Icon.trash`, `Icon.user` → All icons, different symbols
- `Badge.rank`, `Badge.setup` → All badges, different types

But Typography has **different semantic elements**:
- `T.body` → Paragraph (`<p>`)
- `T.h2` → Heading (`<h2>`)
- `T.caption` → Small text (`<span>`)
- `T.title` → Title (`<h1>`)

These aren't **visual variants** of the same component. They're **different HTML elements entirely**.

### The Architectural Reality

**Each Typography component IS a VR:**

- `Typography.body` is a VR with **size/weight/color variants**
- `Typography.heading` is a VR with **level/weight variants**
- `Typography.caption` is a VR with **size/weight/style variants**
- `Typography.title` is a VR with **size/weight/align variants**

So the **namespace contains VRs**, but the namespace itself is not a VR.

```
Typography (Namespace - NOT a VR)
├── body (VR with size/weight/color variants)
├── caption (VR with size/weight/color variants)
├── heading (VR with level/weight variants)
└── title (VR with size/weight/align variants)
```

---

## Why We Call It "Typography VR" Anyway

### 1. Conceptual Grouping

"Typography VR" signals that this system:
- Follows VR principles (zero margins, sovereignty, TTT Gap Model)
- Contains multiple VRs (body, heading, caption, title)
- Is the authoritative system for text rendering

### 2. Developer Ergonomics

Saying "the Typography VR" is easier than:
- "The Typography Component Namespace containing multiple Variant Robots"
- "The Typography System"
- "The Typography Component Collection"

**T-VR** is slang. It's fast. It communicates intent.

### 3. Architectural Consistency

All component systems in Transfoorm follow patterns:
- Button VR
- Icon VR
- Badge VR
- Card VR
- **Typography VR** ← Fits the pattern

Even though Typography is technically a namespace, calling it a "VR" keeps the mental model consistent.

### 4. Typography Sovereignty

The name "Typography VR" reinforces the principle:

> **Typography VRs are the sole authority for all user-visible text.**

If we called it "Typography Components" or "Typography Namespace," it sounds optional.

"Typography VR" sounds like a **system with authority**. Which it is.

---

## The Mental Model

Think of Typography VR as:

**A component library (namespace) that contains multiple VRs, all of which follow VR principles and collectively enforce Typography Sovereignty.**

When someone says "Typography VR," they mean:
- The entire typography system
- The components inside it (T.body, T.h2, etc.)
- The rules that govern text rendering
- The architectural pattern it follows

---

## Usage

### Import

```tsx
import { T } from '@/vr';
// OR
import { Typography } from '@/vr';
```

### Examples

```tsx
// Body text
<T.body size="md">
  Standard paragraph with consistent line-height and spacing.
</T.body>

// Headings (Pure Level System)
<T.h2>Main Section Title</T.h2>
<T.h3>Subsection Title</T.h3>
<T.h4>Smaller Section</T.h4>

// Caption
<T.caption size="sm" color="secondary">
  Supporting text or metadata
</T.caption>

// Title
<T.title size="xl" weight="bold">
  Page Title
</T.title>

// Explicit heading with level
<Typography.heading level={3}>Section Title</Typography.heading>
```

### Available Components (VRs Inside the Namespace)

| Component | Purpose | Renders |
|-----------|---------|---------|
| `T.body` | Paragraph text | `<p>` |
| `T.caption` | Small text, metadata | `<span>` |
| `T.heading` | Headings with semantic levels | `<h2>` - `<h6>` |
| `T.h2` - `T.h6` | Heading shortcuts (level fixed) | `<h2>` - `<h6>` |
| `T.title` | Page/section titles | `<h1>` |

### Complete API Reference

**T.body** - Paragraph text
```tsx
size?: 'sm' | 'md' | 'lg'  // default: 'md'
weight?: 'normal' | 'medium' | 'semibold'  // default: 'normal' (NO 'bold')
color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning'  // default: 'primary'
className?: string
```

**T.caption** - Small text, metadata
```tsx
size?: 'xs' | 'sm'  // default: 'sm'
weight?: 'normal' | 'medium'  // default: 'normal' (NO 'semibold' or 'bold')
color?: 'primary' | 'secondary' | 'tertiary' | 'muted'  // default: 'tertiary'
italic?: boolean  // default: false
className?: string
```

**T.heading** - Headings with explicit level
```tsx
level?: 2 | 3 | 4 | 5 | 6  // default: 3 (determines size AND default weight)
weight?: 'normal' | 'medium' | 'semibold' | 'bold'  // overrides level default
className?: string
```

**T.h2 / T.h3 / T.h4 / T.h5 / T.h6** - Heading shortcuts
```tsx
weight?: 'normal' | 'medium' | 'semibold' | 'bold'  // overrides level default
className?: string
// NO size prop - level determines size
// NO level prop - fixed by shortcut
```

Level defaults:
- `T.h2` → bold (most prominent subsection)
- `T.h3` → semibold (standard section heading)
- `T.h4` → medium
- `T.h5` → normal
- `T.h6` → normal

**T.title** - Page/section titles
```tsx
size?: 'sm' | 'md' | 'lg' | 'xl'  // default: 'lg'
weight?: 'normal' | 'medium' | 'semibold' | 'bold'  // default: 'semibold'
align?: 'left' | 'center' | 'right'  // default: 'left'
className?: string
```

---

## Typography Sovereignty

**All user-visible text MUST pass through Typography VRs.**

This is not optional. It's architectural law.

### What Typography VRs Own

- Font family
- Font size
- Font weight
- Line height
- Color intent
- Semantic HTML tags
- Text hierarchy

### What Typography VRs Do NOT Own

- External margins (zero margins - TTT Gap Model)
- Layout positioning
- Spacing between elements (parent container's responsibility)

### The Canonical Rule

> **If text appears in the UI, it must pass through a Typography VR.**
> **If it does not, the system has lost control of its meaning.**

---

## VR Principles Applied

Even though Typography is technically a namespace, every component inside follows VR principles:

### 1. Zero External Margins (TTT Gap Model)

```css
/* Typography VRs have NO external margins */
.vr-typography-body {
  margin: 0; /* Always zero */
}
```

Parent containers control spacing via `gap` or explicit margin.

### 2. Single Responsibility

Each Typography component does ONE thing:
- `T.body` → Render paragraph text
- `T.h2` → Render level 2 heading
- `T.caption` → Render small text

No layout logic. No spacing logic. Just text rendering.

### 3. Accept `className` for Layout

```tsx
<T.body className="mt-4">
  This paragraph needs top margin from parent
</T.body>
```

Typography VRs accept `className` for layout-specific overrides, but never include margins by default.

### 4. Variant-Driven API

```tsx
<T.body size="lg" weight="semibold" color="primary">
```

Variants (size, weight, color) are explicit props, not CSS classes.

---

## Why "T-VR" Slang Works

**In conversation:**
- "Did you use the T-VR for that text?"
- "All text must go through T-VR"
- "T-VR enforces Typography Sovereignty"

**In documentation:**
- "Typography VR system"
- "T-VR components"
- "The T-VR namespace"

It's fast, clear, and reinforces that Typography is a **system with authority**, not just a random collection of components.

---

## The Bottom Line

**Technically:** Typography is a namespace containing multiple VRs.

**Architecturally:** Typography VR is the system that enforces text rendering sovereignty.

**Practically:** Call it "Typography VR" or "T-VR" because it's easier and everyone knows what you mean.

**Philosophically:** Names matter less than principles. As long as every piece of text goes through these components, the system works.

---

## Related Documentation

- **Typography & Spacing Doctrine** - `/_sdk/11-conventions/TYPOGRAPHY-AND-SPACING.md`
- **VR Doctrine** - `/_sdk/11-conventions/VR-DOCTRINE.md`
- **TTT Philosophy** - `/_sdk/10-TTT-philosophy/TTT-PHILOSOPHY.md`

---

*This is the way.*
