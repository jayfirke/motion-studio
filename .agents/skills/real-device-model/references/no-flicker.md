# A moving device without flicker

The review note was: "when that particular iPhone body is moving, the screen and the body are flickering at every frame — it's not still." Several causes stacked up. Each one is listed below with its fix and the number that proved the fix. Measure on a **device-only render** (background, type and glow off) so the checks see only the device.

## Causes and fixes

| What you see | Cause | Fix | Measured |
|---|---|---|---|
| The whole device shakes a little on every frame; the screen content crawls | Poses driven by raw per-frame fits of a reference (about ±0.4° tilt noise, ±1 px position noise, 0.1° steps) | Smooth curves sampled at the render fps (see "Smooth tracks") | Drift jitter 1.09 → 0.004 px/frame; 18 vertical direction flips → 0; a held pose 0.000 px |
| The screen, border or cutout shimmers; edges tear | The display, border, island and glass as separate planes 0.03–0.25 mm apart, so their depths fight (z-fighting) | Draw the display, black border and cutout into **one** emissive texture on the cover-glass mesh | No shimmer at any distance |
| Small parts (lens rings, buttons, plateau steps) flicker | A fixed near/far of 0.001–20 m with a 24-bit depth buffer resolves only about 0.2 mm at the shot distance | Fit `near`/`far` to the device's bounding box in camera space every frame (code below). A logarithmic depth buffer is a quick stopgap | Sub-mm details stable |
| A flat back or plateau flashes white for 1–2 frames as the device turns | A glossy flat face sweeping past a hard-edged light | Satin on flat backs (roughness about 0.6); soft-edged, wide light strips (a 0.8-wide strip became a 7-wide soft one) | A 1-frame pop became a 4-frame sweep |
| Polished rings flare near-white for 2 frames in a spin | Mirror-like trim (roughness 0.12, env 1.5) | Roughness 0.40, env 1.15 | Gone; a soft sweep remains |
| One-frame colour jump on the lens glass | Thin-film iridescence changes hue sharply with angle | Keep only a trace (0.08) | Plateau brightness sweeps 194 → 207 → 187 over 5 frames |
| The device stalls, then rocks back, at an edge-on moment | A time warp (a slow-down for the edge-on view) unwound faster than real time, so local time ran backwards | Keep every time warp monotone; let it unwind over at least 0.12 s | Rotation per frame 4.1 → 1.8 → 5.0°, never negative |
| Ghost copies of the UI in fast moves | "Shutter blur" built from stepped sub-frame copies | Drop it on UI; keep frames crisp | No ghosts |
| The device twitches up, down and sideways while it turns, though the turn itself looks right and no single frame looks wrong | Small corrections stacked during review rounds: a time warp at edge-on, a 7.5 % pull-back, a height shift and a measured top-edge bob table, plus eases joined with a speed jump (a roll that starts at full speed, a `circ.out` that starts at infinite speed). Each matched the reference at its own moment; together the top edge reversed 13 times in 1.5 s and the roll kicked 1° in one frame | Rebuild the composite path, then fold it into one smooth curve per channel. Make each visible edge one-way between the turns the move really has (pool the reversals, monotone cubic), and solve one channel for it | Top edge 13 → 3 turns (one rise, one fall); sideways jerk 13.4 → 1.1 px/frame³; max change from the old path 9.3 px |
| Banding in screen gradients and dark glass | 8-bit output | ±1 LSB triangular dither, seeded by the frame number (deterministic) | No bands; no visible noise |
| A rail reads as a dark outline, or brightens for one frame | Nothing in the environment where the face's reflection points, or one hard light there | Measure the reflection direction; put a wide, soft strip there | Rails read silver; no single-frame spikes |

Things we tried that did not work:
- A real-glass material on a 2.5D cover-glass edge only mirrored the soft front fill: the edge tilts only about 7°. It greyed the black border instead of drawing a bright line.
- Thin light strips near the lens axis did not show on a rail's lip.
- Lower rail roughness darkened the rail.

## Smooth tracks

Measured or keyframed poses carry noise, and the eye sees it as flicker. Pick one of these per channel:
- **Analytic curve.** Use it when the move has a known shape (an ease, a spin, a pull-back). Fit its few parameters to the samples.
- **Monotone cubic (PCHIP)** through a few key samples. Use it when the value must not overshoot or reverse (size shrinking, a rise that settles).
- **Smoothing spline whose residual RMS equals the measurement noise.** Use it everywhere else. GCV (generalised cross-validation) fits the noise itself, so do not use it.

Sample the result at the render fps and report the RMS against the measured track. If the RMS is bigger than the noise, the curve has lost real motion.

`scripts/fit_track.py` does the spline and PCHIP steps. It estimates each channel's noise from the second differences of the samples, or you can give it per channel.

## Depth range per frame (three.js)

```js
// Phone-local bounding box (mm): buttons, glass, lens tops. Recompute near/far every frame before rendering.
const BOX = [];
for (const x of [-39.5, 39.5]) for (const y of [-81.8, 81.8]) for (const z of [-8.9, 4.45]) BOX.push(new THREE.Vector3(x, y, z));
function fitDepth(cam, groups) {
  let lo = Infinity, hi = -Infinity;
  const v = new THREE.Vector3();
  cam.updateMatrixWorld();
  for (const g of groups) {
    if (!g.visible) continue;
    g.updateMatrixWorld();
    for (const c of BOX) { v.copy(c).applyMatrix4(g.matrixWorld).applyMatrix4(cam.matrixWorldInverse); lo = Math.min(lo, -v.z); hi = Math.max(hi, -v.z); }
  }
  if (!(hi > 0)) return;
  cam.near = Math.max(0.001, lo * 0.9); cam.far = Math.max(cam.near * 1.5, hi * 1.1);
  cam.updateProjectionMatrix();
}
```

## The front image

- **One canvas covers the cover glass**: near-black glass, then the screenshot clipped to the display outline, then the cutout, then the front-camera lens. Wrap it in a `CanvasTexture` with `colorSpace = SRGBColorSpace`, mipmaps, `LinearMipmapLinearFilter` and maximum anisotropy.
- **Use it as `emissiveMap`** on a black, clear-coated `MeshPhysicalMaterial`. That keeps the screen at its own brightness while the glass still reflects a little.
- **Optional Fresnel cap at grazing angles.** Real cover glass dims the screen at grazing angles. If you model that, cap it near 0.97 of the frontal level. A stronger cut greyed the far end of the screen in a macro shot.
- **Swapping screens** swaps the `emissiveMap`, never the mesh.

## 2D (CSS or canvas) device frames

The same causes apply without a depth buffer:
- **One transform for the device.** Put the screen and the frame in one container and animate only that container. Never animate the screen and the frame separately: their rounding differs by a sub-pixel on every frame, and the gap shimmers.
- **Fractional transforms.** Do not round positions to whole pixels per frame, and do not animate `left`/`top`. Both snap and step.
- **No `will-change` or `translateZ(0)` on anything that scales.** The browser rasterizes it once and resamples it blurry, and the blur pops when it re-rasterizes.
- **Screenshot resolution.** Keep the screenshot at least as large as its largest on-screen size, and at most 2× it (or pre-downscale it). Heavy minification without mipmaps sparkles in motion.
- **Smooth tracks** as above, for any measured or hand-keyed path.

## The checks

- **Measure every device shot, spins and whips included, not only holds and drifts.** Our first checks measured the holds and the slow drift and passed; the twitch lived in the spin. For fast turns, project the device's points from the engine itself:
  - render each frame;
  - project the body's centre, top, bottom and a few glass corners to screen pixels;
  - count the turn-backs larger than 1 px on the points that are on screen, and look at their jerk (the third difference).

  A move has only the turns it was designed with. Pixel-based phase correlation is unreliable during a rotation.

- **`scripts/smoothness.py <video> <t0> <t1> <x0> <y0> <x1> <y1>`** measures a region's motion between frames (phase correlation, sub-pixel). It prints:
  - speed per frame;
  - stalls;
  - jitter: the largest change in speed between frames;
  - direction flips;
  - frame differences.

  A hold should be about 0.00 px/frame. A drift should change speed smoothly, with 0 flips.

  Phase correlation measures translation, so during a lean or a turn it can hop between two peaks and report a speed jump that is not there. The script prints the frame difference beside each jump: if that changes smoothly across the jump, step through the frames to confirm and move on. One such false jump showed up in a lean: 2.09 → 0.90 px while the difference went 4.65 → 4.54.
- **`scripts/flash_scan.py <video> --from <s> --to <s>`** counts bright pixels per frame (default > 230). It flags any frame whose count is over 1.4× both neighbours: that is a one-frame flash. Exit code 1 means something was flagged.
- **Watch the device shots at full speed, at 100 % size**, then step through the fastest move frame by frame. Numbers find flicker your eye glosses over; your eye finds flicker in places you did not measure.
