#!/bin/bash
# Builds a zip of this workspace to hand to another person. It contains exactly the files git would track
# (.gitignore decides), and only after check_share.py finds no keys, no forbidden files and no Mixkit audio.
#
#   bash scripts/share/make-share-zip.sh                 # → ~/Desktop/MotionGraphics-share-<date>.zip
#   bash scripts/share/make-share-zip.sh --out <file.zip>
#
# The receiver unzips it to ~/Documents/MotionGraphics and opens that folder in Claude Code; the setup
# starts by itself (SETUP.md).
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NAME="$(basename "$ROOT")"
OUT="$HOME/Desktop/MotionGraphics-share-$(date +%Y-%m-%d).zip"
[ "${1:-}" = "--out" ] && OUT="$2"
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac
LIST="$(mktemp -t share-list)"
trap 'rm -f "$LIST"' EXIT

cd "$ROOT"
echo "Checking what would be shared…"
python3 scripts/share/check_share.py --list-out "$LIST" || { echo; echo "Not packed. Fix the items above, then run this again."; exit 1; }

[ -e "$OUT" ] && { echo "Not packed: $OUT already exists. Move it away or pass --out <file.zip>."; exit 1; }
echo
echo "Packing into $OUT …"
cd "$ROOT/.."
# -y keeps the workspace's relative symlinks (.claude/skills → ../.agents/skills) as links.
tr '\0' '\n' < "$LIST" | sed "s#^#$NAME/#" | zip -q -X -y -@ "$OUT"
n=$(unzip -Z1 "$OUT" | wc -l | tr -d ' ')
size=$(du -h "$OUT" | cut -f1)
sha=$(shasum -a 256 "$OUT" | cut -d' ' -f1)
cat <<EOF

Done: $OUT
  $n files, $size, SHA-256 $sha

Send it by AirDrop, Google Drive or a USB stick (it is too big for most email).
Tell the receiver: unzip it into ~/Documents (so it becomes ~/Documents/$NAME), open that folder in
Claude Code and say "set up this workspace". Setup asks for their own API keys; yours are not inside.
EOF
