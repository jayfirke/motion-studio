"""Per-frame motion of a region by phase correlation: catches judder (stalls, jitter, direction flips) and flicker.

python3 smoothness.py <video> <t0> <t1> <x0> <y0> <x1> <y1>   (region as frame fractions, e.g. 0.3 0.1 0.7 0.9)

Run it on a device-only render (background off). A hold should read ~0.00 px/frame; a drift should change speed
smoothly with 0 direction flips and a max |Δspeed| well under 1 px. Needs ffmpeg/ffprobe and numpy.
"""
import subprocess, sys
import numpy as np

if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
    print(__doc__); sys.exit(0)
if len(sys.argv) != 8:
    sys.exit(__doc__)
src, t0, t1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
x0, y0, x1, y1 = map(float, sys.argv[4:8])
r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{t0}", "-i", src, "-t", f"{t1 - t0}",
                    "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True)
probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", src],
                       capture_output=True, text=True).stdout.strip().split(",")
W, H = int(probe[0]), int(probe[1])
F = np.frombuffer(r.stdout, np.uint8).reshape(-1, H, W).astype(np.float32)
roi = F[:, int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)]
win = np.outer(np.hanning(roi.shape[1]), np.hanning(roi.shape[2]))
def shift(a, b):
    A, B = np.fft.fft2((a - a.mean()) * win), np.fft.fft2((b - b.mean()) * win)
    R = A * np.conj(B); R /= np.abs(R) + 1e-9
    c = np.fft.ifft2(R).real; iy, ix = np.unravel_index(np.argmax(c), c.shape)
    # sub-pixel by parabola
    def sub(c, i, n, axis):
        im, ip = (i - 1) % n, (i + 1) % n
        v = [c[im, ix], c[i, ix], c[ip, ix]] if axis == 0 else [c[iy, im], c[iy, i], c[iy, ip]]
        d = (v[0] - v[2]) / (2 * (v[0] - 2 * v[1] + v[2]) + 1e-9)
        return (i + d + n / 2) % n - n / 2
    return sub(c, iy, c.shape[0], 0), sub(c, ix, c.shape[1], 1)
d = np.array([shift(roi[i + 1], roi[i]) for i in range(len(roi) - 1)])
diff = np.array([np.abs(roi[i + 1] - roi[i]).mean() for i in range(len(roi) - 1)])
sp = np.hypot(d[:, 0], d[:, 1])
acc = np.abs(np.diff(sp))
print(f"frames {len(roi)}  speed px/frame: min {sp.min():.2f} median {np.median(sp):.2f} max {sp.max():.2f}")
print(f"  stalls (speed < 0.15 while median > 0.5): {int(((sp < 0.15) & (np.median(sp) > 0.5)).sum())}")
print(f"  jitter: median |Δspeed| {np.median(acc):.3f} px, max {acc.max():.3f} px")
def flips(v, moving=0.05):
    """sign changes between frames that both move at least `moving` px (a near-still hold reads ±0.01 px of noise)"""
    s = np.sign(v) * (np.abs(v) >= moving)
    return int(sum(1 for a, b in zip(s[:-1], s[1:]) if a and b and a != b))
print(f"  direction flips while moving (|d| >= 0.05 px) in y: {flips(d[:, 0])}, in x: {flips(d[:, 1])}")
big = np.where(acc > 0.5)[0]
if len(big):
    fps = len(roi) / (t1 - t0)
    for i in big[:12]:
        print(f"  speed jump {sp[i]:.2f} -> {sp[i + 1]:.2f} px at t {t0 + (i + 2) / fps:.3f} s; frame diff {diff[i]:.2f} -> {diff[i + 1]:.2f}"
              f"{'  (diff smooth: likely a rotation fooling phase correlation; step through the frames)' if abs(diff[i + 1] - diff[i]) < 0.1 * max(diff[i], 1e-6) else '  (diff jumps too: a real hitch)'}")
print(f"  mean abs frame diff: min {diff.min():.2f} max {diff.max():.2f}")
print("  dy:", " ".join(f"{v:+.2f}" for v in d[:24, 0]))
