---
name: motion-asset-check
description: Audit asset licences for a MotionGraphics project or the _shared library against the ledger in _shared/ASSETS.md. Use before rendering a final, before adding any new sound, music, image, icon, font or Lottie file, or when the owner asks if a video is safe to post.
---

# motion-asset-check

1. List every non-generated media file in the project (`assets/`, `audio/`, `public/`, `fonts/`) or in `_shared/` (skip code-generated audio and SVG drawn in the composition). Also list copied library code: video-shotcraft components/demos (Apache-2.0), bang-motion starters (MIT), and any onetake code (PolyForm Noncommercial: fails for own-brand or monetized films).
2. Each file must match a row in `_shared/ASSETS.md` with source URL, exact licence, commercial OK = yes, redistribution OK, attribution text and date. Its licence text must exist in `_shared/LICENSES/`.
3. Allowed licences: CC0-1.0, MIT, ISC, Apache-2.0, OFL-1.1, Unlicense, Fish Audio `s2.1-pro-free` voice takes (check `audio/vo/takes.jsonl` says that model; after 2026-11-30 re-check the terms). CC-BY-4.0 needs a credit line in the project's `ASSETS-USED.md` and the post caption. Mixkit files (video-shotcraft `assets/audio`) pass only inside the project and the render: fail them if found in `_shared/` or a published page, and fail the six untraceable files listed in AGENTS.md. Freesound files pass only with a CC0 (or credited CC-BY) row in `_shared/sfx/freesound/SOURCES.tsv` or a `.json` sidecar. Anything else (NC, ND, SA, Sampling+, custom "free" licences, Content ID libraries, MusicGen or ElevenLabs output) fails.
4. For a new asset, verify the licence on its source page first, then add the ledger row and licence file before using it.
5. Output a table: file, ledger row found, licence, status (pass/fail/needs credit). Copy the rows into the project's `ASSETS-USED.md`. Never delete files; report failures to the owner.
