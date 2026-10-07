#!/usr/bin/env python3
"""Measure where sharp sounds actually land against the frames that should cause them.

  .venv/bin/python _shared/tools/sfx_sync.py film.mp4 --at 2.033,8.6,... [--fps 30] [--win 0.12]

For each expected time (the frame the button reacts, in seconds) it finds the strongest onset within ±win and
prints the offset in milliseconds (+ = sound late). House target: within ±40 ms (about one frame).
"""
import argparse, subprocess, tempfile
import numpy as np, librosa
ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--at', required=True)
ap.add_argument('--win', type=float, default=0.12)
A = ap.parse_args()
tmp = tempfile.mktemp(suffix='.wav')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', A.film, '-ac', '1', '-ar', '48000', tmp], check=True)
y, sr = librosa.load(tmp, sr=48000)
hop = 96  # 2 ms
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
times = librosa.frames_to_time(np.arange(len(env)), sr=sr, hop_length=hop)
worst = 0
for t in [float(x) for x in A.at.split(',') if x.strip()]:
    m = (times >= t - A.win) & (times <= t + A.win)
    i = np.argmax(np.where(m, env, -1))
    off = (times[i] - t) * 1000
    worst = max(worst, abs(off))
    print(f'expected {t:7.3f} s → onset {times[i]:7.3f} s ({off:+5.0f} ms, strength {env[i]:.1f})')
print(f'worst offset {worst:.0f} ms')
