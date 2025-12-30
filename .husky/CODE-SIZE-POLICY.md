# Code Size & File Length Policy

## Purpose

This repository enforces a global file length policy to prevent code bloat, preserve composability, and maintain long-term architectural clarity.

Large files correlate strongly with:
- Blurred responsibility boundaries
- Reduced testability
- Increased cognitive load
- Higher regression risk during change

The intent of this policy is not stylistic enforcement, but structural health.

---

## Global Rule

**Default hard limit: 400 lines per file**

This limit applies across the codebase unless explicitly exempted.

The expectation is that most files remain well below this threshold through:
- Decomposition
- Clear separation of concerns
- Purpose-specific modules

---

## Advisory Limits by File Type

These are **guidelines**, not hard enforcement, but should be treated as design signals.

- **Components (`*.tsx`)**: 300–400 lines  
  UI should be composable, not monolithic.

- **Hooks (`use*.ts`)**: 200–300 lines  
  Hooks should serve a single, focused responsibility.

- **Utilities / helpers**: 300–400 lines  
  Helpers should remain narrow and reusable.

- **Features / domain modules**: 400–600 lines  
  Business logic is allowed more scope, but must stay cohesive.

- **Convex functions (actions / mutations / queries)**: 400–600 lines  
  Prefer split-by-role patterns (store / actions / queries).

---

## Explicit Exclusions

The following are excluded from line limits:

- Stylesheets (`*.css`, `*.scss`)
- Documentation (`*.md`)
- Generated files (where applicable)

---

## Exception Policy

Some files legitimately require higher line counts due to correctness, atomicity, or protocol integrity.

Exceptions are allowed, but **only under strict rules**.

### Requirements for an Exception

1. **Explicit allowlist entry**  
   The file must be named explicitly (no wildcards).

2. **In-file justification**  
   A top-of-file comment must explain why splitting would:
   - Reduce correctness, or
   - Increase failure modes, or
   - Break transactional or protocol integrity

3. **Higher cap, not unlimited**  
   Exceptions raise the limit (e.g. 800–1200 lines).  
   No file is exempt from limits entirely.

4. **Architectural debt acknowledgement**  
   Exceptions are visible and reviewable.  
   They are not permanent privileges.

---

## Design Principle

If a file grows beyond limits, the default assumption is:

> The design needs refinement — not a larger file.

Exceptions exist to protect correctness, not convenience.

---

## Enforcement Philosophy

- Limits should be enforced by tooling where possible.
- Violations should fail early and clearly.
- Discussions should focus on structure, not personal style.

The goal is a codebase that remains understandable, evolvable, and safe under change.