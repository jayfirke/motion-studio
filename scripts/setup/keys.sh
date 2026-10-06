#!/bin/bash
# Stores this workspace's API keys where the tools read them (_shared/tools/keystore.py):
#   macOS: the login Keychain.
#   Linux and Windows (WSL 2): the desktop secret store through `secret-tool` when one is running (GNOME Keyring,
#   KDE Wallet); otherwise ~/.config/motion-studio/keys.env, a file outside the workspace that only you can read.
# Run it yourself, in Terminal or the app's Terminal panel:
#
#   bash scripts/setup/keys.sh              # asks for each key; press Return at a question to skip it
#   bash scripts/setup/keys.sh fish         # only the Fish Audio key   (also: freesound)
#
# Typing stays hidden, so a key never appears on screen, in the chat with an AI agent, in shell history or in the
# process list. Agents never run this.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1
ONLY="${1:-all}"
PY=python3; [ -x .venv/bin/python ] && PY=.venv/bin/python
OS="$(uname -s)"
KEYS_ENV="$HOME/.config/motion-studio/keys.env"

if [ ! -t 0 ] || [ ! -t 1 ]; then
  echo "keys.sh needs your keyboard, so it only runs in your own Terminal. Open Terminal and run:"
  echo "  cd \"$ROOT\" && bash scripts/setup/keys.sh"
  exit 2
fi

# Linux / WSL 2: use the secret store when it answers, else the private keys.env file.
BACKEND=keychain
if [ "$OS" != "Darwin" ]; then
  BACKEND=file
  if command -v secret-tool >/dev/null 2>&1 && secret-tool search --all service motiongraphics.probe >/dev/null 2>&1; then BACKEND=secret-tool; fi
fi

ask_yes() { local a; read -r -p "$1 [y/N] " a; [ "$a" = "y" ] || [ "$a" = "Y" ]; }

have_key() { # $1 service, $2 env var name
  case "$BACKEND" in
    keychain) security find-generic-password -s "$1" >/dev/null 2>&1 ;;
    secret-tool) [ -n "$(secret-tool lookup service "$1" 2>/dev/null)" ] ;;
    file) [ -f "$KEYS_ENV" ] && grep -q "^$2=" "$KEYS_ENV" ;;
  esac
}

save_key() { # $1 service, $2 label, $3 env var name; reads the key with hidden typing
  case "$BACKEND" in
    keychain) security add-generic-password -U -a "$USER" -s "$1" -l "$2 (MotionGraphics)" -w ;;
    secret-tool) secret-tool store --label="$2 (MotionGraphics)" service "$1" ;;
    file)
      local k1 k2
      read -r -s -p "  Key (hidden): " k1; echo; read -r -s -p "  Again to confirm: " k2; echo
      [ -n "$k1" ] && [ "$k1" = "$k2" ] || { unset k1 k2; return 1; }
      mkdir -p "$(dirname "$KEYS_ENV")" && touch "$KEYS_ENV" && chmod 600 "$KEYS_ENV"
      grep -v "^$3=" "$KEYS_ENV" > "$KEYS_ENV.tmp" 2>/dev/null; printf '%s=%s\n' "$3" "$k1" >> "$KEYS_ENV.tmp"
      mv "$KEYS_ENV.tmp" "$KEYS_ENV" && chmod 600 "$KEYS_ENV"; unset k1 k2 ;;
  esac
}

store() { # $1 service, $2 label, $3 where to get it, $4 what it is for, $5 env var name
  local svc="$1" label="$2"
  printf '\n\033[1m%s\033[0m\n  What for: %s\n  Get it:   %s\n' "$label" "$4" "$3"
  if have_key "$svc" "$5"; then
    ask_yes "  A key is already stored. Replace it?" || { echo "  kept the stored key"; return 0; }
  else
    ask_yes "  Store this key now?" || { echo "  skipped"; return 0; }
  fi
  echo "  Paste the key at the prompt (typing stays hidden), press Return, then paste it again to confirm."
  if save_key "$svc" "$label" "$5"; then
    case "$BACKEND" in
      keychain) echo "  stored in your login Keychain as \"$svc\"" ;;
      secret-tool) echo "  stored in your secret store as \"$svc\"" ;;
      file) echo "  stored in $KEYS_ENV (only you can read it)" ;;
    esac
    return 0
  fi
  echo "  not stored (the two entries did not match, or the store refused). Run this script again."
  return 1
}

check() { # $1 tool args… ; prints only OK or the tool's error line, never the key
  if out=$("$PY" "$@" 2>&1); then echo "  check: OK"; else echo "  check failed: $(printf '%s' "$out" | tail -1 | cut -c1-160)"; fi
}

case "$BACKEND" in keychain) W="your Keychain";; secret-tool) W="your secret store";; file) W="$KEYS_ENV";; esac
echo "MotionGraphics API keys. Nothing you type here is shown or saved anywhere except $W."

if [ "$ONLY" = "all" ] || [ "$ONLY" = "fish" ]; then
  store motiongraphics.fish-audio-api-key "Fish Audio API key" \
    "sign in at https://fish.audio, open https://fish.audio/app/api-keys/ and create a key" \
    "voice-overs (default voice Sarah, free model s2.1-pro-free)" FISH_API_KEY \
    && have_key motiongraphics.fish-audio-api-key FISH_API_KEY \
    && check _shared/tools/fish_tts.py --check
fi

if [ "$ONLY" = "all" ] || [ "$ONLY" = "freesound" ]; then
  store motiongraphics.freesound-api-key "Freesound API key" \
    "make a free account at https://freesound.org, then apply at https://freesound.org/apiv2/apply/ and copy \"Client secret/Api key\"" \
    "optional: search and download new CC0 sound effects" FREESOUND_API_KEY \
    && have_key motiongraphics.freesound-api-key FREESOUND_API_KEY \
    && check _shared/tools/freesound.py check
  store motiongraphics.freesound-client-id "Freesound client ID" \
    "the \"Client id\" on the same Freesound API page" \
    "optional: only for original-quality downloads, which need a browser sign-in" FREESOUND_CLIENT_ID
fi

echo
echo "Done. Back in Claude Code, say \"keys are in\" and it will check them with: bash scripts/setup/doctor.sh --online"
