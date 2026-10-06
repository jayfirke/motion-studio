"""Measure and cut CC0 beds into 24 s previs excerpts that start on a beat.

usage: python music_lib.py <out_dir> <file.ogg> [...]   → prints one JSON object per bed (fsid, bpm, score, start, dur)
Tempo: comb fit over 55-160 BPM on an onset envelope (full band and < 150 Hz), 40 phases per period; the best
mean onset strength wins (see AGENTS-tooling.md, "Previs"). The excerpt starts on the beat that opens the
loudest 24 s stretch in the first two thirds of the file, then gets loudnorm -18 LUFS and a 1.5 s fade.
"""
import json, re, subprocess, sys
import numpy as np, librosa

def comb(env, sr, hop, lo=55, hi=160):
    best = (0, 0, 0)
    fps = sr / hop
    for bpm in np.arange(lo, hi + 0.01, 0.25):
        per = fps * 60 / bpm
        for ph in np.linspace(0, per, 40, endpoint=False):
            idx = np.round(np.arange(ph, len(env) - 1, per)).astype(int)
            s = env[idx].mean()
            if s > best[0]: best = (s, bpm, ph / fps)
    return best

out = sys.argv[1]
for f in sys.argv[2:]:
    y, sr = librosa.load(f, sr=22050, mono=True)
    hop = 128
    full = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    low = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, fmax=150, n_mels=32)
    cands = []
    for name, env in (('full', full), ('low', low)):
        env = env / (env.mean() + 1e-9)
        s, bpm, ph = comb(env, sr, hop)
        cands.append((s, bpm, ph, name))
    s, bpm, ph, band = max(cands)
    dur = len(y) / sr
    per = 60 / bpm
    rms = librosa.feature.rms(y=y, hop_length=512)[0]; fr = sr / 512
    best_t, best_e = ph, -1
    t = ph
    while t + 24 <= dur and t <= max(ph, dur * 0.66):
        e = rms[int(t * fr):int((t + 24) * fr)].mean()
        if e > best_e * 1.04: best_t, best_e = t, e   # prefer earlier unless clearly louder
        t += per * 4
    start = round(best_t, 3)
    fsid = re.search(r'fs(\d+)', f).group(1)
    length = min(24.0, dur - start)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(start), '-t', str(length), '-i', f,
                    '-af', f'loudnorm=I=-18:TP=-2,afade=t=out:st={length - 1.5:.2f}:d=1.5', '-ar', '44100', '-b:a', '128k',
                    f'{out}/{fsid}.mp3'], check=True)
    print(json.dumps({'fsid': fsid, 'bpm': round(float(bpm), 2), 'score': round(float(s), 2), 'band': band, 'start': start, 'dur': round(length, 2), 'src_dur': round(dur, 1)}))
