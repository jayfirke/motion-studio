---
applyTo: "projects/**/*.html,engines/hyperframes-starter/**/*.html"
---
HyperFrames compositions: one paused GSAP timeline per composition on `window.__timelines`, `fromTo` entrances, `class="clip"` timed elements with `data-start`/`data-duration`/`data-track-index`, no CSS transitions, no `repeat`/`yoyo`, no `Math.random`/`Date.now`. Run `npx hyperframes@0.8.134 check` before rendering. Full rules are in `AGENTS.md`.
