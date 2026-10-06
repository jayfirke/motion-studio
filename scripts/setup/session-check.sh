#!/bin/bash
# SessionStart hook (.claude/settings.json). Its output is added to the agent's context at the start of
# every session; on a machine that is set up it prints nothing.
#   - No .local/setup.json or no OWNER.md: a fresh clone, so the agent must run setup first.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ ! -f "$ROOT/.local/setup.json" ] || [ ! -f "$ROOT/OWNER.md" ]; then
  cat <<'EOF'
FIRST RUN: this copy of the motion-studio workspace is not set up on this machine yet (.local/setup.json or OWNER.md is missing).
Before any other work: tell the user in one line, then run the workspace-setup skill (.agents/skills/workspace-setup/SKILL.md; SETUP.md is the human version). Never ask the user to paste an API key into the chat.
EOF
  exit 0
fi
exit 0
