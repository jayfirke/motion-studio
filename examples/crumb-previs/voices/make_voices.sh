#!/bin/bash
# Generates every voice in voices.tsv speaking all 18 lines (free s2.1-pro-free model), then trims and
# levels each take into ../page/audio/vo/<voice>/<scene>-<A|B|C>.mp3 (mono 44.1 kHz, 96 kb/s).
set -u
cd "$(dirname "$0")"
ROOT="$(cd ../../.. && pwd)"   # workspace root (this script cds into its own folder first)
PY=$ROOT/.venv/bin/python
while IFS=$'\t' read -r slug id lang; do
  [ -z "$slug" ] && continue
  mkdir -p "wav/$slug" "../page/audio/vo/$slug"
  if [ ! -f "wav/$slug/l18.wav" ]; then
    $PY $ROOT/_shared/tools/fish_tts.py --lines "lines-$lang.txt" --out-dir "wav/$slug" --voice "$id" > "wav/$slug/log.txt" 2>&1 || echo "FAIL $slug"
  fi
  n=0
  for s in 1 2 3 4 5 6; do for k in A B C; do
    n=$((n+1)); in="wav/$slug/l$n.wav"; out="../page/audio/vo/$slug/s$s-$k.mp3"
    [ -f "$in" ] || { echo "missing $in"; continue; }
    ffmpeg -hide_banner -loglevel error -y -i "$in" -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,loudnorm=I=-20:TP=-2:LRA=7" -ac 1 -ar 44100 -b:a 96k "$out"
  done; done
  echo "done $slug"
done < voices.tsv
