---
name: motion-render-review
description: Check, snapshot, draft-render and verify a video project in this workspace, then write VERIFY.md. Use before showing the owner a draft, before any final render, or when they asks whether a video is ready.
---

# motion-render-review

1. Read the project's `BRIEF.md` and `SHOTLIST.md`.
2. Static checks: HyperFrames `npx hyperframes@0.8.134 lint` and `check` (0 errors required); Remotion and video-shotcraft `npx tsc --noEmit`; motion-reel `node scripts/render.mjs --verify --all`; Diffusion Studio `diffusion check <sceneId>`; onetake `verify_promo.py`.
3. Snapshots at every scene midpoint and at each cut −0.1 s / +0.2 s (`hyperframes snapshot --at …`, `remotion still`, `diffusion capture`). Look at them: safe areas, overlaps at seams, fallback fonts, contrast.
4. Draft render with `--quality draft --workers 1` to `renders/draft.mp4`. Confirm duration, resolution, fps and audio with `ffprobe`.
5. Loudness: measure with ffmpeg `ebur128`. If not around −14 LUFS (true peak ≤ −1 dBTP), make `renders/final.mp4` with the gain + limiter method in `AGENTS-tooling.md`. With voice: check the VO sits clearly above the music.
6. Critique loop (AGENTS.md → Review loop): from the draft MP4 make a 2 fps contact sheet, a 12-frame strip around the fastest action, a 360 px phone test and a loop check; score hook, readability, motion, composition, depth, brand, sound sync, polish (1–10); fix the 3 worst and re-render. Repeat until every score is ≥ 8 after ≥ 3 rounds; a fresh critic sub-agent gives the final verdict.
7. Write `VERIFY.md`: commands run, results, snapshot paths, measured LUFS, critique table per round, open issues. Write only what you actually checked.
8. Ask the owner: render final now, or what changes? Never run a final render without their yes, and never run two renders at once.
