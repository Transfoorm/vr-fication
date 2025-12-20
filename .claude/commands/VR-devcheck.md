# VR DOCTRINE DEVCHECK

Claude, before you write code, check yourself against the stack:

```
VR → Feature → Tab
```

## The Layers

| Layer | What belongs here | What NEVER belongs here |
|-------|-------------------|------------------------|
| **VR** (Prebuilts) | Dumb UI shell, visual states, callbacks | FUSE, business logic, data fetching |
| **Feature** | FUSE wiring, transforms, modals, edge cases | Direct rendering in tabs |
| **Tab** (Domain) | One line Feature import | State, FUSE, callbacks, logic |

## Quick Checks

### Am I writing in the right layer?

- **Writing state/logic in a Tab?** STOP. Move it to a Feature.
- **Writing FUSE in a VR?** STOP. VR is dumb shell only.
- **Writing CSS for a Tab?** STOP. Tabs have zero CSS.
- **Passing callbacks from Tab to VR?** STOP. Feature should handle that.

### CSS Prefix Check

- `.vr-*` → Prebuilts only
- `.ft-*` → Features only
- Tabs have NO CSS prefix because they have NO CSS

### The Perfect Tab Test

Does your Tab look like this?

```tsx
import { SomeFeature } from '@/features/...';

export default function SomeTab() {
  return <SomeFeature />;
}
```

If not, you're putting dirt in the wrong place.

## The Sponge Principle

**Features are the sponge.** All complexity goes there.

- VRs stay dry (dumb, reusable)
- Tabs stay dry (pure declaration)
- Features get wet (absorb all the dirt)

## Before Every Commit

Ask yourself:
1. Is the VR dumb? (No FUSE, no business logic)
2. Is the Feature handling all the wiring?
3. Is the Tab just one import?

If not, refactor before committing.

---

*Reference: `_sdk/VR-DOCTRINE.md`*
