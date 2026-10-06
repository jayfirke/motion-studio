#!/bin/bash
# Read-only health check for this workspace on this machine. Changes nothing and never prints a key.
#   bash scripts/setup/doctor.sh            # tools, skills, plugins, apps, keys (presence only)
#   bash scripts/setup/doctor.sh --online   # also asks Fish Audio and Freesound whether the stored keys work
# Each line: OK (ready), NEED (the core workflow needs it) or OPT (optional), followed by the fix.
# The last line, "DOCTOR need=N optional=M", is for agents to parse.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1
ONLINE=0; [ "${1:-}" = "--online" ] && ONLINE=1
NEED=0; OPTN=0
ok()   { printf '  OK    %-30s %s\n' "$1" "$2"; }
need() { printf '  NEED  %-30s %s\n' "$1" "$2"; NEED=$((NEED+1)); }
opt()  { printf '  OPT   %-30s %s\n' "$1" "$2"; OPTN=$((OPTN+1)); }
head_() { printf '\n%s\n' "$1"; }
has() { command -v "$1" >/dev/null 2>&1; }
has_skill() { [ -e "$HOME/.claude/skills/$1/SKILL.md" ] || [ -e "$HOME/.agents/skills/$1/SKILL.md" ]; }
CLAUDE_BIN="${CLAUDE_CODE_EXECPATH:-$(command -v claude 2>/dev/null)}"
OS="$(uname -s)"; ARCH="$(uname -m)"
if [ "$OS" = "Darwin" ]; then DEF_MODEL="$HOME/Library/Application Support/ru.starmel.OpenSuperWhisper/whisper-models/ggml-large-v3-turbo.bin"
else DEF_MODEL="${XDG_DATA_HOME:-$HOME/.local/share}/whisper-models/ggml-large-v3-turbo.bin"; fi
WHISPER_MODEL="${WHISPER_MODEL:-$DEF_MODEL}"
FIX="bash scripts/setup/install.sh system"   # the per-system installer (Homebrew on macOS, apt on Linux/WSL 2)
PATH="$PATH:$HOME/.local/bin"

echo "MotionGraphics doctor: $ROOT"

head_ "System"
if [ "$OS" = "Darwin" ] && [ "$ARCH" = "arm64" ]; then ok "macOS on Apple Silicon" "$(sw_vers -productVersion)"
elif [ "$OS" = "Darwin" ]; then opt "macOS on Intel" "$(sw_vers -productVersion): should work, not tested"
elif [ "$OS" = "Linux" ]; then
  distro="$(. /etc/os-release 2>/dev/null; echo "${PRETTY_NAME:-Linux}")"
  if grep -qi microsoft /proc/version 2>/dev/null; then ok "Windows (WSL 2)" "$distro, $ARCH"; else ok "Linux" "$distro, $ARCH"; fi
  command -v apt-get >/dev/null || opt "apt" "install.sh supports apt-based distributions (Ubuntu 22.04+, Debian 12+); install the tools by hand"
else need "supported system" "$OS/$ARCH is not supported: use macOS, Linux or Windows through WSL 2"; fi
ok "workspace" "$ROOT"

head_ "Command-line tools"
if [ "$OS" = "Darwin" ]; then has brew && ok "Homebrew" "$(brew --version 2>/dev/null | head -1)" || need "Homebrew" "install from https://brew.sh, then re-run"; fi
has git && ok "git" "$(git --version | awk '{print $3}')" || need "git" "$FIX"
if [ "$OS" = "Linux" ]; then
  has unzip && ok "unzip" "HyperFrames unpacks its Chrome with it" || need "unzip" "$FIX"
  if [ "$ARCH" = "aarch64" ]; then
    if [ -n "${HYPERFRAMES_BROWSER_PATH:-}" ] && [ -x "$HYPERFRAMES_BROWSER_PATH" ]; then ok "Chromium for HyperFrames" "$HYPERFRAMES_BROWSER_PATH"
    else need "Chromium for HyperFrames" "arm64 Linux: $FIX, then export HYPERFRAMES_BROWSER_PATH=\$(command -v chromium)"; fi
  fi
fi
if has node; then
  v=$(node -v); maj=$(node -p "process.versions.node.split('.')[0]")
  [ "$maj" -ge 20 ] && ok "node" "$v (tested with v22 and v24)" || need "node" "$v is too old (20 or newer): $FIX"
else need "node" "$FIX"; fi
has ffmpeg && ok "ffmpeg" "$(ffmpeg -version | head -1 | awk '{print $3}')" || need "ffmpeg" "$FIX"
has ffprobe && ok "ffprobe" "" || need "ffprobe" "comes with ffmpeg: $FIX"
has uv && ok "uv" "$(uv --version | awk '{print $2}')" || opt "uv" "$FIX (makes the Python 3.12 venv; plain python3.12 -m venv also works)"
if [ -x .venv/bin/python ]; then
  pv=$(.venv/bin/python -c 'import sys;print("%d.%d"%sys.version_info[:2])')
  if .venv/bin/python -c 'import numpy, scipy, soundfile, librosa, PIL, requests' 2>/dev/null; then ok "Python venv (.venv)" "Python $pv with numpy, scipy, soundfile, librosa, pillow"
  else need "Python venv (.venv)" "packages missing: bash scripts/setup/install.sh venv"; fi
  [ "$pv" = "3.12" ] || opt "Python version" ".venv is $pv; the scripts were tested on 3.12"
else need "Python venv (.venv)" "bash scripts/setup/install.sh venv"; fi
has whisper-cli && ok "whisper-cli" "$(command -v whisper-cli)" || need "whisper-cli" "$FIX (word timings and voice checks)"
[ -f "$WHISPER_MODEL" ] && ok "Whisper model" "large-v3-turbo" || need "Whisper model" "bash scripts/setup/install.sh whisper-model (1.6 GB download)"
if [ -d "/Applications/Google Chrome.app" ] || has google-chrome || has chromium; then ok "Chrome or Chromium" ""
else opt "Chrome or Chromium" "used by the Previs Studio smoke test; renders bring their own Chromium"; fi

head_ "Claude Code skills and plugins"
if [ -n "$CLAUDE_BIN" ]; then ok "Claude Code" "$("$CLAUDE_BIN" --version 2>/dev/null | head -1)"; else opt "Claude Code CLI" "not on PATH; plugin installs need it (the desktop app sets it for its own sessions)"; fi
for s in hyperframes remotion-best-practices video-shotcraft text-to-lottie fish-audio-api; do
  has_skill "$s" && ok "skill $s" "" || need "skill $s" "bash scripts/setup/install.sh skills"
done
has_skill motion-reel && ok "skill motion-reel" "Motion Reel Kit" || opt "skill motion-reel" "optional creator kit: MOTION_REEL_KIT=<kit folder> bash scripts/setup/install.sh motion-reel"
has_skill onetake && ok "skill onetake" "non-commercial use only" || opt "skill onetake" "bash scripts/setup/install.sh onetake (PolyForm Noncommercial: personal tests only)"
[ -e "$HOME/video-shotcraft" ] && ok "~/video-shotcraft" "path the docs use" || opt "~/video-shotcraft" "bash scripts/setup/install.sh skills links it to the installed skill"
PLUGINS="$(/usr/bin/python3 - <<'PY' 2>/dev/null
import json, os
p = os.path.expanduser('~/.claude/plugins/installed_plugins.json')
try:
    d = json.load(open(p)); print(' '.join(d.get('plugins', d).keys()))
except Exception:
    pass
PY
)"
for p in hyperframes@hyperframes core-skills@hyperframes bang-motion@bang-motion; do
  case " $PLUGINS " in *" $p "*) ok "plugin $p" "";; *) need "plugin $p" "bash scripts/setup/install.sh plugins";; esac
done
case " $PLUGINS " in *" watch@claude-video "*) ok "plugin watch@claude-video" "";; *) opt "plugin watch@claude-video" "bash scripts/setup/install.sh plugins (watching reference videos)";; esac

head_ "Apps and connectors"
if [ "$OS" = "Darwin" ]; then [ -d "/Applications/Diffusion Studio.app" ] && ok "Diffusion Studio app" "" || opt "Diffusion Studio app" "only for editing footage: download it from https://diffusion.studio"
else opt "Diffusion Studio" "desktop app is macOS/Windows only; on Linux use the web app at https://app.diffusion.studio (no MCP)"; fi
has diffusion && ok "diffusion CLI" "$(diffusion --version 2>/dev/null | head -1)" || opt "diffusion CLI" "comes with the Diffusion Studio app"
if [ -f "$HOME/.claude.json" ] && /usr/bin/grep -q "127.0.0.1:3274" "$HOME/.claude.json" 2>/dev/null; then ok "Diffusion MCP" "configured"
else opt "Diffusion MCP" "after installing the app: bash scripts/setup/install.sh diffusion-mcp"; fi
[ -d _shared/previs/app/node_modules ] && ok "Previs app packages" "" || opt "Previs app packages" "only to rebuild Previs Studio: bash scripts/setup/install.sh app"
opt "Fish Audio connector (claude.ai)" "optional: claude.ai Settings → Connectors → Fish Audio (the scripts don't need it)"

head_ "API keys (presence only; values are never shown)"
key_present() { # $1 store item, $2 env var (same lookup order as _shared/tools/keystore.py)
  [ -n "${!2:-}" ] && return 0
  if [ "$OS" = "Darwin" ]; then security find-generic-password -s "$1" >/dev/null 2>&1; return; fi
  [ -n "$(secret-tool lookup service "$1" 2>/dev/null)" ] && return 0
  [ -f "$HOME/.config/motion-studio/keys.env" ] && grep -q "^$2=" "$HOME/.config/motion-studio/keys.env"
}
if key_present motiongraphics.fish-audio-api-key FISH_API_KEY; then ok "Fish Audio API key" "stored"
else need "Fish Audio API key" "voice-overs need it: run bash scripts/setup/keys.sh in your own Terminal"; fi
if key_present motiongraphics.freesound-api-key FREESOUND_API_KEY; then ok "Freesound API key" "stored"
else opt "Freesound API key" "only to search and download new sounds: bash scripts/setup/keys.sh"; fi
if key_present motiongraphics.freesound-client-id FREESOUND_CLIENT_ID; then ok "Freesound client ID" "stored"
else opt "Freesound client ID" "only for original-quality downloads (OAuth): bash scripts/setup/keys.sh"; fi
if [ "$ONLINE" = 1 ] && [ -x .venv/bin/python ]; then
  if key_present motiongraphics.fish-audio-api-key FISH_API_KEY; then
    .venv/bin/python _shared/tools/fish_tts.py --check >/dev/null 2>&1 && ok "Fish Audio key works" "API answered" || need "Fish Audio key works" "the API refused the stored key: run bash scripts/setup/keys.sh again"
  fi
  if key_present motiongraphics.freesound-api-key FREESOUND_API_KEY; then
    .venv/bin/python _shared/tools/freesound.py check >/dev/null 2>&1 && ok "Freesound key works" "API answered" || opt "Freesound key works" "the API refused the stored key: run bash scripts/setup/keys.sh again"
  fi
fi

head_ "Setup marker"
[ -f .local/setup.json ] && ok ".local/setup.json" "setup finished on this machine" || opt ".local/setup.json" "written by the workspace-setup skill when setup is done"

printf '\nDOCTOR need=%d optional=%d\n' "$NEED" "$OPTN"
exit 0
