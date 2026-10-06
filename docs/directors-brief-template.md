# Director's brief (template)

Fill this in `projects/NNN-name/BRIEF.md` before planning anything over 15 s. Infer what you can from the product and ask the owner only what you can't.

## The film in one line
`<who it is for> sees <what> and feels <what>; it ends on <the promise>.`

## Facts
- Product and link:
- Audience and where it will be posted:
- Length and formats: `<e.g. 20 s, 16:9 first, then 9:16>`
- Engine (and why): see "Which tool for which job" in `AGENTS.md`.
- Use: personal, own brand, client or monetized (decides which tools and assets are allowed).

## Real assets
- UI (screenshots or a URL to capture), logo, fonts, colour tokens, copy.
- For a made-up brand: the tokens you invent, kept the same across shots.

## References
- 1–3 films whose grammar you borrow (rhythm, camera, transitions) and what you will **not** take from them (content, logos, characters).

## Beat sheet (on the measured grid)
| Beat | Time | State on screen | Carry into the next beat | Voice line | Sound |
|---|---|---|---|---|---|
| Hook | 0–2 s | | | | |
| … | | | | | |
| End card | | | | | |

One state per beat; something carried across every boundary; the hook lands by 2 s.

## On-screen text
At most two text levels at once; every line readable at 360 px.

## Voice-over
- Voice: the owner's default (`OWNER.md`) unless the film needs another.
- Lines: one per beat, three wordings each, at most 3.4 words per second.

## Music and sound
- Bed: measured BPM and phase, energy curve, where the drop lands.
- Foley: the real action sounds (clicks, keys, switches) and the cinematic layer (soft whooshes, one impact, one riser).

## Gates
- Previs approved in the page → `approved-video-spec.json` → `SHOTLIST.md` → build → critique loop → owner review → final render.

## Deliverables
- `renders/<name>.mp4` per format, −14 LUFS, true peak ≤ −1 dBTP, plus `VERIFY.md` with the scores.
