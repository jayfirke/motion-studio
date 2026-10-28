#!/usr/bin/env python3
"""Find 1–2 frame flashes: short runs of frames whose count of bright pixels jumps above both neighbours.

python3 flash_scan.py <video> [--from S] [--to S] [--region x0 y0 x1 y1] [--threshold 230] [--ratio 1.4] [--width 2] [--min 40]

A glossy face sweeping past a hard light, a mirror-like trim or an iridescent lens shows up as a run of up to
--width frames whose bright-pixel count is more than --ratio times the frames just before and after it. Region is in
frame fractions (default: whole frame); put it on the device, because a bright screen elsewhere hides a small flash.
Frames with fewer than --min bright pixels are ignored (noise). Exit code 1 if anything is flagged.
Needs ffmpeg/ffprobe and numpy.
"""
import argparse, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("video")
ap.add_argument("--from", dest="t0", type=float, default=0.0)
ap.add_argument("--to", dest="t1", type=float, default=None)
ap.add_argument("--region", type=float, nargs=4, default=[0, 0, 1, 1], metavar=("X0", "Y0", "X1", "Y1"))
ap.add_argument("--threshold", type=int, default=230, help="bright pixel level, 0-255 (default 230)")
ap.add_argument("--ratio", type=float, default=1.4, help="flag a run above this many times both neighbours (default 1.4)")
ap.add_argument("--width", type=int, default=2, help="longest run of frames that still counts as a flash (default 2)")
ap.add_argument("--min", dest="min_px", type=int, default=40, help="ignore frames with fewer bright pixels (default 40)")
a = ap.parse_args()

probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                        "-of", "csv=p=0", a.video], capture_output=True, text=True, check=True).stdout.strip().split(",")
W, H = int(probe[0]), int(probe[1])
num, den = probe[2].split("/")
fps = float(num) / float(den or 1)
cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{a.t0}", "-i", a.video]
if a.t1 is not None:
    cmd += ["-t", f"{a.t1 - a.t0}"]
r = subprocess.run(cmd + ["-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True)
F = np.frombuffer(r.stdout, np.uint8).reshape(-1, H, W)
x0, y0, x1, y1 = a.region
roi = F[:, int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)]
n = (roi > a.threshold).reshape(len(roi), -1).sum(1).astype(float)

flags, taken = [], set()
for w in range(1, max(1, a.width) + 1):         # shortest runs first; a frame belongs to one flash only
    for i in range(1, len(n) - w):
        run = n[i:i + w]
        if taken & set(range(i, i + w)) or run.min() < a.min_px:
            continue
        if run.min() > a.ratio * n[i - 1] and run.min() > a.ratio * n[i + w]:
            flags.append((i, w)); taken |= set(range(i, i + w))
print(f"frames {len(n)} ({a.t0:.3f}s on, {fps:g} fps), bright > {a.threshold}: min {int(n.min())} median {int(np.median(n))} max {int(n.max())}")
if not flags:
    print(f"no flashes of 1-{a.width} frames (no run > {a.ratio}x both neighbours)")
    sys.exit(0)
print(f"{len(flags)} flash(es):")
for i, w in sorted(flags):
    seq = " -> ".join(str(int(v)) for v in n[i - 1:i + w + 1])
    print(f"  t {a.t0 + i / fps:.3f}s  frame {i}, {w} frame(s): {seq}")
sys.exit(1)
