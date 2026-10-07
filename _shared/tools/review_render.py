#!/usr/bin/env python3
"""Self-review kit for a rendered film: what I look at and measure before anyone sees it.

  .venv/bin/python _shared/tools/review_render.py renders/draft.mp4 --out review/draft [--cuts 5.0,7.8,...] [--script vo/lines.txt]

Writes into --out:
  sheet.jpg        contact sheet, 2 frames a second, time-stamped (look at every shot)
  strip_<t>.jpg    12 frames around each planned cut (look for jumps, blank or doubled frames)
  phone.jpg        one frame every 2 s at 360 px wide (is the text readable on a phone?)
  report.json      numbers: duration, fps, frozen runs (identical frames ≥ 4), unexpected jumps (big
                   frame changes away from planned cuts), loudness (integrated LUFS, true peak), the
                   whisper transcript of the final mix with word times, and how well it matches the script
  report.txt       the same, short and readable
"""
import argparse, json, re, subprocess, tempfile
from pathlib import Path
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--out', required=True)
ap.add_argument('--cuts', default=''); ap.add_argument('--script', default='')
ap.add_argument('--no-whisper', action='store_true')
A = ap.parse_args()
V, OUT = Path(A.video), Path(A.out); OUT.mkdir(parents=True, exist_ok=True)
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
MODEL = Path(__import__('os').environ.get('WHISPER_MODEL') or Path.home() / 'Library/Application Support/ru.starmel.OpenSuperWhisper/whisper-models/ggml-large-v3-turbo.bin')   # Linux/WSL 2: set WHISPER_MODEL

info = json.loads(run('ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,nb_frames:format=duration', '-of', 'json', str(V)).stdout)
st = info['streams'][0]; W, H = st['width'], st['height']
num, den = map(int, st['r_frame_rate'].split('/')); FPS = num / den
DUR = float(info['format']['duration'])
cuts = [float(c) for c in A.cuts.split(',') if c.strip()]
tf = lambda t: f'{int(t // 60)}:{t % 60:05.2f}'

# --- pictures
cols = 6 if W >= H else 10
run('ffmpeg', '-y', '-loglevel', 'error', '-i', str(V), '-vf', f"fps=2,scale={480 if W >= H else 216}:-2,drawtext=fontfile=/System/Library/Fonts/Menlo.ttc:text='%{{pts\\:hms}}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile={cols}x{int(np.ceil(DUR * 2 / cols))}", '-frames:v', '1', str(OUT / 'sheet.jpg'))
if not (OUT / 'sheet.jpg').exists():  # this ffmpeg has no drawtext: plain sheet
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', str(V), '-vf', f"fps=2,scale={480 if W >= H else 216}:-2,tile={cols}x{int(np.ceil(DUR * 2 / cols))}", '-frames:v', '1', str(OUT / 'sheet.jpg'))
for c in cuts:
    t0 = max(0, c - 6 / FPS)
    run('ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t0:.3f}', '-i', str(V), '-frames:v', '12', '-vf', f"scale={400 if W >= H else 180}:-2,tile=6x2", str(OUT / f'strip_{c:06.2f}.jpg'))
run('ffmpeg', '-y', '-loglevel', 'error', '-i', str(V), '-vf', f"fps=0.5,scale=360:-2,tile={8 if W >= H else 10}x{int(np.ceil(DUR / 2 / (8 if W >= H else 10)))}", '-frames:v', '1', str(OUT / 'phone.jpg'))

# --- motion scan: frame-to-frame change on a small grey copy
w = 160; h = int(round(H * w / W / 2) * 2)
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(V), '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))  # d[i] = change from frame i to i+1
frozen, run_start = [], None
for i, v in enumerate(d):
    if v < 0.05:
        run_start = i if run_start is None else run_start
    else:
        if run_start is not None and i - run_start >= 4:
            frozen.append([round(run_start / FPS, 2), round(i / FPS, 2), i - run_start])
        run_start = None
if run_start is not None and len(d) - run_start >= 4:
    frozen.append([round(run_start / FPS, 2), round(len(d) / FPS, 2), len(d) - run_start])
med = float(np.median(d)) if len(d) else 0
thr = max(12.0, med * 8)
jumps = [[round((i + 1) / FPS, 2), round(float(v), 1)] for i, v in enumerate(d) if v > thr]
unexpected = [j for j in jumps if not any(abs(j[0] - c) <= 2 / FPS + 1e-6 for c in cuts)]

# --- sound
eb = run('ffmpeg', '-hide_banner', '-i', str(V), '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
I = re.findall(r'I:\s+(-?[\d.]+) LUFS', eb); TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', eb)
words, match = [], None
if not A.no_whisper:
    tmp = Path(tempfile.mkdtemp())
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', str(V), '-ar', '16000', '-ac', '1', str(tmp / 'a.wav'))
    run('whisper-cli', '-m', str(MODEL), '-f', str(tmp / 'a.wav'), '-ojf', '-of', str(tmp / 'w'), '-l', 'en', '-np')
    try:
        cur = None
        for seg in json.loads((tmp / 'w.json').read_text()).get('transcription', []):
            for tk in seg.get('tokens', []):
                t = tk.get('text', '')
                if t.startswith('[_') or not t.strip():
                    continue
                a = tk['offsets']['from'] / 1000
                if t.startswith(' ') or cur is None:
                    cur = {'w': t.strip(), 't': round(a, 2)}; words.append(cur)
                else:
                    cur['w'] += t
    except Exception as e:  # noqa
        words = [{'w': f'(whisper failed: {e})', 't': 0}]
    if A.script:
        norm = lambda s: re.sub(r'[^a-z0-9 ]', '', s.lower().replace('-', ' ')).split()
        ref = norm(' '.join(l for l in Path(A.script).read_text().splitlines() if l.strip() and not l.startswith('#')))
        hyp = norm(' '.join(x['w'] for x in words))
        j, hit, missing = 0, 0, []
        for x in ref:
            for k in range(j, min(len(hyp), j + 5)):
                if hyp[k] == x or (len(x) > 3 and (hyp[k].startswith(x[:4]) or x.startswith(hyp[k][:4]))):
                    hit += 1; j = k + 1; break
            else:
                missing.append(x)
        match = {'score': round(hit / max(1, len(ref)), 3), 'missing_or_misheard': missing}

rep = {'video': str(V), 'size': [W, H], 'fps': round(FPS, 3), 'duration': round(DUR, 3),
       'frozen_runs_s': frozen, 'jumps': jumps, 'unexpected_jumps': unexpected, 'median_change': round(med, 3),
       'loudness_lufs': float(I[-1]) if I else None, 'true_peak_dbtp': float(TP[-1]) if TP else None,
       'script_match': match, 'transcript': words}
(OUT / 'report.json').write_text(json.dumps(rep, indent=1))
lines = [f'{V.name}: {W}x{H} @ {FPS:.2f} fps, {DUR:.2f} s',
         f'loudness {rep["loudness_lufs"]} LUFS, true peak {rep["true_peak_dbtp"]} dBTP',
         f'frozen runs (≥4 identical frames): ' + (', '.join(f'{tf(a)}–{tf(b)} ({n} f)' for a, b, n in frozen) or 'none'),
         f'big frame changes: ' + (', '.join(f'{tf(t)} ({v})' for t, v in jumps) or 'none'),
         f'unexpected (not at a planned cut): ' + (', '.join(f'{tf(t)} ({v})' for t, v in unexpected) or 'none')]
if match:
    lines.append(f'script match {match["score"]:.0%}; missing/misheard: {" ".join(match["missing_or_misheard"]) or "none"}')
lines.append('transcript: ' + ' '.join(f'{x["w"]}' for x in words))
(OUT / 'report.txt').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
