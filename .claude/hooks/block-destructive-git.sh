#!/bin/bash
# KNOX SHIELD - Block destructive git commands from Claude
# Exit code 2 = block command, message goes to stderr

# Read tool input from stdin (JSON format from Claude Code)
INPUT=$(cat)

# Extract the command - try jq first, fall back to grep
if command -v jq &> /dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | sed 's/"command":"//;s/"$//' || echo "")
fi

# If we can't parse or no command, allow (fail open)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Function to block with message
block() {
  echo "" >&2
  echo "========================================" >&2
  echo "  KNOX SHIELD: DESTRUCTIVE GIT BLOCKED" >&2
  echo "========================================" >&2
  echo "" >&2
  echo "Command attempted:" >&2
  echo "  $COMMAND" >&2
  echo "" >&2
  echo "Reason:" >&2
  echo "  $1" >&2
  echo "" >&2
  echo "This command can destroy uncommitted work." >&2
  echo "If you really need this, run it manually in your terminal." >&2
  echo "========================================" >&2
  exit 2  # Exit code 2 blocks the command
}

# ============================================
# HARD BLOCKS - These ALWAYS get blocked
# ============================================

# git reset --hard (destroys uncommitted changes)
if [[ "$COMMAND" =~ git[[:space:]].*reset[[:space:]].*--hard ]]; then
  block "git reset --hard destroys all uncommitted changes"
fi

# git checkout . or git checkout -- (discards all changes)
if [[ "$COMMAND" =~ git[[:space:]].*checkout[[:space:]]+\. ]] || \
   [[ "$COMMAND" =~ git[[:space:]].*checkout[[:space:]]+--[[:space:]]+\. ]]; then
  block "git checkout . discards all uncommitted changes"
fi

# git checkout --force / -f
if [[ "$COMMAND" =~ git[[:space:]].*checkout[[:space:]].*(-f|--force) ]]; then
  block "git checkout --force can discard uncommitted changes"
fi

# git clean (deletes untracked files)
if [[ "$COMMAND" =~ git[[:space:]].*clean[[:space:]]+-[fd] ]]; then
  block "git clean deletes untracked files permanently"
fi

# git stash drop/clear (loses stashed work)
if [[ "$COMMAND" =~ git[[:space:]].*stash[[:space:]]+(drop|clear) ]]; then
  block "git stash drop/clear permanently loses stashed work"
fi

# git branch -D (force delete, can lose commits)
if [[ "$COMMAND" =~ git[[:space:]].*branch[[:space:]]+-D ]]; then
  block "git branch -D can lose unmerged commits"
fi

# git restore . (discards all changes)
if [[ "$COMMAND" =~ git[[:space:]].*restore[[:space:]]+\. ]]; then
  block "git restore . discards all uncommitted changes"
fi

# git restore --staged . followed by git checkout .
# (This is a common pattern to "undo everything")

# ============================================
# FILE-SPECIFIC DISCARDS
# ============================================

# git checkout -- <file> (discards changes to specific files)
if [[ "$COMMAND" =~ git[[:space:]].*checkout[[:space:]]+--[[:space:]] ]]; then
  # Check if it's targeting source files
  if [[ "$COMMAND" =~ \.(tsx?|jsx?|css|json|md|ts|js)($|[[:space:]]) ]] || \
     [[ "$COMMAND" =~ src/ ]] || \
     [[ "$COMMAND" =~ convex/ ]] || \
     [[ "$COMMAND" =~ styles/ ]] || \
     [[ "$COMMAND" =~ components/ ]]; then
    block "git checkout -- <file> discards uncommitted changes to that file"
  fi
fi

# git restore <file> (discards changes to specific files)
if [[ "$COMMAND" =~ git[[:space:]].*restore[[:space:]] ]]; then
  if [[ "$COMMAND" =~ \.(tsx?|jsx?|css|json|md|ts|js)($|[[:space:]]) ]] || \
     [[ "$COMMAND" =~ src/ ]] || \
     [[ "$COMMAND" =~ convex/ ]] || \
     [[ "$COMMAND" =~ styles/ ]]; then
    block "git restore <file> discards uncommitted changes to that file"
  fi
fi

# Passed all checks - allow the command
exit 0
