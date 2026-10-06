---
name: motion-new-project
description: Scaffold a new video project in projects with the right engine, template files, fonts and audio. Use when the owner asks to start, make or create a new video, reel, promo, intro or motion graphic in this workspace.
---

# motion-new-project

1. Read `AGENTS.md`. Pick the next free number `NNN` in `projects/` and a short kebab-case name (for example `002-chai-promo`).
2. If tool, format, length, style, music or voice is missing from the prompt, ask in one round. Pick the tool with AGENTS.md → "Which tool for which job" (product demo/ad → video-shotcraft; reel/kinetic → HyperFrames). Voice defaults to Fish Audio Sarah.
3. Scaffold with the pinned command for the engine (`AGENTS-tooling.md`):
   - HyperFrames: `npx hyperframes@0.8.134 init NNN-name --non-interactive --resolution portrait|landscape|square`
   - Remotion: `npx create-video@4.0.532 --yes --blank NNN-name`
   - motion-reel: `sh ~/.claude/skills/motion-reel/scripts/init.sh projects/NNN-name --preset presets/blank`
   - video-shotcraft: copy `~/video-shotcraft/template/` into `projects/NNN-name/` (ask before `npm install`); bang-motion: copy a starter from its `assets/`; Diffusion Studio: `diffusion open -b projects/NNN-name`.
4. Copy `projects/_template/*.md` into the project. Fill `BRIEF.md` from the prompt (keep the owner's words). If the prompt came from Prompt Studio, paste it under "Source prompt".
5. Copy only the fonts the style needs from `_shared/fonts/` into the project's fonts folder (`public/fonts/` for Remotion), along with `OFL.txt`.
6. Copy chosen music and SFX (from `_shared/`, the video-shotcraft Mixkit library, or Freesound via `_shared/tools/freesound.py`) into the project's `assets/audio/`, following `_shared/sfx/UI-AD-PALETTE.md`, and add their ledger rows to `ASSETS-USED.md`.
7. Report the folder path and the next step (shot list, if longer than 10 s).
