"""Option libraries for the Crumb previs: extra looks, motion feels, camera moves, transitions, pacing,
sounds, music beds and voices. Every decision still ships with three director options; these libraries
are what the reviewer (or the Ask tab) can add on top, so "more options" never needs a new build.

add_libraries(D, PAGE) fills D['libraries'] and adds the global "Which voice?" decision.
"""
import json, subprocess
from pathlib import Path
from urllib.parse import quote

HERE = Path(__file__).resolve().parent

def _dur(page, p):
    f = page / p
    if not f.exists():
        return None
    return round(float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)]).decode()), 2)

# ---------------------------------------------------------------- fonts (Google Fonts, OFL)
FONT_AXES = {
    'Fraunces': 'opsz,wght@9..144,500;9..144,600', 'IBM Plex Sans': 'wght@400;500;600;700', 'IBM Plex Mono': 'wght@400;600',
    'Sora': 'wght@500;600', 'Inter': 'wght@400;500;600;700', 'Bricolage Grotesque': 'opsz,wght@12..96,500;12..96,600',
    'DM Sans': 'wght@400;500;700', 'Manrope': 'wght@400;500;600;700', 'DM Serif Display': None, 'Space Grotesk': 'wght@500;600;700',
    'Work Sans': 'wght@400;500;600', 'Outfit': 'wght@400;500;600;700', 'Figtree': 'wght@400;500;600;700', 'Syne': 'wght@600;700',
    'Plus Jakarta Sans': 'wght@400;500;600;700', 'Instrument Serif': None, 'Playfair Display': 'wght@500;600;700',
}
def fonts_url(*families):
    parts = []
    for f in families:
        ax = FONT_AXES.get(f)
        parts.append('family=' + quote(f).replace('%20', '+') + (f':{ax}' if ax else ''))
    return 'https://fonts.googleapis.com/css2?' + '&'.join(parts) + '&display=swap'

def look(lid, name, pitch, why, tradeoff, tags, t, display, ui, serif=False):
    tokens = dict(t)
    tokens['display'] = f"'{display}', {'Georgia, serif' if serif else 'Arial, sans-serif'}"
    tokens['ui'] = f"'{ui}', Arial, sans-serif"
    tokens['mono'] = "'IBM Plex Mono', Menlo, monospace"
    fams = [display] + ([ui] if ui != display else []) + ['IBM Plex Mono']
    return {'id': lid, 'name': name, 'pitch': pitch, 'why': why, 'tradeoff': tradeoff, 'tags': tags, 'tokens': tokens, 'fonts_url': fonts_url(*fams), 'origin': 'library'}

LOOKS = [
    look('look-slate', 'Sober slate', 'Cool grey ground, white cards and one steel-blue accent. Quiet and grown-up.',
         'The most restrained option: the product and the voice do all the talking.', 'Can feel like any fintech app.',
         ['sober', 'calm', 'minimal', 'simple', 'corporate', 'grey', 'blue'],
         {'bg': '#E8EAED', 'on-bg': '#1E2329', 'card': '#FFFFFF', 'on-card': '#1E2329', 'muted': '#5E6672', 'line': '#DDE1E6', 'paper': '#F7F8FA', 'on-paper': '#1E2329', 'accent': '#2F5D8C', 'on-accent': '#FFFFFF', 'frame': '#1E2329'}, 'Manrope', 'Inter'),
    look('look-ocean', 'Ocean calm', 'Pale sky ground, navy type and a clear blue accent. Calm and trustworthy.',
         'Blue reads as safe money; soft ground keeps it friendly.', 'Blue is the most common fintech colour.',
         ['calm', 'trust', 'sober', 'blue', 'light', 'finance'],
         {'bg': '#EAF2FA', 'on-bg': '#0D2340', 'card': '#FFFFFF', 'on-card': '#0D2340', 'muted': '#56708F', 'line': '#D9E5F2', 'paper': '#F7FAFD', 'on-paper': '#0D2340', 'accent': '#1F63D6', 'on-accent': '#FFFFFF', 'frame': '#0D2340'}, 'Plus Jakarta Sans', 'Plus Jakarta Sans'),
    look('look-mono', 'Paper mono', 'Pure white, black ink, no colour at all. Editorial and exact.',
         'Lets the receipt itself be the hero; very premium when the type is right.', 'No accent means hits need motion to read.',
         ['minimal', 'monochrome', 'editorial', 'sober', 'black and white', 'premium'],
         {'bg': '#FFFFFF', 'on-bg': '#111111', 'card': '#FFFFFF', 'on-card': '#111111', 'muted': '#666666', 'line': '#E6E6E6', 'paper': '#F5F5F2', 'on-paper': '#111111', 'accent': '#111111', 'on-accent': '#FFFFFF', 'frame': '#111111'}, 'Space Grotesk', 'IBM Plex Sans'),
    look('look-forest', 'Forest bistro', 'Deep green, cream paper and a mustard accent. A good restaurant at night.',
         'Ties the app to eating out; warm and premium.', 'Darker ground; small UI text needs the camera push.',
         ['warm', 'premium', 'restaurant', 'green', 'dark', 'elegant'],
         {'bg': '#1F3A2E', 'on-bg': '#F1EDE3', 'card': '#FBF8F1', 'on-card': '#1C2A22', 'muted': '#6E7F73', 'line': '#E6E1D5', 'paper': '#FBF7EE', 'on-paper': '#1C2A22', 'accent': '#E2A13B', 'on-accent': '#1F1505', 'frame': '#0F1E17'}, 'DM Serif Display', 'DM Sans', serif=True),
    look('look-terracotta', 'Terracotta', 'Burnt orange ground, cream cards, espresso ink. Sunny trattoria.',
         'Warmer and more human than Citrus pop, still bold in a feed.', 'Orange grounds are loud next to food photos.',
         ['warm', 'bold', 'orange', 'friendly', 'italian'],
         {'bg': '#B4502E', 'on-bg': '#FFF6EE', 'card': '#FFF8F1', 'on-card': '#2A1710', 'muted': '#86675A', 'line': '#F0E1D6', 'paper': '#FFF8F1', 'on-paper': '#2A1710', 'accent': '#2A1710', 'on-accent': '#FFF6EE', 'frame': '#2A1710'}, 'Fraunces', 'Work Sans', serif=True),
    look('look-mint', 'Mint fresh', 'Mint ground, white cards, green accent. Light and easy.',
         'Feels like money that is sorted; fresh without shouting.', 'Green can read as a bank.',
         ['fresh', 'friendly', 'light', 'green', 'calm', 'fintech'],
         {'bg': '#DFF3EA', 'on-bg': '#0E2A20', 'card': '#FFFFFF', 'on-card': '#0E2A20', 'muted': '#4F6E62', 'line': '#D4E8DE', 'paper': '#F6FBF8', 'on-paper': '#0E2A20', 'accent': '#0C7A4E', 'on-accent': '#FFFFFF', 'frame': '#0E2A20'}, 'Outfit', 'Figtree'),
    look('look-plum', 'Plum night', 'Plum ground, near-white cards and a pink accent. Bold and a little fun.',
         'Stands out at night in a feed; playful for a friends app.', 'Pink accent is polarising.',
         ['bold', 'night', 'playful', 'dark', 'pink', 'purple'],
         {'bg': '#24142F', 'on-bg': '#F4EEF8', 'card': '#F9F6FB', 'on-card': '#24142F', 'muted': '#7D6C8A', 'line': '#E9E1EF', 'paper': '#FBF8FD', 'on-paper': '#24142F', 'accent': '#FF7AB6', 'on-accent': '#24142F', 'frame': '#12081A'}, 'Syne', 'Manrope'),
    look('look-butter', 'Butter and ink', 'Butter-yellow ground, black ink, chunky grotesque. Cheerful and loud.',
         'Yellow is the friendliest colour in a feed; black keeps it graphic.', 'Very loud; less premium.',
         ['playful', 'warm', 'sunny', 'loud', 'yellow', 'bold'],
         {'bg': '#FFE9A8', 'on-bg': '#1B1A17', 'card': '#FFFFFF', 'on-card': '#1B1A17', 'muted': '#6F6550', 'line': '#F1E6C4', 'paper': '#FFFBEE', 'on-paper': '#1B1A17', 'accent': '#1B1A17', 'on-accent': '#FFE9A8', 'frame': '#1B1A17'}, 'Bricolage Grotesque', 'DM Sans'),
]

MOTION = [
    {'id': 'motion-gentle', 'name': 'Gentle (sine)', 'ease': 'sine', 'why': 'Soft, even arrivals; nothing snaps. The calmest feel.', 'tags': ['calm', 'sober', 'soft', 'slow']},
    {'id': 'motion-smooth', 'name': 'Smooth (power2)', 'ease': 'power2', 'why': 'A gentle deceleration; softer than Crisp.', 'tags': ['calm', 'smooth', 'simple']},
    {'id': 'motion-expo', 'name': 'Fast-out (expo)', 'ease': 'expo', 'why': 'Moves almost instantly, then glides in. Modern app feel.', 'tags': ['modern', 'fast', 'premium']},
    {'id': 'motion-softspring', 'name': 'Soft spring', 'spring': {'f': 5.2, 'd': 6.5}, 'why': 'A rounder spring with about 1 % overshoot; friendly but calm.', 'tags': ['friendly', 'spring', 'soft']},
    {'id': 'motion-pop', 'name': 'Playful pop', 'spring': {'f': 9.5, 'd': 5.2}, 'why': 'Visible bounce on arrival (about 8 %). Fun, but above the 4 % house limit for UI.', 'tags': ['playful', 'bouncy', 'fun'], 'tradeoff': 'Breaks the house overshoot rule; use only for a playful brand.'},
    {'id': 'motion-cinematic', 'name': 'Slow cinematic', 'bezier': [0.65, 0, 0.35, 1], 'why': 'Slow in, slow out. Weighty and deliberate.', 'tags': ['cinematic', 'slow', 'dramatic', 'sober']},
    {'id': 'motion-linear', 'name': 'Mechanical (linear)', 'ease': 'lin', 'why': 'Constant speed, robotic. Useful only as a contrast.', 'tags': ['mechanical', 'robotic'], 'tradeoff': 'Feels cheap for UI.'},
]

PACING = [
    {'id': 'pace-080', 'name': 'Very tight · 16.8 s', 'scale': 0.8, 'why': 'Every shot 20 % shorter. Punchy for a feed; the voice must be quick.', 'tags': ['fast', 'punchy']},
    {'id': 'pace-095', 'name': 'Brisk · 20.0 s', 'scale': 0.95, 'why': 'A touch quicker than standard.', 'tags': ['brisk']},
    {'id': 'pace-105', 'name': 'Easy · 22.1 s', 'scale': 1.05, 'why': 'A little more air between beats.', 'tags': ['calm']},
    {'id': 'pace-125', 'name': 'Slow · 26.3 s', 'scale': 1.25, 'why': 'Very relaxed; hits drift off the beat grid.', 'tags': ['slow', 'calm', 'sober']},
]

CAMERA = [
    {'id': 'cam-locked', 'name': 'Locked', 'cam': {}, 'why': 'No camera move: the content moves, the frame stays still.', 'tags': ['still', 'sober', 'calm']},
    {'id': 'cam-push', 'name': 'Slow push', 'cam': {'s': [1, 1.06]}, 'why': 'A gentle push draws the eye in.', 'tags': ['push', 'calm']},
    {'id': 'cam-push-hard', 'name': 'Strong push', 'cam': {'s': [1, 1.16]}, 'why': 'A clear push in; good for making small text readable.', 'tags': ['push', 'bold']},
    {'id': 'cam-pull', 'name': 'Pull back', 'cam': {'s': [1.1, 1]}, 'why': 'Starts close, opens out to reveal the whole frame.', 'tags': ['reveal', 'pull']},
    {'id': 'cam-drift-left', 'name': 'Drift left', 'cam': {'s': [1.05, 1.05], 'x': [20, -30]}, 'why': 'A slow sideways drift; adds life to a hold.', 'tags': ['drift', 'lively']},
    {'id': 'cam-drift-up', 'name': 'Drift up', 'cam': {'s': [1.05, 1.05], 'y': [24, -30]}, 'why': 'A slow rise; reads top to bottom content.', 'tags': ['drift', 'reveal']},
]

TRANSITIONS = [
    {'id': 'tr-cut', 'name': 'Hard cut', 'type': 'cut', 'why': 'Instant change. Clean, but nothing carries across.', 'tags': ['simple', 'fast']},
    {'id': 'tr-push', 'name': 'Push up', 'type': 'push', 'd': 0.5, 'why': 'The new shot pushes the old one up and away.', 'tags': ['smooth', 'carry']},
    {'id': 'tr-slide', 'name': 'Slide left', 'type': 'slide', 'd': 0.5, 'why': 'Like moving to the next app screen.', 'tags': ['app', 'smooth']},
    {'id': 'tr-slide-fast', 'name': 'Quick slide', 'type': 'slide', 'd': 0.3, 'why': 'A faster slide that feels snappy.', 'tags': ['fast', 'app']},
    {'id': 'tr-zoom', 'name': 'Zoom through', 'type': 'zoom', 'd': 0.6, 'why': 'Push through the frame into the next shot.', 'tags': ['carry', 'bold']},
    {'id': 'tr-iris', 'name': 'Iris from centre', 'type': 'iris', 'd': 0.6, 'at': [50, 50], 'why': 'The next shot opens out of the middle.', 'tags': ['reveal', 'playful']},
]

VOICES = [
    # slug, fish id, language, display name, gender, accent, intro, tags
    ('sarah', '933563129e564b19a115bedd57b7406a', 'en', 'Sarah', 'female', 'American English',
     'Fish Audio official voice. Young, soft and sincere, close to the mic. Our default narrator.', ['soft', 'warm', 'conversational', 'default']),
    ('adrian', 'bf322df2096a46f18c579d0baa36f41d', 'en', 'Adrian', 'male', 'English',
     'Fish Audio official voice. Deep, slow and measured; a serious storyteller.', ['deep', 'calm', 'serious', 'trust']),
    ('slax', 'c5f56a6cc2ec4fa8920cb4c5889a3fb7', 'en', 'Slax', 'male', 'English',
     'Calm, clear and professional; a neutral explainer voice.', ['calm', 'clear', 'professional', 'sober']),
    ('alok', 'b7204d4e40ef4a548c7c8547b7f73492', 'en', 'Alok', 'male', 'British English',
     'Calm podcast host with a British accent; measured and polished.', ['british', 'calm', 'polished']),
    ('in-f', '0429f2b252464b88b2ab2128f084290c', 'en', 'Calm Indian English', 'female', 'Indian English',
     'Calm, clear and professional with an Indian accent.', ['indian', 'calm', 'clear', 'professional']),
    ('in-m', 'ce9c96291460478ea6851049cb847d73', 'en', 'Warm Indian English', 'male', 'Indian English',
     'Young, warm and slow with an Indian accent; gentle and friendly.', ['indian', 'warm', 'friendly', 'slow']),
    ('hi-f1', '4d7609058bd34213b1378b29efbde1f1', 'hi', 'Hindi, bright', 'female', 'Hindi',
     'Young, bright and confident Hindi voice; energetic and clear.', ['hindi', 'bright', 'energetic', 'clear']),
    ('hi-f2', '94fc4065e6e04b9baf1aea2107e91d66', 'hi', 'Hindi, friendly', 'female', 'Hindi',
     'Young, friendly and cheerful Hindi voice; expressive storyteller.', ['hindi', 'friendly', 'cheerful']),
    ('hi-m1', '0de8162a9e384545a0106046b57488a7', 'hi', 'Hindi, narrator', 'male', 'Hindi',
     'Young, clear and professional Hindi narrator.', ['hindi', 'clear', 'professional']),
    ('hi-m2', '6366ea69a97d41ada9eb855a64e56fba', 'hi', 'Hindi, warm', 'male', 'Hindi',
     'Warm, friendly Hindi voice with an easy conversational tone.', ['hindi', 'warm', 'friendly', 'conversational']),
]

def _hindi_lines():
    lines = [l.strip() for l in (HERE / 'voices' / 'lines-hi.txt').read_text().splitlines() if l.strip() and not l.startswith('#')]
    keys = [f's{s}-{k}' for s in range(1, 7) for k in 'ABC']
    return dict(zip(keys, lines))

def _voice(page, slug, fid, lang, name, gender, accent, intro, tags):
    keys = [f's{s}-{k}' for s in range(1, 7) for k in 'ABC']
    d = '' if slug == 'sarah' else f'audio/vo/{slug}/'
    durs = {k: _dur(page, (d or 'audio/vo/') + f'{k}.mp3') for k in keys}
    durs = {k: v for k, v in durs.items() if v}
    o = {'id': f'voice-{slug}', 'name': name, 'lang': lang, 'accent': accent, 'gender': gender, 'intro': intro, 'tags': tags + [gender, lang],
         'voice': fid, 'dir': d, 'durs': durs, 'sample': (d or 'audio/vo/') + 's1-A.mp3',
         'why': intro, 'lic': 'Fish Audio s2.1-pro-free output (commercial use allowed)', 'origin': 'library'}
    if lang == 'hi':
        o['texts'] = _hindi_lines()
    if d and not durs:
        # No takes for this voice in this copy (the public demo ships Sarah only): it plays as captions until
        # someone records it with voices/make_voices.sh, timed on Sarah's takes.
        o.update(dir='', needs='voice takes: run voices/make_voices.sh with your own Fish key',
                 durs={k: v for k in keys if (v := _dur(page, f'audio/vo/{k}.mp3'))})
        o.pop('sample', None)
    return o

def _sfx_library(D):
    seen, out = set(), []
    for sc in D['scenes']:
        for x in sc.get('sfx', []):
            for o in x['options']:
                if o.get('src') and o['src'] not in seen:
                    seen.add(o['src'])
                    out.append({'id': 'sfx-' + Path(o['src']).stem, 'name': o['name'], 'src': o['src'], 'gain': o.get('gain', 1.0),
                                'why': f"Recorded foley ({o['name']}).", 'tags': ['foley'] + [w.lower() for w in o['name'].split('(')[0].split()], 'origin': 'library'})
    return out

def add_libraries(D, page):
    music = []
    for m in json.loads((HERE / 'music_lib.json').read_text()):
        fid = m['id'][2:]
        music.append({'id': m['id'], 'name': m['name'], 'src': f'audio/music/lib/{fid}.mp3', 'bpm': m['bpm'], 'phase': m['phase'],
                      'lic': f"Freesound {fid} · CC0 · {m['author']}", 'why': m['why'], 'tradeoff': m.get('tradeoff'), 'tags': m['tags'] + [m['energy'] + ' energy'],
                      'level': m['energy'], 'origin': 'library'})
    voices = [_voice(page, *v) for v in VOICES]
    D['libraries'] = {'direction': LOOKS, 'music': music, 'motion': MOTION, 'pacing': PACING, 'camera': CAMERA, 'transition': TRANSITIONS,
                      'sfx': _sfx_library(D), 'voice': voices}
    # The global voice decision: three director options from the library, the rest one click away.
    by = {v['id']: v for v in voices}
    def opt(letter, vid, why):
        o = dict(by[vid]); o['id'] = letter; o['ref'] = vid; o['why'] = why; o.pop('origin', None)
        return o
    D['global']['voice'] = {'label': 'Voice', 'chosen': 'A', 'options': [
        opt('A', 'voice-sarah', 'Soft and sincere; the house narrator. Sits well under a warm look.'),
        opt('B', 'voice-in-f', 'Calm Indian English; closer to an Indian audience while staying in English.'),
        opt('C', 'voice-hi-f1', 'The whole film in Hindi with a bright young voice. On-screen text stays English.'),
    ]}
    # Every library font must load in the page as well.
    D['fonts_url_extra'] = [l['fonts_url'] for l in LOOKS]
    return D
