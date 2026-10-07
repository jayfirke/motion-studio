#!/usr/bin/env python3
"""Master a film's audio to −14 LUFS integrated with true peak ≤ −1 dBTP (house rule), video stream copied.

  python3 _shared/tools/master.py in.mp4 out.mp4 [--target -14] [--tp -1]

Measure → gain → true-peak limiter, then measure again and correct the gain until the result is within 0.2 LU
(the limiter takes some loudness back, so one pass usually lands 0.5–1 LU short).
"""
import argparse, re, subprocess
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--target', type=float, default=-14.0); ap.add_argument('--tp', type=float, default=-1.0)
A = ap.parse_args()


def measure(f):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = e[e.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))
    return i, tp


I0, _ = measure(A.src)
gain = A.target - I0
lim = 10 ** ((A.tp - 1.0) / 20)  # ceiling under the true-peak target: the limiter runs 4× oversampled, AAC still adds a little
for k in range(5):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', A.src, '-c:v', 'copy', '-af',
                    f'aresample=192000,volume={gain:.2f}dB,alimiter=limit={lim:.4f}:attack=1:release=60:level=false,aresample=48000',
                    '-c:a', 'aac', '-b:a', '256k', A.dst], check=True)
    I, TP = measure(A.dst)
    print(f'pass {k + 1}: gain {gain:+.2f} dB → {I:.1f} LUFS, true peak {TP:.1f} dBTP')
    if abs(I - A.target) <= 0.2 and TP <= A.tp:
        break
    gain += A.target - I
print(f'{A.dst}: {I:.1f} LUFS integrated, true peak {TP:.1f} dBTP (input {I0:.1f} LUFS)')
