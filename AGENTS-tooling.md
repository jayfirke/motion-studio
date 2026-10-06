# AGENTS-tooling.md — commands and gotchas

Companion to `AGENTS.md`. Read the section for a tool before running it. All commands run from the project folder unless stated otherwise. Everything here was tested on an M1 Max in October 2026.

## HyperFrames (pinned 0.8.134)

```bash
npx hyperframes@0.8.134 init NNN-name --non-interactive --resolution portrait   # or landscape / square
npx hyperframes@0.8.134 catalog --query "notification stack" --json          # search 394 registry items before hand-building a look
npx hyperframes@0.8.134 add <item>                                           # install a registry block/component
npx hyperframes@0.8.134 lint
npx hyperframes@0.8.134 check                                                # must pass before any render
npx hyperframes@0.8.134 snapshot --at 1.5,2.9,3.2                            # contact sheet in snapshots/
npx hyperframes@0.8.134 preview --background                                 # Studio at http://localhost:<port>
npx hyperframes@0.8.134 render --quality draft --workers 1 --output renders/draft.mp4
npx hyperframes@0.8.134 render --quality high --workers 1 --output renders/video.mp4
```

- Measured: a 6 s 1080p30 card renders in 10 s (22 s cold), and the 15 s Tally reel in 26 s.
- Voice: use Fish Audio Sarah (below), not `hyperframes tts` (Kokoro). Kokoro is only a fallback when Fish is down.
- Gotchas:
  - Registry components (`count-up`, `notification-stack`, `device-frame-stage`) ship bounce, idle loops and US number grouping. Rebuild their working parts inline when the house rules forbid that.
  - Inter has no ₹ or ✓ glyphs. Draw them as inline SVG, or pick a font that has them.
  - Frame ids that start with a digit need `[id="01-…"]` selectors or `getElementById`. `check` warns about this, but it is harmless.
  - `product-launch-video`'s `audio.mjs generate` and `fetch-sfx` retrieve from HeyGen, and when signed out they fall back to MusicGen. Don't run them. Write `audio_meta.json` by hand, pointing at project files.

## Remotion (pinned 4.0.532, personal use only)

```bash
npx create-video@4.0.532 --yes --blank NNN-name
npm run dev                                      # Remotion Studio
npx remotion render <CompositionId> renders/video.mp4
npx remotion still <CompositionId> renders/still.png --frame=90
```

- Measured: a 6 s 1080p30 card renders in 18 s, including bundling.
- Fonts go in `public/fonts/` and load with `staticFile()`.
- WebGL effects and some transitions need `Config.setChromiumOpenGlRenderer('angle')`.

## video-shotcraft (product demos and ads) — `~/video-shotcraft`

Remotion-based library: 157 shot recipe cards (10 categories: ui-entrance 28, typography 26, transition 19, effects 17, interaction 15, data 13, rhythm 11, opening 11, camera 10, outro 7), a demo implementation for every card, a validated 36 s promo template ("Ink Press"), components (`PageCam` 2.5D page camera, `ClipCard`, `DigitRoll`, `FlashCut`, `Caption`, `FlatPanel`, `VerticalTicker`, helpers), 149 SFX in 16 categories plus 5 BGM, a workbench, and a CapCut (剪映) exporter. The docs are in Chinese; read them anyway.

- Modes (ask the owner, unless the prompt already names one): **template** (`template/TEMPLATE.md`), **autonomous free creation** (`references/pipeline.md`, 8 stages, no stops), **co-creation** (`references/guided-free-creation.md`, confirm brief → direction → shot mapping → storyboard). Named shot cards → read each card in full, then the exact demo TSX named under "参考实现".
- Card index: `gallery/api/library.json` (name, summary, use, duration, energy, category). the owner can browse animated samples at https://vincentwei1021.github.io/video-shotcraft/library.html and copy card names.
- Must-reads: `references/aesthetic-rules.md` (R rhythm, Q camera and composition, S sound, C copy, P process), `references/sound-design.md`, `references/music-beat-sync.md` (librosa grid fit, `beatF(n)`, verify cut error ≤ 3 frames), `references/final-review.md` (independent critic checklist).
- Start a film: copy `template/` into `projects/NNN-name/` (never build inside `~/video-shotcraft`). Copy the components from `assets/lib/` and the demo TSX you use. `npm install` there is an install, so ask first. The template pins `remotion` 4.0.484.

```bash
cd projects/NNN-name && npm install                                   # ask first
npx remotion studio src/index.ts                                      # preview
npx remotion still src/index.ts AiflPromo renders/qa/f150.png --frame=150
npx remotion render src/index.ts AiflPromo renders/draft.mp4
npx remotion render src/index.ts AiflPromo renders/nobgm.mp4 --props='{"bgm":false}'   # the SFX-only version it always delivers
node ~/video-shotcraft/workbench/scripts/open.mjs projects/NNN-name   # after delivery: multi-track workbench on :5198
```

- Real UI: capture with `assets/scripts/capture-template.mjs` (set BASE, routes and selectors): full-page 2x textures, element crops and `layout.json`. Rasterize UI at native size, then scale down in 3D (Q2), or text blurs.
- Sound: `assets/audio/sfx/<category>/`. In `ui/`, only the ✅ files in `sound-design.md` §3.3 (`switch-light`, `switch-tap`, `switch-click-quick`) are real foley; the `tone`, `bleep` and `notification` files are banned for ads. The six untraceable files listed in `AGENTS.md` are never used. Pin each sound as `SHOTS.<shot>.from + offset`.
- Skip its closing "promote the author" lines in the delivery message; keep the credit rows in `ASSETS-USED.md`.

## motion-reel (Motion Reel Kit, optional creator kit)

```bash
source .venv/bin/activate
sh ~/.claude/skills/motion-reel/scripts/init.sh projects/NNN-name --preset presets/blank
python3 scripts/music.py && python3 scripts/beats.py audio/music.wav --stem audio/drums.wav
node scripts/sync.mjs && node scripts/sfx.mjs && python3 scripts/mix.py
node scripts/render.mjs --sheet --all          # contact sheet
node scripts/render.mjs                        # full render (60 fps + motion blur)
python3 scripts/review.py <round>              # critique kit for the critic sub-agent (reference/CRITIQUE.md)
```

- Measured: a 6 s 1080p60 render takes 61 s, plus about 20 s for the audio. A 16 s film with motion blur takes about 200 s per format.
- Voiceover: generate Sarah takes with `fish_tts.py --lines` into `audio/vo/`, then `python3 scripts/vo.py --scan`, write `vo.json` (`"voice": {"provider": "fish-audio", "id": "933563129e564b19a115bedd57b7406a", "name": "Sarah"}`), run `python3 scripts/vo.py`, then `node scripts/sync.mjs`.
- New music bed: edit `timeline.json` (`bpm`, `duration`, `music.sections`, `music.seed`), then run `music.py`. If the synth bed sounds generic (as in the first MIRA film), use a licensed bed and run `beats.py` on it instead.

## bang-motion 1.19.0 (openers, bumpers, kinetic type, explainers)

Skill text is in Indonesian. Plugin path: `~/.claude/plugins/cache/bang-motion/bang-motion/1.19.0` (also symlinked as `bang-motion` in the other agents' skill folders). Output is one `index.html` that autoplays and loops; `?debug=1` shows the scrub panel, and `?clean=1` holds autoplay for export.

- Start from a starter in `assets/`: `starter-opener.html` (openers, promos, bumpers, kinetic type) or `starter-explainer-*.html` (kartun, jurnalisme, katalog, sketsa, panggung).
- Before code, write its style brief (theme, three concept candidates from `references/opener-konsep.md`, palette with sources, display font that is not Inter, Poppins, Roboto, Montserrat or Arial, a signature move, background motion and surface). Run its anti-PPT structural checks (in SKILL.md) before showing anything.
- GSAP and fonts load from a CDN. Vendor them into the project folder before a final render (no network during render).
- `node scripts/snap.mjs` (contact sheet) and `node scripts/export-frames.mjs` (frames to MP4, 60 fps) need Puppeteer, which is not installed. Ask before `npm i puppeteer` in the project, or reuse HyperFrames' renderer by porting the timeline.

## onetake (non-commercial only) — `~/.claude/skills/onetake`

PolyForm Noncommercial 1.0.0. Use it for personal experiments and to learn its method; never for own-brand or monetized films.

```bash
python3 scripts/analyze_ref.py ref.mp4 --out ana/          # reference → energy map, cuts, stillness, motion line
python3 scripts/look.py sheet                              # looks gallery
python3 scripts/stills.py comp.html --times 0.7,2.4,6.2 --out stills.png
python3 scripts/render.py comp.html --out draft.mp4 --sfx sfx.wav --workers 1   # 1080p30 + shutter blur
python3 scripts/verify_promo.py draft.mp4 --comp comp.html                     # rhythm / continuity / curves / framing oracle
```

- Missing Python packages in `.venv`: `playwright`, `matplotlib`, `fonttools`, `brotli`, `opencv-python` (and `faster-whisper` for its VO tools). Installing them is an install, so ask first.
- Its `render.py` defaults to cores − 2 workers; always pass `--workers 1` here.
- Reusable ideas for every tool:
  - three concepts that differ in their central idea;
  - "carry, never replace";
  - shot lengths varied at least 4×;
  - a third of the film still;
  - a camera that chases and lands;
  - shutter motion blur on moves over 80 px per frame;
  - one sound room.

## Diffusion Studio 0.209.1 (app + `diffusion` CLI + MCP)

A JSX video editor that runs in the background. The MCP is at `http://127.0.0.1:3274/mcp` (global in `~/.claude.json`, so Claude sessions started after the install load it; verified in a fresh session, where the `context` tool answered). `diffusion mcp` serves stdio for other agents. The docs ship inside the app at `/Applications/Diffusion Studio.app/Contents/Resources/docs`: read `skills/editor.md` before editing, and `guides/motion/easings.md` before animating.

```bash
diffusion open -b projects/NNN-name     # open a folder as a project (background)
diffusion context                       # open project, playhead, generate.* status
diffusion check <sceneId>               # structural check, no credits
diffusion capture <sceneId> ...         # contact sheets of what an export would encode (the review tool)
diffusion export <sceneId> renders/video.mp4    # only when the owner asks
diffusion media ...                     # probe / grab / filmstrip / waveform (local, free); transcribe and listen cost credits
diffusion fonts --help                  # Google Fonts + local fonts usable in <text>
```

- Free and local: open, context, check, capture, export (up to 4K, no watermark), media probe, grab, filmstrip and waveform, and `media_segment` (SAM 2.1 masks).
- Credits (50 free, one-time): `generate.*` (FLUX, GPT Image 2, Nano Banana, Seedream, Kling, Veo, Seedance, Wan, Hailuo, ElevenLabs music/SFX), `media_transcribe`, `media_listen`. Ask first; ElevenLabs is banned.
- Authoring: a scene is JSX. Motion graphics go in `<html>` driven by a paused anime.js timeline; 3D goes in a Three.js `<surface>`. Wrap clips in `<sequence>`. Hoist look constants with `@inspect`.

## text-to-lottie (Lottie elements)

The skill authors Lottie JSON and verifies it in the official Skia Skottie player.

```bash
npx degit diffusionstudio/lottie _shared/lottie-player && cd _shared/lottie-player && npm install   # one-time setup, ask first
npm run dev                         # Vite prints the real port (3030 by default, next free port if taken)
curl -s http://localhost:<port>/__context      # project tree, active scene
# scenes: public/projects/<project>/<scene-N>/lottie.json (+ controls.json, fonts next to it)
```

- Inspect frames at `http://localhost:<port>/<project>/<scene>?frame=N`: frame 0, the midpoint and `op − 1`.
- Use the result in a film:
  - HyperFrames: its built-in Lottie adapter (`hyperframes-animation` → `adapters/lottie.md`);
  - Remotion: `@remotion/lottie`;
  - Diffusion Studio: an `<html>` layer.
- Copy the JSON into the project, and log it in `ASSETS-USED.md` as code-generated.
- LottieFiles Creator MCP (Claude Desktop config) can also author Lottie, but output from a LottieFiles account follows LottieFiles terms. Prefer text-to-lottie.

## Fish Audio voiceover (Sarah)

```bash
python3 _shared/tools/fish_tts.py --check                                   # key OK + package balance
python3 _shared/tools/fish_tts.py "[excited] Meet Pulse. [soft] The ring that knows you." --out audio/vo/l1.wav
python3 _shared/tools/fish_tts.py --lines vo/lines.txt --out-dir audio/vo --takes 2   # l1a.wav, l1b.wav, ...
```

- Defaults: voice Sarah `933563129e564b19a115bedd57b7406a`, model `s2.1-pro-free`, WAV 44.1 kHz mono (Fish's WAV maximum; engines resample to 48 kHz), `normalize_loudness` on. Every take is logged to `<out-dir>/takes.jsonl`.
- Measured 2026-10-05: a 9-word line returns in about 2 s, comes out at about −22 LUFS with a −1.6 dBFS peak, and the tags were performed, not read (checked with whisper).
- Raw HTTP (any language): `POST https://api.fish.audio/v1/tts`, header `model: s2.1-pro-free`, JSON `{text, reference_id, format, sample_rate, latency, prosody}`. See the `fish-audio-api` skill for WebSocket streaming, multi-speaker dialogue, voice design and cloning.
- Claude-only connector tools: `search_voices`, `get_voice` (sample URL), `text_to_speech` (uses the plan's 8,000 package credits, 500 bytes per call; the API path above does not), `get_credit_balance`, `create_voice_clone`. Cloning the owner's own voice needs their recording and their OK; never clone anyone else.

## Freesound (CC0 foley)

```bash
python3 _shared/tools/freesound.py check
python3 _shared/tools/freesound.py search "mouse click" --max-dur 0.5 --min-rating 4 --sort downloads_desc -n 10
python3 _shared/tools/freesound.py get 256455 448086 --dir projects/NNN-name/audio/sfx --wav --note "cursor press"
```

- CC0 only by default; `--allow-cc-by` adds CC-BY 4.0 and prints the credit line. CC-BY-NC and Sampling+ are always refused.
- Downloads the HQ preview (OGG, about 192 kbps), converts it to 48 kHz WAV with `--wav`, writes a `.json` sidecar, and appends to `_shared/sfx/freesound/SOURCES.tsv`.
- About 60 requests per minute and 2,000 per day. Searching is cheap, so download only what you will use. Original files need OAuth2 (ask the owner).
- Search vocabulary that works: "mouse click", "button press click", "single key press keyboard", "laptop keyboard typing", "light switch toggle", "swipe swish", "whoosh soft", "camera shutter", "cinematic impact boom", "riser". "trackpad click" has 0 CC0 hits; use soft mouse clicks instead.

## Word timings (OpenSuperWhisper model, verified)

```bash
ffmpeg -i input.mp4 -ar 16000 -ac 1 /tmp/a.wav
whisper-cli -m "${WHISPER_MODEL:-$HOME/Library/Application Support/ru.starmel.OpenSuperWhisper/whisper-models/ggml-large-v3-turbo.bin}"   # Linux/WSL 2: ~/.local/share/whisper-models/ggml-large-v3-turbo.bin \
  -f /tmp/a.wav -ojf -of whisper-full -l en          # -l hi for Hindi
npx hyperframes@0.8.134 transcribe whisper-full.json  # word-level transcript.json
```

- Use `-ojf` (full JSON). Plain `-oj` imports as "No words found".
- Measured: an 18 s clip takes about 3 s, and a 20 min video about 63 s.

## Loudness to −14 LUFS (video untouched)

HyperFrames and Remotion renders come out around −20 to −21 LUFS. A plain loudnorm (linear) step clipped SFX peaks to +3.5 dBFS, so use measure → gain → limiter (tested 2026-10-04):

```bash
ffmpeg -i renders/video.mp4 -af loudnorm=I=-14:print_format=json -f null - 2> /tmp/ln.txt   # read input_i
G=$(python3 -c "print(-14-(INPUT_I)+1.0)")                                              # e.g. input_i -20.99 → G=7.99
ffmpeg -i renders/video.mp4 -c:v copy -af "volume=${G}dB,alimiter=limit=0.6:attack=1:release=60:level=false" -ar 48000 -c:a aac -b:a 192k renders/final.mp4
ffmpeg -i renders/final.mp4 -af ebur128=peak=true -f null -    # expect about −14 LUFS, peak below 0 dBFS
```

motion-reel mixes itself to −14 LUFS (`scripts/mix.py`), so it needs no extra step. With a voiceover, mix the voice stem first (about −16 LUFS), duck the music under it (sidechain or a volume envelope, −8 to −10 dB), then normalise the full mix.

## Engine gotchas found by the first sample reels

- HyperFrames:
  - The 3D iPhone/MacBook registry blocks and `vfx-shatter` need experimental Chrome features or an extra model file, so rebuild them in CSS instead.
  - Shader transitions (`cinematic-zoom`, via `@hyperframes/shader-transitions` from jsDelivr) render fine but show blank in `snapshot`, so check them in the render.
  - Render times: a 16 s 9:16 kinetic film takes 26 s; 21.6 s of 9:16 with shader cuts takes 55 s.
- Remotion: `@remotion/transitions@4.0.532` works. 27.6 s at 1080p30 renders in 41 s, and one `remotion still` takes about 12 s.
- motion-reel: `review.py final` reports sync; a constant ~45 ms lag is AAC encoder delay.
- What the first test showreel got wrong:
  - thin synth SFX and music;
  - Flowboard SFX about 15 dB under the music;
  - simple fades and pops;
  - no voiceover;
  - no critique rounds.
  Don't repeat these.

## Browsers for rendering

- HyperFrames uses its own `chrome-headless-shell`. motion-reel uses Playwright Chromium (revisions 1228 and 1243 are cached in `~/Library/Caches/ms-playwright`).
- If `npx playwright install chromium` times out:
  1. Download Chrome for Testing for the revision Playwright asks for, from `storage.googleapis.com/chrome-for-testing-public/<ver>/mac-arm64/chrome-headless-shell-mac-arm64.zip`.
  2. Unzip it into `~/Library/Caches/ms-playwright/chromium_headless_shell-<rev>/`.
  3. Add empty `INSTALLATION_COMPLETE` and `DEPENDENCIES_VALIDATED` files.

## Research and video tools

- `agent-reach`:
  - web search: `mcporter call exa.web_search_exa …`. Exa returned HTTP 503 on 2026-10-05; fall back to the built-in web search.
  - page reading: `curl https://r.jina.ai/<url>`.
  - GitHub: `gh`.
  - YouTube transcripts: `yt-dlp`.
  - Reddit, X and Instagram need a login, so they are unavailable.
- `deep-research-pro`: only when the owner asks for deep research. It confirms scope and depth first and verifies licences adversarially.
- `watch`: the local engine reads captions first, then frames. If the captions come back auto-translated (Lukas Margerie's video gave Arabic), transcribe the downloaded audio yourself: `ffmpeg -i <work>/download/*/video.mp4 -ar 16000 -ac 1 a.wav && whisper-cli -m <model> -f a.wav -l en -otxt -of transcript`.
- References to borrow grammar from: https://whatships.com (an index of Opus-made launch films), the video-shotcraft gallery, and onetake `cases/*/README.md`.

## Prompt Studio and the catalog

- `_guide/prompt-studio/` is Motion Prompt Studio: a local page to audition sounds and music and build a prompt visually. It loads data with fetch, so serve it: `python3 -m http.server 5191 --directory _guide/prompt-studio`.
- `_shared/catalog.json` is the machine-readable option list (sounds, music, moves, transitions, icons, fonts, asset sources) with licences. Prompts refer to items by `id`. `_shared/sfx/UI-AD-PALETTE.md` is the curated UI-ad sound palette and Freesound audition list.

## Cost check (Claude only, Claudoscope MCP)

- Before a multi-agent run, base the estimate on a measured session: `mcp__claudoscope__get_session <id>` gives tokens and an API-equivalent cost per session. Find ids with `mcp__claudoscope__search_sessions`.
- Rates (Opus 5.5, as Claudoscope prices them): $5/M input, $25/M output, $0.50/M cache read, $10/M one-hour cache write.
- After the run, report actual against estimate with `get_session` (main session) and `get_usage --period today`.

## Lessons from a video-shotcraft product film (9 critique rounds)

From a 38 s product film built with video-shotcraft (the project itself is not in this template). Avoid these traps from the first draft; each one cost a critique round.

### Build
- **Made-up product?** Build the UI as React DOM inside Remotion and film it with a 2.5D camera that magnifies with the CSS `zoom` property (`src/World.tsx`). Text stays sharp at any push. Use screenshot capture only when a real product exists.
- **Measure the music grid with a comb fit over the whole track.** On house-vibez, `beats.py` snapped only 15 beats and was 1 % off in BPM, which drifts 0.4 s over a film.
  - Confirm the downbeat from kick and clap energy per beat.
  - Pin a deep impact by its low-band onset, not its RMS peak. The kit's sync check uses the low band for impacts.
- **Fonts:** wrap font loading in `delayRender('fonts', { timeoutInMilliseconds: 120000 })` and render with `--timeout=120000`. The first render after edits can time out.

### Scripts
- `scripts/stills.mjs <frames…>`: many stills from one bundle, about 2 s each.
- `scripts/master.sh in out`: masters to −14 LUFS. The limiter is set at 0.72 so true peak stays ≤ −1 dBTP after AAC encoding.
- `scripts/kit.py mp4 tag strip0 '{events}'`: builds the critique kit. It makes a contact sheet, a 360 px phone sheet, 12-frame strips, a blank-frame scan and the sync numbers.

### What the fresh critics flagged (check stills for these before round 1)
- **Carries:**
  - No empty container during any morph. The old content leaves upward while the new content rises from below (a roll), overlapping by 2 frames.
  - No one-frame swap of content; keep it one object.
  - At a shot boundary, start the next shot from the exact last frame of the previous one, camera transforms included.
- **3D layers:**
  - An element coplanar with the page inside a `preserve-3d` camera can vanish. Give it `translateZ(0.5px)` or more.
  - An overshooting ease can push a lifted card behind the page. Clamp z to at least 1.5 px.
- **Overlays and moves:**
  - A full-frame dim or veil must ease out before a cut. Switched off, it reads as a flash.
  - A camera that follows content (a caret) must be one eased move, not steps per line.
  - A spotlight on a light UI should be a card-shaped hole in page space (huge `box-shadow` around a rounded rect). A radial pool reads as a glow halo.
- **Text:**
  - Mask exits leave glyph slivers. Keep them under 2 frames.
  - At most two text levels on the end card.
  - The CTA must be the most legible line on the end card and readable for at least 1.5 s before the press.
  - The press needs a visible response (about 4 % scale plus a shadow drop), held.
- **Sound:**
  - The impact should be at least 2 LU louder than the loudest voice passage.
  - Dip the bed for about 0.5 s around the stamp, then release it, or the finale sags.
  - Split a closing VO line so each phrase sits under its own picture.

### Cost
That build plus 9 critic rounds cost about $105 API-equivalent:
- each fresh critic round is about $4–6 and 5–10 minutes;
- each render plus master plus kit is about 2 minutes.

Budget about $80–110 per film at this quality bar, or cap the rounds.

## Lessons from a HyperFrames + three.js product hero (5 critique rounds)

From a 24.5 s 3D product hero (a titanium ring) built in HyperFrames with three.js (the project itself is not in this template).

### Build
- **One `render(t)` drives everything.** Call it from the `hf-seek` event and from a GSAP proxy tween on `window.__timelines.main`. Register `window.__hf.buildReady` for anything that waits on fonts. The draft render took about 35 s for 24.5 s at 1080×1920 on the hardware GPU, so iterating is cheap.
- **Pure function of time, enforced.** A style set only inside an `if (shot)` branch leaks into other frames when the renderer seeks out of order: snapshots, and probably parallel renders. Reset every element every frame.
  - A child set to `visibility: visible` shows even when its parent is hidden. Hide containers with `display: none`, and set children to `""`, never `"visible"`.
- **Lighting a dark metal product:**
  - Studio as a PMREM of softboxes in a black room, generated with `{ size: 1024 }`. At 256 px the highlights in a macro go blocky.
  - Round discs for anything that reflects in small glossy parts.
  - A broad dim fill behind the camera so titanium never reads as black ceramic.
  - A fixed `DirectionalLight` for the plinth wall. Highlights that come from the environment swing whenever you rotate the environment for a light sweep.
- **Lathe winding:** order the profile points bottom→top for outward faces. An inside-out plinth hides nothing behind it.
- **Cormorant ascenders overshoot the line box.** Mask rises must start at least 200 % below. Hide each word before it starts and for the last 30 % of its exit, or one-frame glyph slivers appear.
- **Run `hyperframes check` before every render.** It catches real overlaps. Mark intentional ones (a readout inside a ring, a canvas full-bleed) with `data-layout-allow-overlap` / `-overflow`.

### What the fresh critics flagged
- **A carry has to be literal.** "The ring becomes the gauge" only worked once the arc was drawn on the ring itself (a torus segment on its rim) and the readout lived inside the projected ring. A DOM overlay floating over the 3D object failed.
- **Falls and landings read only in screen space.**
  - A camera that follows the object makes it hover while the floor rises ("a lift").
  - A locked camera for a whole act reads as dead.
  - What worked: a hard cut on the beat into a held hero frame, with the object falling about 500 px through it.
  - Then on contact:
    - a camera jolt of about 30 px;
    - a rebound timed to the foley's second hit;
    - the contact shadow snapping dark in the last 2 frames.
- **A fingertip in a luxury film is a trap.** Grey discs, 3D capsules, a tapered lathe finger and a rim-lit finger all scored as cheap: a ball, a peg, a stick. A 96 px touch ring with 30 % fill, scaling in from 0.6 and sitting in the button padding (never on the label), is the safe choice.
- **Composition caps on "a third of the frame empty for more than 1 s".** That includes a black plinth wall and a dark macro. Light the lower third, or put the stats on a glass shelf there.
- **One label slot at a time** inside a readout ("READINESS" while it counts, then the status line). Time-separate the caption and the stats.
- **Critics keep asking for:**
  - motion blur on the fastest camera moves (not built yet: sub-frame accumulation on the WebGL canvas);
  - a brighter, readable product on frame 0.

### Sound
- **Make the soundtrack a mastered `mix.wav`** built by a script (`scripts/mix.py`). Pin every sound by its measured peak minus 43 ms for AAC. The render keeps it at −14.3 LUFS.
- **Impact as the loudest moment:**
  - High-pass and pre-limit the boom so the master limiter keeps its body.
  - Layer a real foley knock: the 1–3 kHz range counts in LUFS, a sub boom barely does.
  - Trim the sample's head to about 40 ms before its peak.
  - Duck the bed only about 6 dB under the spec line so the low end survives.

### Cost
About $25 main loop plus five critics at about $5 each, so about $50 API-equivalent. Each critic round took 9–13 minutes.

### Audio offset per engine (measured 2026-10-05 by cross-correlating the render against its mix)
- **Measure sync with cross-correlation, not nearest-onset.** A project-local `kit.py` reports `render_lag_vs_mix_ms`; it should be 0. Nearest-onset latches onto ripples inside a sample's envelope and hid a 43 ms error in one film and a 77 ms one in another.
- **HyperFrames 0.8.121 and 0.8.134** (`render`): 0.0 ms lag (0.8.134 re-measured). Do not pre-shift the mix.
- **Diffusion Studio 0.209.1** (`export`):
  - about 44 ms lag. Clip `start`/`sourceIn` snap to whole frames (33 ms), so trim the WAV itself (a small `dx_audio.sh` trims it).
  - The export also writes one frame fewer than duration × 30 unless the scene has an extra frame of headroom.
- **Remotion 4.0.484** (the video-shotcraft film): compensated 1.28 frames (about 43 ms) for AAC. Not re-measured by cross-correlation.

## Lessons from a bang-motion launch film
- Export: `tools/export-frames.mjs` defaults to 60 fps; pass `FPS=30`. Serve the folder over http (module imports). 836 frames took about 2 min and 2 GB of PNGs: delete them after the mux.
- Mux: ffmpeg's AAC from PNG frames + WAV measured 0.0 ms lag by cross-correlation, so the mix needs no pre-shift.
- Sync checks: measure designed hits on an SFX-only stem (`mix.py` writes `stem-sfx.wav`); in the full mix, music transients inside the ±60 ms window fake ±40–60 ms errors.
- Tempo: measure a bed's kick grid before trusting a library BPM tag. Mixkit `cat-walk` is 129.98 BPM, not 129.2 (80 ms drift over 17 s); `atempo` stretches it cleanly at that ratio.
- Visibility: in seek-anywhere renders never set a child to `visibility: visible` (it beats a hidden parent); use `inherit`.
- three.js: a transparent shadow catcher must not write depth (`depthWrite:false`), or the transparent sort order hides other transparent meshes for single frames. A clipping plane at the desk lets a 3D object rise out of / sink into the page.
- Critics flag: one-frame text swaps, empty containers while something grows, opacity entrances, a cursor tip on a label, text alone on empty paper, and a press that does not visibly cause its effect. Carry one element through every morph (here: the red code row becomes line 42; the Approve click floods the card with ink).

## Lessons from a motion-reel film
- Measure a bed's tempo before writing a storyboard grid: FS 414441 is 120 BPM, but librosa's tracker (and `beats.py`) locks to its 96 BPM starting guess. Fit the kick onsets (autocorrelation of a low-band onset envelope) and write `beats.json` by hand when the tracker disagrees.
- `init.sh` refuses a non-empty folder: scaffold into a temp folder and `rsync --ignore-existing` into the project (macOS is case-insensitive, so the template `brief.md` collides with `BRIEF.md`).
- Recorded SFX: `scripts/sfx-samples.py` (project-local) reads `cues.json` and places real samples, replacing `sfx.mjs` (synth timbres).
- `mix.py`'s 4× oversampled limiter drops about 0.15 s from the end and the drafts' `-shortest` then trims the picture: pad the master with `apad,atrim=0:<DUR>`.
- Determinism: glyphs at sub-pixel offsets (spring-driven `translateY`, a `scale()` push on text) paint differently depending on the previous frame. Round text offsets to whole pixels; grow an end card with `font-size`, not a transform.
- `C.seg/sp/spHit` take beats (or marks), never seconds: `seg(t, bt(32), …)` fired an event at half the intended time.
- What the critics flagged round after round: one-frame swaps (morph the container instead), UI text under 3 % of the frame (push the camera in, don't enlarge fonts), empty headline columns at line handoffs, a parked dot or a still card, cards crossing each other in flight, and the impact not being the loudest moment (step the bed down into it).

## Previs (`video-director-previs`)
Worked example: `examples/crumb-previs/` (its data pack is the demo film in `_shared/previs/studio/films/011-crumb/`).
```bash
(cd _shared/previs/app && npm ci && npm run build)   # React + TS app → inlined index.html for studio/ and page/ (targets in scripts/inline.mjs)
(cd _shared/previs/app && npm run smoke -- --out <dir>)   # browser checks in real Chrome: desktop, tablet, phone, full screen
(cd _shared/previs/app && npm run a11y)               # axe-core audit of both themes
cp examples/crumb-previs/build_previs.py projects/NNN-name/previs/   # edit scenes, options, audio
python3 projects/NNN-name/previs/build_previs.py                    # writes page/previs.json (PREVIS_PAGE=<folder> builds into another data pack)
python3 _shared/tools/fish_tts.py --lines projects/NNN-name/previs/vo-lines.txt --out-dir projects/NNN-name/previs/vo-wav   # free model
python3 _shared/previs/freeze_spec.py projects/NNN-name/previs --approval <approval.json>   # after the owner approves
python3 -m http.server 5193 --directory _shared/previs/studio                               # open Previs Studio locally
```
- The page reads `previs.json` and paints every frame from it: scenes are HTML styleframes driven by tweens, the three directions swap CSS tokens, Web Audio plays the chosen bed, the chosen voice lines (bed ducked 8 dB) and the chosen foley. Keys: Space, ← →, J K L, [ ], C (comment), N (next note), F, M, S (captions), `\` (hold for the original picks), ⌘K, ?, 1 2 3 (views).
- App source: `_shared/previs/app/` (Vite, React 19, TypeScript, Tailwind 4, Radix, zustand, zod). Never hand-edit a built `index.html`.
- Option libraries (looks, music, motion, pacing, camera, transitions, sounds, voices), "More options" on every card, an Ask tab that acts (adds options, switches, files requests for Claude Code; works without AI from the libraries), N-way compare, captions, light and dark themes, storyboard grid/strip/script with a shot sheet, a Plan with a spec export, and the Claude Code bridge (note statuses, activity feed, Send to Claude Code).
- As a claude.ai Artifact: publish `_shared/previs/studio/index.html` with its `films.json` and `films/` as files and `capabilities: {"db": {}, "user": {}, "sample": {}, "comments": {}, "downloads": true}`. Notes land in `films/<id>/notes`, picks and sound tweaks in `films/<id>/state/picks`, approval in `films/<id>/state/approval`.
- Music library: `python3 _shared/previs/music_lib.py <out_dir> <beds.ogg>` measures BPM (comb fit) and cuts beat-aligned 24 s excerpts. Voice library: `examples/crumb-previs/voices/make_voices.sh` (voices.tsv + lines-<lang>.txt, free Fish model), then whisper-cli spot checks. The demo ships Sarah's takes only; the other voices play as captions until you record them.
- UX research behind the app: `_guide/research/previs-studio-ux-research.md`.
- Tempo for beat markers: comb fit over 85–150 BPM on a low-band (< 150 Hz) onset envelope, hop 128 at 22.05 kHz, 40 phases per period; take the best mean onset strength. Measured: Bell Beats FS 414441 120.0, Tropicorp FS 561190 102.0, Wet Square Techno FS 170601 127.0. A plain autocorrelation picked 80 for Bell Beats (2/3 of 120); use the comb fit.
- Python's http.server resets some of the parallel audio fetches; a published page does not.
- In `film_css`, prefix classes with `f-` (the page's own `.row`, `.chip`, `.dot` would leak into the film) and give every colour as a token.

## HyperFrames Claude plugins (checked 2026-10-06)
- Installed in Claude Code desktop: `hyperframes@hyperframes` and `core-skills@hyperframes`, both 0.8.134 (`~/.claude/plugins/cache/hyperframes/`). They add the `hyperframes:*` skills (core, animation, keyframes, creative, cli, registry, studio, media-use, audio and the workflows: product-launch-video, motion-graphics, music-to-video, faceless-explainer, general-video, slideshow, embedded-captions, talking-head-recut, pr-to-video, figma, remotion-to-hyperframes).
- The CLI pin moved to 0.8.134 with them. Test on the HyperFrames product hero: `hyperframes check` passed (0 errors), a high-quality render took 43 s, PSNR against the 0.8.121 final averaged 68.8 dB (min 54.4), audio lag 0.0 ms, −14.3 LUFS.
- On an older project the CLI prints "This project pins hyperframes@0.8.121 (latest 0.8.134)". Leave delivered projects on their pin.

## brag and the showreel gist (references only)
- [latent-spaces/brag](https://github.com/latent-spaces/brag) (MIT) is a reference only, not included. On Opus 5.5, `/brag` hands off to `brag-slim` (one file, the model builds everything). Worth borrowing: inspect → answer "what is it, who is it for, what's the hook, what real flow to show" before planning; Hook (2–3 s) → Reveal → 2–3 highlights → punchline; readable text holds about 0.3 s per word; reuse real components instead of redrawing; pick a best settled frame and bake it in as frame 0 (the poster).
- The mirzemehdi "motion showreel master prompt" gist (HyperFrames + GSAP + a Node synth) has a mobile-app mode: a code-drawn phone, a finger ring that presses, screen pushes, pieces lifting out of the phone. Its gotchas match ours: GSAP and fonts load locally, reveal with `fromTo` on autoAlpha (a bare `set` visibility can be skipped by cold-seek render workers), no CSS transform on anything GSAP tweens, no template literals inside selector strings, in zsh write `${i}` next to a colon.
- Not adopted (house rules win): confetti and particle bursts, glow pulsing, camera shake, synthesized UI blips and chimes, a synthesized score unless it sounds finished, the Kokoro voice, unpinned `npx hyperframes`.
