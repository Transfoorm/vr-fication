#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
#  🛡️ GIT GUARDIAN - Destructive Command Blocker
#  /scripts/git-guardian.sh
#
#  Wraps git to block commands that destroy uncommitted work:
#    - git checkout HEAD -- <file>
#    - git checkout -- <file>
#    - git reset --hard
#    - git clean -fd
#    - git stash drop
#
#  INSTALL:
#    Add to ~/.bashrc or ~/.zshrc:
#      alias git='/path/to/vr/scripts/git-guardian.sh'
#
#  BYPASS (when you really mean it):
#    FORCE_GIT=1 git reset --hard
#═══════════════════════════════════════════════════════════════════════════════

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Allow bypass with FORCE_GIT=1
if [ "$FORCE_GIT" = "1" ]; then
    /usr/bin/git "$@"
    exit $?
fi

# Convert args to string for pattern matching
ARGS="$*"

# ═══════════════════════════════════════════════════════════════════════════════
# BLOCKED PATTERNS
# ═══════════════════════════════════════════════════════════════════════════════

# Pattern 1: git checkout HEAD -- <file>
# Pattern 2: git checkout -- <file>
if [[ "$ARGS" =~ checkout.*--[[:space:]] ]] || [[ "$ARGS" =~ checkout[[:space:]]+HEAD[[:space:]]+-- ]]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  🛡️ GIT GUARDIAN - DESTRUCTIVE COMMAND BLOCKED${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}  Command: git $ARGS${NC}"
    echo ""
    echo "  This command DESTROYS uncommitted changes to files."
    echo "  Your work will be GONE. No recovery possible."
    echo ""
    echo "  If you REALLY mean it, run:"
    echo "    FORCE_GIT=1 git $ARGS"
    echo ""
    exit 1
fi

# Pattern 3: git reset --hard
if [[ "$ARGS" =~ reset.*--hard ]]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  🛡️ GIT GUARDIAN - DESTRUCTIVE COMMAND BLOCKED${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}  Command: git $ARGS${NC}"
    echo ""
    echo "  This command DESTROYS all uncommitted changes."
    echo "  Everything not committed will be GONE."
    echo ""
    echo "  If you REALLY mean it, run:"
    echo "    FORCE_GIT=1 git $ARGS"
    echo ""
    exit 1
fi

# Pattern 4: git clean -f (with any flags)
if [[ "$ARGS" =~ clean.*-[a-zA-Z]*f ]]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  🛡️ GIT GUARDIAN - DESTRUCTIVE COMMAND BLOCKED${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}  Command: git $ARGS${NC}"
    echo ""
    echo "  This command DELETES untracked files permanently."
    echo "  Files not in git will be GONE."
    echo ""
    echo "  If you REALLY mean it, run:"
    echo "    FORCE_GIT=1 git $ARGS"
    echo ""
    exit 1
fi

# Pattern 5: git stash drop
if [[ "$ARGS" =~ stash[[:space:]]+drop ]]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  🛡️ GIT GUARDIAN - DESTRUCTIVE COMMAND BLOCKED${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}  Command: git $ARGS${NC}"
    echo ""
    echo "  This command DELETES a stash permanently."
    echo "  That stashed work will be GONE."
    echo ""
    echo "  If you REALLY mean it, run:"
    echo "    FORCE_GIT=1 git $ARGS"
    echo ""
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# SAFE - Pass through to real git
# ═══════════════════════════════════════════════════════════════════════════════
/usr/bin/git "$@"
