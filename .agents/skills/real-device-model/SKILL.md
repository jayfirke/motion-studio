---
name: real-device-model
description: Build a real physical device or real-world object for a film (phone, tablet, laptop, watch, earbuds, card, any product) so it matches the real thing, and keep a screen inside a moving device frame free of flicker. Use whenever a film shows a real device or object, a device mockup, or app screens inside a phone or laptop, and whenever someone says the device looks fake or like a demo model, has the wrong size, corners, cutout or colour, or flickers, shimmers or jitters while it moves.
---

# real-device-model

Viewers judge a device on screen against the one in their pocket. Two problems each cost a full review round in our films, and both are solved here:
- **A body built from memory.** The proportions were wrong, the corners were round arcs, the cutout was missing and the finish was guessed. It looked like "a demo iPhone".
- **Flicker.** The screen and the body flickered on every frame while the device moved.

Read these before building anything:
- `references/research.md`: where exact numbers come from, how to read a dimensional drawing, and a worked example (iPhone 17 Pro Max).
- `references/no-flicker.md`: each flicker cause we hit, its fix, and the measurement that proved the fix.

## 1. Research the real object before any geometry

1. **Pin the exact model and finish**, for example "iPhone 17 Pro Max, Silver". If the brief does not name them, ask the owner once. Never build a generic "modern phone".
2. **Get the maker's dimensional drawing.** Apple publishes one PDF per device in its Accessory Design Guidelines, at `https://developer.apple.com/download/files/accessories/dimensional-drawings/<model>.pdf`; for example, `iphone-17-pro-max.pdf`.
   - If there is no drawing, use these in order: the maker's tech-specs page, then regulatory filings, then independent measurements. Mark the confidence of every number taken from these.
   - Never take dimensions from marketing renders, mockup kits or memory.
3. **Write a spec table** in the project (`analysis/device.md`). Give every number its source: sheet, view and detail. At minimum, cover:
   - the body width, height and depth;
   - the outline corner, as a traced curve, not a radius;
   - the cover glass and display active area, with their insets;
   - the cutout (island, notch or punch-hole): its size and position;
   - the buttons and ports;
   - the camera lenses: diameters, centres, and how far they stand proud;
   - the camera plateau;
   - the finish of each part.
4. **Capture the screens** at the device's native pixel size: use a simulator or emulator with the same display size, with a clean status bar. Screenshots never include the hardware cutout, so draw it at the drawing's position.

## 2. Build

- Take geometry from the spec table only, in millimetres, with the origin at the body centre.
- **Corners:** modern devices use continuous-curvature corners, and a circular arc of the nominal radius reads wrong.
  - Trace the drawing's corner curve as points and run a monotone cubic (Fritsch–Carlson) through them, so the curve never overshoots the drawing's line.
  - Make the glass and display corners parallel insets of that outline.
- **The front is one emissive image on the cover glass.** Draw the display, the black border and the cutout into one texture. Never stack them as separate planes.
- **Make the shell closed.** Seams share vertices, with no T-junctions, and no two visible surfaces are coplanar.
- **No maker logos or marks.** The shape and the finish carry the identity.
- **Finish comes from what the surface reflects.**
  - Find the direction each face mirrors, then put soft-edged light strips there, in a PMREM studio environment.
  - Tune roughness and environment intensity under the film's own camera, not by hex values alone.
  - A front-on side rail mirrors the room beside and behind the device. If that part of the environment is empty, the rail reads as a dark outline.

## 3. Move it without flicker

Details and numbers are in `references/no-flicker.md`.
- Drive every pose from fitted smooth curves sampled at the render fps (`scripts/fit_track.py`), never from raw per-frame measurements.
- In 3D, fit the camera's near and far planes to the device's bounding box on every frame.
- Use these finishes:
  - satin, not mirror, on flat faces that turn through a light;
  - soft, wide light strips;
  - polished trims rough enough that a highlight sweeps over 4 frames or more.
- Keep time warps (slow-downs and holds) monotone, so time never runs backwards.
- Never stack per-moment corrections on a move (a warp here, a scale bump there, a measured bob table). Each one looks right on its own frames, but together they twitch. Fold them into one smooth curve per channel, and check that each visible edge only turns where the move intends.
- Join eases with matching speeds. An ease that starts at full speed (`sine.out`, and `circ.out` starts at infinite speed) right after one that ended at rest is a one-frame kick.
- Never put sub-frame "shutter blur" copies on UI: they ghost.

## 4. Prove it before anyone sees it

| Check | How | Pass |
|---|---|---|
| Shape vs drawing | Orthographic renders at a fixed px/mm, laid out like the drawing (front, sides, back, top, bottom), then `scripts/drawing_overlay.py` | Every outline, inset, cutout, button and lens line within 1 px at 6 px/mm (0.17 mm) |
| Mesh | Count open edges, non-manifold edges and flipped faces; measure the bounding box | 0 / 0 / 0; the box equals the spec |
| Motion | `scripts/smoothness.py` on a device-only render (background off) over each device shot, spins and whips included; for fast turns, also the engine's projected points (see `references/no-flicker.md`) | Holds ≤ 0.01 px/frame; moves have 0 direction flips and no stalls; no speed jump over 0.5 px between frames, unless the frame difference stays smooth across it (a rotation can fool phase correlation) |
| Flashes | `scripts/flash_scan.py` over each device shot | No frame whose bright-pixel count is over 1.4× both neighbours |
| Screen | A still at the closest frame; measure the cutout in pixels | Text reads; the cutout matches the spec |

Log every check in `VERIFY.md` with its numbers. Never publish the maker's drawing, an overlay made from it, or reference footage: keep them in local scratch space.

## Scripts

All take `--help`. They need Python 3 with numpy, plus ffmpeg for the video checks, scipy for `fit_track.py` and Pillow for `drawing_overlay.py`.

```bash
python3 .agents/skills/real-device-model/scripts/fit_track.py raw_pose.csv --fps 60 --out smooth_pose.csv     # noise-matched smooth curves
python3 .agents/skills/real-device-model/scripts/smoothness.py render.mp4 12.3 16.0 0.3 0.1 0.7 0.9            # judder and flicker of a region
python3 .agents/skills/real-device-model/scripts/flash_scan.py render.mp4 --from 6.1 --to 9.75                 # one-frame flashes
python3 .agents/skills/real-device-model/scripts/drawing_overlay.py --render front.png --render-ppmm 6 \
    --drawing sheet1.png --drawing-ppmm 8.643 --match 1374.5,836.5:166.06,49.71 --out overlay.png                # drawing lines in red
```
