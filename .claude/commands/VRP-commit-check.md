---
description: VRP Pristine Check - Verify git repository is clean (no unstaged, no stashes, synced)
tags: [vrp, git, pristine, clean]
---

# 🧼 VRP-PRISTINE: Repository Cleanliness Verification

**Purpose**: Verify the git repository is in a pristine, clean state after commits and pushes.

**When to use**: After completing `/VRP-commit` and pushing to remote, to confirm everything is clean.

---

## EXECUTION PROTOCOL

You MUST run the following checks in parallel and report results:

### 1. Working Tree Status
```bash
git status
```

### 2. Stash Check
```bash
git stash list
```

### 3. Branch & Sync Status
```bash
git status -sb
```

### 4. Last Commit Info
```bash
git log -1 --oneline
```

### 5. Unstaged Files Check
```bash
git ls-files --others --exclude-standard
```

---

## REPORT FORMAT

After running all checks, present results in this EXACT format:

```
🧼 VRP-PRISTINE VERIFICATION
═══════════════════════════════════════════════════════════════

✅ Working Tree:        [Clean / ❌ Dirty]
✅ Staged Changes:      [None / ❌ Present]
✅ Unstaged Changes:    [None / ❌ Present]
✅ Untracked Files:     [None / ❌ Present]
✅ Stashes:             [None / ❌ Present]
✅ Branch:              [main / other]
✅ Remote Sync:         [Synced / ❌ Behind / ❌ Ahead / ❌ Diverged]
✅ Last Commit:         [hash + message]

═══════════════════════════════════════════════════════════════
STATUS: [✅ PRISTINE / ❌ NEEDS ATTENTION]
```

---

## SUCCESS CRITERIA

Repository is PRISTINE when ALL of these are true:
- ✅ Working tree clean
- ✅ No staged changes
- ✅ No unstaged changes
- ✅ No untracked files
- ✅ No stashes
- ✅ On main branch (or expected branch)
- ✅ Remote synced (no ahead/behind)

If ANY check fails, report what needs attention.

---

## IMPORTANT

- Run ALL checks in parallel for speed
- NEVER suggest fixes - just report status
- If not pristine, list exactly what's dirty
- This is a READ-ONLY verification tool
