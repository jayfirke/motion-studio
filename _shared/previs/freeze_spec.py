#!/usr/bin/env python3
"""Freeze an approved previs into the production contract.

    python3 _shared/previs/freeze_spec.py projects/NNN-name/previs [--picks picks.json] [--approval approval.json]

Reads previs/page/previs.json plus the owner's picks, added options and approval (saved from the page's database
with ArtifactData `get` on films/<id>/state/picks, state/custom and state/approval, using `out_dir`), applies
the picks (including options added from the libraries or by the AI director), resolves the voice, and writes
previs/approved-video-spec.json. Engines build from that file and do not reinterpret it.
"""
import argparse, json, sys
from datetime import date
from pathlib import Path

def load(p):
    d = json.loads(Path(p).read_text())
    return d.get('data', d)  # ArtifactData out_dir files wrap the body in {"id","data",...}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('previs', type=Path, help='the project previs folder')
    ap.add_argument('--picks', type=Path, help='picks/current document (JSON)')
    ap.add_argument('--approval', type=Path, help='approval/current document (JSON)')
    ap.add_argument('--custom', type=Path, help='state/custom document (JSON): options added in the page')
    a = ap.parse_args()
    D = json.loads((a.previs / 'page' / 'previs.json').read_text())
    approval = load(a.approval) if a.approval else {}
    picks_doc = load(a.picks) if a.picks else {}
    picks = approval.get('picks') or picks_doc.get('picks') or {}
    tweaks = approval.get('tweaks') or picks_doc.get('tweaks') or {}
    custom = approval.get('custom') or (load(a.custom).get('options') if a.custom else {}) or {}

    dec = {'direction': D['directions']}
    dec.update(D['global'])
    for sc in D['scenes']:
        for k, v in (sc.get('decisions') or {}).items():
            dec[sc['id'] + '.' + k] = v
        for x in sc.get('sfx') or []:
            dec[sc['id'] + '.' + x['id']] = x
    # Options added in the page (library items, AI looks and motion feels, new lines) join their decision.
    for k, extra in custom.items():
        if k in dec:
            dec[k] = {**dec[k], 'options': dec[k]['options'] + [o for o in extra if not any(x['id'] == o['id'] for x in dec[k]['options'])]}
    def pick(key):
        d = dec[key]; chosen = picks.get(key, d['chosen'])
        o = next((o for o in d['options'] if o['id'] == chosen), d['options'][0])
        return o
    voice = pick('voice') if 'voice' in dec else None
    needs = []
    def line(sc_id, o):
        # The narration resolved for the chosen voice: its own take, length and (for Hindi) its own words.
        k = f"{sc_id}-{o['id']}"
        fresh = o.get('needs') or o.get('origin') in ('ai', 'you')
        out = dict(o)
        if voice and voice.get('dir'):
            out['src'] = None if fresh else f"{voice['dir']}{k}.mp3"
            out['dur'] = (voice.get('durs') or {}).get(k, o.get('dur'))
            out['text'] = (voice.get('texts') or {}).get(k, o.get('text'))
            out['text_en'] = o.get('text')
        elif fresh:
            out['src'] = None
        if not out.get('src'):
            needs.append(f"record {sc_id} line {o['id']}: {out.get('text')}")
        return out
    changed = {k: picks[k] for k in picks if k in dec and picks[k] != dec[k]['chosen']}

    scale = pick('pacing').get('scale', 1)
    t, scenes = 0.0, []
    for sc in D['scenes']:
        d = sc['dur'] * scale
        scenes.append({
            'id': sc['id'], 'name': sc['name'], 'start': round(t, 3), 'end': round(t + d, 3), 'purpose': sc.get('purpose'), 'truth': sc.get('truth'),
            'copy': sc.get('copy'), 'notes': sc.get('notes'), 'html': sc.get('html'), 'anim': sc.get('anim'),
            'decisions': {k: (line(sc['id'], pick(sc['id'] + '.' + k)) if k == 'vo' else pick(sc['id'] + '.' + k)) for k in (sc.get('decisions') or {})},
            'sfx': [{'id': x['id'], 'label': x['label'], 'at': [round(t + v * scale + tweaks.get(sc['id'] + '.' + x['id'], {}).get('dt', 0), 3) for v in (x['at'] if isinstance(x['at'], list) else [x['at']])], 'gain_db': tweaks.get(sc['id'] + '.' + x['id'], {}).get('db', 0), 'hit': x.get('hit', False), 'pick': pick(sc['id'] + '.' + x['id'])} for x in (sc.get('sfx') or [])],
            'engine': sc.get('engine') or D.get('engine'),
        })
        t += d
    spec = {
        'contract': 'approved-video-spec', 'frozen': str(date.today()), 'approved': bool(approval.get('approved')), 'approved_at': approval.get('at'),
        'version': approval.get('version') or D['versions'][-1]['v'], 'project': D['project'], 'duration': round(t, 3),
        'direction': pick('direction'), 'music': pick('music'), 'motion': pick('motion'), 'pacing': pick('pacing'),
        'voice': {k: v for k, v in (voice or {}).items() if k not in ('durs', 'texts')} or {'name': 'Sarah', 'voice': '933563129e564b19a115bedd57b7406a'},
        'added_options': custom, 'needs_before_build': needs,
        'style_rules': D.get('style_rules'), 'film_css': D.get('film_css'), 'fonts_url': D.get('fonts_url'), 'audio_notes': D.get('audio_notes'),
        'changed_from_director': changed, 'scenes': scenes,
        'mix': {'voice_db': tweaks.get('lane.vo', {}).get('db', 0), 'music_db': tweaks.get('lane.music', {}).get('db', 0), 'sfx_db': tweaks.get('lane.sfx', {}).get('db', 0), 'duck_music_under_voice': tweaks.get('mix.duck', {}).get('on', True)},
        'rules': 'Build exactly this. Production may add polish (masks, depth, sub-frame motion, final sound layers named in audio_notes) but may not change story, copy, order, timing, picks or engine without a new previs version.',
    }
    out = a.previs / 'approved-video-spec.json'
    out.write_text(json.dumps(spec, ensure_ascii=False, indent=1))
    print(f'{out}: {len(scenes)} scenes, {spec["duration"]} s, {len(changed)} picks changed from the director, approved={spec["approved"]}')
    if needs:
        print('before the build: ' + '; '.join(needs), file=sys.stderr)
    if not spec['approved']:
        print('warning: no approval document; this is a draft spec, not a contract', file=sys.stderr)

if __name__ == '__main__':
    main()
