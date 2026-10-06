# Previs Studio (app source)

The review app for AI-planned films. A non-expert watches the previs, swaps any decision between three options, points at anything to leave a note, and approves. Nothing is rendered before approval.

The app is fixed; films arrive only as data packs (`previs.json` + `audio/`). See `.agents/skills/video-director-previs/SKILL.md` for the data contract and the review loop.

## Commands

```bash
npm run dev        # dev server on http://localhost:5194 (public/ links to ../studio data)
npm run typecheck
npm run build      # type-check, bundle, inline into the published pages (scripts/inline.mjs)
npm run smoke      # 39 checks in real Chrome on the built page; add -- --out <dir> for screenshots
npm run a11y       # axe-core audit of every view (fails on serious or critical issues)
```

`npm run build` writes one self-contained page body (title, fonts link, inline CSS, `#root`, inline module script; no doctype, the Artifact publisher adds it) to every target in `scripts/inline.mjs`: `../studio/index.html`, `../page/index.html` and each per-film page. Publish with `capabilities: {"db": {}, "user": {}, "sample": {}}`.

## Stack

Vite 8, React 19, TypeScript (strict), Tailwind 4, Radix primitives (tooltip, popover, dialog, dropdown, slider), zustand, zod, cmdk, sonner, lucide-react. Tests: playwright-core with the cached Chrome for Testing.

## Layout

```
src/data/       types.ts (the contract), schema.ts (zod validation with readable problems), model.ts (decisions, timeline, QA)
src/engine/     viewer.ts (paints any frame as a pure function of time), audio.ts (Web Audio: bed ducked under the voice, VO, foley),
                playback.ts (one clock for the player, compare and storyboard cards), picker.ts (what the pointer is on)
src/state/      store.ts (zustand: picks, tweaks, undo, notes, approval, sync with the page database)
src/components/ player/ (stage, comment layer, pins, composer, controls, timeline with sound lanes)
                side/ (choices, notes, guided review, ask the director), board/, plan/, shell/ (top bar, home, dialogs, ⌘K)
src/lib/        claude.ts (typed artifact runtime: db, user, sample; every capability may be absent), hooks, layout, util
```

## Rules

- Every frame is a function of time and the current picks: no timers in painting, no randomness.
- Every control has a tooltip with a plain sentence and its shortcut.
- Works at 375 px wide, on touch, and in full screen (theater mode when the Fullscreen API is refused).
- Picks and notes save to the page database when it is there, and to this browser when it is not.
