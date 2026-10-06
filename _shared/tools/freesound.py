#!/usr/bin/env python3
"""Freesound search + download for MotionGraphics (stdlib only; ffmpeg optional for WAV conversion).

Licence gate: CC0 only by default. --allow-cc-by also accepts CC-BY 4.0 (then the project's ASSETS-USED.md
and the post caption must carry the credit printed here). CC-BY-NC and Sampling+ are always refused.

The API key is read from $FREESOUND_API_KEY, else from the macOS Keychain item
"motiongraphics.freesound-api-key". It is never printed or written to disk.
Token auth gives search + high-quality previews (HQ OGG ~192 kbps / MP3 ~128 kbps), which is what this
script downloads. Original-file download needs OAuth2 (a browser sign-in by the owner): ask first.
API limits: about 60 requests/minute and 2000/day. Search once, then download only what you will use.

  python3 _shared/tools/freesound.py search "mouse click" --max-dur 0.6 -n 15
  python3 _shared/tools/freesound.py search "keyboard typing" --sort downloads_desc --min-rating 4
  python3 _shared/tools/freesound.py get 448086 253168 --dir _shared/sfx/freesound/ui --wav
  python3 _shared/tools/freesound.py check

Every download writes <file>.json (id, name, author, licence, url, query) next to the audio and appends a row
to _shared/sfx/freesound/SOURCES.tsv, so the licence ledger can be audited later (motion-asset-check).
"""
import argparse, json, os, shutil, subprocess, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path

API = 'https://freesound.org/apiv2'
KEYCHAIN_ITEM = 'motiongraphics.freesound-api-key'
ROOT = Path(__file__).resolve().parents[2]            # this workspace
SOURCES = ROOT / '_shared/sfx/freesound/SOURCES.tsv'
CC0 = 'creativecommons.org/publicdomain/zero/1.0'
CCBY = 'creativecommons.org/licenses/by/4.0'
FIELDS = 'id,name,username,license,duration,avg_rating,num_ratings,num_downloads,tags,url,previews,samplerate'


def api_key():
    key = os.environ.get('FREESOUND_API_KEY', '').strip()
    if not key:
        try:
            key = subprocess.run(['security', 'find-generic-password', '-s', KEYCHAIN_ITEM, '-w'],
                                 capture_output=True, text=True, check=True).stdout.strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            sys.exit(f'No Freesound key: set FREESOUND_API_KEY or add Keychain item "{KEYCHAIN_ITEM}".')
    return key


def get_json(path, params, key):
    params = dict(params, token=key)
    url = f'{API}{path}?{urllib.parse.urlencode(params)}'
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'motiongraphics/1'}), timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'Freesound HTTP {e.code} on {path}: {e.read().decode(errors="replace")[:300]}')


def licence_ok(lic, allow_by):
    return CC0 in lic or (allow_by and CCBY in lic)


def short_lic(lic):
    return 'CC0' if CC0 in lic else 'CC-BY-4.0' if CCBY in lic else 'CC-BY-NC' if '/by-nc' in lic else lic


def search(a, key):
    filt = ['license:"Creative Commons 0"'] if not a.allow_cc_by else ['license:("Creative Commons 0" OR "Attribution")']
    if a.max_dur or a.min_dur:
        filt.append(f'duration:[{a.min_dur or 0} TO {a.max_dur or "*"}]')
    if a.min_rating:
        filt.append(f'avg_rating:[{a.min_rating} TO *]')
    d = get_json('/search/text/', {'query': a.query, 'filter': ' '.join(filt), 'fields': FIELDS,
                                   'page_size': a.n, 'sort': a.sort}, key)
    print(f"{d.get('count', 0)} matches for \"{a.query}\" ({a.sort}); showing {len(d.get('results', []))}")
    print('id\tlicence\tdur_s\trating(n)\tdownloads\tname · author')
    for r in d.get('results', []):
        if not licence_ok(r['license'], a.allow_cc_by):
            continue
        print(f"{r['id']}\t{short_lic(r['license'])}\t{r['duration']:.2f}\t{r.get('avg_rating', 0):.1f}({r.get('num_ratings', 0)})"
              f"\t{r.get('num_downloads', 0)}\t{r['name']} · {r['username']}")


def download(a, key):
    out_dir = Path(a.dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    SOURCES.parent.mkdir(parents=True, exist_ok=True)
    if not SOURCES.exists():
        SOURCES.write_text('file\tfreesound_id\tname\tauthor\tlicence\turl\tcredit_line\n')
    for sid in a.ids:
        r = get_json(f'/sounds/{sid}/', {'fields': FIELDS}, key)
        lic = r['license']
        if not licence_ok(lic, a.allow_cc_by):
            print(f'REFUSED {sid} "{r["name"]}": licence {short_lic(lic)} is not allowed')
            continue
        prev = r['previews'].get('preview-hq-ogg') or r['previews']['preview-hq-mp3']
        ext = Path(urllib.parse.urlparse(prev).path).suffix or '.ogg'
        stem = f"fs{sid}-" + ''.join(c if c.isalnum() else '-' for c in Path(r['name']).stem.lower())[:40].strip('-')
        dest = out_dir / (stem + ext)
        with urllib.request.urlopen(urllib.request.Request(prev, headers={'User-Agent': 'motiongraphics/1'}), timeout=120) as resp:
            dest.write_bytes(resp.read())
        if a.wav and shutil.which('ffmpeg'):
            wav = dest.with_suffix('.wav')
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(dest), '-ar', '48000', str(wav)], check=True)
            dest.unlink()
            dest = wav
        credit = '' if CC0 in lic else f'"{r["name"]}" by {r["username"]} (freesound.org/s/{sid}/), CC BY 4.0'
        meta = {'freesound_id': sid, 'name': r['name'], 'author': r['username'], 'licence': lic,
                'licence_short': short_lic(lic), 'url': r['url'], 'duration': r['duration'],
                'credit_line': credit, 'query_note': a.note or ''}
        Path(str(dest) + '.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
        rel = dest.relative_to(ROOT) if dest.is_absolute() and ROOT in dest.parents else dest
        with open(SOURCES, 'a') as f:
            f.write(f"{rel}\t{sid}\t{r['name']}\t{r['username']}\t{short_lic(lic)}\t{r['url']}\t{credit}\n")
        print(f'{dest}  [{short_lic(lic)}] {r["duration"]:.2f}s  {r["name"]} · {r["username"]}' + (f'\n  credit: {credit}' if credit else ''))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('search')
    s.add_argument('query')
    s.add_argument('-n', type=int, default=15)
    s.add_argument('--sort', default='score', choices=['score', 'rating_desc', 'downloads_desc', 'duration_asc', 'created_desc'])
    s.add_argument('--min-dur', type=float)
    s.add_argument('--max-dur', type=float)
    s.add_argument('--min-rating', type=float)
    s.add_argument('--allow-cc-by', action='store_true')
    g = sub.add_parser('get')
    g.add_argument('ids', nargs='+')
    g.add_argument('--dir', default=str(ROOT / '_shared/sfx/freesound'))
    g.add_argument('--wav', action='store_true', help='convert to 48 kHz WAV with ffmpeg')
    g.add_argument('--allow-cc-by', action='store_true')
    g.add_argument('--note', help='why/where it is used (stored in the sidecar)')
    sub.add_parser('check')
    a = p.parse_args()
    key = api_key()
    if a.cmd == 'check':
        d = get_json('/search/text/', {'query': 'click', 'filter': 'license:"Creative Commons 0"', 'page_size': 1, 'fields': 'id'}, key)
        print(f"key OK · {d.get('count')} CC0 results for 'click'")
    elif a.cmd == 'search':
        search(a, key)
    else:
        download(a, key)


if __name__ == '__main__':
    main()
