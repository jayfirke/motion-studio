#!/usr/bin/env python3
"""Turn a noisy pose track (measured from a reference, or hand-keyed) into smooth curves sampled at the render fps.

python3 fit_track.py track.csv [--fps 60] [--noise rx=0.4,y=0.004] [--pchip scale] [--key-step 0.25] [--from S] [--to S] [--out smooth.csv]

Input: a CSV with a header row `t,<channel>,...`, or a JSON list of rows [[t, a, b, ...], ...] (channels c1, c2, ...).
Each channel gets a smoothing spline whose residual RMS equals the measurement noise: GCV would fit the noise and keep
the shake. The noise is given per channel with --noise, or estimated from the second differences of the samples
(robust MAD; fine for evenly spaced samples). Channels named in --pchip must not overshoot or reverse (a size that
shrinks, a rise that settles): they get a monotone cubic (PCHIP) through the means of --key-step windows.
Prints, per channel, the noise used, the RMS against the samples (should be about the noise) and the frame-to-frame
jitter (max |second difference|) before and after. Writes CSV or JSON (by --out's extension); prints CSV without --out.
Needs numpy and scipy.
"""
import argparse, csv, json, sys
import numpy as np
from scipy.interpolate import PchipInterpolator, make_smoothing_spline

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("track")
ap.add_argument("--fps", type=float, default=60.0)
ap.add_argument("--noise", default="", help="per-channel noise RMS, e.g. rx=0.4,y=0.004")
ap.add_argument("--pchip", default="", help="comma-separated monotone channels")
ap.add_argument("--key-step", type=float, default=0.25, help="window (s) for the PCHIP key means (default 0.25)")
ap.add_argument("--from", dest="t0", type=float, default=None)
ap.add_argument("--to", dest="t1", type=float, default=None)
ap.add_argument("--out", default=None)
a = ap.parse_args()

# ---------------------------------------------------------------- read
if a.track.endswith(".json"):
    rows = json.load(open(a.track))
    names = [f"c{i}" for i in range(1, len(rows[0]))]
else:
    with open(a.track, newline="") as f:
        r = list(csv.reader(f))
    names, rows = r[0][1:], [[float(x) for x in row] for row in r[1:] if row]
D = np.array(rows, float)
D = D[np.argsort(D[:, 0])]
_, keep = np.unique(D[:, 0], return_index=True)
D = D[keep]
t = D[:, 0]
noise_in = dict((k, float(v)) for k, v in (p.split("=") for p in a.noise.split(",") if p))
mono = {c for c in a.pchip.split(",") if c}
for c in list(noise_in) + list(mono):
    if c not in names:
        sys.exit(f"fit_track: unknown channel {c!r}; channels are {names}")


def est_noise(v):
    """white noise of RMS s gives second differences of RMS s*sqrt(6). Trimmed RMS, not MAD: measured tracks are often
    rounded (0.1 deg steps), most second differences are then exactly 0 and a median-based estimate collapses to 0.
    The top 10 % are dropped as real accelerations; the rounding step itself sets a floor (step / sqrt(12))."""
    if len(v) < 5:
        return 0.0
    a = np.sort(np.abs(np.diff(v, 2)))
    s = float(np.sqrt(np.mean(a[:max(1, int(len(a) * 0.9))] ** 2)) / np.sqrt(6))
    steps = np.abs(np.diff(v))
    q = steps[steps > 1e-12].min() if (steps > 1e-12).any() else 0.0
    return max(s, float(q) / np.sqrt(12))


def flips(x, h):
    """direction reversals bigger than h (zigzag count): each one reads as a back-and-forth twitch"""
    if h <= 0 or len(x) < 3:
        return 0
    n, d, ext = 0, 0, x[0]          # d: current direction (+1 up, -1 down, 0 not yet known); ext: extreme since the last turn
    for v in x[1:]:
        if d == 0:
            if abs(v - ext) > h:
                d, ext = (1 if v > ext else -1), v
        elif (v - ext) * d > 0:
            ext = v
        elif abs(v - ext) > h:
            n, d, ext = n + 1, -d, v
    return n


def rms(x, y):
    return float(np.sqrt(np.mean((np.asarray(x) - np.asarray(y)) ** 2)))


def spline(v, noise):
    """the smoothest spline whose residual RMS stays within the noise (bisection on log10 lambda)"""
    if noise <= 0:
        return make_smoothing_spline(t, v, lam=1e-12)
    lo, hi = -12.0, 6.0
    best = make_smoothing_spline(t, v, lam=10 ** lo)
    for _ in range(48):
        mid = (lo + hi) / 2
        sp = make_smoothing_spline(t, v, lam=10 ** mid)
        if rms(sp(t), v) <= noise:
            best, lo = sp, mid
        else:
            hi = mid
    return best


def pchip(v):
    """monotone cubic through window means; the end keys come from a line fitted to the end window, so a trend is not
    pulled in by averaging. With fewer than 5 samples it goes through the samples themselves."""
    if len(t) < 5:
        return PchipInterpolator(t, v)
    edges = np.arange(t[0], t[-1] + a.key_step, a.key_step)
    wins = [(t >= e0) & ((t < e1) if i < len(edges) - 2 else (t <= e1)) for i, (e0, e1) in enumerate(zip(edges[:-1], edges[1:]))]
    wins = [m for m in wins if m.any()]
    kt, kv = [float(t[m].mean()) for m in wins], [float(v[m].mean()) for m in wins]

    def end(m, at):
        if m.sum() < 2:
            return float(v[m][0])
        k, c = np.polyfit(t[m], v[m], 1)
        return float(k * at + c)
    kt = [float(t[0])] + kt + [float(t[-1])]
    kv = [end(wins[0], t[0])] + kv + [end(wins[-1], t[-1])]
    kt, idx = np.unique(kt, return_index=True)
    return PchipInterpolator(kt, monotone(np.asarray(kv)[idx]))


def monotone(y):
    """pool adjacent violators: the closest sequence that never reverses (in the direction of the overall change);
    noisy window means can step back by a hair, and PCHIP only stays monotone if its keys are"""
    s = 1.0 if y[-1] >= y[0] else -1.0
    blocks = []                              # [mean, count]
    for v in s * y:
        blocks.append([v, 1])
        while len(blocks) > 1 and blocks[-2][0] > blocks[-1][0]:
            (m1, c1), (m2, c2) = blocks[-2], blocks.pop()
            blocks[-1] = [(m1 * c1 + m2 * c2) / (c1 + c2), c1 + c2]
    return s * np.concatenate([[m] * c for m, c in blocks])


# ---------------------------------------------------------------- fit and sample
t0 = t[0] if a.t0 is None else a.t0
t1 = t[-1] if a.t1 is None else a.t1
T = np.round(np.arange(t0, t1 + 0.5 / a.fps, 1 / a.fps), 6)
Tc = np.clip(T, t[0], t[-1])
cols, report = [], []
for j, name in enumerate(names):
    v = D[:, j + 1]
    nz = noise_in.get(name, est_noise(v))
    f = pchip(v) if name in mono or len(t) < 5 else spline(v, nz)   # a spline needs 5 samples
    s = f(Tc)
    cols.append(s)
    report.append((name, "pchip" if name in mono or len(t) < 5 else "spline", nz, rms(f(t), v), flips(v, nz), flips(s, nz)))

print(f"{len(t)} samples {t[0]:.3f}-{t[-1]:.3f}s -> {len(T)} frames at {a.fps:g} fps", file=sys.stderr)
print(f"{'channel':>10} {'kind':>6} {'noise':>10} {'rms vs samples':>15} {'reversals > noise: raw':>23} {'smooth':>7}", file=sys.stderr)
for name, kind, nz, r, f0, f1 in report:
    print(f"{name:>10} {kind:>6} {nz:10.5g} {r:15.5g} {f0:23d} {f1:7d}", file=sys.stderr)
print("Reversals left in a channel should be real moves (a settle, a sway). If a channel must not reverse, use --pchip.", file=sys.stderr)

out_rows = [[float(T[i])] + [round(float(c[i]), 6) for c in cols] for i in range(len(T))]
if a.out and a.out.endswith(".json"):
    json.dump(out_rows, open(a.out, "w"))
else:
    fh = open(a.out, "w", newline="") if a.out else sys.stdout
    w = csv.writer(fh)
    w.writerow(["t"] + names)
    w.writerows(out_rows)
