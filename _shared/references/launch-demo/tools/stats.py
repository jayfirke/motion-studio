#!/usr/bin/env python3
"""Aggregate numbers for the launch/demo reference library.

Reads the group of each video from INDEX.md (the section its row sits in) and the
measured numbers from data/<id>.json, then prints median (Q1–Q3) per group as a
Markdown table. Run from anywhere:  python3 tools/stats.py
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def groups_from_index():
    """Return {id: (group, rating)} from the INDEX.md tables (rating is the 6th column)."""
    group, out = None, {}
    for line in open(os.path.join(ROOT, 'INDEX.md'), encoding='utf-8'):
        if line.startswith('## '):
            group = line[3:].strip()
        m = re.search(r'\(cards/([^)]+)\.md\)', line)
        if m and group in ('Launch', 'Demo', 'Explainer', 'Brand/ad', 'Agency talks') and line.startswith('| '):
            cells = [c.strip() for c in re.split(r'(?<!\\)\|', line)[1:-1]]
            rating = int(cells[5]) if len(cells) > 5 and cells[5].isdigit() else 0
            out[m.group(1)] = (group, rating)
    return out

def quartiles(v):
    v = sorted(v); n = len(v)
    def p(x):
        k = (n - 1) * x; f = int(k); c = min(f + 1, n - 1)
        return v[f] + (v[c] - v[f]) * (k - f)
    return p(.5), p(.25), p(.75)

def main():
    grp = groups_from_index()
    rows = []
    for i, (g, rating) in grp.items():
        path = os.path.join(ROOT, 'data', i + '.json')
        if not os.path.exists(path):
            continue
        d = json.load(open(path)); dur = d['duration_s']
        rows.append(dict(g=g, rating=rating, dur=dur, cpm=d['cuts'] / (dur / 60), med=d['shot_s']['median'],
                         longest=d['shot_s']['max'], wpm=d['words_per_min'], bpm=d['tempo_bpm'],
                         sfx=d['sound_events_per_min'], lufs=d['lufs']))
    films = lambda r: r['g'] != 'Agency talks'
    sets = [
        ('All films (no agency talks)', films),
        ('Launch-style (Launch + Brand/ad)', lambda r: r['g'] in ('Launch', 'Brand/ad')),
        ('Demo-style (Demo + Explainer)', lambda r: r['g'] in ('Demo', 'Explainer')),
        ('Narrated films (≥ 60 words/min)', lambda r: films(r) and r['wpm'] >= 60),
        ('Music-only films (< 30 words/min)', lambda r: films(r) and r['wpm'] < 30),
        ('Launch-style, narrated', lambda r: r['g'] in ('Launch', 'Brand/ad') and r['wpm'] >= 60),
        ('Demo-style, narrated', lambda r: r['g'] in ('Demo', 'Explainer') and r['wpm'] >= 60),
        ('The films rated 5 in INDEX', lambda r: r['rating'] == 5),
    ]
    cols = [('dur', 'Length s', 0), ('cpm', 'Cuts/min', 1), ('med', 'Median shot s', 1), ('longest', 'Longest take s', 0),
            ('wpm', 'Words/min', 0), ('bpm', 'BPM', 0), ('sfx', 'Sound events/min', 0), ('lufs', 'LUFS', 1)]
    print('| Group | n | ' + ' | '.join(c[1] for c in cols) + ' |')
    print('|---|---|' + '---|' * len(cols))
    for name, fn in sets:
        g = [r for r in rows if fn(r)]
        cells = []
        for k, _, dp in cols:
            m, a, b = quartiles([r[k] for r in g])
            cells.append(f'{m:.{dp}f} ({a:.{dp}f}–{b:.{dp}f})')
        print(f'| {name} | {len(g)} | ' + ' | '.join(cells) + ' |')

if __name__ == '__main__':
    main()
