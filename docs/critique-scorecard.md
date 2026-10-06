# Critique scorecard

A fresh critic (a new sub-agent that has not seen the build) judges each draft render from evidence, not from the code. Run it before the owner sees any film. Log every round in the project's `VERIFY.md`.

## Evidence to make from the rendered MP4

1. **Contact sheet** at 2 fps (every frame tiled, timestamps under each).
2. **Fast-action strip:** 12 consecutive frames around the fastest move or cut.
3. **Phone test:** the contact sheet again at 360 px wide. Can you read every line?
4. **Loop check:** the last frame next to the first.
5. **Sound numbers:** integrated loudness (LUFS), true peak, and the offset of each designed hit against its picture event, measured on an SFX-only stem by cross-correlation.
6. **Blank-frame scan:** any frame that is a single colour.

## The eight scores (1–10 each)

| Score | 8 means | Typical failures |
|---|---|---|
| **Hook** | Frame 0 already reads; the subject and the promise land by 2 s | empty first frame, slow logo intro, text before picture |
| **Readability at 360 px** | Every line readable on a phone; captions ≥ 5% of frame height, secondary text ≥ 3% | UI text under 3%, thin weights on busy backgrounds |
| **Motion** | Springs with weight, overlap and follow-through; something carried across every boundary | everything fades in, one-frame swaps, empty containers mid-morph, bouncy UI |
| **Composition** | Clear focal point in every frame; no dead third of the frame for more than a second | centred title on a gradient, cards crossing in flight, a parked element |
| **Depth** | Layers, light and camera give space; the camera moves for a reason and lands | flat cards, handheld shake, a camera that steps instead of easing |
| **Brand accuracy** | Real tokens: fonts, colours, radii, copy; UI matches the product | redrawn UI, a stock font, colours from another film |
| **Sound sync** | Every designed hit within ±40 ms of its picture event; voice leads, the impact is the loudest moment, −14 LUFS, true peak ≤ −1 dBTP | music swallowing the voice, game-like bloops, harsh whooshes, a hit before its cause |
| **Polish** | No glitches: no slivers, flashes, leaks, clipped text or blank frames | glyph slivers at mask edges, a veil switched off instead of eased, one-frame flashes |

## The loop

1. Make the evidence. 2. The critic scores all eight with one line of evidence each (a timestamp or a number). 3. Fix the **three worst** problems only, verify each fix on stills or a short clip, log what changed. 4. Repeat.

Ship when every score is 8 or higher after at least 3 rounds, or stop at the owner's round cap (see `OWNER.md`) and report the remaining scores honestly.
