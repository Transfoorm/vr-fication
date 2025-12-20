# TYPOGRAPHY & SPACING DOCTRINE

> Typography is content, not layout. Spacing is responsibility, not decoration.

---

## The Core Principle

**Typography VRs have ZERO external margins.**

This isn't dogma. This is architecture.

If typography controls spacing:
- You lose predictability
- You fight margins in tight layouts
- You get double-spacing when wrapped
- You violate single responsibility

Typography is content. Layout is structure. Never mix them.

---

## Typography VRs

All typography components follow the VRS (Variant Robot System) pattern.

### Available Variants

```tsx
// Full namespace (explicit)
Typography.body      // Regular body text
Typography.caption   // Small caption text
Typography.heading   // Subsection headings (level-based)
Typography.title     // Page and section titles

// Short alias (ergonomic)
T.body              // Same as Typography.body
T.caption           // Same as Typography.caption
T.title             // Same as Typography.title

// Heading shortcuts (Pure Level System)
T.h2                // Typography.heading level={2} - Main sections (2xl, bold)
T.h3                // Typography.heading level={3} - Subsections (xl, semibold)
T.h4                // Typography.heading level={4} - Smaller sections (lg, medium)
T.h5                // Typography.heading level={5} - Minor headings (md, normal)
T.h6                // Typography.heading level={6} - Minor headings (md, normal)
```

### Configuration Props

**Size:** (Body, Caption, Title only)
- `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` (variant-dependent)

**Level:** (Heading only - Pure Level System)
- `2`, `3`, `4`, `5`, `6` - Determines BOTH size AND semantic HTML tag
- Each level has intelligent defaults:
  - `h2` → 2xl + bold (most prominent)
  - `h3` → xl + semibold (standard section)
  - `h4` → lg + medium
  - `h5/h6` → md + normal

**Weight:** (All variants)
- `normal`, `medium`, `semibold`, `bold`
- Headings have intelligent defaults per level (can be overridden)

**Color:** (All variants)
- `primary`, `secondary`, `tertiary`, `quaternary`
- `error`, `success`, `warning` (semantic colors)

**Alignment:** (Title only)
- `left`, `center`, `right`

**Style:** (Caption only)
- `italic`

### Usage Examples

```tsx
// Body text - Short alias
<T.body size="md">
  Standard paragraph text with consistent line-height.
</T.body>

// Caption - Short alias
<T.caption size="sm" color="secondary">
  Supporting text or metadata
</T.caption>

// Headings - Pure Level System shortcuts
<T.h2>Main Section Title</T.h2>
<T.h3>Subsection Title</T.h3>
<T.h4>Smaller Section</T.h4>

// Heading with custom weight override
<T.h3 weight="bold">Important Subsection</T.h3>

// Title - Full namespace for clarity
<Typography.title size="xl" weight="bold" align="center">
  Page Title
</Typography.title>

// Explicit heading with level (when needed)
<Typography.heading level={3}>Section Title</Typography.heading>
```

### Implementation Rules

1. **NO external margins** - TTT Gap Model compliant
2. **Internal structure only** - line-height, font-size, color, weight
3. **No layout logic** - no positioning, no spacing, no flex/grid
4. **Accept `className`** - For layout spacing only (safe via architecture)

---

## TTT Gap Model

**The Model:**
- VR components: ZERO external margins
- Container/Parent: Controls ALL spacing

**Why This Works:**

Typography without margins is:
- Predictable (no margin collapse)
- Composable (no spacing conflicts)
- Flexible (parent chooses rhythm)
- Honest (WYSIWYG in showcase)

Typography with margins is:
- Unpredictable (cascade fights)
- Inflexible (locked-in spacing)
- Dishonest (hides true output)
- Fragile (breaks in tight layouts)

---

## Spacing Responsibility

### Who Controls What

| Element | Controls | Example |
|---------|----------|---------|
| **VR Component** | Internal padding, structure | `padding: var(--space-md)` inside button |
| **Parent Container** | External spacing between VRs | `gap: var(--space-lg)` in layout |
| **VR `className`** | Layout spacing ONLY | `<Typography.body className="mt-4" />` |

### The Wrapper Hierarchy

Spacing authority flows from container to child:

```
Card (layout authority)
 └─ gap: var(--space-md)
    ├─ Typography.title (no margin)
    ├─ Typography.body (no margin)
    └─ Button.primary (no margin)
```

**The wrapper provides spacing.**

That wrapper can be:
- **Card** - Most common layout authority
- **Section** - Group container
- **Feature wrapper** - Custom layout
- **Stack/Grid** - Layout VRs (if implemented)

### Cards as Layout Authority

**Key insight:** If something is "inside a Card", then:
- Card owns padding
- Card owns vertical rhythm
- Card owns child spacing

Typography stays pure.
Features stay clean.
Layouts stay consistent.

This is the natural winner in your architecture.

---

## Composition Example

```tsx
<Card.standard title="User Profile" subtitle="Account information">
  {/* Card provides gap - all children are margin-less */}

  <T.h4>Personal Details</T.h4>

  <T.body size="md" color="secondary">
    Manage your account information and preferences.
  </T.body>

  <T.caption size="sm" color="tertiary" style="italic">
    Last updated: January 2025
  </T.caption>

  <Button.primary>Save Changes</Button.primary>
</Card.standard>
```

**What happens:**
1. Card defines `gap: var(--space-md)` on its content container
2. All children render margin-less
3. Spacing is consistent, predictable, controlled

**No margin fights. No cascade wars. No surprises.**

---

## Edge Cases

### When VRs Need Spacing

Use `className` for layout spacing:

```tsx
<T.body className="mt-4">
  This paragraph needs top margin
</T.body>
```

**Why this is safe:**
- VRs are never imported directly into Pages
- Pages import Features only
- Architecture prevents `className` abuse
- Layout spacing is explicit, not hidden

### When Typography Wraps Typography

```tsx
<T.body>
  This is a paragraph with{' '}
  <T.caption color="tertiary">
    inline caption text
  </T.caption>
  {' '}continuing the sentence.
</T.body>
```

**No spacing issues** - both have zero margins, inline flow preserved.

### When You Need Custom Rhythm

Create a Feature wrapper with explicit spacing:

```tsx
// features/profile/ProfileContent.tsx
export function ProfileContent() {
  return (
    <div className="ft-profile-content">
      <T.h3>Profile Section</T.h3>
      <T.body>User information and settings.</T.body>
    </div>
  );
}

// features/profile/profile.css
.ft-profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg); /* Custom rhythm for this feature */
}
```

---

## Verification

**TTT Gap Model compliance checklist:**

- [ ] Typography VRs have NO `margin` in CSS
- [ ] Containers define `gap` or spacing
- [ ] VRs accept `className` for layout only
- [ ] Showcase renders truthfully (no hidden margins)
- [ ] Features control rhythm via wrappers

**File locations:**
- Typography VRs: `src/prebuilts/typography/`
- Typography CSS: `src/prebuilts/typography/typography.css`
- Implementation: Check header comment: `/* NO external margins - TTT Gap Model compliant */`

---

## The Research

After building the Typography showcase and testing composition patterns, the verdict is clear:

**Typography VRs should never carry spacing.**

This is architecturally sound, not dogmatic.

**The decision is proven by:**
1. Completeness - Showcases every variant truthfully
2. Composition - Typography pieces combine cleanly
3. Predictability - No margin collapse surprises
4. Responsibility - Spacing is layout concern, not content concern

**Next logical steps:**
- Define Card vertical rhythm rules (default gap values)
- Formalize "layout responsibility" as doctrine
- Create Stack/Grid layout VRs if recurring patterns emerge

---

## Typography Sovereignty — Intent

Typography is not decoration.  
Typography is **meaning made visible**.

In Transfoorm, **Typography VRs are the sole authority for how text appears in the UI**.  
They encode semantic intent, hierarchy, and emphasis directly into the component tree — not into the CSS cascade.

Global styles may prepare the canvas.  
They may **never** decide how content is expressed.

---

### The Sovereignty Principle

**All user-visible text must be expressed through a Typography Variant Robot.**

This is not a stylistic preference.  
It is a system guarantee.

Typography VRs ensure that:
- meaning is explicit
- hierarchy is preserved
- intent is auditable
- scale is consistent
- theming is deterministic
- accessibility is structural, not accidental

If text bypasses a Typography VR, the system has lost authority over its own language.

---

### What Typography VRs Own

Typography VRs are responsible for:
- font family
- font size
- font weight
- color intent
- hierarchy
- line height
- semantic correctness

These decisions are variant-driven and explicit.  
They do not rely on CSS inheritance or cascade coincidence.

---

### What Globals Must Never Do

Global styles may **never**:
- define content font sizes
- define heading scales
- define paragraph hierarchy
- express semantic emphasis
- "fix" typography inconsistencies

Globals are infrastructure.
Typography VRs are language.

---

### Typography VR: Meaning vs. Mechanics

**Typography VR governs semantic meaning, not component mechanics.**

Typography VR exists to answer:
- **What role does this text play?**
- Is this body, caption, title, emphasis?
- What is the semantic hierarchy?

Component CSS exists to answer:
- **How does this control render at rest/hover/disabled?**
- What is the minimum readable size for a button label?
- What visual feedback signals interactivity?

**These are different questions. Mixing them collapses the architecture.**

#### The Separation

**Typography VR (Semantic Text):**
```tsx
// User-visible content with semantic meaning
<T.body size="lg">User profile description</T.body>
<T.caption color="secondary">Last updated: Jan 2025</T.caption>
<T.h3>Account Settings</T.h3>
```

**Component CSS (Mechanical Constraints):**
```css
/* Structural rendering requirements */
.vr-button-primary {
  font-size: 14px; /* Minimum legibility constraint */
  font-weight: 500; /* Structural clickability signal */
}

.vr-input-field:disabled {
  font-weight: 400; /* Visual state feedback */
  opacity: 0.6; /* Disabled state rendering */
}

.vr-badge-rank {
  font-size: 11px; /* Dense display constraint */
  text-transform: uppercase; /* Visual treatment */
}
```

**Feature CSS (Always Forbidden):**
```css
/* ❌ VIOLATION - Feature deciding typography */
.ft-profile-name {
  font-size: 18px; /* This is a Typography VR decision */
  font-weight: 600; /* This is semantic hierarchy */
}
```

#### The Rule

- ✅ **Typography VR** owns semantic text (content in the UI, user-facing meaning)
- ✅ **Component CSS** owns mechanical constraints (control rendering, state feedback, structural requirements)
- ❌ **Feature CSS** owns neither (no font rules, ever)

**If text has semantic meaning, it goes through Typography VR.**
**If a component needs rendering constraints, it goes in component CSS.**
**Features touch neither.**

---

### The Canonical Rule

> **If text appears in the UI, it must pass through a Typography VR.  
> If it does not, the system has lost control of its meaning.**

---

## Typography VR Sprawl: The Long-Term Risk

**The risk:** Over time, Typography VRs accumulate too many variants and props.

### What Clean Looks Like (Now)

```tsx
<T.body size="md">Content</T.body>
<T.h3>Section Title</T.h3>
<T.caption color="secondary">Metadata</T.caption>
```

Clear. Simple. Semantic intent is obvious.

### What Sprawl Looks Like (Future Risk)

```tsx
<T.body
  variant="emphasized"
  size="lg"
  tone="warm"
  emphasis="high"
  density="comfortable"
  prominence="secondary"
>
  Content
</T.body>
```

Clarity eroded. Too many aesthetic knobs. Semantic intent buried under configuration.

### The Mitigation

**Keep variants finite. Add new VRs only when semantics change, not aesthetics.**

#### Good Reasons to Add Props/Variants:
- ✅ New semantic role (e.g., adding `T.label` for form labels)
- ✅ Necessary hierarchy level (e.g., `T.h5` for deeper structure)
- ✅ Core accessibility need (e.g., `aria-label` support)
- ✅ Fundamental rendering state (e.g., `disabled`, `error`)

#### Bad Reasons to Add Props/Variants:
- ❌ "Marketing wants warmer text tone"
- ❌ "This page needs slightly different emphasis"
- ❌ "Feature X needs custom density"
- ❌ "Can we add a prominence scale?"

**If the ask is aesthetic, not semantic, the answer is NO.**

### The Guardrail

Before adding any prop or variant to Typography VR, ask:

1. **Does this represent a new semantic role?** (Yes → Maybe add it)
2. **Is this an aesthetic preference?** (Yes → Reject it)
3. **Can existing variants solve this?** (Yes → Use existing)
4. **Will this be used in 5+ places?** (No → Reject it)

**Typography VR is not a theming system. It's a semantic hierarchy enforcer.**

If you need aesthetic variation:
- Use Feature CSS for one-off styling
- Create a new VR if it's truly a distinct semantic role
- Challenge the design requirement

### The Pressure Point

The **only** long-term architectural risk to Typography VR is sprawl.

Stay conscious of this. Keep the system tight. Resist aesthetic expansion.

**Finite variants. Semantic changes only.**

---

## Summary

**Typography is content, not layout.**

- VRs define appearance (font, color, weight)
- Containers define spacing (gap, margin, rhythm)
- Cards are the layout authority
- TTT Gap Model prevents spacing conflicts
- **Resist Typography VR sprawl** - semantic changes only

This is system design, not page design.

**You're building the architecture that every future feature will compose.**

Keep VRs pure. Keep spacing explicit. Keep responsibility clear. **Keep variants finite.**

---

## Related Documentation

- **Card Layout Authority** - `src/prebuilts/card/README.md` - Practical implementation of spacing principles
- **VR Doctrine** - `_sdk/11-conventions/VR-DOCTRINE.md` - Complete VR architecture and patterns
- **TTT Philosophy** - `_sdk/10-TTT-philosophy/TTT-PHILOSOPHY.md` - Testing framework and principles

---

*This is the way.*
