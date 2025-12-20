# VR DOCTRINE & VRS COMPONENT SYSTEM

> The complete guide to Variant Robots: Philosophy, Architecture, and Implementation

## 🚀 THE CATCHPHRASE

> **"There's a VR for that!"**

Need a sortable table? **There's a VR for that!**
Need a search bar? **There's a VR for that!**
Need a metric card? **There's a VR for that!**
Need form fields? **There's a VR for that!**

**VRs are the backbone and foundation of everything you build.**
**Feature → Page building starts with asking: "Which VR solves this?"**

---

## Part 1: The Philosophy

### The Stack

```
VR → Feature → Tab/Page
```

**VR** = Pure UI behavior (dumb shell)
**Feature** = VR + FUSE + business logic (smart wrapper)
**Tab** = One line import (pure declaration)
**Domain Page** = Orchestrates tabs/features, may use FUSE for coordination

---

### The Sponge Principle

Features are the sponge. They absorb:
- FUSE wiring
- Business logic
- Transforms
- Validations
- Modal flows
- Edge cases
- Animations
- All the dirt

**VRs and Tabs stay dry. Features get wet.**

---

### Why This Works

1. **VRs stay clean** - Reusable across any data source
2. **Features absorb dirt** - All edge cases, transforms, wiring
3. **Tabs stay pristine** - Just declarations, no logic
4. **Clear boundaries** - Know exactly where code belongs
5. **Testable** - VRs can be tested in isolation

---

## Part 2: What is VRS?

**VRS (Variant Robot System)** is a component architecture where each component variant is a **first-class citizen** with its own identity, not a prop-driven derivative.

### The Modular Mindset

Before you write ANY component or feature, ask yourself:

> **"Is there a VR for that?"**

If you need UI, there's probably already a VR that does it. **VRs are the foundation.** Features are built FROM VRs, not instead of them.

Traditional components:
```tsx
<Button variant="primary" size="large" />  // Props configure behavior
```

VRS components:
```tsx
<Button.primary />     // Variant IS the component
<Card.metric />        // Self-contained, prebuilt
<Input.search />       // No configuration needed
```

**There's a VR for that!** should be your first thought, always.

### Core Principles

1. **Variants Are Components** - Each variant is distinct and self-contained
2. **Zero Configuration** - Components arrive ready to use
3. **Self-Sufficient Styling** - No external CSS required
4. **Behavior-Only Props** - Props control behavior, not appearance

---

## Part 3: The Rules

### VRs (Prebuilts)
- Dumb visual shells
- Receive value, fire callback
- No FUSE imports
- No business logic
- Just states: idle, focused, dirty, saved, error
- Reusable DNA

### Features
- Import VRs
- Wire to FUSE
- Add transforms, validations, modals
- Handle all edge cases
- The sponge for dirt
- All complexity lives here

### Tabs (Tab Content Components)
- One line imports
- Zero FUSE
- Zero callbacks
- Zero state
- Pure declaration
- Just place Features

### Domain Pages (Page Orchestrators)
- Compose multiple tabs/features
- MAY use FUSE for coordination (e.g., Shadow King, user state checks)
- Handle page-level concerns (tab routing, freeze states)
- Still minimal - delegate to Features for real work

### VR → Feature → Page Protection

VRs are **never imported directly into Pages**. Pages import Features only.

This architecture makes style override abuse **structurally impossible**:
- Pages can't hack VR styles because pages never touch VRs
- Features own all customization in their `ft-*.css` files
- VRs stay pure in their `vr-*.css` files

```tsx
// This CAN'T happen - pages don't import VRs
<Button.primary className="bg-red-500" />

// This is the only option - pages import Features
<ConfirmAction />
```

VRs accept `className` for **layout spacing** (e.g., `mt-4`), which is safe because the architecture prevents abuse.

---

## Part 4: Component Namespace Pattern

### Button Variants
```tsx
Button.primary     // Main CTA, high emphasis
Button.secondary   // Alternative action
Button.ghost       // Low emphasis, icon-only capable
Button.danger      // Destructive actions
Button.fire        // Special animated button
Button.green       // Success/confirm actions
```

### Card Variants
```tsx
Card.metric        // Dashboard metrics display
Card.standard      // General content container
Card.action        // Clickable/actionable cards
```

### Input Variants
```tsx
Input.text         // Standard text input
Input.search       // Search with icon
Input.password     // Password with toggle
Input.toggle       // Boolean switch
Input.radio        // Radio buttons
Input.radioFancy   // Styled radio cards
```

### Table Variants
```tsx
Table.data         // Full data table
Table.sortable     // Sortable columns
Table.paginated    // With pagination
```

---

## Part 5: Implementation Pattern

### Defining VRS Components

```tsx
// prebuilts/button/index.tsx
import PrimaryButton from './Primary';
import SecondaryButton from './Secondary';
import GhostButton from './Ghost';
import DangerButton from './Danger';

export const Button = {
  primary: PrimaryButton,
  secondary: SecondaryButton,
  ghost: GhostButton,
  danger: DangerButton,
};
```

### Variant Implementation

```tsx
// prebuilts/button/Primary.tsx

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;  // For layout spacing only
}

export default function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  className = '',
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`vr-button-primary ${className}`}
    >
      {children}
    </button>
  );
}
```

---

## Part 6: CSS Architecture

### Class Prefixes
- `.vr-*` → VR classes (prebuilts)
- `.ft-*` → Feature classes (features)

### File Cascade
- `styles/prebuilts.css` → Imports all VR CSS
- `styles/features.css` → Imports all Feature CSS (largest by design)
- Tabs have no CSS - they just compose Features

### Example Styles

```css
/* styles/prebuilts.css → imports prebuilts/button/button.css */

.vr-button-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-fast) var(--ease-out);
}

.vr-button-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

/* Feature - specific assembly */
.ft-profile-country { }
.ft-setup-modal { }
```

The prefixes tell you exactly where the code belongs. `vr-` is reusable DNA. `ft-` is specific assembly.

### Exception: Animation Slot Variables

Variables prefixed with `--anim-*` are **animation slot variables** - an intentional exception to the namespace rule.

**How it works:**
1. Shared keyframes in `styles/animations.css` use generic slot variables
2. Components fill these slots locally to customize the animation
3. The same keyframe can be reused with different values

```css
/* styles/animations.css - shared keyframe */
@keyframes slide-in {
  from {
    transform: translateY(var(--anim-slide-distance, -8px));
  }
  to {
    transform: translateY(0);
  }
}

/* prebuilts/modal/modal.css - fills the slot */
.vr-modal-alert {
  --anim-slide-distance: calc(-1 * var(--modal-alert-animation-distance));
  animation: slide-in var(--modal-alert-animation-duration) ease-out;
}

/* prebuilts/dropdown/dropdown.css - fills the same slot differently */
.vr-dropdown-simple-menu {
  --anim-slide-distance: calc(-1 * var(--dropdown-animation-distance));
  animation: slide-in var(--dropdown-animation-duration) ease-out;
}
```

**Rules:**
- `--anim-*` variables are ONLY permitted inside scoped selectors
- `--anim-*` at `:root` level is a violation
- This enables keyframe reuse without duplicating animation definitions

---

## Part 7: Usage Examples

### VR (prebuilts/field/Live.tsx)
```tsx
// Dumb shell - just UI states
export default function FieldLive({ value, onSave, label }) {
  // Visual states: focused, dirty, saved
  // Fires onSave callback
  // Knows nothing about FUSE
}
```

### Feature (features/account/ProfileTab/index.tsx)
```tsx
// Smart wrapper - wires FUSE
import { Field } from '@/prebuilts';
import { useFuse } from '@/store/fuse';

export function ProfileFields() {
  const user = useFuse((s) => s.user);
  const updateUserLocal = useFuse((s) => s.updateUserLocal);

  return (
    <div className="ft-profile-fields">
      <Field.live
        label="First Name"
        value={user?.firstName ?? ''}
        onSave={(v) => updateUserLocal({ firstName: v })}
      />
    </div>
  );
}
```

### Tab (domains/settings/account/_tabs/Profile.tsx)
```tsx
// Pure declaration - one line
import { ProfileFields } from '@/features/account/ProfileTab';

export default function Profile() {
  return <ProfileFields />;
}
```

### Domain Page (domains/settings/account/Account.tsx)
```tsx
// Orchestrator - may use FUSE for coordination
import { useFuse } from '@/store/fuse';
import { Tabs } from '@/prebuilts';
import Profile from './_tabs/Profile';
import Email from './_tabs/Email';

export default function Account() {
  const user = useFuse((s) => s.user);
  const freeze = user?.setupStatus === 'pending';

  return (
    <Tabs.panels
      tabs={[
        { id: 'profile', label: 'Profile', content: <Profile /> },
        { id: 'email', label: 'Email', content: <Email /> },
      ]}
    />
  );
}
```

---

## Part 8: The VR Ontology

How a VR is formed, from the lowest level to the highest:

| Level | What | Example |
|-------|------|---------|
| byte | Raw storage | 0x48 |
| character | Single symbol | H |
| token | CSS variable, JS identifier | --space-md |
| declaration | Property + value | gap: var(--space-md); |
| class | Selector + declarations | .vr-field-live { } |
| structure | DOM tree | `<div><label/><input/></div>` |
| behavior | State, events, lifecycle | useState('idle') |
| variant surface | Props that modify appearance | helper="Letters only" |
| **VR** | Complete unit | `<Field.live />` |
| section | Group of VRs | Profile form |
| screen | Full page | Account page |
| app | Transfoorm | Router |

**The VR is the first truly complete, predictable, portable, sealed UI unit.**

A VR encapsulates:
- Styling system (classes)
- Structural system (markup blueprint)
- Behavioral system (state machine)
- Variant system (configuration)
- Edge contracts (spacing, rhythm)

Everything below VR is encapsulated. Everything above just composes it.

---

## Part 9: Extending VRS

### Adding New Variants

1. Create variant component file
2. Add to namespace index
3. Create variant-specific styles in the component's CSS file
4. Document use case

```tsx
// prebuilts/button/Outline.tsx
export default function OutlineButton({ children, onClick }) {
  return (
    <button className="vr-button-outline" onClick={onClick}>
      {children}
    </button>
  );
}

// prebuilts/button/index.tsx
export const Button = {
  primary: PrimaryButton,
  secondary: SecondaryButton,
  outline: OutlineButton,  // New variant
};
```

### Creating New Component Families

```tsx
// prebuilts/alert/index.tsx
import AlertSuccess from './Success';
import AlertError from './Error';
import AlertWarning from './Warning';

export const Alert = {
  success: AlertSuccess,
  error: AlertError,
  warning: AlertWarning,
};
```

---

## Part 10: TTT Compliance

VRS passes all 7 TTT tests:

1. **Architecture** - Static styling, no runtime computation
2. **Design** - CSS variables, theme-aware
3. **Maintainability** - Self-documenting, isolated
4. **Performance** - Zero runtime overhead
5. **Reversibility** - Delete variant, no cascade
6. **Consistency** - Same pattern everywhere
7. **Clarity** - Non-coder can understand usage

---

## Summary

**VR** = The organ (dumb, reusable DNA)
**Feature** = The assembly (smart, specific, the sponge)
**Tab** = The placement (clean, declarative)
**Domain Page** = The orchestrator (coordinates tabs)

The Tab should never know about FUSE. The VR should never know about business logic. Features do all the work. Domain Pages coordinate when needed.

```tsx
// This is VRS
<Button.primary>Submit</Button.primary>
<Card.metric>Active Users: 1,234</Card.metric>
<Table.data data={users} />
```

---

## 🎯 THE MANTRA

Remember, when building features:

1. **Start with VRs** - Don't build UI from scratch
2. **Ask first: "Is there a VR for that?"** - There probably is
3. **VRs are modular building blocks** - Compose them, don't replace them
4. **Features connect VRs to data** - That's where your work happens
5. **Pages just declare** - No logic, no CSS, just placement

**VRs are the backbone. Features are the muscle. Pages are the skeleton.**

> **"There's a VR for that!"** - The coder's catchphrase
