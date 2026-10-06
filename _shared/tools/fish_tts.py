#!/usr/bin/env python3
"""Fish Audio text-to-speech for MotionGraphics projects (stdlib only, any agent can run it).

Defaults: voice "Sarah" (Fish Official, id 933563129e564b19a115bedd57b7406a), model s2.1-pro-free
(free through 2026-11-30, commercial use allowed for businesses under $1M ARR), 44.1 kHz mono WAV (Fish's WAV maximum).

The API key is read from $FISH_API_KEY, else from the macOS Keychain item
"motiongraphics.fish-audio-api-key". It is never printed or written to disk.

  python3 _shared/tools/fish_tts.py "Meet Pulse. [soft] The ring that knows you." --out audio/vo/l1.wav
  python3 _shared/tools/fish_tts.py --lines vo/lines.txt --out-dir audio/vo        # one take per line: l1.wav, l2.wav, ...
  python3 _shared/tools/fish_tts.py --lines vo/lines.txt --out-dir audio/vo --takes 3   # 3 takes per line: l1a.wav, l1b.wav, l1c.wav
  python3 _shared/tools/fish_tts.py --check                                         # key works? prints the package balance

Inline delivery tags work inside the text: [excited] [soft] [whispering] [emphasis] [pause] [long pause] ...
Every call appends a row to <out-dir>/takes.jsonl (text, voice, model, settings, file, UTC time).
"""
import argparse, datetime, json, os, subprocess, sys, urllib.error, urllib.request
from pathlib import Path

API = 'https://api.fish.audio'
SARAH = '933563129e564b19a115bedd57b7406a'
KEYCHAIN_ITEM = 'motiongraphics.fish-audio-api-key'


def api_key():
    # env var → macOS Keychain → Linux secret store → ~/.config/motion-studio/keys.env (see keystore.py)
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from keystore import get_key, where
    key = get_key('FISH_API_KEY', KEYCHAIN_ITEM)
    if not key:
        sys.exit(f'No Fish Audio key: ' + where('FISH_API_KEY', KEYCHAIN_ITEM) + '.')
    return key


def request(path, key, body=None, model=None):
    headers = {'Authorization': f'Bearer {key}'}
    data = None
    if body is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(body).encode()
    if model:
        headers['model'] = model
    req = urllib.request.Request(API + path, data=data, headers=headers, method='POST' if data else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors='replace')[:400]
        sys.exit(f'Fish Audio HTTP {e.code} on {path}: {msg}')


def synth(text, out, key, a):
    body = {'text': text, 'reference_id': a.voice, 'format': 'wav', 'sample_rate': a.sample_rate,
            'latency': 'normal', 'normalize': True, 'temperature': a.temperature, 'top_p': a.top_p,
            'prosody': {'speed': a.speed, 'volume': 0, 'normalize_loudness': True}}
    audio = request('/v1/tts', key, body, a.model)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    row = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'), 'file': str(out),
           'text': text, 'voice': a.voice, 'model': a.model, 'temperature': a.temperature, 'top_p': a.top_p,
           'speed': a.speed, 'sample_rate': a.sample_rate, 'bytes': len(audio)}
    with open(out.parent / 'takes.jsonl', 'a') as f:
        f.write(json.dumps(row, ensure_ascii=False) + '\n')
    print(f'{out}  ({len(audio)} bytes)  "{text[:70]}"')


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('text', nargs='?', help='one line to speak')
    p.add_argument('--lines', type=Path, help='text file, one line per take (blank lines and # comments skipped)')
    p.add_argument('--out', type=Path, help='output WAV for a single text')
    p.add_argument('--out-dir', type=Path, default=Path('audio/vo'))
    p.add_argument('--takes', type=int, default=1, help='takes per line (suffix a, b, c ...)')
    p.add_argument('--voice', default=SARAH, help='Fish voice/model id (default: Sarah, Fish Official)')
    p.add_argument('--model', default='s2.1-pro-free', choices=['s2.1-pro-free', 's2.1-pro', 's2-pro', 's1'])
    p.add_argument('--temperature', type=float, default=0.7)
    p.add_argument('--top-p', type=float, default=0.7)
    p.add_argument('--speed', type=float, default=1.0, help='0.5-2.0; prefer cutting and placing over speeding up')
    p.add_argument('--sample-rate', type=int, default=44100, choices=[8000, 16000, 24000, 32000, 44100], help='WAV max is 44100; engines resample to 48 kHz')
    p.add_argument('--check', action='store_true', help='verify the key and print the package balance')
    a = p.parse_args()
    key = api_key()
    if a.check:
        pkg = json.loads(request('/wallet/self/package', key))
        print(f"key OK · plan {pkg.get('type')} · package balance {pkg.get('balance')}/{pkg.get('total')} credits")
        return
    if a.text:
        synth(a.text, a.out or a.out_dir / 'line.wav', key, a)
        return
    if not a.lines:
        p.error('give a text, --lines FILE, or --check')
    lines = [l.strip() for l in a.lines.read_text().splitlines() if l.strip() and not l.lstrip().startswith('#')]
    for i, line in enumerate(lines, 1):
        for t in range(a.takes):
            suffix = '' if a.takes == 1 else 'abcdefghij'[t]
            synth(line, a.out_dir / f'l{i}{suffix}.wav', key, a)


if __name__ == '__main__':
    main()
