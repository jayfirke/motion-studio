#!/bin/bash
# Installs what this workspace needs, one named step at a time. Every step is safe to re-run.
# Systems: macOS (Homebrew), Linux with apt (Ubuntu 22.04+, Debian 12+) and Windows through WSL 2 (Ubuntu).
# The workspace-setup skill asks the owner before running any step (installs are "ask first" in AGENTS.md).
#
#   bash scripts/setup/install.sh system          # command-line tools for this system: Homebrew on macOS, apt on Linux/WSL 2
#   bash scripts/setup/install.sh brew            # macOS only: node, ffmpeg, whisper-cpp, uv, git (Homebrew)
#   bash scripts/setup/install.sh venv            # .venv with Python 3.12 and requirements.txt
#   bash scripts/setup/install.sh skills          # Claude Code skills: HyperFrames, Remotion, video-shotcraft, text-to-lottie, Fish Audio
#   bash scripts/setup/install.sh plugins         # Claude Code plugins: hyperframes, core-skills, bang-motion, watch
#   bash scripts/setup/install.sh motion-reel     # Motion Reel Kit skill (MOTION_REEL_KIT=<kit folder>, else engines/motion-reel)
#   bash scripts/setup/install.sh onetake         # onetake skill at the pinned commit (non-commercial use only)
#   bash scripts/setup/install.sh whisper-model   # Whisper large-v3-turbo, 1.6 GB, for word timings
#   bash scripts/setup/install.sh app             # Previs Studio app packages (only to rebuild Previs Studio)
#   bash scripts/setup/install.sh diffusion-mcp   # register the Diffusion Studio MCP (after installing the app)
#   bash scripts/setup/install.sh core            # system venv skills plugins (+ motion-reel when the kit is there)
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1
CLAUDE_BIN="${CLAUDE_CODE_EXECPATH:-$(command -v claude 2>/dev/null)}"
SKILLS_CLI="npx -y skills@1.5.23"          # the skills installer, pinned (writes ~/.agents/.skill-lock.json)
ONETAKE_COMMIT=cf09bde
OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then WHISPER_DIR="$HOME/Library/Application Support/ru.starmel.OpenSuperWhisper/whisper-models"
else WHISPER_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/whisper-models"; fi
[ -n "${WHISPER_MODEL:-}" ] && WHISPER_DIR="$(dirname "$WHISPER_MODEL")"
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
FAILED=0

say()  { printf '\n\033[1m== %s\033[0m\n' "$1"; }
ok()   { printf '  ok    %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILED=$((FAILED+1)); }
run()  { printf '  $ %s\n' "$*"; "$@"; }

step_brew() {
  say "Homebrew packages"
  command -v brew >/dev/null || { fail "Homebrew is missing: install it from https://brew.sh (it asks for your password), then re-run"; return; }
  for f in node ffmpeg whisper-cpp uv git; do
    if brew list --formula "$f" >/dev/null 2>&1; then ok "$f already installed"; else run brew install "$f" && ok "$f" || fail "brew install $f"; fi
  done
}

# Linux and WSL 2 (apt): the same tools as the Homebrew step, plus what HyperFrames' own Chrome needs to start.
apt_pick() { local p; for p in "$@"; do apt-cache show "$p" >/dev/null 2>&1 && { echo "$p"; return; }; done; }
step_apt() {
  say "System packages (apt)"
  command -v apt-get >/dev/null || { fail "install.sh supports apt-based Linux (Ubuntu 22.04+, Debian 12+, WSL 2 Ubuntu); on other distributions install git, curl, unzip, ffmpeg, cmake, a C++ compiler, Node 20+ and uv by hand"; return; }
  if [ -n "$SUDO" ] && ! sudo -n true 2>/dev/null && [ ! -t 0 ]; then
    fail "this step needs your password (sudo): run it yourself in a terminal: bash scripts/setup/install.sh system"; return
  fi
  run $SUDO apt-get update -qq || { fail "apt-get update"; return; }
  local pk="git curl unzip ffmpeg ca-certificates build-essential cmake"
  # Chrome's system libraries (names changed in Ubuntu 24.04, hence the pick)
  for alts in "libnss3" "libatk1.0-0t64 libatk1.0-0" "libatk-bridge2.0-0t64 libatk-bridge2.0-0" "libcups2t64 libcups2" "libdrm2" "libxkbcommon0" \
              "libxcomposite1" "libxdamage1" "libxfixes3" "libxrandr2" "libgbm1" "libpango-1.0-0" "libcairo2" "libasound2t64 libasound2" "fonts-liberation"; do
    pk="$pk $(apt_pick $alts)"
  done
  # HyperFrames brings its own Chrome on x86_64; on arm64 Linux it needs the system Chromium
  [ "$(uname -m)" = "aarch64" ] && pk="$pk $(apt_pick chromium chromium-browser)"
  run $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $pk && ok "apt packages" || fail "apt-get install"
  if ! command -v node >/dev/null || [ "$(node -p "process.versions.node.split('.')[0]")" -lt 20 ]; then
    echo "  Node 20+ is missing: installing Node 22 from NodeSource (https://github.com/nodesource/distributions)"
    run bash -c "curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO bash -" && run $SUDO apt-get install -y -qq nodejs && ok "node $(node -v)" || fail "Node 22"
  else ok "node $(node -v) already installed"; fi
  if ! command -v uv >/dev/null && [ ! -x "$HOME/.local/bin/uv" ]; then
    run bash -c "curl -LsSf https://astral.sh/uv/install.sh | sh" && ok "uv (in ~/.local/bin; open a new terminal so it is on PATH)" || fail "uv installer"
  else ok "uv already installed"; fi
  step_whisper_build
  if [ "$(uname -m)" = "aarch64" ] && [ -z "${HYPERFRAMES_BROWSER_PATH:-}" ]; then
    local cr; cr="$(command -v chromium || command -v chromium-browser)"
    echo "  HyperFrames on arm64 Linux uses the system Chromium. Add this line to your ~/.bashrc (or ~/.zshrc):"
    echo "    export HYPERFRAMES_BROWSER_PATH=\"${cr:-/usr/bin/chromium}\""
  fi
}

# whisper-cli (word timings): built from source, one static binary in ~/.local/bin
WHISPER_CPP_TAG="${WHISPER_CPP_TAG:-v1.9.4}"   # latest release on 2026-10-06
step_whisper_build() {
  if command -v whisper-cli >/dev/null || [ -x "$HOME/.local/bin/whisper-cli" ]; then ok "whisper-cli already installed"; return; fi
  local src="${XDG_DATA_HOME:-$HOME/.local/share}/motion-studio/whisper.cpp"
  mkdir -p "$(dirname "$src")" "$HOME/.local/bin"
  [ -d "$src/.git" ] || run git clone -q --depth 1 --branch "$WHISPER_CPP_TAG" https://github.com/ggml-org/whisper.cpp "$src" \
    || run git clone -q --depth 1 https://github.com/ggml-org/whisper.cpp "$src" || { fail "git clone whisper.cpp"; return; }
  local j; j="$(nproc 2>/dev/null || echo 4)"
  # optimised for this CPU first; some compilers (GCC 12 on ARM) reject that, so fall back to a generic build
  if ( cd "$src" && run cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF >/dev/null && run cmake --build build -j "$j" --target whisper-cli >/dev/null 2>&1 ) \
     || ( cd "$src" && rm -rf build && echo "  (retrying a generic build without CPU-specific flags)" && run cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DGGML_NATIVE=OFF >/dev/null && run cmake --build build -j "$j" --target whisper-cli >/dev/null ); then
    cp "$src/build/bin/whisper-cli" "$HOME/.local/bin/whisper-cli" && ok "whisper-cli → ~/.local/bin/whisper-cli"
  else fail "whisper.cpp build"; fi
}

step_system() {
  case "$OS" in
    Darwin) step_brew ;;
    Linux) step_apt ;;
    *) say "System tools"; fail "unsupported system $OS: use macOS, Linux (apt) or Windows through WSL 2" ;;
  esac
}

step_venv() {
  say "Python 3.12 venv (.venv)"
  local UV; UV="$(command -v uv || { [ -x "$HOME/.local/bin/uv" ] && echo "$HOME/.local/bin/uv"; })"
  if [ -n "$UV" ]; then
    # uv fetches Python 3.12 itself when the system has an older one (Debian 12 ships 3.11)
    [ -x .venv/bin/python ] || run "$UV" venv --python 3.12 .venv || { fail "uv venv"; return; }
    run "$UV" pip install --python .venv/bin/python -r requirements.txt && ok "packages from requirements.txt" || fail "uv pip install"
  elif command -v python3.12 >/dev/null; then
    [ -x .venv/bin/python ] || run python3.12 -m venv .venv || { fail "python3.12 -m venv"; return; }
    run .venv/bin/python -m pip install -q -r requirements.txt && ok "packages from requirements.txt" || fail "pip install"
  else
    fail "needs uv or python3.12: bash scripts/setup/install.sh system"
  fi
}

step_skills() {
  say "Claude Code skills (user level, from their public GitHub repos)"
  command -v npx >/dev/null || { fail "npx is missing: bash scripts/setup/install.sh system"; return; }
  run $SKILLS_CLI add heygen-com/hyperframes -g -a claude-code -s hyperframes -s hyperframes-animation -s hyperframes-audio -s hyperframes-cli -s hyperframes-core -s hyperframes-creative -s hyperframes-keyframes -s hyperframes-registry -s hyperframes-studio -s media-use -s product-launch-video -y && ok "HyperFrames skills"   || fail "HyperFrames skills"
  run $SKILLS_CLI add remotion-dev/skills -g -a claude-code -s '*' -y           && ok "Remotion skills"      || fail "Remotion skills"
  run $SKILLS_CLI add Vincentwei1021/video-shotcraft -g -a claude-code -y       && ok "video-shotcraft"      || fail "video-shotcraft"
  run $SKILLS_CLI add diffusionstudio/lottie -g -a claude-code -s text-to-lottie -y && ok "text-to-lottie"   || fail "text-to-lottie"
  run $SKILLS_CLI add https://docs.fish.audio -g -a claude-code -s fish-audio-api -s fish-audio-sdk -y && ok "Fish Audio skills" || fail "Fish Audio skills"
  # The docs say ~/video-shotcraft; point it at the installed skill.
  for d in "$HOME/.agents/skills/video-shotcraft" "$HOME/.claude/skills/video-shotcraft"; do
    if [ -d "$d" ] && [ ! -e "$HOME/video-shotcraft" ]; then ln -s "$d" "$HOME/video-shotcraft" && ok "~/video-shotcraft → $d"; break; fi
  done
}

step_plugins() {
  say "Claude Code plugins"
  [ -n "$CLAUDE_BIN" ] || { fail "the claude command is not on PATH: install Claude Code (https://claude.com/claude-code) or run this step from a Claude Code session"; return; }
  run "$CLAUDE_BIN" plugin marketplace add heygen-com/hyperframes      || true
  run "$CLAUDE_BIN" plugin install hyperframes@hyperframes             && ok "hyperframes (pinned CLI is 0.8.134)" || fail "hyperframes plugin"
  run "$CLAUDE_BIN" plugin install core-skills@hyperframes             && ok "core-skills"  || fail "core-skills plugin"
  run "$CLAUDE_BIN" plugin marketplace add bangtutorial/bang-motion    || true
  run "$CLAUDE_BIN" plugin install bang-motion@bang-motion             && ok "bang-motion (tested with 1.19.0)" || fail "bang-motion plugin"
  run "$CLAUDE_BIN" plugin marketplace add bradautomates/claude-video  || true
  run "$CLAUDE_BIN" plugin install watch@claude-video                  && ok "watch (optional)" || fail "watch plugin (optional)"
  echo "  Plugins load in the next Claude Code session."
}

step_motion_reel() {
  # The Motion Reel Kit is a creator kit: its folder comes from MOTION_REEL_KIT, else engines/motion-reel.
  local kit="${MOTION_REEL_KIT:-$ROOT/engines/motion-reel}"
  say "motion-reel skill (Motion Reel Kit at $kit)"
  [ -f "$kit/install.sh" ] || { echo "  skip  no kit folder (get the Motion Reel Kit from its creator, then MOTION_REEL_KIT=<folder> bash scripts/setup/install.sh motion-reel)"; return; }
  # The kit's installer checks for Python packages with python3; put the workspace venv first so it finds them.
  ( export PATH="$ROOT/.venv/bin:$PATH"; run sh "$kit/install.sh" ) && ok "motion-reel → ~/.claude/skills/motion-reel" || fail "Motion Reel Kit installer"
  # motion-reel projects share the skill's node_modules through a symlink (not shipped: it points into a home folder).
  for p in projects/*/; do
    if [ -f "$p/timeline.json" ] && [ -d "$p/film" ] && [ ! -e "$p/node_modules" ] && [ -d "$HOME/.claude/skills/motion-reel/node_modules" ]; then
      ln -s "$HOME/.claude/skills/motion-reel/node_modules" "$p/node_modules" && ok "linked ${p}node_modules"
    fi
  done
}

step_onetake() {
  say "onetake skill (PolyForm Noncommercial: personal tests only, never own-brand or paid work)"
  local d="$HOME/.claude/skills/onetake"
  if [ -d "$d/.git" ]; then ok "already cloned"; else run git clone https://github.com/feitangyuan/onetake.git "$d" || { fail "git clone onetake"; return; }; fi
  run git -C "$d" checkout -q "$ONETAKE_COMMIT" && ok "pinned at $ONETAKE_COMMIT" || fail "checkout $ONETAKE_COMMIT"
}

step_whisper_model() {
  say "Whisper model large-v3-turbo (1.6 GB)"
  local f="$WHISPER_DIR/ggml-large-v3-turbo.bin"
  if [ -f "$f" ]; then ok "already at $f"; return; fi
  mkdir -p "$WHISPER_DIR"
  run curl -L --fail -o "$f.part" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin \
    && mv "$f.part" "$f" && ok "saved to $f (the path AGENTS-tooling.md uses)" || { rm -f "$f.part"; fail "model download"; }
}

step_app() {
  say "Previs Studio app packages"
  (cd _shared/previs/app && run npm ci --no-audit --no-fund) && ok "npm ci in _shared/previs/app" || fail "npm ci"
}

step_diffusion_mcp() {
  say "Diffusion Studio MCP"
  [ "$OS" = "Darwin" ] || { fail "the Diffusion Studio MCP comes with its desktop app (macOS and Windows); on Linux use the web app at https://app.diffusion.studio"; return; }
  [ -d "/Applications/Diffusion Studio.app" ] || { fail "install the Diffusion Studio app first (https://diffusion.studio)"; return; }
  [ -n "$CLAUDE_BIN" ] || { fail "the claude command is not on PATH"; return; }
  run "$CLAUDE_BIN" mcp add --scope user --transport http diffusion http://127.0.0.1:3274/mcp && ok "diffusion MCP (loads in the next session)" || fail "claude mcp add"
}

[ $# -gt 0 ] || { sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }
for s in "$@"; do
  case "$s" in
    core) step_system; step_venv; step_skills; step_plugins; step_motion_reel ;;
    system) step_system ;; brew) step_brew ;; apt) step_apt ;; venv) step_venv ;; skills) step_skills ;; plugins) step_plugins ;;
    motion-reel) step_motion_reel ;; onetake) step_onetake ;; whisper-model) step_whisper_model ;;
    app) step_app ;; diffusion-mcp) step_diffusion_mcp ;;
    *) echo "unknown step: $s"; FAILED=$((FAILED+1)) ;;
  esac
done
printf '\nINSTALL failed=%d\n' "$FAILED"
[ "$FAILED" -eq 0 ]
