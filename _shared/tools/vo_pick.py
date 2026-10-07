#!/usr/bin/env python3
"""Pick the best Sarah take per line and place it ready for an engine.

  python3 _shared/tools/vo_pick.py --lines vo/lines.txt --raw vo/raw --out public/audio/vo [--wpm 150] [--sr 48000]

For every line n (1-based) it looks for raw takes l<n>a.wav, l<n>b.wav, ... (fish_tts.py --takes), trims leading and
trailing silence, levels each take (loudnorm −20 LUFS), transcribes it with whisper-cli (the owner's local model, word
timings), scores how well the words match the line, and keeps the best match (ties: pace closest to --wpm).
Writes <out>/l<n>.wav and <out>/vo.json: {"l1": {"text", "take", "dur", "wpm", "match", "words": [{"w","a","b"}]}}.
Lines whose best match is under 0.9 are flagged "CHECK" so a person (or I) listens before using them.
"""
import argparse, json, re, subprocess, tempfile
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('--lines', required=True); ap.add_argument('--raw', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--wpm', type=float, default=150); ap.add_argument('--sr', type=int, default=48000)
A = ap.parse_args()
MODEL = Path(__import__('os').environ.get('WHISPER_MODEL') or Path.home() / 'Library/Application Support/ru.starmel.OpenSuperWhisper/whisper-models/ggml-large-v3-turbo.bin')   # Linux/WSL 2: set WHISPER_MODEL
TRIM = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,'
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,loudnorm=I=-20:TP=-2:LRA=7')
norm = lambda s: re.sub(r'[^a-z0-9 ]', '', re.sub(r'\[[^\]]*\]', '', s.lower()).replace('-', ' ')).split()
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
dur = lambda f: float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)).stdout.strip())


def words(wav):
    tmp = Path(tempfile.mkdtemp()); w16 = tmp / 'w16.wav'
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-ar', '16000', '-ac', '1', str(w16))
    run('whisper-cli', '-m', str(MODEL), '-f', str(w16), '-ojf', '-of', str(tmp / 'w'), '-l', 'en', '-np')
    out, cur = [], None
    for seg in json.loads((tmp / 'w.json').read_text()).get('transcription', []):
        for tk in seg.get('tokens', []):
            t = tk.get('text', '')
            if t.startswith('[_') or not t.strip():
                continue
            a, b = tk['offsets']['from'] / 1000, tk['offsets']['to'] / 1000
            if t.startswith(' ') or cur is None:
                cur = {'w': t.strip(), 'a': a, 'b': b}; out.append(cur)
            else:
                cur['w'] += t; cur['b'] = b
    return out


def match(text, ws):
    a, b = norm(text), norm(' '.join(w['w'] for w in ws))
    if not a:
        return 0
    hit, j = 0, 0
    for x in a:                      # in-order matches, tolerant of whisper splitting/merging words
        for k in range(j, min(len(b), j + 4)):
            if b[k] == x or (len(x) > 3 and (b[k].startswith(x[:4]) or x.startswith(b[k][:4]))):
                hit += 1; j = k + 1; break
    return hit / len(a)


lines = [l.strip() for l in Path(A.lines).read_text().splitlines() if l.strip() and not l.startswith('#')]
out = Path(A.out); out.mkdir(parents=True, exist_ok=True)
res = {}
for n, text in enumerate(lines, 1):
    best = None
    for raw in sorted(Path(A.raw).glob(f'l{n}[a-z].wav')):
        trimmed = Path(tempfile.mkdtemp()) / raw.name
        run('ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw), '-af', TRIM, '-ar', str(A.sr), '-ac', '1', str(trimmed))
        ws = words(trimmed); d = dur(trimmed); m = match(text, ws)
        wpm = len(norm(text)) / d * 60
        key = (round(m, 2), -abs(wpm - A.wpm))
        if best is None or key > best[0]:
            best = (key, raw.stem[-1], trimmed, ws, d, m, wpm)
    if best is None:
        print(f'l{n}: no takes'); continue
    _, take, trimmed, ws, d, m, wpm = best
    subprocess.run(['cp', str(trimmed), str(out / f'l{n}.wav')])
    res[f'l{n}'] = {'text': text, 'take': take, 'dur': round(d, 3), 'wpm': round(wpm, 1), 'match': round(m, 2),
                    'words': [{'w': w['w'], 'a': round(w['a'], 3), 'b': round(w['b'], 3)} for w in ws]}
    print(f'l{n} take {take} {d:5.2f}s {wpm:5.1f} wpm match {m:.2f}{"   <-- CHECK" if m < 0.9 else ""}  | ' + ' '.join(w['w'] for w in ws))
(out / 'vo.json').write_text(json.dumps(res, indent=1))
