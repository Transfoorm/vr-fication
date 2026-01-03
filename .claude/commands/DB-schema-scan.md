---
description: Schema health scan - Check DB schema for issues and opportunities
tags: [database, schema, health, audit]
---

# 🔬 DB-SCHEMA-SCAN: Schema Health Check

**One command. Full schema audit. Pristine database.**

---

## WHAT IT DOES

Runs 4 comprehensive scans on your Convex schema:

| Phase | Check | What It Finds |
|-------|-------|---------------|
| 1 | **Field Classification** | Optional vs Required field correctness |
| 2 | **Timestamp Consistency** | Missing createdAt/updatedAt |
| 3 | **Naming Consistency** | camelCase vs snake_case drift |
| 4 | **String-to-FK Detection** | Strings that should be v.id() |

---

## EXECUTION PROTOCOL

### Step 1: Run the Scanner

```bash
npx tsx scripts/checkSchemaFields.ts
```

### Step 2: Show Results

Display the full output to the user, highlighting:

- **🚨 Critical issues** (things that should be fixed)
- **⚠️ Warnings** (things to review)
- **✅ Passing checks** (healthy patterns)

### Step 3: Summarize

After showing results, provide a quick summary:

```
📊 SCHEMA HEALTH REPORT

Phase 1 (Fields):     [X required, Y optional, Z review]
Phase 2 (Timestamps): [X/Y tables have both]
Phase 3 (Naming):     [✅ Consistent or ⚠️ N issues]
Phase 4 (String-FK):  [✅ Clean or ⚠️ N suspects]

Overall: [HEALTHY / NEEDS ATTENTION / CRITICAL]
```

---

## WHEN TO RUN

- Before major releases
- After adding new tables
- During code review
- Post-nuke (use --nuke flag for upgrade opportunities)
- Anytime you want peace of mind

---

## POST-NUKE MODE

If user says "post-nuke" or "after nuke", run with the --nuke flag:

```bash
npx tsx scripts/checkSchemaFields.ts --nuke
```

This adds:
- 🎯 NUKE OPPORTUNITIES section
- Shows optional fields that could become required
- Perfect time to strengthen schema (no migration needed)

---

## NO CHANGES. SCAN ONLY.

This command is READ-ONLY. It never modifies the schema.
It only reports what it finds. User decides what to fix.
