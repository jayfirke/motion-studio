# Crumb — a worked previs example

Crumb is a made-up bill-splitting app. This folder holds the plan of its 21-second launch film as code: six scenes, 34 decisions with three options each, option libraries (looks, music, motion, camera, transitions, sounds, voices), the director team, assets, gates and QA. Run it to rebuild the demo film's data:

```bash
PREVIS_PAGE=_shared/previs/studio/films/011-crumb .venv/bin/python examples/crumb-previs/build_previs.py
python3 -m http.server 5193 --directory _shared/previs/studio      # then open http://localhost:5193
```

- `build_previs.py` — scenes as HTML styleframes plus tweens, decisions, versions and changes. Copy it to start a new film.
- `libraries.py` — the extra looks, motion feels, pacing, camera moves, transitions and voices behind "More options".
- `music_lib.json` — eleven CC0 music beds from Freesound with measured BPM and phase (credits in `CREDITS.md`).
- `vo-lines.txt`, `voices/` — the voice lines (three wordings each, English and Hindi) and the voice list. The demo ships Sarah's takes only; record the other voices on your own free Fish key with `bash examples/crumb-previs/voices/make_voices.sh` and copy them into the data pack.
