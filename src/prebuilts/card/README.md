# Card Component - Layout Authority Principle

## Philosophy

**Cards are layout authorities.** They control spacing, rhythm, and visual structure. Content VRs (Typography, Buttons, Inputs) remain pure and margin-less.

---

## The Rule

### VRs Provide Content
- Typography components have **ZERO margins**
- Button components have **ZERO margins**
- Input components have **ZERO margins**
- All VRs follow the **TTT Gap Model** - no external spacing

### Cards Provide Rhythm
- Card.standard controls vertical spacing via `gap`
- Default gap: `var(--space-lg)`
- Children stack naturally with consistent spacing
- No spacing conflicts, no margin collapse, no surprises

---

## How It Works

**Card.standard-content uses flex gap:**

```css
.vr-card-standard-content {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}
```

**This means:**
```tsx
<Card.standard title="Example">
  <TypographyTitle>Title</TypographyTitle>
  <TypographyBody>Paragraph 1</TypographyBody>
  <TypographyBody>Paragraph 2</TypographyBody>
  <Button.primary>Action</Button.primary>
</Card.standard>
```

**Automatically produces:**
- Consistent `--space-lg` gaps between all children
- No manual spacing needed
- No wrapper divs required
- Predictable, clean layout

---

## Why This Matters

### ❌ Without Card Layout Authority
```tsx
<Card.standard>
  <div style={{ marginBottom: '20px' }}>
    <TypographyTitle>Title</TypographyTitle>
  </div>
  <div style={{ marginBottom: '16px' }}>
    <TypographyBody>Body</TypographyBody>
  </div>
  {/* Inconsistent, manual, fragile */}
</Card.standard>
```

### ✅ With Card Layout Authority
```tsx
<Card.standard>
  <TypographyTitle>Title</TypographyTitle>
  <TypographyBody>Body</TypographyBody>
  {/* Automatic, consistent, reliable */}
</Card.standard>
```

---

## Benefits

1. **Consistency** - Every Card has the same rhythm
2. **Predictability** - No hidden spacing surprises
3. **Simplicity** - No wrapper divs, no manual gaps
4. **Maintainability** - Change `--space-lg` token, update everywhere
5. **Composability** - VRs work anywhere, Cards handle context

---

## Exceptions

### When to override gap:

**Tight variant (if needed):**
```tsx
<Card.tight>
  {/* Uses --space-md instead of --space-lg */}
</Card.tight>
```

**Custom spacing for specific feature:**
```tsx
<Card.standard>
  <div className="ft-custom-spacing">
    {/* Feature-specific layout */}
  </div>
</Card.standard>
```

**Horizontal layout:**
```tsx
<Card.standard>
  <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
    {/* Horizontal override */}
  </div>
</Card.standard>
```

---

## The Doctrine

> **Card Layout Authority Principle:**
>
> VRs provide content with zero margins.
> Cards provide rhythm via gap.
> Children stack naturally with consistent spacing.
> Override only when contextually necessary.
>
> This is not dogma - this is system design.

---

## Related Documentation

- **Typography & Spacing Doctrine** - `_sdk/11-conventions/TYPOGRAPHY-AND-SPACING.md` - Complete spacing philosophy
- **VR Doctrine** - `_sdk/11-conventions/VR-DOCTRINE.md` - VR architecture patterns
- **TTT Gap Model** - VRs have no external margins (see Typography doc)
- **WCCC Protocol** - Semantic CSS prefixes (vr-, ft-, ly-)

---

## Implementation

All Card variants should define their content area spacing strategy:

- **Card.standard** - `gap: var(--space-lg)` (default vertical rhythm)
- **Card.action** - Custom gap based on action density
- **Card.minimal** - May use tighter gap or no gap
- **Card.custom** - Feature-specific spacing as needed

The pattern: **Container owns spacing, VRs stay pure.**
