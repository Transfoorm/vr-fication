/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ ISV PROTECTION - TypeScript Level Enforcement                     │
│  Real-time inline style blocking via type system                      │
│                                                                        │
│  This makes `style={{}}` show TypeScript errors INSTANTLY in VS Code  │
│  No extensions needed - built into TypeScript itself!                 │
│                                                                        │
│  DISABLED: This breaks exception files. Use ESLint instead.           │
│  Keeping file for documentation purposes.                             │
└────────────────────────────────────────────────────────────────────────┘ */

/**
 * NOTE: TypeScript-level blocking is too aggressive and breaks
 * legitimate exception files (Phoenix Animation, Portals, etc.)
 *
 * Instead, we use:
 * 1. ESLint for editor warnings (with exceptions)
 * 2. Pre-commit hooks for hard blocks
 * 3. Build-time verification
 *
 * This provides real-time feedback without breaking valid code.
 */

export {};
