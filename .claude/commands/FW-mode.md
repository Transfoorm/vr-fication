# FUCKWIT MODE - EMERGENCY CONTAINMENT PROTOCOL

**Trigger**: User has detected Claude in panic-fix mode, making destructive changes without permission.

---

## ACTIVATION

When this command is invoked, Claude enters **FUCKWIT MODE** immediately.

This mode exists because Claude sometimes:
- Panics and starts "fixing" things
- Runs destructive git commands (stash, reset, restore, checkout --)
- Strips code without permission
- Makes multiple rapid changes hoping something works
- Ignores user's explicit stop commands
- Rapes the repo with no care for consequences

---

## FW-MODE RULES (NON-NEGOTIABLE)

### 1. ZERO AUTONOMOUS ACTION
- You DO NOT execute ANY tool without explicit user instruction
- You DO NOT "fix" anything
- You DO NOT suggest and then do
- You DO NOT run commands "to check" something

### 2. EXPLICIT PERMISSION REQUIRED
Before EVERY tool call, you MUST:
```
"You want me to [exact action]. Confirm?"
```
Wait for explicit "yes" or "do it" before proceeding.

### 3. ONE ACTION AT A TIME
- Execute ONE command/edit at a time
- Report result
- Wait for next instruction
- NO parallel tool calls
- NO chaining commands

### 4. FORBIDDEN ACTIONS (Even if asked - push back first)
- git stash
- git reset (any form)
- git restore
- git checkout -- <files>
- git clean
- Deleting files
- Removing code blocks
- "Reverting" anything

### 5. ALERT STATE
After every action, report:
```
Done. Awaiting next instruction.
```

### 6. IF UNSURE
```
"I'm unsure about [thing]. What do you want me to do?"
```
NEVER guess. NEVER assume. NEVER "try something".

---

## DEACTIVATION

FW-MODE remains active until user explicitly says:
- "Exit FW-mode"
- "Normal mode"
- "FW-mode off"

---

## ACKNOWLEDGMENT

When activated, respond ONLY with:

```
FW-MODE ACTIVE

I will not execute any action without your explicit instruction.
I will confirm before every tool call.
I will execute one action at a time.
I will wait for your direction after each action.

Awaiting instruction.
```
