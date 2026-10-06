# AGENTS.md — motion-studio workspace

The single source of truth for every coding agent working here: Claude Code, Codex, OpenCode, Cursor, Copilot, Junie and Antigravity (`agy`). Wrapper files only point here. Tool commands are in `AGENTS-tooling.md`; open it before running any CLI.

This is a local studio for motion-graphics videos made in code: product demos, ads, reels, openers, kinetic type. Every film is planned as a playable preview first, then built in one code engine with a real voice, recorded sound effects and a beat-synced edit.

**The owner's preferences live in `OWNER.md`** (made from `OWNER.example.md` during setup; never committed): name, default voice, quality bar, sound taste, budget, how they like to review. Read it right after this file. Wherever this file says "the owner", it means the person in `OWNER.md`. If `OWNER.md` is missing, run the `workspace-setup` skill first.

**Quality bar.** First drafts made by an agent tend to look like a slide deck with a thin synth soundtrack. Every new film must clear the "Motion Studio rules" below and pass the critique loop (every score at or above the owner's bar in `OWNER.md`; the example bar is 8) before the owner sees a render. The prompt is 10% of the result; the harness (brief, real assets, beat grid, sound, critique loop) is the other 90%.

## Precedence

1. The owner's message in chat. 2. The project's `BRIEF.md`. 3. `OWNER.md`. 4. This file. 5. Skill rules (video-shotcraft, HyperFrames, Remotion, motion-reel, bang-motion, onetake, Diffusion Studio, text-to-lottie). 6. Your defaults.
A nested `AGENTS.md`/`CLAUDE.md` inside an engine project (written by `hyperframes init`) is engine documentation. Read it, but never hand-edit it. When a skill's advice conflicts with the licence rules here (for example a skill suggests Pixabay or YouTube Audio Library music), this file wins.

## Toolbox

| Tool | Best for | Licence / cost | Skill or entry |
|---|---|---|---|
| **video-shotcraft** | Product demos and product ads from real UI: real screenshots, 2.5D camera, shot recipe cards, beat-synced cuts, cinematic sound | Apache-2.0 code; Remotion inside (see its licence); its audio is Mixkit (see licences) | `video-shotcraft` |
| **HyperFrames 0.8.134** (default when nothing else fits) | Reels, kinetic type, promos, captions, graphics over a clip; 394-item registry | Apache-2.0, local render | `hyperframes`, `hyperframes-*`, `media-use`, `product-launch-video` |
| **Remotion 4.0.532** | React videos, data charts, lower thirds, reusable templates | Free for individuals and companies of up to 3 people; larger companies need a licence | `remotion-*` |
| **motion-reel** (Motion Reel Kit, optional) | Beat-synced product reel: synthesized score, measured beat grid, critique loop, 4 formats from one timeline | A creator kit, **not included**: get it from its creator (see `CREDITS.md`) | `motion-reel` |
| **bang-motion** 1.19.0 | Openers, bumpers, idents, channel intros, kinetic type, explainers (single `index.html`, GSAP) | MIT | `bang-motion` (Claude plugin) |
| **onetake** | Short launch films built on carry, rhythm, operated camera, shutter blur, verify oracle | **PolyForm Noncommercial**: personal tests only, never for own-brand or monetized posts | `onetake` |
| **Diffusion Studio** 0.209.1 | Editing and compositing footage in JSX: A/B roll, captions, object masks (SAM 2.1), audio/video inspection, `capture` contact sheets | Editor, CLI and exports free and open source, commercial OK; AI features cost credits | app + `diffusion` CLI + MCP `http://127.0.0.1:3274/mcp` |
| **text-to-lottie** | Lottie assets: logos, icons, loaders, lower thirds, UI micro-interactions, data hits, for use inside a film | MIT (diffusionstudio/lottie) | `text-to-lottie` |
| **video-director-previs** (workspace skill) | Seeing and hearing a film before any render: a playable animatic with voice, music and foley, three options on every decision, time-anchored notes, versions, approval, then `approved-video-spec.json` for the engine | Code in this repo (MIT); plays only CC0 or self-made audio | `video-director-previs`, `_shared/previs/` |
| **Fish Audio** | Voiceover. Default voice set in `OWNER.md` (the example uses Sarah, a Fish Audio official voice) | `s2.1-pro-free` API model: free through 2026-11-30, commercial use OK for businesses under $1M a year | `_shared/tools/fish_tts.py`, skills `fish-audio-api` / `fish-audio-sdk` |
| **Freesound** | Recorded foley when `_shared` has no fitting sound (real clicks, keys, switches, whooshes) | Per sound: CC0 only by default, CC-BY 4.0 with credit | `_shared/tools/freesound.py` |

### Which tool for which job

- **Any new film over 10 s:** previs first with `video-director-previs`. The owner approves the page; then the engine below builds the approved spec.
- **Product demo or product ad with UI:** video-shotcraft first (real screenshots, shot cards, PageCam). Use motion-reel when the beat-synced score is the point and you have the kit, or HyperFrames for a 9:16 reel with heavy kinetic type.
- **Opener, bumper, logo sting, channel intro:** bang-motion or HyperFrames.
- **Kinetic typography, captions, social reels:** HyperFrames.
- **Data stories, templates you will reuse:** Remotion.
- **Cutting or captioning existing footage, masking objects:** Diffusion Studio (or HyperFrames).
- **A small animated element** (logo build, icon, loader, success check, lower third): text-to-lottie, then place the Lottie in the film's engine.
- **One film, one engine.** A film renders in one engine. Other tools supply parts (Lottie files, voice, SFX, music, masks), never a second half-built timeline.

If the prompt names no tool, pick from the list above and say why in one line. Never build inside `engines/` (clean starters) or inside a skill's own folder (`~/video-shotcraft`, `~/.claude/skills/onetake`): copy what you need into the project.

## Pinned versions (never upgrade without asking)

- `npx hyperframes@0.8.134 …` always pinned. Telemetry off, signed out of HeyGen, no cloud render.
- `npx create-video@4.0.532` for new Remotion projects. A video-shotcraft project keeps its template's own pin (`remotion` 4.0.484), because its demos were validated on it; never mix the two in one project.
- Diffusion Studio app and `diffusion` CLI 0.209.1. bang-motion 1.19.0. onetake at commit `cf09bde`.
- Python audio scripts run in the workspace `.venv` (Python 3.12, `requirements.txt`).

## Project folders

- One folder per video: `projects/NNN-short-name/` (next free number). Start by copying `projects/_template/` files into it (the `motion-new-project` skill does this).
- Every project keeps `BRIEF.md` (what and why), `SHOTLIST.md` (approved before building anything over 10 s), `ASSETS-USED.md` (licence rows used), `VERIFY.md` (checks, critique scores, evidence) and `HANDOFF.md` (notes for the next agent).
- Renders go in the project's `renders/` and are never committed.
- `examples/crumb-previs/` is a worked example of a previs (a made-up product). Copy from it; don't build inside it.

## Motion Studio rules (house style for every tool)

Distilled from public lessons by motion designers and tool authors (see `CREDITS.md`): the "moves" behind Lukas Margerie's video "How to Make Insane Motion Graphics With Opus 5.5", video-shotcraft's `references/aesthetic-rules.md`, onetake's hard rules, and our own critique rounds. These rules are for the agent; the owner doesn't need to repeat them in prompts. `OWNER.md` may tighten or relax them.

**Render contract.** Every frame is a pure function of time. No `Date.now()`, no unseeded `Math.random()` (use mulberry32 or a hash seed), no network fetches during a render, no CSS transitions or timers in render mode, no infinite `repeat`/`yoyo`, no state carried between frames. Avoid `will-change`/`translateZ(0)` on anything the camera scales.
- HyperFrames: one paused GSAP timeline per composition on `window.__timelines`; entrances use `fromTo`; run `hyperframes check` before every render.
- Remotion: everything from `useCurrentFrame()` with `spring()`/`interpolate()`.
- motion-reel: `window.seek(t)` plus springs from its `lib/motion.js`; obey its `reference/RULES.md`.
- bang-motion, onetake and Diffusion `<html>`: a paused timeline (GSAP or anime.js) driven by the seek time.

**Look.**
- Banned clichés: a centered title on a gradient, everything fading in, a pure opacity fade as an enter or exit, crossfades between shots, corner labels and frame borders, glow on UI chrome, particle or confetti bursts, spins, glitches, light leaks, bouncy easing on UI, dead time.
- Premium means subtract: no decorative cards, borders or dividers unless they do a job. One display face, one UI face, one accent colour. The look comes from the product's own design tokens (fonts, colours, radii), never from the last film or a starter.
- Real product UI, logos and fonts. Capture them with Playwright or use the owner's screenshots, never redraw UI that exists. For a made-up brand, build the UI to publish quality and keep it consistent across shots.
- At most two text levels on screen at once. Readable at phone size: captions at least 5% of frame height, secondary text at least 3%.

**Motion and rhythm.**
- Springs with weight, overlap and follow-through. `power3.out` (or a critically damped spring) is the default; overshoot only on playful UI pops (about 4% max), never on type.
- Carry, don't replace: at every section boundary something survives and moves into the next beat (a container that morphs, a camera that pushes through a card, a cursor). Bare hard cuts only in bursts of hits and on the end card.
- Vary shot length at least 4× (0.25 s words next to 2.5 s holds). Something new every 2–4 s, but leave rests. Brand wordmark holds 1 s or more; the opening subject gets about 3 s.
- The cause is visible: a cursor or hand presses, then the UI reacts. Camera moves follow the subject and land; product films keep the camera steady (no handheld shake).
- One animation technique stars once per film. No repeated shots or taglines.

**Sound** (details in "Sound design" below). Picture is locked before SFX are pinned. Hits sit on the measured beat grid. Final mix −14 LUFS, true peak ≤ −1 dBTP.

**Loop before the owner sees anything:** the critique loop under "Review loop".

## Writing the brief (the harness)

Use `docs/directors-brief-template.md` for anything over 15 s. A brief names:
- the film in one line;
- references;
- tools, skills and keys;
- real brand assets;
- the beat sheet (one state per beat, on the grid);
- the on-screen text;
- voiceover lines;
- workflow gates;
- the critique loop;
- deliverables (16:9 first, then 1:1 / 4:5 / 9:16 re-blocked from the same timeline).

Before code, show the owner the state list on the beat grid. To borrow a reference film's style, take one frame every 0.5 s, write a short style guide, and take the grammar, never the content, logos or characters.

## Voiceover (Fish Audio)

- Default voice: the one in `OWNER.md`. The example is **Sarah**, Fish Audio official, id `933563129e564b19a115bedd57b7406a` (young female, conversational narration, soft, sincere). Audition 2–3 voices on the tightest line when asked. Use public voices only; never clone a real person without their written consent.
- Model: **`s2.1-pro-free`**. It is free through 2026-11-30, with no hard cap and commercial use allowed (businesses over $1M ARR must contact Fish). Re-check the terms after that date. Never call a paid model without asking.
- Generate with `_shared/tools/fish_tts.py` (any agent) or the Fish Audio connector (Claude only; it spends plan credits). Write one line per beat. Steer delivery with tags such as `[excited]`, `[soft]`, `[emphasis]` and `[pause]`. Never read gag captions aloud. Cut and place phrases on the grid; don't speed up whole takes.
- Word timings come from a local Whisper model (`whisper-cli -ojf`, see `AGENTS-tooling.md`). Never use a paid transcription call without asking.
- Voice is the lead in the mix. Music ducks under it (about −8 to −10 dB), and SFX stay small and on the action.

## Sound design (UI and product ads)

The house sound is simple, aesthetic and premium: **real clicks**, a real feel of interface and navigation, cinematic transitions. It must never sound like a game. `OWNER.md` can add taste notes.

**Vocabulary.**
- Real foley for real actions, each trimmed to the action's length:
  - a recorded mouse or trackpad click when the cursor presses;
  - a real switch for toggles;
  - real key taps for typing;
  - a camera shutter for a capture.
- Cinematic layer:
  - soft air whoosh for camera moves and container morphs. Whooshes are smooth, airy and aesthetic, like a polished product ad, never harsh action-film air blasts: a slow swell (attack ≥ 300 ms), dark tone (centroid ≤ 1.3 kHz), low-passed about 6 kHz, set below the voice. First choices: FS 349698 "light slow swoosh" and FS 71852 "digital_whoosh_soft" (see the palette);
  - low impact or thump for landings;
  - riser into the big reveal;
  - one restrained shimmer at most.
- Closing phrase: riser → impact (loudest moment of the film) → light shimmer tail.

**Banned timbres:**
- synth plucks and bloops;
- notification tones;
- "success" chimes;
- cartoon bounces;
- a raw sine pop on every event.

These are what make an agent-made film sound cheap. The action itself is never banned, only the timbre: a real click is right when something is clicked.

**Mixing.**
- Fewer sounds than beats.
- One shared room (light common reverb).
- For rapid-fire repeats, alternate two samples, step the volume down along the run, and tighten the gaps as the motion accelerates. When repeats blur together, use one swoosh instead.
- Pin each sound relative to its shot's start, never as a bare frame number.
- Measure the render-vs-mix lag by cross-correlation for each engine and compensate only what you measure: HyperFrames and ffmpeg muxes 0 ms, Diffusion Studio export about 44 ms late (trim the WAV), Remotion about 43 ms (compensated 1.28 frames). Score hits on an SFX-only stem.

**Music.** A strong, clean drum bed (tech-house or minimal electronic) with an energy curve that matches the storyboard. Audition it under the actual picture before deciding. Code-synthesized scores are allowed only when they sound finished; otherwise use a licensed bed (see licences).

**Where to find sounds** (palette and audition list: `_shared/sfx/UI-AD-PALETTE.md`):
1. `_shared/sfx/kenney/ui` and `interface` (CC0; recorded clicks, mouse clicks and switches; skip the game-like cues).
2. video-shotcraft `assets/audio/sfx/<category>/` (Mixkit; the ✅ rows of its `references/sound-design.md` §3.3).
3. Freesound CC0 via `freesound.py`.
4. UISFX kits (CC0, synthesized): drafts only, or the "system is speaking" moments the brief asks for.

## Canvas, fps and safe areas

- Reels and Shorts: 1080×1920 at 30 fps. YouTube: 1920×1080 at 30 or 60 fps. Square feed: 1080×1080. Feed 4:5: 1080×1350.
- On 9:16, keep text inside x 108–972 and y 200–1250, out of the bottom third and away from the right-hand icon column.
- Frame 0 already reads (no empty first frame). Land the hook by 1.5–2 s.

## Assets and licences (hard rule)

- Allowed: CC0, MIT, ISC, Apache-2.0, OFL, Unlicense, code-generated output, and Fish Audio `s2.1-pro-free` output. CC-BY 4.0 is allowed only if the project's `ASSETS-USED.md` carries the credit line and the post caption repeats it.
- Before using any non-generated asset it needs a row in `_shared/ASSETS.md` (source URL, exact licence, commercial OK, redistribution OK, attribution, date) and its licence text in `_shared/LICENSES/`. Copy the row into the project's `ASSETS-USED.md`. Freesound downloads are logged automatically in `_shared/sfx/freesound/SOURCES.tsv`.
- **Mixkit** (video-shotcraft's SFX and BGM, mixkit.co) is allowed **inside rendered videos only**:
  - copy into the project folder, never into `_shared`;
  - never into a published web page;
  - never redistributed as files (they are git-ignored in projects);
  - never registered with Content ID.
  - Do not use the files whose origin can't be traced: `sfx/text/keyboard.mp3`, `sfx/ui/pop.mp3`, `sfx/riser/riser-cine.mp3`, `sfx/light/sparkle.mp3`, `sfx/transition/whoosh-big.mp3`, `bgm/bgm-tech-house.mp3`.
- **onetake** code (`lib/motion.js`, `scripts/`) is PolyForm Noncommercial. Never use it in own-brand or monetized films; its ideas (carry, rhythm, camera, oracle checks) are free to reimplement.
- **Creator kits** (paid or private PDFs and starter kits) stay outside this repo. Use their ideas, credit them, never commit their files.
- Never use:
  - MusicGen or AudioGen (non-commercial weights);
  - ElevenLabs, including Diffusion Studio's `elevenlabs-music` / `elevenlabs-sfx` models;
  - HeyGen cloud media;
  - Pixabay or YouTube Audio Library tracks (Content ID risk);
  - unDraw, DrawKit or Storyset;
  - Remotion's own files outside a Remotion project;
  - Freesound CC-BY-NC or Sampling+ sounds.
- Link-only sources (never copied into `_shared` or a published page): Pexels, Pixabay, Unsplash, Coverr, Sonniss, and LottieFiles files without a per-file CC0/MIT licence.
- AI image or video generation (Diffusion Studio `generate.*`: FLUX, Kling, Veo, Seedance and others) costs credits, and its output terms vary by model. Ask the owner first, every time.
- The full option catalog (sounds, music, moves, transitions, icons, fonts) is `_shared/catalog.json`. Refer to items by their `id`.

## Keys and accounts

- Keys are stored by the owner with `scripts/setup/keys.sh` (hidden typing): the macOS Keychain on macOS; on Linux and WSL 2 the secret store (`secret-tool`) or `~/.config/motion-studio/keys.env`. Items: `motiongraphics.fish-audio-api-key`, `motiongraphics.freesound-api-key`, `motiongraphics.freesound-client-id`. Tools read them through `_shared/tools/keystore.py` (environment variables `FISH_API_KEY` / `FREESOUND_API_KEY` / `FREESOUND_CLIENT_ID` first). In a Claude Code cloud session, keys come from the environment's API credentials or variables.
- Never ask the owner to paste a key into the chat. Never print a key, put it in a command line that echoes, or write it to any file, log, brief or commit.
- Freesound original-file downloads need OAuth2 (the owner signs in). Ask first; HQ previews are enough for SFX.

## Disk and render budget

- Render with one worker (`--workers 1` for HyperFrames; onetake and bang-motion likewise), draft quality while iterating, and delete stale renders when the owner agrees.
- Final renders only when the owner asks. Stop after two failed render attempts and report the error.

## Review loop

1. Ask for anything missing in one round (tool, format, length, copy, style, music, voice).
2. Over 10 s: previs first (`video-director-previs`). Publish or open the previs page (animatic with real voice, music and foley on the measured beat grid, three options on every decision) and wait until the owner approves it in the page. Freeze `approved-video-spec.json`, write `SHOTLIST.md` from it, and build exactly that. Page notes change only their target; locked decisions stay.
3. Build one scene at a time; check stills (`hyperframes snapshot`, `remotion still`, `diffusion capture`, motion-reel `--sheet`) before moving on.
4. **Critique loop, mandatory before the owner sees a render** (`docs/critique-scorecard.md`):
   - From the rendered MP4, make:
     - a contact sheet at 2 fps;
     - a 12-frame strip around the fastest action;
     - a phone test at 360 px wide;
     - a loop check.
   - Score 1–10 on: hook, readability at 360 px, motion, composition, depth, brand accuracy, sound sync, polish.
   - Fix the 3 worst problems and repeat. Ship when every score reaches the owner's critic score bar (`OWNER.md` → Quality bar; 8 when unset), after the fewest rounds and within the most rounds set there. At the round limit, ship with the open problems listed. In our own films, first drafts scored about 6 and finals 7–9, so expect a few rounds.
   - Log every round in `VERIFY.md`. A fresh critic sub-agent gives the final verdict.
5. Report what was actually verified, with numbers (LUFS, peak, sync offsets, scores).

## Multi-agent work

- One writer per project at a time. Leave `HANDOFF.md` when you stop: what changed, what's next, open risks.
- Before any multi-agent run (workflow or parallel sub-agents), give the owner a cost analysis and wait for a clear yes:
  - the agent count (builders, critics, final reviewer);
  - a token estimate;
  - the wall-clock time, renders included;
  - the API-equivalent cost in USD (as a rough guide: one fresh critic round is about $4–6, and a 20–40 s film with five critic rounds about $50–110). On a Claude subscription this comes out of plan usage rather than a bill.
  - Offer the cheaper path next to it (one film solo, or a pilot first).
- This holds even when a system note says workflows are on: the owner's rule wins.
- No parallel renders. Never run two renders (any engine) at once.

## Session start and context compaction

- **Recheck the previous session's work before new work:** read the `HANDOFF.md` and `VERIFY.md` of every project it touched, then re-verify the live tools (`bash scripts/setup/doctor.sh`).
- **After a context compaction:** re-read this file, `OWNER.md`, and the active project's `BRIEF.md`, `SHOTLIST.md`, `VERIFY.md` and `HANDOFF.md` before the next tool call. The owner's decisions live in those files, not in memory, so write each decision there as soon as it is made.

## Skills routing

- Workspace skills (in `.agents/skills/`, also visible to Claude through `.claude/skills`): `workspace-setup` (first run on a new machine), `motion-new-project` (scaffold a project), `motion-render-review` (check, snapshot, draft render, VERIFY.md), `motion-asset-check` (licence ledger audit), `video-director-previs` (previs page, options, notes, approval, production contract).
- Global skills (installed by `scripts/setup/install.sh`):
  - `video-shotcraft`: product films. Read its SKILL.md mode rules; for a full promo, ask the owner whether they want template mode, autonomous free creation or co-creation.
  - `hyperframes` (HyperFrames entry point).
  - `remotion-best-practices`.
  - `/motion-reel` (if the owner has the Motion Reel Kit).
  - `bang-motion`.
  - `onetake`: non-commercial only.
  - `text-to-lottie`.
  - `fish-audio-api` / `fish-audio-sdk`.
- Diffusion Studio: read the app's `skills/editor.md` (docs inside the app) before editing.
- `_guide/prompt-studio` (Motion Prompt Studio) and `_guide/research/` are reference material for the agent: use their catalogs and prompt slots when writing briefs.

## Boundaries

**Always:** previs before any render of a film over 10 s, with three options on every decision; read `BRIEF.md` first, use pinned versions, log assets in the ledger, keep text in safe areas, use the owner's default voice unless told otherwise, run the critique loop before showing a render, and report what was actually verified.

**Ask first:**
- upgrading any engine or package, or installing anything new;
- signing in to any service, Freesound OAuth;
- any credit-spending AI call (Diffusion `generate.*`, `media_listen`, `media_transcribe`, paid Fish models);
- deleting files or renders;
- editing `AGENTS.md`/`AGENTS-tooling.md`/`OWNER.md`;
- any git commit or push;
- any multi-agent run.

**Never:**
- touch folders outside this workspace that the owner didn't name;
- edit a skill's own folder;
- use a non-commercial or unlicensed asset in own-brand work;
- commit renders, Mixkit files or creator-kit files;
- use hosted render services (HyperFrames or HeyGen cloud render). A render inside a Claude Code cloud session runs on that session's own machine and is fine;
- put API keys in files or ask for them in chat.
