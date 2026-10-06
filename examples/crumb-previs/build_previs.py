"""Builds previs/page/previs.json for 011 Crumb (fictional bill-splitting app).

Edit this file, run it, then republish previs/page. Times inside a scene are seconds from the
scene start at pace 1.0; the page rescales them for the Pacing option. Every decision carries
three options (A/B/C) and the director's pick in `chosen`.
"""
import json, subprocess
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAGE = Path(os.environ['PREVIS_PAGE']) if os.environ.get('PREVIS_PAGE') else HERE / 'page'   # PREVIS_PAGE: build into another data pack

def dur(p):
    return round(float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(PAGE / p)]).decode()), 2)

def vo(scene, at, lines, chosen='A', copies=None):
    opts = []
    for k, text in zip('ABC', lines):
        o = {'id': k, 'name': text, 'text': text, 'src': f'audio/vo/{scene}-{k}.mp3', 'dur': dur(f'audio/vo/{scene}-{k}.mp3'), 'at': at, 'gain': 1.0}
        if copies: o['copy'] = copies[k]
        opts.append(o)
    return {'label': 'Voice line (Sarah)', 'chosen': chosen, 'options': opts}

def fx(fid, name, gain=1.0, why=''):
    return {'name': f'{name} (FS {fid})', 'src': f'audio/sfx/fs{fid}.mp3', 'gain': gain, 'why': why}

def none(why='Silence here lets the picture and voice carry it.'):
    return {'name': 'Nothing', 'src': None, 'why': why}

def sfx(sid, label, at, opts, chosen='A', hit=False, why='', step=None):
    o = [dict(v, id=k) for k, v in zip('ABC', opts)]
    d = {'id': sid, 'label': label, 'at': at, 'chosen': chosen, 'options': o, 'why': why}
    if hit: d['hit'] = True
    if step: d['step'] = step
    return d

def dec(label, chosen, opts):
    return {'label': label, 'chosen': chosen, 'options': [dict(v, id=k) for k, v in zip('ABC', opts)]}

# ---------------------------------------------------------------- film styles (all colours from direction tokens)
FILM_CSS = r"""
#stage { font-family: var(--ui); color: var(--on-bg); }
#stage * { box-sizing: border-box; }
#stage .f-hl { position: absolute; left: 108px; right: 108px; top: 236px; font-family: var(--display); font-size: 108px; line-height: 1.02; letter-spacing: -0.025em; font-weight: 600; color: var(--on-bg); }
#stage .f-rc { position: absolute; left: 210px; top: 640px; width: 660px; background: var(--paper); color: var(--on-paper); font-family: var(--mono); font-size: 34px; padding: 44px 46px 52px; box-shadow: 0 34px 70px rgba(0,0,0,.22); transform-origin: 50% 0; }
#stage .f-rh { text-align: center; font-size: 27px; letter-spacing: .14em; padding-bottom: 20px; margin-bottom: 14px; border-bottom: 3px dashed currentColor; opacity: .85; }
#stage .f-r { display: flex; justify-content: space-between; padding: 7px 10px; margin: 0 -10px; border-radius: 6px; }
#stage .f-r.hl2 { background: color-mix(in srgb, var(--accent) 24%, transparent); }
#stage .f-rt { display: flex; justify-content: space-between; align-items: baseline; border-top: 3px dashed currentColor; margin-top: 16px; padding-top: 18px; font-weight: 600; }
#stage .f-tot { font-size: 60px; display: inline-block; transform-origin: 100% 70%; }
#stage .f-tot.hot { color: var(--accent); }
#stage .f-ph { position: absolute; left: 150px; top: 210px; width: 780px; height: 1500px; border-radius: 108px; background: var(--frame); padding: 16px; box-shadow: 0 44px 90px rgba(0,0,0,.28); }
#stage .f-scr { position: relative; width: 100%; height: 100%; border-radius: 92px; background: var(--card); color: var(--on-card); overflow: hidden; }
#stage .f-isl { position: absolute; left: 50%; top: 22px; width: 196px; height: 56px; margin-left: -98px; border-radius: 30px; background: var(--frame); z-index: 4; }
#stage .f-sb { position: absolute; left: 70px; right: 70px; top: 30px; display: flex; justify-content: space-between; font-weight: 600; font-size: 30px; z-index: 3; }
#stage .f-hd { position: absolute; left: 56px; right: 56px; top: 132px; }
#stage .f-hd h4 { margin: 0; font-family: var(--display); font-size: 66px; font-weight: 600; letter-spacing: -0.015em; line-height: 1.05; }
#stage .f-hd p { margin: 8px 0 0; font-size: 31px; color: var(--muted); }
#stage .f-hd .b2, #stage .f-hd.done .b1 { display: none; } #stage .f-hd.done .b2 { display: inline; }
#stage .f-vf { position: absolute; left: 0; right: 0; top: 120px; height: 1010px; background: #101010; overflow: hidden; }
#stage .f-vf .f-rc { left: 94px; top: 70px; width: 560px; font-size: 27px; padding: 34px 34px 40px; box-shadow: none; }
#stage .f-vf .f-tot { font-size: 46px; }
#stage .f-br { position: absolute; left: 60px; top: 40px; right: 60px; bottom: 40px; border: 5px solid rgba(255,255,255,.85); border-radius: 30px; clip-path: polygon(0 0, 18% 0, 18% 4%, 4% 4%, 4% 18%, 0 18%, 0 82%, 4% 82%, 4% 96%, 18% 96%, 18% 100%, 82% 100%, 82% 96%, 96% 96%, 96% 82%, 100% 82%, 100% 18%, 96% 18%, 96% 4%, 82% 4%, 82% 0, 100% 0, 100% 100%, 0 100%); }
#stage .f-scan { position: absolute; left: 60px; right: 60px; top: 60px; height: 8px; border-radius: 4px; background: var(--accent); box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 25%, transparent); display: none; }
#stage .f-scan.on { display: block; }
#stage .f-pill { position: absolute; left: 50%; top: 1170px; transform: translateX(-50%); white-space: nowrap; }
#stage .f-pill span { display: inline-block; font-size: 32px; font-weight: 600; padding: 16px 30px; border-radius: 40px; background: rgba(255,255,255,.12); color: #fff; }
#stage .f-pill .b, #stage .f-pill.done .a { display: none; } #stage .f-pill.done .b { display: inline-block; background: var(--accent); color: var(--on-accent); }
#stage .f-shut { position: absolute; left: 50%; top: 1270px; width: 130px; height: 130px; margin-left: -65px; border-radius: 50%; border: 8px solid #fff; background: rgba(255,255,255,.18); }
#stage .f-li { position: absolute; left: 40px; right: 40px; height: 104px; display: flex; align-items: center; gap: 14px; padding: 0 22px; font-size: 33px; border-bottom: 2px solid var(--line); }
#stage .f-li .nm { min-width: 0; white-space: nowrap; }
#stage .f-li .p { margin-left: auto; font-family: var(--mono); font-size: 30px; color: var(--muted); }
#stage .f-chs { display: flex; gap: 6px; margin-left: 10px; }
#stage .f-ch { width: 54px; height: 54px; border-radius: 50%; background: var(--accent); color: var(--on-accent); display: grid; place-items: center; font-weight: 700; font-size: 25px; font-style: normal; }
#stage .f-ch.all { width: auto; padding: 0 16px; border-radius: 27px; }
#stage .f-av { position: absolute; top: 1262px; width: 88px; height: 88px; margin-left: -44px; border-radius: 50%; background: var(--paper); color: var(--on-paper); display: grid; place-items: center; font-weight: 700; font-size: 36px; border: 5px solid transparent; }
#stage .f-av.sel { border-color: var(--accent); }
#stage .f-tray { position: absolute; left: 0; right: 0; top: 1236px; height: 150px; border-top: 2px solid var(--line); }
#stage .f-ring { position: absolute; left: -60px; top: -60px; width: 120px; height: 120px; border-radius: 50%; background: color-mix(in srgb, var(--on-card) 22%, transparent); border: 4px solid color-mix(in srgb, var(--on-card) 55%, transparent); z-index: 6; }
#stage .f-vf ~ .f-ring, #stage .f-ring.lt { background: rgba(255,255,255,.25); border-color: rgba(255,255,255,.7); }
#stage .f-pp { position: absolute; left: 40px; right: 40px; height: 98px; display: flex; align-items: center; gap: 22px; padding: 0 22px; font-size: 35px; border-bottom: 2px solid var(--line); }
#stage .f-pp i { width: 74px; height: 74px; border-radius: 50%; background: var(--paper); color: var(--on-paper); display: grid; place-items: center; font-weight: 700; font-style: normal; font-size: 30px; }
#stage .f-pp b { margin-left: auto; font-family: var(--mono); font-size: 38px; font-weight: 600; }
#stage .f-barw { position: absolute; left: 62px; right: 62px; top: 1060px; }
#stage .f-bl { display: flex; justify-content: space-between; font-size: 30px; color: var(--muted); margin-bottom: 14px; }
#stage .f-bar { height: 22px; border-radius: 11px; background: var(--line); overflow: hidden; }
#stage .f-fill { height: 100%; width: 100%; background: var(--accent); transform-origin: 0 50%; }
#stage .f-ok { position: absolute; left: 50%; top: 1230px; margin-left: -260px; width: 520px; text-align: center; font-size: 33px; font-weight: 700; padding: 22px 0; border-radius: 44px; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--on-card); }
#stage .f-mrow { position: absolute; left: 56px; right: 56px; height: 92px; display: flex; align-items: center; justify-content: space-between; font-size: 33px; border-bottom: 2px solid var(--line); }
#stage .f-mrow b { font-family: var(--mono); font-weight: 600; }
#stage .f-btn { position: absolute; left: 56px; right: 56px; top: 1190px; height: 136px; border-radius: 68px; background: var(--accent); color: var(--on-accent); display: grid; place-items: center; font-size: 42px; font-weight: 700; }
#stage .f-card { position: absolute; left: 0; top: 0; width: 410px; height: 150px; border-radius: 30px; background: var(--card); color: var(--on-card); display: flex; align-items: center; gap: 20px; padding: 0 28px; box-shadow: 0 18px 40px rgba(0,0,0,.2); font-size: 33px; z-index: 5; }
#stage .f-card i { width: 70px; height: 70px; border-radius: 50%; background: var(--paper); color: var(--on-paper); display: grid; place-items: center; font-style: normal; font-weight: 700; font-size: 29px; flex: none; }
#stage .f-card b { font-family: var(--mono); font-weight: 600; }
#stage .f-card .ck { margin-left: auto; width: 46px; height: 46px; border-radius: 50%; border: 4px solid var(--line); }
#stage .f-card.paid .ck { background: var(--accent); border-color: var(--accent); box-shadow: inset 0 0 0 9px var(--card); }
#stage .f-icon { position: absolute; left: 150px; top: 790px; width: 210px; height: 210px; border-radius: 56px; background: var(--accent); overflow: hidden; }
#stage .f-icon::before { content: ""; position: absolute; left: 42px; top: 42px; width: 126px; height: 126px; border-radius: 50%; background: var(--on-accent); }
#stage .f-icon::after { content: ""; position: absolute; left: 118px; top: 24px; width: 70px; height: 70px; border-radius: 50%; background: var(--accent); }
#stage .f-wm { position: absolute; left: 395px; top: 795px; white-space: nowrap; font-family: var(--display); font-size: 186px; line-height: 1.05; font-weight: 600; letter-spacing: -0.035em; color: var(--on-bg); }
#stage .f-tag { position: absolute; left: 150px; right: 108px; top: 1070px; font-size: 60px; line-height: 1.15; color: var(--on-bg); font-weight: 500; }
"""

ROWS = [('Margherita', '18.00'), ('Spritz ×2', '24.00'), ('Burrata', '16.50'), ('Risotto ×2', '44.00'), ('Branzino', '29.00'), ('Tiramisu ×2', '19.00'), ('Bread &amp; water', '11.60')]
RECEIPT = ('<div class="f-rc"><div class="f-rh">NONNA\'S · TABLE 12</div>'
           + ''.join(f'<div class="f-r a{i}"><span>{n}</span><span>{p}</span></div>' for i, (n, p) in enumerate(ROWS))
           + '<div class="f-r a7"><span>Tax &amp; tip</span><span>24.30</span></div>'
           + '<div class="f-rt"><span>TOTAL</span><b class="f-tot">$186.40</b></div></div>')
PHONE_TOP = '<div class="f-isl"></div><div class="f-sb"><span>9:41</span><span>●●● ▮</span></div>'
PEOPLE = [('M', 'Maya', 22.61), ('J', 'Jon', 32.38), ('S', 'Sam', 26.63), ('P', 'Priya', 24.90), ('L', 'Leo', 33.53), ('A', 'Ana', 19.15), ('R', 'Ravi', 27.20)]
assert round(sum(p[2] for p in PEOPLE), 2) == 186.40
AV_X = [68, 170, 272, 374, 476, 578, 680]  # seven 88 px avatars across the 748 px screen

def ring_path(points):
    """points: list of (t_arrive_start, t_arrive, x, y, press) -> tweens for .f-ring"""
    out = []
    for i, (ta, tb, x, y, press) in enumerate(points):
        out.append({'s': '.f-ring', 't': [ta, tb], 'to': {'x': x, 'y': y}, 'e': 'out'})
        if press:
            out.append({'s': '.f-ring', 't': [tb, tb + 0.08], 'to': {'s': 0.8}, 'e': 'out'})
            out.append({'s': '.f-ring', 't': [tb + 0.08, tb + 0.28], 'to': {'s': 1}, 'e': 'm'})
    return out

# ---------------------------------------------------------------- scenes
s1 = {
    'id': 's1', 'name': 'Hook', 'dur': 3.0, 'truth': 'conceptual_visual', 'levels': 2,
    'purpose': 'Land the problem in two seconds: one long receipt, one big total.',
    'copy': 'Seven friends. One receipt.',
    'notes': {'camera': 'A slow push keeps the held receipt alive without moving the reading line.', 'motion': 'The receipt arrives with weight and settles at a slight tilt; the total punches on the drop.', 'type': 'Display face, 108 px, two lines, top safe area.', 'music': 'Bell Beats is quiet for its first bar and drops at 2.0 s, exactly on the total.'},
    'html': '<div class="f-hl" data-copy>Seven friends. One receipt.</div>' + RECEIPT,
    'anim': [
        {'s': '.f-rc', 't': [0.0, 0.9], 'f': {'y': 760, 'r': -7}, 'to': {'y': 0, 'r': -2.5}, 'e': 'm'},
        {'s': '.f-hl', 't': [0.0, 0.6], 'f': {'y': 24}, 'to': {'y': 0}, 'e': 'out'},
        {'s': '.f-tot', 'set': 'hot', 'at': 2.0},
        {'s': '.f-tot', 't': [2.0, 2.12], 'f': {'s': 1}, 'to': {'s': 1.16}, 'e': 'out'},
        {'s': '.f-tot', 't': [2.12, 2.7], 'to': {'s': 1}, 'e': 'm'},
    ],
    'decisions': {
        'camera': dec('Camera', 'A', [
            {'name': 'Slow push', 'cam': {'s': [1, 1.06], 'origin': '50% 70%'}, 'why': 'Draws the eye down to the total as it lands.'},
            {'name': 'Locked', 'cam': {}, 'why': 'Calm and authoritative; the receipt does all the moving.'},
            {'name': 'Drift up', 'cam': {'y': [0, -50]}, 'why': 'Reads the receipt top to bottom; risks the headline leaving the frame.'}]),
        'vo': vo('s1', 0.3, ["Seven friends. One receipt.", "Dinner's done. Now the math.", "One bill. Seven people."], 'A',
                 {'A': 'Seven friends. One receipt.', 'B': "Dinner's done. Now the math.", 'C': 'One bill. Seven people.'}),
    },
    'sfx': [
        sfx('x1', 'Receipt slides in', 0.05, [fx(651514, 'Paper handling', 0.8), fx(614153, 'Gentle swish', 0.6), fx(554208, 'Card riffle', 0.6)], 'A', why='A real paper sound sells the object.'),
        sfx('x2', 'Total lands', 2.0, [fx(388958, 'Soft snap', 1.0), fx(378085, 'Mechanical key', 0.8), fx(406586, 'Heavy paper drop', 0.9)], 'C', hit=True, why='The first hit of the film; physical, not a chime.'),
    ],
}
s2 = {
    'id': 's2', 'name': 'Scan', 'dur': 3.5, 'truth': 'conceptual_ui', 'levels': 1,
    'purpose': 'Show the cause: one tap on the shutter, then Crumb reads every line.',
    'copy': '(UI) Reading the receipt… → 8 lines found',
    'notes': {'camera': 'Steady on the phone so the scan reads.', 'motion': 'Phone rises from below; the shutter press is visible before the scan starts.', 'type': 'UI only: one status pill.', 'music': 'The shutter press lands on 4.0 s, a downbeat at 120 BPM.'},
    'html': '<div class="f-ph"><div class="f-scr" style="background:#0d0d0c">' + PHONE_TOP.replace('<div class="f-sb">', '<div class="f-sb" style="color:#fff">')
            + '<div class="f-vf">' + RECEIPT + '<div class="f-br"></div><div class="f-scan"></div></div>'
            + '<div class="f-pill"><span class="a">Reading the receipt…</span><span class="b">8 lines found</span></div>'
            + '<div class="f-shut"></div><div class="f-ring lt"></div></div></div>',
    'anim': [
        {'s': '.f-ph', 't': [0.0, 0.75], 'f': {'y': 1500}, 'to': {'y': 0}, 'e': 'm'},
        {'s': '.f-vf .f-rc', 't': [0.3, 1.0], 'f': {'s': 1.25, 'r': -4}, 'to': {'s': 1, 'r': -1.5}, 'e': 'm'},
        {'s': '.f-br', 't': [0.7, 1.0], 'f': {'s': 1.1, 'o': 0}, 'to': {'s': 1, 'o': 1}, 'e': 'out'},
        {'s': '.f-ring', 't': [0.0, 0.6], 'f': {'x': 560, 'y': 1560, 'o': 0}, 'to': {'x': 560, 'y': 1560, 'o': 0}, 'e': 'lin'},
        {'s': '.f-ring', 't': [0.6, 0.95], 'to': {'x': 374, 'y': 1335, 'o': 1}, 'e': 'out'},
        {'s': '.f-ring', 't': [0.95, 1.03], 'to': {'s': 0.8}, 'e': 'out'},
        {'s': '.f-ring', 't': [1.03, 1.25], 'to': {'s': 1}, 'e': 'm'},
        {'s': '.f-ring', 't': [1.3, 1.6], 'to': {'x': 600, 'y': 1600, 'o': 0}, 'e': 'in'},
        {'s': '.f-shut', 't': [0.97, 1.05], 'f': {'s': 1}, 'to': {'s': 0.9}, 'e': 'out'},
        {'s': '.f-shut', 't': [1.05, 1.3], 'to': {'s': 1}, 'e': 'm'},
        {'s': '.f-scan', 'set': 'on', 'at': 1.1, 'until': 2.35},
        {'s': '.f-scan', 't': [1.1, 2.3], 'f': {'y': 0}, 'to': {'y': 880}, 'e': 'lin'},
    ] + [{'s': f'.f-vf .a{i}', 'set': 'hl2', 'at': round(1.3 + 0.12 * i, 2)} for i in range(8)] + [
        {'s': '.f-pill', 'set': 'done', 'at': 2.45},
        {'s': '.f-pill', 't': [2.45, 2.75], 'f': {'s': 0.92}, 'to': {'s': 1}, 'e': 'm'},
    ],
    'decisions': {
        'transition': dec('Into this scene', 'B', [
            {'name': 'Push up', 'type': 'push', 'why': 'Clear and quick; the receipt leaves as the phone arrives.'},
            {'name': 'Zoom into the viewfinder', 'type': 'zoom', 'why': 'The receipt grows into the phone screen: one object carried, not replaced.'},
            {'name': 'Hard cut on the beat', 'type': 'cut', 'why': 'Fastest; loses the sense that the paper becomes data.'}]),
        'camera': dec('Camera', 'A', [
            {'name': 'Locked', 'cam': {}, 'why': 'Product UI reads best on a steady camera.'},
            {'name': 'Push to the viewfinder', 'cam': {'s': [1, 1.08], 'origin': '50% 42%'}, 'why': 'Puts the scan line closer; crops the shutter press.'},
            {'name': 'Drift down', 'cam': {'y': [0, 40]}, 'why': 'Follows the scan line; slightly busy under the voice.'}]),
        'vo': vo('s2', 0.5, ['Crumb reads every line.', 'Snap it. Crumb reads the rest.', 'Point your camera at the receipt.'], 'A'),
    },
    'sfx': [
        sfx('x1', 'Phone rises', 0.0, [fx(349698, 'Light slow swoosh', 0.55), fx(71852, 'Digital whoosh soft', 0.6), fx(701104, 'Whoosh light', 0.5)], 'A', why='Airy, slow swell; never an action-film blast.'),
        sfx('x2', 'Shutter press', 1.0, [fx(256455, 'Mouse click', 1.0), fx(570754, 'Key press', 0.9), fx(332713, 'Touch tap', 1.0)], 'C', hit=True, why='A soft touch, because a finger presses glass.'),
        sfx('x3', 'Scan sweeps', 1.1, [fx(447909, 'Typing run', 0.3), fx(614153, 'Gentle swish', 0.4), none()], 'C', why='Fewer sounds than beats; the voice is speaking here.'),
    ],
}
li = ''.join(f'<div class="f-li b{i}" style="top:{300 + 116 * i}px"><span class="nm">{n}</span><span class="f-chs c{i}"></span><span class="p">{p}</span></div>' for i, (n, p) in enumerate(ROWS))
CLAIMS = {0: ['M'], 1: ['J', 'S'], 2: ['P', 'L', 'A'], 3: ['L', 'R'], 4: ['J', 'P'], 5: ['S', 'A'], 6: ['all']}
for i, ws in CLAIMS.items():
    chips = ''.join(f'<i class="f-ch {"all" if w == "all" else ""} k{i}{w}">{f"All {len(PEOPLE)}" if w == "all" else w}</i>' for w in ws)
    li = li.replace(f'<span class="f-chs c{i}"></span>', f'<span class="f-chs c{i}">{chips}</span>')
tray = '<div class="f-tray"></div>' + ''.join(f'<div class="f-av v{j}" style="left:{AV_X[j]}px">{p[0]}</div>' for j, p in enumerate(PEOPLE))
taps = [(0.60, 0, 0), (0.92, None, 0), (1.35, 1, 1), (1.65, None, 1), (2.10, 3, 2), (2.40, None, 2)]
pops_auto = ['k1S', 'k2L', 'k2A', 'k3L', 'k3R', 'k4J', 'k4P', 'k5S', 'k5A', 'k6all']
s3 = {
    'id': 's3', 'name': 'Claim', 'dur': 4.5, 'truth': 'conceptual_ui', 'levels': 2,
    'purpose': 'The key action: tap a name, tap a dish. Three taps shown, the rest fill in.',
    'copy': "(UI) Nonna's · 8 items → All 8 items claimed",
    'notes': {'camera': 'Push in until the list text is at least 3 % of the frame (house rule).', 'motion': 'A 96 px touch ring travels, presses (0.8 scale), and the chip pops on the dish it lands on.', 'type': 'Display title, UI rows at 33 px.', 'music': 'Taps run with the groove, not locked to every beat.'},
    'html': '<div class="f-ph"><div class="f-scr">' + PHONE_TOP + '<div class="f-hd"><h4>Nonna\'s</h4><p><span class="b1">8 items · $186.40</span><span class="b2">All 8 items claimed</span></p></div>' + li + tray + '<div class="f-ring"></div></div></div>',
    'anim': ring_path([(0.0, 0.01, 520, 1700, False), (0.3, 0.6, AV_X[0], 1310, True), (0.65, 0.92, 560, 352, True), (1.1, 1.35, AV_X[1], 1310, True), (1.4, 1.65, 560, 468, True), (1.85, 2.1, AV_X[3], 1310, True), (2.15, 2.4, 560, 584, True), (2.6, 3.0, 700, 1700, False)])
        + [{'s': '.f-ring', 't': [0.0, 0.3], 'f': {'o': 0}, 'to': {'o': 1}, 'e': 'out'}, {'s': '.f-ring', 't': [2.7, 3.0], 'to': {'o': 0}, 'e': 'lin'}]
        + [{'s': f'.v{v}', 'set': 'sel', 'at': a + 0.02, 'until': a + 0.7} for a, v in [(0.6, 0), (1.35, 1), (2.1, 3)]]
        + [{'s': f'.{k}', 't': [a, a + 0.2], 'f': {'s': 0}, 'to': {'s': 1}, 'e': 'm'} for a, k in [(0.92, 'k0M'), (1.65, 'k1J'), (2.4, 'k2P')]]
        + [{'s': f'.{k}', 't': [round(2.75 + 0.08 * j, 2), round(2.95 + 0.08 * j, 2)], 'f': {'s': 0}, 'to': {'s': 1}, 'e': 'm'} for j, k in enumerate(pops_auto)]
        + [{'s': '.f-hd', 'set': 'done', 'at': 3.7}],
    'decisions': {
        'transition': dec('Into this scene', 'A', [
            {'name': 'Screen slides left', 'type': 'slide', 'why': 'Reads as the app moving to its next screen. In production only the screen content slides; the phone stays.'},
            {'name': 'Hard cut', 'type': 'cut', 'why': 'Snappy, but the scan result and the list feel unrelated.'},
            {'name': 'Iris from the pill', 'type': 'iris', 'at': [50, 63], 'why': 'The list opens out of "8 lines found"; the strongest carry, slower.'}]),
        'camera': dec('Camera', 'A', [
            {'name': 'Push in to the list', 'cam': {'s': [1, 1.12], 'origin': '55% 34%'}, 'why': 'Makes the rows readable on a phone; follows the taps.'},
            {'name': 'Locked', 'cam': {}, 'why': 'Shows the whole tray and list; row text stays small.'},
            {'name': 'Drift with the taps', 'cam': {'s': [1.04, 1.04], 'x': [0, -30]}, 'why': 'Lively; can feel handheld, which product films avoid.'}]),
        'vo': vo('s3', 0.3, ['Tap who had what.', 'Tap a name, then tap a dish.', 'Everyone claims their own plates.'], 'A'),
    },
    'sfx': [
        sfx('x1', 'Taps on names and dishes', [0.60, 0.92, 1.35, 1.65, 2.10, 2.40], [fx(332713, 'Touch tap', 1.0), fx(256455, 'Mouse click', 0.9), fx(534103, 'Short press', 0.9)], 'A', why='One real tap per press, each a little quieter (house rule for runs).', step=0.9),
        sfx('x2', 'The rest fill in', 2.75, [fx(614153, 'Gentle swish', 0.5), fx(447909, 'Typing run', 0.3), none('Let the voice and the chips carry it.')], 'A', why='When hits blur together, one swoosh instead of nine clicks.'),
    ],
}
pp = ''.join(f'<div class="f-pp q{i}" style="top:{290 + 104 * i}px"><i>{c}</i><span>{n}</span><b class="m{i}">${v:.2f}</b></div>' for i, (c, n, v) in enumerate(PEOPLE))
s4 = {
    'id': 's4', 'name': 'Split', 'dur': 3.5, 'truth': 'conceptual_ui', 'levels': 2,
    'purpose': 'The result: everyone\'s fair share, tax and tip spread by what they ate.',
    'copy': '(UI) Who owes what · seven amounts · Tax & tip $24.30 · All squared',
    'notes': {'camera': 'A slow push lands on the totals.', 'motion': 'Rows rise in order; amounts count up in tabular figures; the tax bar fills last.', 'type': 'Amounts in the mono face, 38 px.', 'music': 'Energy holds; no hit, the voice carries it.'},
    'html': '<div class="f-ph"><div class="f-scr">' + PHONE_TOP + '<div class="f-hd"><h4>Who owes what</h4><p>Tax and tip follow what each person ate</p></div>' + pp
            + '<div class="f-barw"><div class="f-bl"><span>Tax &amp; tip</span><span>$24.30</span></div><div class="f-bar"><div class="f-fill"></div></div></div><div class="f-ok">All squared · $186.40</div></div></div>',
    'anim': [{'s': f'.q{i}', 't': [round(0.1 + 0.06 * i, 2), round(0.5 + 0.06 * i, 2)], 'f': {'y': 40, 'o': 0}, 'to': {'y': 0, 'o': 1}, 'e': 'm'} for i in range(len(PEOPLE))]
          + [{'s': f'.m{i}', 'count': [0, v], 't': [round(0.3 + 0.06 * i, 2), round(1.3 + 0.06 * i, 2)], 'p': '$', 'd': 2} for i, (_, _, v) in enumerate(PEOPLE)]
          + [{'s': '.f-fill', 't': [1.5, 2.4], 'f': {'sx': 0}, 'to': {'sx': 1}, 'e': 'm'},
             {'s': '.f-ok', 't': [2.5, 2.85], 'f': {'y': 30, 'o': 0}, 'to': {'y': 0, 'o': 1}, 'e': 'm'}],
    'decisions': {
        'transition': dec('Into this scene', 'A', [
            {'name': 'Screen slides left', 'type': 'slide', 'why': 'Same grammar as the previous screen change; the app keeps moving forward.'},
            {'name': 'Push up', 'type': 'push', 'why': 'Different direction from the last change, so it reads as a new step.'},
            {'name': 'Hard cut', 'type': 'cut', 'why': 'Fast; the result appears without any build.'}]),
        'camera': dec('Camera', 'B', [
            {'name': 'Locked', 'cam': {}, 'why': 'All seven totals in view at once.'},
            {'name': 'Slow push', 'cam': {'s': [1, 1.08], 'origin': '50% 45%'}, 'why': 'Keeps a still screen alive while numbers count.'},
            {'name': 'Pull back', 'cam': {'s': [1.1, 1]}, 'why': 'Starts close on the first total; ends on the whole list.'}]),
        'vo': vo('s4', 0.3, ['Tax and tip, split fairly.', 'Tax and tip land where they belong.', 'Shared plates, shared fairly.'], 'A'),
    },
    'sfx': [
        sfx('x1', 'Amounts count up', 0.3, [fx(447909, 'Typing run', 0.25), none('Silence under the voice; the numbers are the event.'), fx(421583, 'Soft key', 0.4)], 'B'),
        sfx('x2', 'Tax bar fills', 1.5, [fx(71852, 'Digital whoosh soft', 0.5), fx(614153, 'Gentle swish', 0.5), none()], 'A', why='A short airy swell matches the fill.'),
    ],
}
mrows = ''.join(f'<div class="f-mrow" style="top:{300 + 100 * j}px"><span>{n}</span><b>${v:.2f}</b></div>' for j, (_, n, v) in enumerate(PEOPLE[1:]))
CARD_POS = [(110, 250), (560, 250), (110, 440), (560, 440), (110, 630), (560, 630)]
REQUEST = round(sum(p[2] for p in PEOPLE[1:]), 2)
cards = ''.join(f'<div class="f-card k{j}"><i>{c}</i><span>{n}</span><b>${v:.2f}</b><span class="ck"></span></div>' for j, (c, n, v) in enumerate(PEOPLE[1:]))
s5 = {
    'id': 's5', 'name': 'Settle', 'dur': 3.0, 'truth': 'conceptual_ui', 'levels': 2,
    'purpose': 'Payoff: one press sends six requests; they land paid.',
    'copy': f'(UI) Request ${REQUEST:.2f} → six request cards, ticked',
    'notes': {'camera': 'Steady; the phone itself steps back to make room for the cards.', 'motion': 'The press squashes the button, then the cards lift out of the phone and land in two columns.', 'type': 'Card names 33 px, amounts mono.', 'music': 'A riser starts here and peaks into the logo.'},
    'html': '<div class="f-ph"><div class="f-scr">' + PHONE_TOP + '<div class="f-hd"><h4>Send it</h4><p>You paid · Maya</p></div>' + mrows + f'<div class="f-btn">Request ${REQUEST:.2f}</div><div class="f-ring"></div></div></div>' + cards,
    'anim': ring_path([(0.0, 0.01, 520, 1700, False), (0.15, 0.48, 374, 1258, True), (0.75, 1.0, 640, 1700, False)])
        + [{'s': '.f-ring', 't': [0.0, 0.2], 'f': {'o': 0}, 'to': {'o': 1}, 'e': 'out'}, {'s': '.f-ring', 't': [0.8, 1.0], 'to': {'o': 0}, 'e': 'lin'},
           {'s': '.f-btn', 't': [0.5, 0.58], 'f': {'s': 1}, 'to': {'s': 0.95}, 'e': 'out'}, {'s': '.f-btn', 't': [0.58, 0.85], 'to': {'s': 1}, 'e': 'm'},
           {'s': '.f-ph', 't': [0.8, 1.4], 'f': {'y': 0, 's': 1}, 'to': {'y': 560, 's': 0.7}, 'e': 'm'}]
        + [{'s': f'.k{j}', 't': [round(1.0 + 0.1 * j, 2), round(1.5 + 0.1 * j, 2)], 'f': {'x': 335, 'y': 1450, 's': 0.4, 'o': 0}, 'to': {'x': x, 'y': y, 's': 1, 'o': 1}, 'e': 'm'} for j, (x, y) in enumerate(CARD_POS)]
        + [{'s': f'.k{j}', 'set': 'paid', 'at': round(2.0 + 0.1 * j, 2)} for j in range(len(CARD_POS))],
    'decisions': {
        'transition': dec('Into this scene', 'A', [
            {'name': 'Hard cut on the beat', 'type': 'cut', 'why': 'The split is done; a clean cut resets attention for the payoff.'},
            {'name': 'Screen slides left', 'type': 'slide', 'why': 'Third slide in a row; consistent but predictable.'},
            {'name': 'Zoom through', 'type': 'zoom', 'why': 'More energy into the payoff; can feel like an effect for its own sake.'}]),
        'camera': dec('Camera', 'A', [
            {'name': 'Locked', 'cam': {}, 'why': 'The cards need a still frame to land into.'},
            {'name': 'Slow push', 'cam': {'s': [1, 1.05]}, 'why': 'Adds life; the top cards come close to the edge.'},
            {'name': 'Drift up', 'cam': {'y': [0, -40]}, 'why': 'Follows the cards upward.'}]),
        'vo': vo('s5', 0.7, ['Everyone pays their part.', 'Six requests, sent in one tap.', "Done before the waiter's back."], 'A'),
    },
    'sfx': [
        sfx('x1', 'Request press', 0.5, [fx(332713, 'Touch tap', 1.0), fx(256455, 'Mouse click', 0.9), fx(534103, 'Short press', 0.9)], 'A', hit=True, why='Same tap as the claims, so the action sounds like the same app.'),
        sfx('x2', 'Cards fly out', 1.0, [fx(554208, 'Card riffle', 0.7), fx(614153, 'Gentle swish', 0.6), fx(651514, 'Paper handling', 0.6)], 'A', why='Paper-like riffle for six cards leaving at once.'),
        sfx('x3', 'Riser into the logo', 0.0, [fx(685256, 'Riser, short', 0.55), fx(349698, 'Light slow swoosh', 0.6), none('No riser; the logo lands on its own.')], 'A', why='Builds toward the loudest moment of the film.'),
    ],
}
s6 = {
    'id': 's6', 'name': 'Logo', 'dur': 3.5, 'truth': 'conceptual_visual', 'levels': 2,
    'purpose': 'Brand and promise. The icon lands on the downbeat; the wordmark holds over a second.',
    'copy': "Crumb · Split it before the coffee's cold.",
    'notes': {'camera': 'Locked: the wordmark holds still.', 'motion': 'The icon falls in from a large scale, squashes about 6 % on contact and settles.', 'type': 'Wordmark 186 px (fits the widest display face); tagline 60 px, two text levels.', 'music': 'The icon lands at 18.0 s, a bar line at 120 BPM: the loudest moment.'},
    'html': '<div class="f-icon"></div><div class="f-wm">Crumb</div><div class="f-tag" data-copy>Split it before the coffee\'s cold.</div>',
    'anim': [
        {'s': '.f-icon', 't': [0.0, 0.5], 'f': {'y': 640, 's': 3.2}, 'to': {'y': 0, 's': 1}, 'e': 'power3'},
        {'s': '.f-icon', 't': [0.5, 0.58], 'f': {'sx': 1, 'sy': 1}, 'to': {'sx': 1.06, 'sy': 0.94}, 'e': 'out'},
        {'s': '.f-icon', 't': [0.58, 0.85], 'to': {'sx': 1, 'sy': 1}, 'e': 'm'},
        {'s': '.f-wm', 't': [0.55, 0.95], 'f': {'x': -50, 'o': 0}, 'to': {'x': 0, 'o': 1}, 'e': 'out'},
        {'s': '.f-tag', 't': [0.95, 1.35], 'f': {'y': 40, 'o': 0}, 'to': {'y': 0, 'o': 1}, 'e': 'out'},
    ],
    'decisions': {
        'transition': dec('Into this scene', 'A', [
            {'name': 'The phone collapses into the icon', 'type': 'zoom', 'why': 'The app becomes its own icon: the film\'s one carry into the logo.'},
            {'name': 'Accent flood from the button', 'type': 'iris', 'at': [50, 80], 'why': 'The request button floods the frame; loud, very on brand.'},
            {'name': 'Hard cut', 'type': 'cut', 'why': 'Clean end card; loses the carry.'}]),
        'camera': dec('Camera', 'A', [
            {'name': 'Locked', 'cam': {}, 'why': 'A wordmark reads best still.'},
            {'name': 'Slow push', 'cam': {'s': [1, 1.04]}, 'why': 'A little life on a long hold.'},
            {'name': 'Pull back', 'cam': {'s': [1.06, 1]}, 'why': 'Opens out as the tagline arrives.'}]),
        'vo': vo('s6', 0.6, ["Crumb. Split it before the coffee's cold.", 'Crumb. Every bill, settled.', 'Crumb. Fair, fast, done.'], 'A',
                 {'A': "Split it before the coffee's cold.", 'B': 'Every bill, settled.', 'C': 'Fair, fast, done.'}),
    },
    'sfx': [
        sfx('x1', 'Icon lands (loudest moment)', 0.5, [fx(767613, 'Metal ring drop', 0.9), fx(406586, 'Heavy paper drop', 1.0), fx(388958, 'Soft snap', 1.0)], 'B', hit=True,
            why='The final mix layers the Mixkit low impact under this (render-only, so this page cannot play it).'),
    ],
}

D = {
    'project': {'id': '011-crumb', 'product': 'Crumb', 'fictional': True, 'feature': 'A 21-second 9:16 app film: split a group dinner bill from one receipt photo.',
                'format': '9:16', 'w': 1080, 'h': 1920, 'fps': 30, 'engine': 'HyperFrames 0.8.134', 'status': 'Awaiting creative approval'},
    'summary': {'tone': 'Warm, quick and a little funny.', 'audience': 'friends who eat out together', 'message': 'Crumb turns one restaurant receipt into everyone\'s fair share in three taps.', 'arc': 'Hook → scan → claim → split → settle → logo'},
    'directions': {'chosen': 'A', 'options': [
        {'id': 'A', 'name': 'Diner receipt', 'pitch': 'Warm receipt paper, ink and one tomato-red accent. Feels like the table you just ate at.',
         'why': 'The product starts from a paper receipt; the look carries that object through the whole film.', 'tradeoff': 'Quieter on a busy feed than C.',
         'tokens': {'bg': '#F2ECE0', 'on-bg': '#1D1A16', 'card': '#FFFDF9', 'on-card': '#1D1A16', 'muted': '#776D61', 'line': '#E7DFD1', 'paper': '#FBF7EE', 'on-paper': '#1D1A16', 'accent': '#D9432A', 'on-accent': '#FFFFFF', 'frame': '#1D1A16', 'display': "'Fraunces', Georgia, serif", 'ui': "'IBM Plex Sans', Arial, sans-serif", 'mono': "'IBM Plex Mono', Menlo, monospace"}},
        {'id': 'B', 'name': 'Midnight ledger', 'pitch': 'Deep navy, warm amber, crisp geometric type. Late dinner, serious money.',
         'why': 'Signals trust for a payments feature.', 'tradeoff': 'Less playful; the paper receipt is the only warm surface.',
         'tokens': {'bg': '#0F1B2D', 'on-bg': '#EEF2F8', 'card': '#15243A', 'on-card': '#EEF2F8', 'muted': '#93A2B7', 'line': '#26364F', 'paper': '#F4F1EA', 'on-paper': '#1B1A17', 'accent': '#F2B33D', 'on-accent': '#1A1203', 'frame': '#04080F', 'display': "'Sora', Arial, sans-serif", 'ui': "'Inter', Arial, sans-serif", 'mono': "'IBM Plex Mono', Menlo, monospace"}},
        {'id': 'C', 'name': 'Citrus pop', 'pitch': 'Tangerine field, white UI, electric-blue accent, chunky grotesque. Loud and friendly.',
         'why': 'Stops the scroll in a 9:16 feed.', 'tradeoff': 'Risks feeling like a generic consumer-app ad.',
         'tokens': {'bg': '#FF7A1A', 'on-bg': '#1A1208', 'card': '#FFFFFF', 'on-card': '#17120B', 'muted': '#6F655B', 'line': '#EFE6DC', 'paper': '#FFF8EF', 'on-paper': '#17120B', 'accent': '#2737FF', 'on-accent': '#FFFFFF', 'frame': '#17120B', 'display': "'Bricolage Grotesque', Arial, sans-serif", 'ui': "'DM Sans', Arial, sans-serif", 'mono': "'IBM Plex Mono', Menlo, monospace"}},
    ]},
    'global': {
        'music': {'label': 'Music bed', 'chosen': 'A', 'options': [
            {'id': 'A', 'name': 'Bell Beats', 'src': 'audio/music/A.mp3', 'bpm': 120, 'phase': 0, 'lic': 'Freesound 414441 · CC0 · BuytheField', 'why': 'Quiet first bar, then the beat drops at 2.0 s, right where the total lands. Playful bells suit a dinner app. Measured 120 BPM (librosa says 96).'},
            {'id': 'B', 'name': 'Tropicorp Advertisement', 'src': 'audio/music/B.mp3', 'bpm': 101.98, 'phase': 0, 'lic': 'Freesound 561190 · CC0 · code_box', 'why': 'Bright, steady corporate pulse; safest under the voice, but generic. Measured 102 BPM.'},
            {'id': 'C', 'name': 'Wet Square Techno Beat', 'src': 'audio/music/C.mp3', 'bpm': 127.02, 'phase': 0, 'lic': 'Freesound 170601 · CC0 · Detski', 'why': 'Driving techno with a strong kick; energetic, but it fights a soft voice and a warm look. Measured 127 BPM.'}]},
        'motion': {'label': 'Motion feel', 'chosen': 'A', 'options': [
            {'id': 'A', 'name': 'Weighted spring', 'ease': 'spring', 'why': 'About 2.5 % overshoot on UI pieces, none on type: things land with weight.'},
            {'id': 'B', 'name': 'Crisp (power3)', 'ease': 'power3', 'why': 'Clean decelerations, no overshoot; calmer and more corporate.'},
            {'id': 'C', 'name': 'Snappy (power5)', 'ease': 'snappy', 'why': 'Fast starts and hard stops; energetic, can feel mechanical.'}]},
        'pacing': {'label': 'Pacing', 'chosen': 'B', 'options': [
            {'id': 'A', 'name': 'Tight · 18.9 s', 'scale': 0.9, 'why': 'Every scene 10 % shorter; the voice lines get tight.'},
            {'id': 'B', 'name': 'Standard · 21.0 s', 'scale': 1.0, 'why': 'Hits land on the 120 BPM grid at this pace.'},
            {'id': 'C', 'name': 'Relaxed · 23.5 s', 'scale': 1.12, 'why': 'More air for reading; hits drift off the beat grid.'}]},
    },
    'engine': {'name': 'HyperFrames 0.8.134', 'why': 'Code-drawn phone UI, kinetic type and one seekable GSAP timeline; matches the installed Claude plugin; 0 ms audio lag measured on 2026-10-06.',
               'alt': 'bang-motion 1.19.0 (same GSAP stack, one index.html) or video-shotcraft (when a real product with real screens exists).', 'fallback': 'bang-motion'},
    'references': [
        {'name': 'brag-slim launch videos (_kits/brag, MIT)', 'borrow': 'entry → key action → result; the hook in two seconds; every frame postable', 'avoid': 'confetti, synth chimes, the Kokoro voice', 'scenes': 'Hook, Claim, Settle'},
        {'name': 'Showreel gist, mobile mode (mirzemehdi)', 'borrow': 'code-drawn phone, touch ring with a press, screen pushes, cards lifting out of the phone', 'avoid': 'particle bursts, camera shake, a synthesized score', 'scenes': 'Scan, Claim, Settle'},
        {'name': 'Our 010 MIRA', 'borrow': 'one object carried through every boundary; the accent lands inside the logo', 'avoid': 'a dark, slow opening; flat cards with no depth', 'scenes': 'Scan, Logo'},
    ],
    'style_rules': {
        'Colour': 'From the direction tokens only: one accent; text on the stage uses on-bg, inside the phone on-card.',
        'Type': 'One display face, one UI face, mono for money. At most two text levels; captions ≥ 5 % and UI ≥ 3 % of frame height after the camera push.',
        'Shape': 'Phone 780 × 1500, 108 px radius; pills and avatars round; cards 30 px radius.',
        'Motion': 'Springs with weight, overlap and follow-through; overshoot ≤ 4 % on UI, never on type; no pure opacity fades in production.',
        'Camera': 'Steady on UI; pushes land and stop; no handheld shake.',
        'Sound': 'Recorded foley only, fewer sounds than beats, airy whooshes, the logo landing is the loudest moment.',
    },
    'audio_notes': [
        'The voice leads; the bed ducks about 8 dB under each line (you hear this live here).',
        'Final mix: −14 LUFS, true peak ≤ −1 dBTP, checked by cross-correlation and on an SFX-only stem.',
        'The final adds a Mixkit low impact under the icon landing and one shimmer tail; both are render-only, so this page cannot play them.',
    ],
    'qa': [
        {'level': 'warn', 'text': 'Crumb, Nonna\'s and the seven names are made up; check the name before any public post.'},
        {'level': 'warn', 'text': 'Previs fidelity: layout and motion are rough; type polish, masks and depth happen in production.'},
        {'level': 'ok', 'text': 'Fonts load from Google here; the HyperFrames build vendors them as local woff2 files.'},
    ],
    'versions': [{'v': 'v0.1', 'date': '2026-10-06', 'note': 'First previs: three directions, three beds, three motion feels, three pacings, three options on every scene decision.'},
                 {'v': 'v0.2', 'date': '2026-10-06', 'note': 'Self-check fixes before your review: the hook reads from frame 0, and the wordmark fits the frame in every look.'}],
    'film_css': FILM_CSS,
    'fonts_url': 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&family=Sora:wght@500;600&family=Inter:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600&family=DM+Sans:wght@400;500;700&display=swap',
    'scenes': [s1, s2, s3, s4, s5, s6],
}


# ---------------------------------------------------------------- plain names for click-to-comment, and the storyboard thumbnail moment
import re as _re
NAMES = [('class="f-hl"', 'Headline'), ('class="f-rc"', 'Receipt'), ('class="f-tot"', 'Receipt total'), ('class="f-ph"', 'Phone'), ('class="f-vf"', 'Camera view'),
         ('class="f-shut"', 'Shutter button'), ('class="f-scan"', 'Scan line'), ('class="f-pill"', 'Status pill'), ('class="f-hd"', 'Screen title'), ('class="f-ring lt"', 'Finger'),
         ('class="f-ring"', 'Finger'), ('class="f-barw"', 'Tax and tip bar'), ('class="f-ok"', 'All squared pill'), ('class="f-btn"', 'Request button'), ('class="f-icon"', 'App icon'),
         ('class="f-wm"', 'Wordmark'), ('class="f-tag"', 'Tagline')]
DISH = [n.replace('&amp;', 'and') for n, _ in ROWS]
def name_html(h):
    for pat, nm in NAMES:
        h = h.replace(pat, pat + f' data-name="{nm}"')
    h = _re.sub(r'class="f-li b(\d)"', lambda m: f'class="f-li b{m.group(1)}" data-name="Dish: {DISH[int(m.group(1))]}"', h)
    h = _re.sub(r'class="f-av v(\d)"', lambda m: f'class="f-av v{m.group(1)}" data-name="Diner: {PEOPLE[int(m.group(1))][1]}"', h)
    h = _re.sub(r'class="f-pp q(\d)"', lambda m: f'class="f-pp q{m.group(1)}" data-name="{PEOPLE[int(m.group(1))][1]}\'s share"', h)
    h = _re.sub(r'class="f-card k(\d)"', lambda m: f'class="f-card k{m.group(1)}" data-name="Request: {PEOPLE[int(m.group(1)) + 1][1]}"', h)
    return h
KEYS = {'s1': 2.4, 's2': 2.6, 's3': 3.9, 's4': 2.9, 's5': 2.6, 's6': 2.0}
for sc in D['scenes']:
    sc['html'] = name_html(sc['html'])
    sc['key'] = KEYS[sc['id']]


# ---------------------------------------------------------------- the director's plan
D['chief'] = {
    'objective': 'Show in 21 seconds that one receipt photo becomes everyone\'s fair share.',
    'thesis': 'The receipt is the hero object: it is carried from paper into the phone and ends as the logo\'s promise.',
    'feeling': 'Curiosity → relief → satisfaction',
    'depth': 'Small product film: one combined approval gate instead of five, ten specialists active, four not needed.',
}
D['story'] = [
    {'beat': 'Hook', 'scene': 's1', 'viewer': 'Seven people, one long bill: who pays what?'},
    {'beat': 'Discovery', 'scene': 's2', 'viewer': 'Crumb can read the receipt from a photo.'},
    {'beat': 'Proof', 'scene': 's3', 'viewer': 'Claiming dishes is a tap per name.'},
    {'beat': 'Payoff', 'scene': 's4', 'viewer': 'Everyone\'s share, tax and tip included, adds up.'},
    {'beat': 'Resolution', 'scene': 's5', 'viewer': 'Money requests go out in one tap and come back paid.'},
    {'beat': 'Call to action', 'scene': 's6', 'viewer': 'The name and the promise.'},
]
D['directors'] = [
    {'id': 'story', 'group': 'Story', 'name': 'Story director', 'active': True, 'owns': ['storyline'], 'summary': 'Hook → discovery → proof → payoff → resolution → name. One idea per shot; the receipt connects them.', 'why': 'A bill-splitting app is understood fastest as before and after: one bill, then seven fair shares.'},
    {'id': 'script', 'group': 'Story', 'name': 'Script and voice director', 'active': True, 'owns': ['vo'], 'summary': 'Six short lines for Sarah, three wordings each, at most 3.4 words a second; the last line is also the tagline.', 'why': 'Short lines leave room for the taps and sounds to be heard.'},
    {'id': 'editorial', 'group': 'Story', 'name': 'Editorial director', 'active': True, 'owns': ['pacing', 'transition'], 'summary': 'Shots of 3.0 to 4.5 s; cuts on the beat only for the two hits (total and logo); the longest shot is the key action.', 'why': 'Varying shot length and saving the beat for big moments keeps it from feeling like a music video.'},
    {'id': 'art', 'group': 'Look', 'name': 'Art director', 'active': True, 'owns': ['direction'], 'summary': 'Three looks: diner receipt (recommended), midnight ledger, citrus pop.', 'why': 'The paper receipt is the product\'s own starting point, so the recommended look grows out of it.'},
    {'id': 'design', 'group': 'Look', 'name': 'Design and styleframe director', 'active': True, 'owns': ['style'], 'summary': 'One accent colour, a code-drawn phone, money in a mono face, two text levels at most.', 'why': 'Premium means subtracting: no decorative cards or borders.'},
    {'id': 'type', 'group': 'Look', 'name': 'Typography director', 'active': True, 'owns': ['type'], 'summary': 'One display face per look, one UI face, mono for amounts; headline 108 px, UI text at least 3 % of the frame after the push-in.', 'why': 'It has to read on a phone held at arm\'s length.'},
    {'id': 'refs', 'group': 'Look', 'name': 'Reference director', 'active': True, 'owns': ['references'], 'summary': 'brag-slim launch videos, the showreel gist\'s phone mode, our own 010 MIRA. Grammar only, never content.', 'why': 'Each reference lends one principle; see the list for what we avoid.'},
    {'id': 'camera', 'group': 'Motion', 'name': 'Camera director', 'active': True, 'owns': ['camera'], 'summary': 'Steady on UI, slow pushes to make text readable, a locked frame for the logo.', 'why': 'Product films keep the camera calm; each move has a reason written on the shot.'},
    {'id': 'motion', 'group': 'Motion', 'name': 'Motion director', 'active': True, 'owns': ['motion'], 'summary': 'Weighted springs with about 2.5 % overshoot on UI, none on type; the finger presses before anything reacts.', 'why': 'Cause before effect is what makes UI motion believable.'},
    {'id': 'transitions', 'group': 'Motion', 'name': 'Transition director', 'active': True, 'owns': ['transition'], 'summary': 'Receipt zooms into the viewfinder, screens slide, a hard cut resets for the payoff, the phone collapses into the icon.', 'why': 'Every boundary carries something across; a cut is used where a reset helps.'},
    {'id': 'music', 'group': 'Sound', 'name': 'Music director', 'active': True, 'owns': ['music'], 'summary': 'Bell Beats at a measured 120 BPM: quiet first bar, drop at 2.0 s on the total, the logo on the bar at 18.0 s.', 'why': 'The track\'s own structure gives the two hits; we cut on phrases, not every beat.'},
    {'id': 'sfx', 'group': 'Sound', 'name': 'Sound design director', 'active': True, 'owns': ['sfx'], 'summary': 'Recorded foley only: paper, touch taps, a soft whoosh per move, a riser into the logo, one landing.', 'why': 'Real sounds for real actions; fewer sounds than beats.'},
    {'id': 'mix', 'group': 'Sound', 'name': 'Mix director', 'active': True, 'owns': ['mix'], 'summary': 'Voice leads; music ducks about 8 dB under each line; the logo landing is the loudest moment; master −14 LUFS.', 'why': 'A non-expert hears the words first and feels the landing.'},
    {'id': 'assets', 'group': 'Production', 'name': 'Asset director', 'active': True, 'owns': ['assets'], 'summary': 'Everything is drawn in code or recorded CC0 audio; no screenshots exist because Crumb is made up.', 'why': 'See the asset list for each item\'s source and licence.'},
    {'id': 'engine', 'group': 'Production', 'name': 'Engine director', 'active': True, 'owns': ['engine'], 'summary': 'HyperFrames 0.8.134 for every shot (one film, one engine).', 'why': 'Code-drawn UI and type on one seekable timeline; 0 ms audio lag measured.'},
    {'id': 'pipeline', 'group': 'Production', 'name': 'Pipeline director', 'active': True, 'owns': ['pipeline'], 'summary': 'After approval: freeze the spec, build shot by shot with stills, one render, self-check (your call for this sample).', 'why': 'No renders until you approve; one worker, no parallel renders.'},
    {'id': 'qa', 'group': 'Production', 'name': 'QA director', 'active': True, 'owns': ['qa'], 'summary': 'Checks timing, beat hits, voice speed, text levels and product truth for your current picks.', 'why': 'Issues are cheapest to fix here, before any render.'},
    {'id': 'vfx', 'group': 'Not needed', 'name': 'VFX and compositing director', 'active': False, 'summary': 'Not used.', 'why': 'No footage to composite; house rules ban glows and particles anyway.'},
    {'id': 'lighting', 'group': 'Not needed', 'name': 'Lighting director', 'active': False, 'summary': 'Not used.', 'why': 'Flat 2D UI film; no 3D scene to light.'},
    {'id': 'broll', 'group': 'Not needed', 'name': 'B-roll and caption director', 'active': False, 'summary': 'Not used.', 'why': 'No talking head or footage; the voice lines are short.'},
    {'id': 'color', 'group': 'Not needed', 'name': 'Colour grading director', 'active': False, 'summary': 'Not used.', 'why': 'Colours come straight from the chosen look\'s tokens.'},
]
D['assets'] = [
    {'name': 'Crumb UI, phone, receipt, icon', 'kind': 'new', 'source': 'Drawn in code (HTML/CSS)', 'licence': 'Self-made', 'truth': 'Made-up product'},
    {'name': 'Sarah voice, 18 takes', 'kind': 'generated', 'source': 'Fish Audio s2.1-pro-free', 'licence': 'Free grant, commercial OK', 'truth': ''},
    {'name': 'Music beds A, B, C', 'kind': 'existing', 'source': 'Freesound 414441, 561190, 170601', 'licence': 'CC0', 'truth': ''},
    {'name': 'Foley: taps, clicks, paper, whooshes, riser', 'kind': 'existing', 'source': 'Freesound (ids on each sound)', 'licence': 'CC0', 'truth': ''},
    {'name': 'Low impact and shimmer under the logo', 'kind': 'existing', 'source': 'Mixkit via video-shotcraft', 'licence': 'Render-only (not on this page)', 'truth': ''},
    {'name': 'Fonts: Fraunces, IBM Plex, Sora, Inter, Bricolage, DM Sans', 'kind': 'existing', 'source': 'Google Fonts', 'licence': 'OFL', 'truth': ''},
]
D['gates'] = [
    {'name': 'Direction', 'covers': 'look, references, tone'},
    {'name': 'Story', 'covers': 'shots, order, script'},
    {'name': 'Look', 'covers': 'styleframes, type, colours'},
    {'name': 'Animatic', 'covers': 'timing, motion, sound'},
    {'name': 'Production', 'covers': 'engine, assets, plan'},
]
D['pipeline'] = {'engine': 'HyperFrames 0.8.134', 'steps': ['Freeze approved-video-spec.json', 'Vendor fonts locally', 'Build shot by shot, check a still of each', 'hyperframes check', 'One draft render, one worker', 'Self-check: contact sheet, phone sheet, loudness, sync', 'Final render'], 'formats': '1080×1920, 30 fps, H.264 + AAC', 'estimate': 'About 2–3 h of build, one render of about 40 s'}
D['changes'] = [
    {'v': 'v0.2', 'target': 'Shot 1: Hook', 'change': 'The headline is on screen from the first frame and the receipt starts half in view, instead of an empty first frame.', 'reason': 'House rule: frame 0 already reads'},
    {'v': 'v0.2', 'target': 'Shot 6: Logo', 'change': 'Wordmark 220 px → 186 px and kept on one line.', 'reason': 'In Midnight ledger and Citrus pop the wider faces ran off the right edge'},
]

from libraries import add_libraries
add_libraries(D, PAGE)
D['assets'] += [
    {'name': 'Voice library: 9 more voices × 18 lines (English and Hindi)', 'kind': 'generated', 'source': 'Fish Audio s2.1-pro-free (public Fish voices, no real-person clones)', 'licence': 'Free grant, commercial OK', 'truth': ''},
    {'name': 'Music library: 11 more beds (24 s excerpts)', 'kind': 'existing', 'source': 'Freesound 679738, 671900, 629170, 670039, 395037, 639933, 335361, 655615, 566952, 607304, 384202', 'licence': 'CC0', 'truth': ''},
    {'name': 'Library looks: 8 more token sets and fonts', 'kind': 'new', 'source': 'Designed for this previs; Google Fonts', 'licence': 'Self-made / OFL', 'truth': ''},
]
for d in D['directors']:
    if d['id'] == 'script': d['owns'] = ['vo', 'voice']
D['versions'].append({'v': 'v0.3', 'date': '2026-10-06', 'note': 'Option libraries: 8 more looks, 11 more music beds, 7 motion feels, camera moves, transitions and a voice library (English and Hindi). Ask the director can add any of them.'})
D['changes'] += [
    {'v': 'v0.3', 'target': 'Whole film: Voice', 'change': 'New "Which voice?" choice: Sarah, calm Indian English, or the whole film in Hindi; 7 more voices in the library.', 'reason': 'the reviewer asked for other voices and languages'},
    {'v': 'v0.3', 'target': 'Whole film: libraries', 'change': 'Look, music, motion, pacing, camera, transition and sound libraries the reviewer can add from.', 'reason': 'the reviewer asked for more than three options'},
]
# v0.4 (the reviewer's note 0x5f4518cvpnakd3z1qy, applied by Claude on claude.ai): seven friends in the hook headline only.
D['versions'].append({'v': 'v0.4', 'date': '2026-10-06', 'note': 'Hook headline now reads "Seven friends. One receipt."'})
D['changes'].append({'v': 'v0.4', 'target': 'Shot 1: Hook', 'change': 'Headline "Six friends. One receipt." → "Seven friends. One receipt."', 'reason': 'the reviewer asked for seven friends instead of six'})
# v0.5 (the reviewer, 2026-10-06 07:20 UTC: "Seven everywhere"): the voice, the claims, the amounts and the requests follow seven friends.
D['versions'].append({'v': 'v0.5', 'date': '2026-10-06', 'note': 'Seven friends everywhere: new voice takes for three lines in all 10 voices, a seventh diner (Ravi), seven amounts and six request cards.'})
D['changes'] += [
    {'v': 'v0.5', 'target': 'Shots 1 and 5: Voice', 'change': '"Six friends" → "Seven friends", "Six people" → "Seven people", "Five requests" → "Six requests"; re-recorded in all 10 voices (English and Hindi).', 'reason': 'the reviewer chose seven friends everywhere'},
    {'v': 'v0.5', 'target': 'Shot 3: Claim', 'change': 'A seventh person, Ravi (R), in the tray; Risotto now L + R, Branzino J + P; chip reads "All 7".', 'reason': 'Seven diners need seven avatars and claims that add up'},
    {'v': 'v0.5', 'target': 'Shot 4: Split', 'change': 'Seven amounts that follow the claims (food share plus tax and tip in proportion), still totalling $186.40.', 'reason': 'The amounts now match what each person ate'},
    {'v': 'v0.5', 'target': 'Shot 5: Settle', 'change': f'Six request cards in a 2 × 3 grid; the button reads Request ${REQUEST:.2f}.', 'reason': 'Maya paid, so six friends get a request'},
]
(PAGE / 'previs.json').write_text(json.dumps(D, ensure_ascii=False, indent=1))
n = 4 + sum(len(s['decisions']) + len(s.get('sfx', [])) for s in D['scenes'])
print('previs.json written:', round(sum(s['dur'] for s in D['scenes']), 2), 's,', len(D['scenes']), 'scenes,', n, 'decisions')
