# File Naming Convention

> FUSE Stack File Naming Doctrine — No Exceptions

---

## The Law

| Type | Convention | Example |
|------|------------|---------|
| Folder | kebab-case | `page-header/` |
| CSS file | kebab-case (matches folder) | `page-header.css` |
| CSS variables | kebab-case (matches folder) | `--page-header-*` |
| CSS classes | prefixed kebab-case | `.ly-page-header-*` |
| React component file | PascalCase | `PageHeader.tsx` |
| React context file | PascalCase + Context | `PageHeaderContext.tsx` |
| Barrel/index file | lowercase | `index.ts` or `index.tsx` |
| Utility/config file | kebab-case | `config.ts`, `types.ts` |
| Hook file | camelCase with use prefix | `usePageHeader.ts` |

---

## Directory Coverage

This doctrine applies to ALL directories under `src/`:

| Directory | Purpose | Folder Convention |
|-----------|---------|-------------------|
| `src/shell/` | Layout components | kebab-case |
| `src/features/` | Feature components | kebab-case |
| `src/prebuilts/` | Reusable components | kebab-case |
| `src/app/` | Next.js routes | kebab-case (Next.js conventions) |
| `src/providers/` | React providers | flat (PascalCase files) |
| `src/hooks/` | Custom hooks | flat (camelCase files) |
| `src/store/` | State management | kebab-case |
| `src/fuse/` | FUSE internals | kebab-case |
| `src/lib/` | Utilities | kebab-case |

---

## Component Folder Pattern

ONE pattern. No exceptions:

```
folder-name/
├── ComponentName.tsx       ← PascalCase (main component)
├── ComponentNameContext.tsx ← PascalCase + Context (if needed)
├── folder-name.css         ← kebab-case (matches folder)
├── index.ts                ← lowercase (barrel export)
├── types.ts                ← lowercase (types)
└── config.ts               ← lowercase (config)
```

---

## File Type Rules

### React Components (.tsx)
- **PascalCase** matching the component name inside
- First letter MUST be uppercase
- Examples: `PageHeader.tsx`, `Sidebar.tsx`, `FlyingButton.tsx`

### React Context (.tsx)
- **PascalCase + Context suffix**
- Examples: `PageHeaderContext.tsx`, `VanishContext.tsx`
- **Export exception:** Context files export Providers and hooks, NOT a component matching the filename
- `PageHeaderContext.tsx` → exports `PageHeaderProvider` + `usePageHeaderContext` (correct)

### Barrel Files
- **Always `index.ts` or `index.tsx`**
- Lowercase, no exceptions

### Utility Files (.ts)
- **kebab-case or single lowercase word**
- Examples: `types.ts`, `config.ts`, `utils.ts`, `navigation.ts`

### Hook Files (.ts)
- **camelCase with `use` prefix**
- Examples: `usePageHeader.ts`, `useRouteTitle.ts`, `useFuse.ts`

### CSS Files (.css)
- **kebab-case matching folder name**
- Examples: `page-header.css`, `flying-button.css`
- **Module-level exception:** Root CSS files like `shell.css` (import hub) and `app.css` (frame layout) are allowed at module roots

### CSS Variables
- **kebab-case with folder prefix**
- Examples: `--page-header-height`, `--flying-button-speed`

---

## Validation Rules

### PASS Conditions
- Folder name is kebab-case (lowercase, hyphens only)
- CSS filename matches folder name exactly
- Component files start with uppercase letter
- Context files end with `Context.tsx`
- Utility files are lowercase
- Hook files start with `use` + uppercase letter
- CSS variables contain no uppercase letters
- **PascalCase files export a matching component name**
- **Lowercase files do NOT export React components**

### FAIL Conditions
- Folder contains uppercase: `PageHeader/` ❌
- CSS contains uppercase: `PageHeader.css` ❌
- Component starts lowercase: `pageHeader.tsx` ❌
- CSS doesn't match folder: `styles.css` in `page-header/` ❌
- Variable contains uppercase: `--pageHeader-size` ❌
- Hook missing use prefix: `pageHeader.ts` ❌
- **PascalCase file without matching export:** `Button.tsx` with `export function Btn` ❌
- **Lowercase file exporting component:** `utils.ts` with `export function MyComponent` ❌

---

## TTT Compliance

This convention passes all 7 TTT tests:

1. **Architecture** — Static naming, predictable resolution
2. **Design** — Consistent across entire codebase
3. **Maintainability** — Any dev can predict file locations
4. **Performance** — Zero runtime overhead
5. **Reversibility** — Rename folder = rename contents
6. **Consistency** — ONE pattern, no exceptions
7. **Clarity** — Non-coders can navigate the structure

---

## The Oath

```
Folders are kebab-case.
CSS files match folders.
Components are PascalCase.
Contexts end with Context.
Utilities are lowercase.
Hooks start with use.
Variables are kebab-case.

No exceptions. No debates. No options.
```
