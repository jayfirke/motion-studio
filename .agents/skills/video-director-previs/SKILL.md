---
name: video-director-previs
description: Plan a film as its director and show it to the owner as a playable previs page (animatic with real voice, music and foley, a timeline, three swappable options on every decision, time-anchored notes, versions and an Approve button) before anything is rendered. Use for every new film over 10 s, when the owner asks to "see it first", "previs", "storyboard", "animatic", or "visualize before you render", and when they leave notes on a previs page. Produces approved-video-spec.json for the engine skills; never renders the final itself.
---

# video-director-previs

Make expensive creative decisions at the cheapest stage. This skill owns pre-production: direction, story, script, storyboard, styleframes, animatic, music, SFX, voice, engine choice, QA, review, versions and approval. Engines (HyperFrames, video-shotcraft, Remotion, motion-reel, bang-motion, Diffusion Studio) only build what the owner approved.

Worked example: `examples/crumb-previs/` (a made-up bill-splitting app). Its data pack is the demo film in Previs Studio (`_shared/previs/studio/films/011-crumb/`).

**The app never changes per film.** Previs Studio is one fixed React + TypeScript app (source `_shared/previs/app/`, see its README). `npm run build` there type-checks, bundles and inlines it into `_shared/previs/studio/index.html` and `_shared/previs/page/index.html` (template); add a target in `scripts/inline.mjs` for each per-film page. `npm run smoke` drives the built page in real Chrome at desktop, tablet, phone and full screen (screenshots with `--out`). Never hand-edit the built `index.html`.

What the owner gets: Watch (video-style player with true full screen, hover-scrub preview, end card; comment mode that names the smallest part under the pointer, scroll for bigger or smaller, drag a box around several parts, pen and arrow, drag across the shots row for a time range; sound lanes with waveforms, beats, the duck curve, solo/mute/volume and draggable SFX that snap to the beat), choices that replay their moment in place with sound, side-by-side compare, hold-to-hear-the-original, Storyboard (cards that play their shot in place, Play all, per-shot choices, a shot sheet), Plan (chief director, story, director team, look, sound, assets, production, checks, versions with "ask to undo", spec export), a guided review, Ask the director, ⌘K search, undo/redo, light and dark themes, tooltips on every control. Films arrive only as data packs.

## Two homes, same app
- **Previs Studio (all films):** `_shared/previs/studio/`. Add a film = add `films/<id>/previs.json` + `films/<id>/audio/...` and a row in `films.json`. Locally: `python3 -m http.server --directory _shared/previs/studio` (or the `previs-studio` entry in `.claude/launch.json`).
- **Per-film page:** `projects/NNN/previs/page/` holds a copy of the same `index.html` (title `<Product> Previs`), `films.json` with one row whose `path` is `""`, `previs.json` and `audio/`.
- **As a claude.ai Artifact (Claude only):** publish the page with `capabilities: {"db": {}, "user": {}, "sample": {}, "comments": {}, "downloads": true}`. `db` stores notes and picks, `sample` powers Ask the director, `comments` carries "Send to Claude Code", `downloads` the spec export. Without them the page still works and saves in the browser.
- Database paths: **comments** (change requests pinned to the film; the collection keeps the old name) `films/<id>/notes` (`kind` frame, region, range, sound, shot, revert or request; `target`, `targets`, `box`, `strokes`, `quick` chips, `t`/`t2`, `picks` and `version` at the time); picks and sound tweaks `films/<id>/state/picks` (`tweaks`: `<scene>.<sfx>` `{dt, db}`, `lane.vo|music|sfx` `{db}`, `mix.duck` `{on}`); added options `films/<id>/state/custom`; approval `films/<id>/state/approval`; Claude's status `films/<id>/state/claude`; activity `films/<id>/activity`; **notes** (free thoughts about the whole film: read them as background, never as tasks) `films/<id>/pad`.

## Libraries: more than three options on demand
Every decision ships three director options; `D['libraries']` adds more the reviewer (or the Ask tab) can pull in: `direction` (looks: token sets + `fonts_url`), `music` (CC0 beds with `bpm`, `phase`, `tags`, `level`), `motion` (`ease`, `spring {f,d}` or `bezier`), `pacing`, `camera`, `transition`, `sfx` (every sound in the film) and `voice` (Fish voices: `dir`, `durs`, `texts` for other languages, `intro`, `sample`). The global `voice` decision picks the narrator; a voice resolves each line to `<dir><scene>-<A|B|C>.mp3`, and a voice with `needs` and no `dir` plays as captions until it is recorded. Added options live in the page database, are undoable, and go into the approved spec. Build libraries with `examples/crumb-previs/libraries.py` as the model:
- Music: search Freesound CC0 (`freesound.py search ... --min-dur 20`), `freesound.py get`, then `python3 _shared/previs/music_lib.py <page>/audio/music/lib <oggs>` (beat-aligned 24 s excerpts, measured BPM); write tags and a why per bed; ledger rows in `_shared/ASSETS.md`.
- Voices: pick public Fish voices with `search_voices` (no real-person or character clones), list them in `voices/voices.tsv`, write `voices/lines-<lang>.txt`, run `voices/make_voices.sh` (free model), then spot-check takes with whisper-cli and regenerate any that drop words.
- The AI director (Ask tab, `lib/director.ts`) can also design looks (contrast-checked, allowed Google fonts), motion feels and new line wordings (those need a recording: it files a request note for Claude Code).

## Claude Code's side of the notes (do this every round)
The owner sends notes from the page ("Send to Claude Code": a live comment that wakes a watching session, or a copied message). Then:
0. **Pull before you change.** Claude on claude.ai can answer a "Send to Claude Code" thread by itself, edit the data file and publish a new version. Before building, read the published `previs.json`, compare it with your local build, and port any change into `build_previs.py` so the next build keeps it.
1. Set `films/<id>/state/claude {state:"reading"|"working"|"publishing"|"idle", at, message, version, open}` so the page shows what you are doing.
2. For each open note: `update` it with `claude: {state:"seen"}` when read, `{state:"working"}` while changing, then `status:"done"`, `claude:{state:"done", at, msg}` and append `{by:"claude", text, at}` to `replies` (pin `if_version`). Use `state:"question"` (with the question in `msg`) when you need the owner, `"wontfix"` when you recommend keeping it. Notes with `kind:"request"` are jobs from the Ask tab (record a new line, find a sound); `prefer` points at the option the owner likes; `intent:"question"` wants an answer, not a change.
   Every `at` is the real time: take it from `date -u +%Y-%m-%dT%H:%M:%SZ`, never a guess.
3. Add lines to `films/<id>/activity` (`{at, by:"claude", kind:"seen"|"applied"|"published"|"question", text, version}`): what you read, what you changed, what you published.
4. Reply in the page comment thread if the owner used Send to Claude Code, then resolve it.

## Rules
- **One director, no committee.** Work through the specialist checklist below yourself, in order. No workflows or sub-agents unless the owner asks (cost rule).
- **Infer aggressively; ask only true blockers** (product truth, a missing asset, a licence question). Never a long questionnaire before the owner sees something.
- **Three options on every decision, by default.** Direction, music, motion feel, pacing, and per scene: transition, camera, voice line, each SFX event. Options must be genuinely different. Mark the director's pick and give each option one plain sentence of why or trade-off. "Nothing" is a valid SFX option.
- **Product truth.** Every scene is labelled `real_ui`, `conceptual_ui`, `conceptual_visual` or `external_footage`; anything not real shows a label in the player.
- **House rules still apply** (AGENTS.md, OWNER.md): banned clichés, carries, two text levels, recorded foley, the default voice, licences. The page only plays CC0 or self-made audio; Mixkit (render-only) appears by name only.
- **Scale down.** A 6 s sting can be one direction card, 3 music options and a 6 s animatic. A 40 s product film gets the full set.
- **Locks.** Once the owner approves, story, copy, order, timing and picks are locked. A later note changes only its target; list what you preserved.

## Specialist checklist (the director covers each, briefly)
Story (hook by 2 s, one state per beat) · script and voice lines (words per second ≤ 3.4) · editorial pacing (vary shot length, rests, not every cut on the beat) · art direction (3 directions as token sets: bg, on-bg, card, on-card, muted, line, paper, on-paper, accent, on-accent, frame, display, ui, mono) · typography · references (borrow / avoid / where used; grammar, never content) · camera (every move has a reason) · motion (purpose, ease, overshoot ≤ 4 % on UI, none on type) · transitions (a simple cut is valid) · assets (existing / new / generated / placeholder, with licence) · music (measured BPM and phase, energy curve, where the drop lands) · SFX (asset, time, trigger, gain, why) · mix (voice leads, duck 8 dB, impact loudest) · engine (chosen, why, alternative, fallback) · QA.

## Files (one folder per film)
```
projects/NNN-name/previs/
  build_previs.py          # writes page/previs.json; copy examples/crumb-previs/build_previs.py and edit (scenes = HTML styleframe + anim tweens)
  vo-lines.txt             # 3 wordings per line, for fish_tts.py
  page/index.html          # built by _shared/previs/app (npm run build; add this page as a target in scripts/inline.mjs)
  page/films.json          # [{"id": "NNN-name", "name": "Product", "path": ""}]
  page/previs.json         # the whole plan
  page/audio/{music,vo,sfx}/
  changes.jsonl            # append-only change log, one op per line
  approved-video-spec.json # written by _shared/previs/freeze_spec.py after approval
```

## Steps
1. **Read** the brief or one-line ask and the product source (real UI, tokens, copy). Write `BRIEF.md` with the inferred decisions.
2. **Audio** (cheap, local):
   - Beds: measure tempo and phase by comb fit over 85–150 BPM on a low-band onset envelope (`AGENTS-tooling.md`, "Previs"); cut 24 s excerpts starting on a beat, loudnorm to −18 LUFS: `ffmpeg -ss <phase> -t 24 -i bed.wav -af "loudnorm=I=-18:TP=-2,afade=t=out:st=22.5:d=1.5" page/audio/music/A.mp3`.
   - Voice: `python3 _shared/tools/fish_tts.py --lines previs/vo-lines.txt --out-dir previs/vo-wav` (free model), then trim silence into `page/audio/vo/sN-{A,B,C}.mp3`.
   - Foley: copy CC0 previews from `_guide/prompt-studio/media/foley/` or fetch with `freesound.py`.
3. **Plan** in `build_previs.py` (see the example for every field): `project`, `summary`, `chief`, `story` (beats → scenes), `directors`, `assets`, `gates`, `pipeline`, `changes`, `directions` (3), `global.music|motion|pacing|voice` (3 each), `engine`, `references`, `style_rules`, `audio_notes`, `qa`, `versions`, `film_css` (all colours via tokens, classes prefixed `f-`), `fonts_url`, and `scenes[]` with `html`, `anim` (tweens `{s, t:[a,b], f, to, e}` on x, y, s, sx, sy, r, o, clip, w, blur; `{s, set, at, until}` class toggles; `{s, count:[from,to], t, p, d}` counters; `e:'m'` follows the Motion pick), `decisions` (transition types cut, push, slide, zoom, iris; camera `{s,x,y,origin}`; vo `{text, src, dur, at, copy}`), `sfx` (`at` may be a list for runs), `key` (the storyboard still's moment). Give every element the owner might point at a plain `data-name` ("Receipt total", "Request button").
4. **Check locally**: serve the page folder, look at a still of every scene and one mid-transition, switch all three directions once, confirm no console errors. One pass, no loop.
5. **Share** the page (locally, or as a claude.ai Artifact with the capabilities above) and add the film to Previs Studio. Give the owner the link and a five-line summary. Stop for review.
6. **Review loop** (each round is one republish):
   - Read notes, picks and approval.
   - For each open note: change only its target, append an op to `changes.jsonl` (`{"v","target","t","change","from","to","reason","preserve":[...]}`), then mark the note done with a one-line reply (protocol above). A `revert` note asks to undo a listed change.
   - Bump `versions` and add the round's `changes` in `build_previs.py`, rerun it, copy `previs.json` into the Studio copy, republish. The player shows a "what changed" banner and the Plan lists each change with an Undo request.
7. **Approval**: when `state/approval` has `approved: true` (it carries `picks`, `tweaks` and `custom`), save it, run `python3 _shared/previs/freeze_spec.py projects/NNN-name/previs --approval <file>` (it resolves added options and the voice, and lists `needs_before_build` such as unrecorded lines), write `SHOTLIST.md` from the spec, then hand off to the engine skill named in the spec. The engine builds exactly the spec (polish allowed, decisions not).

## Cost
Solo work only. A 20 s previs is a few hours of one session (roughly $30–60 API-equivalent), with Fish on the free model and no renders. The production render and its checks come after approval.
