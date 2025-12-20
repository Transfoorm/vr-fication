# Virgin-Repo Protocol (VRP)

> Zero-tolerance code quality enforcement system

**"One violation = FAIL. No compromises. No exceptions."**

---

## What is VRP?

**Virgin-Repo Protocol** ensures every commit maintains architectural purity across 7 critical layers.

### Why "Virgin"?

A **virgin repository** is one that has never been contaminated with:
- Type errors
- ESLint violations
- Build failures
- Architectural drift
- Inline style viruses (ISV)
- Type Any viruses (TAV)
- FUSE pattern violations

Once contaminated, a repository loses its virgin status. VRP maintains this purity through **continuous enforcement**.

---

## The 7 Layers of Protection

### Layer 1: TypeScript Compiler (10 points)
- Zero type errors in `src/` and `fuse/`
- Zero implicit `any` types
- All hooks have proper return types
- No `@ts-ignore` or `@ts-expect-error`
- Strict mode enabled

**Tool:** `tsc --noEmit`

### Layer 2: ESLint (TAV + ISV + FUSE) (15 points)
- Zero explicit `any` violations (TAV)
- Zero inline style violations (ISV)
- Zero loading state violations (FUSE Rule 1)
- Zero fetch() violations in components (FUSE Rule 2)
- Proper React patterns

**Tool:** `eslint . --max-warnings=0`

### Layer 3: Next.js Build (10 points)
- Build completes successfully
- No build warnings
- Bundle size reasonable
- Static pages generate

**Tool:** `npm run build`

### Layer 4: FUSE Architecture (15 points)
- Store structure valid
- `useFuse` hook properly exported
- Provider pattern in layouts
- All domains have hydration flags
- No loading states in components

### Layer 5: Naming Conventions (10 points)
- PascalCase for components
- camelCase for hooks
- kebab-case for utilities
- SCREAMING_SNAKE_CASE for constants
- CSS tokens follow pattern

### Layer 6: Build & Runtime Integrity (10 points)
- `.next/` output valid
- No massive bundle chunks (>1MB)
- Server Actions properly marked
- No runtime errors

### Layer 7: Random Sampling (Pass/Fail)
- Deep inspect 10 random files
- Check imports, types, accessibility

---

## The 3 Sacred Commands

### 1. `/VRP-commit` - Sacred Commit Ritual

Enforce VRP compliance before creating commits:

```
/VRP-commit
   ↓
Run virgin-check (TypeScript + ESLint + Build)
   ↓
If CLEAN → Create commit with VRP-Compliant tag
   ↓
Ask: "Push to remote? 1=YES, 2=NO"
```

**Example Commit:**
```
VRP-Compliant: Add user profile feature

Implemented complete user profile system with:
- Profile editing
- Avatar upload
- Settings management

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 2. `/VRP-push` - Sacred Push Ritual

Enforce VRP compliance before pushing:

```
/VRP-push
   ↓
Run virgin-check
   ↓
Check branch status
   ↓
If CLEAN → Push to origin
```

### 3. `/VRP-audit` - 88-Point Compliance Audit

Complete FUSE 6.0 Stack compliance audit:

```
PART 1: AUTOMATED (70 points)
  Phase 1: Virgin-Check (Points 1-35)
  Phase 2: Sovereign Router (Points 36-50)
  Phase 3: FUSE Store & WARP (Points 51-60)
  Phase 4: Build Integrity (Points 61-70)

PART 2: MANUAL (18 points)
  Phase 5: TTTS Manual Rules (Points 71-73)
  Phase 6: SRB Sovereignty Rules (Points 74-88)
```

See `/VRP-audit` slash command for full 88-point breakdown.

---

## TAV Protection

### What is TAV (Type Any Virus)?

The use of explicit `any` types in TypeScript:

```typescript
// ❌ TAV INFECTION
function process(data: any) { ... }
const result = value as any;

// ✅ TAV-FREE
function process(data: UserData) { ... }
const result = value as User;
```

**Enforcement:**
```js
"@typescript-eslint/no-explicit-any": "error"
```

---

## ISV Protection

### What is ISV (Inline Style Virus)?

The use of inline `style={{}}` props:

```tsx
// ❌ ISV INFECTION
<div style={{color: 'red', fontSize: '16px'}} />

// ✅ ISV-FREE
<div className="text-error text-base" />
```

**Enforcement:**
```js
"react/forbid-dom-props": [
  "error",
  { forbid: [{ propName: "style" }] }
]
```

**Legitimate Exceptions (Dynamic Law):**
```tsx
// ✅ Runtime-calculated positioning
<Tooltip style={{ top: `${y}px`, left: `${x}px` }} />

// ✅ CSS variable bridges
<div style={{ '--rank-color': meta.color } as CSSProperties} />
```

---

## Ground Zero Certification

**Ground Zero** = Zero violations across all 7 layers.

### Achieving Ground Zero

1. Run `/VRP-audit` to baseline
2. Fix all violations
3. Run `npm run virgin-check`
4. Commit with `/VRP-commit`
5. Push with `/VRP-push`
6. Maintain with VRP commands

### The Golden Rule

> **Never commit without `/VRP-commit`. Never push without `/VRP-push`.**

---

## Integration with FUSE

VRP enforces FUSE principles:

| FUSE Principle | VRP Enforcement |
|----------------|-----------------|
| No loading states | ESLint blocks `useState` with `loading` |
| No client-side fetch | ESLint blocks `fetch()` in components |
| Golden Bridge pattern | Checks mutation → cookie → hydration |
| CSS tokens only | ESLint blocks inline styles |
| Type safety | TypeScript + TAV protection |

---

## Zero Tolerance Philosophy

### Why Zero Tolerance?

1. **Violations Compound**
   - One `any` spreads to 10 files in a week
   - One inline style becomes "the pattern"

2. **Cognitive Load**
   - "Some violations allowed" = developers waste time deciding
   - Zero violations = clear, simple rule

3. **Trust**
   - If build passes, code is production-ready
   - No "it builds but..." scenarios

---

## The Sacred Oath

> **"I commit to writing code that passes virgin-check on the first try. I will not bypass, workaround, or --no-verify. I will fix violations immediately. I will maintain Ground Zero."**

---

## Quick Reference

### Commands

| Command | Purpose | When |
|---------|---------|------|
| `/VRP-commit` | Create compliant commit | Every commit |
| `/VRP-push` | Push with verification | When sharing |
| `/VRP-audit` | Full 88-point audit | Weekly/releases |

### Violation Checklist

If VRP fails, check:
- [ ] TypeScript errors? → Fix types
- [ ] ESLint violations? → Fix lint errors
- [ ] Build failures? → Fix build
- [ ] TAV infections? → Replace `any`
- [ ] ISV infections? → Replace inline styles
- [ ] FUSE violations? → Remove loading states/fetch

### Emergency Recovery

```bash
# Accidentally committed violations:
git reset --soft HEAD~1
# Fix violations
/VRP-commit
```

---

## Benefits of Ground Zero

- ✅ Zero technical debt accumulation
- ✅ Always production-ready
- ✅ Instant onboarding (no cleanup needed)
- ✅ Safe refactoring (type safety guaranteed)
- ✅ Predictable performance (no inline style bloat)
- ✅ Pure architecture (FUSE patterns enforced)

---

## Conclusion

**VRP is not bureaucracy - it's architectural self-defense.**

Every violation prevented is:
- Hours saved debugging later
- Performance issues avoided
- Onboarding friction eliminated
- Technical debt prevented

**Cost of enforcement:** 30 seconds per commit
**Cost of no enforcement:** Weeks of cleanup

**Choose virgin. Choose VRP.**
