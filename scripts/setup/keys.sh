#!/bin/bash
# Stores this workspace's API keys in the macOS Keychain, where the tools read them
# (_shared/tools/fish_tts.py and freesound.py). Run it yourself, in Terminal or the app's Terminal panel:
#
#   bash scripts/setup/keys.sh              # asks for each key; press Return at a question to skip it
#   bash scripts/setup/keys.sh fish         # only the Fish Audio key   (also: freesound)
#
# macOS's own `security` tool asks for each key with hidden typing, so the key never appears on screen,
# in the chat with an AI agent, in a file, in shell history or in the process list. Agents never run this.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1
ONLY="${1:-all}"
PY=python3; [ -x .venv/bin/python ] && PY=.venv/bin/python

if [ ! -t 0 ] || [ ! -t 1 ]; then
  echo "keys.sh needs your keyboard, so it only runs in your own Terminal. Open Terminal and run:"
  echo "  cd \"$ROOT\" && bash scripts/setup/keys.sh"
  exit 2
fi

if [ "$(uname -s)" != "Darwin" ]; then
  cat <<'EOF'
Not a Mac, so there is no Keychain. The tools also read environment variables. Add these lines to your
shell profile (~/.zshrc or ~/.bashrc), never to a file inside this workspace, then open a new terminal:
  export FISH_API_KEY='...'          # https://fish.audio/app/api-keys/
  export FREESOUND_API_KEY='...'     # optional: https://freesound.org/apiv2/apply/
  export FREESOUND_CLIENT_ID='...'   # optional
EOF
  exit 0
fi

ask_yes() { local a; read -r -p "$1 [y/N] " a; [ "$a" = "y" ] || [ "$a" = "Y" ]; }

store() { # $1 Keychain service, $2 label, $3 where to get it, $4 what it is for
  local svc="$1" label="$2"
  printf '\n\033[1m%s\033[0m\n  What for: %s\n  Get it:   %s\n' "$label" "$4" "$3"
  if security find-generic-password -s "$svc" >/dev/null 2>&1; then
    ask_yes "  A key is already stored. Replace it?" || { echo "  kept the stored key"; return 0; }
  else
    ask_yes "  Store this key now?" || { echo "  skipped"; return 0; }
  fi
  echo "  Paste the key at the prompt (typing stays hidden), press Return, then paste it again to confirm."
  if security add-generic-password -U -a "$USER" -s "$svc" -l "$label (MotionGraphics)" -w; then
    echo "  stored in your login Keychain as \"$svc\""
    return 0
  fi
  echo "  not stored (the two entries did not match, or Keychain refused). Run this script again."
  return 1
}

check() { # $1 tool args… ; prints only OK or the tool's error line, never the key
  if out=$("$PY" "$@" 2>&1); then echo "  check: OK"; else echo "  check failed: $(printf '%s' "$out" | tail -1 | cut -c1-160)"; fi
}

echo "MotionGraphics API keys. Nothing you type here is shown or saved anywhere except your Keychain."

if [ "$ONLY" = "all" ] || [ "$ONLY" = "fish" ]; then
  store motiongraphics.fish-audio-api-key "Fish Audio API key" \
    "sign in at https://fish.audio, open https://fish.audio/app/api-keys/ and create a key" \
    "voice-overs (default voice Sarah, free model s2.1-pro-free)" \
    && security find-generic-password -s motiongraphics.fish-audio-api-key >/dev/null 2>&1 \
    && check _shared/tools/fish_tts.py --check
fi

if [ "$ONLY" = "all" ] || [ "$ONLY" = "freesound" ]; then
  store motiongraphics.freesound-api-key "Freesound API key" \
    "make a free account at https://freesound.org, then apply at https://freesound.org/apiv2/apply/ and copy \"Client secret/Api key\"" \
    "optional: search and download new CC0 sound effects" \
    && security find-generic-password -s motiongraphics.freesound-api-key >/dev/null 2>&1 \
    && check _shared/tools/freesound.py check
  store motiongraphics.freesound-client-id "Freesound client ID" \
    "the \"Client id\" on the same Freesound API page" \
    "optional: only for original-quality downloads, which need a browser sign-in"
fi

echo
echo "Done. Back in Claude Code, say \"keys are in\" and it will check them with: bash scripts/setup/doctor.sh --online"
