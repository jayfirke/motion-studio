# UI-ad sound palette

The sound house style for product demos and product ads: simple, aesthetic, premium, with **real clicks** and a real feel of interface and navigation. Rules are in `AGENTS.md` → "Sound design". Built 2026-10-05 from what is on disk plus a Freesound CC0 search. Nothing below has been auditioned under picture yet: always test candidates inside the actual cut, never alone.

Source keys:
- **K** = `_shared/sfx/kenney/…/Audio/` (CC0).
- **M** = `~/video-shotcraft/assets/audio/sfx/…` (Mixkit; render-only, so copy into the project, never into `_shared`).
- **FS** = Freesound id, CC0, fetched with `python3 _shared/tools/freesound.py get <id> --dir projects/NNN/audio/sfx --wav`.

## Action → sound

| On-screen action | First choice | Alternatives | Notes |
|---|---|---|---|
| Cursor press / tap on a button | FS 256455 "Mouse Click" (0.30 s), FS 534103 "mouse-click-single" | K `ui/mouseclick1.ogg` + `ui/mouserelease1.ogg`; FS 448086 "Normal click" (0.05 s, very short); FS 171697 "Menu Selection Click" | The film's sharpest, most present SFX (video-shotcraft gives the click the highest SFX level). Land the transient on the frame the button visibly depresses. |
| Double-click | FS 534104 "mouse-click-double" | two alternating single clicks | |
| Toggle / switch | M `ui/switch-tap.mp3`, M `ui/switch-light.mp3` | K `ui/switch1…38.ogg` (recorded); FS 457462 "Small Flashlight Click on 03" | Pick one switch sample for the whole film. |
| Segmented control / tab change | M `ui/switch-click-quick.mp3` | K `interface/select_00X.ogg` (audition: some are tonal) | |
| Typing in a field | FS 447909 "Keyboard typing" (3.8 s), FS 394945 "Keyboard" (6.9 s) | FS 565205 fast and hard; M `text/typewriter-hit-soft.mp3` for a stylised look | Trim to the exact typing span. For revealed text, alternate two single-key samples (FS 378085, FS 570754, FS 766639/766640) on the visible keystrokes. |
| Single key / Enter | FS 378085 "mechanical key hard" | FS 570754 "Keyboard - Press down" | |
| Scroll / list moves | FS 256457 "Mouse Scrolling Slow" | K `interface/scroll_00X.ogg` | Keep it low; it is texture, not a hit. |
| Container morph / card expand | FS 71852 "digital_whoosh_soft" (high-pass 140 Hz, low-pass 6.5 kHz, 40 ms fade-in) | FS 349698 "light slow swoosh" for longer moves | the owner (2026-10-05): smooth, airy, ad-like, never harsh. Peak the whoosh on the landing. Mixkit `air-woosh-quick` judged too harsh. |
| Camera push / zoom into UI | FS 349698 "light slow swoosh" (high-pass 120 Hz, low-pass 6 kHz, normalise; slow 575 ms swell) | FS 71852 for fast punches | Mixkit `zoom-air-fast` judged too bright/harsh for product ads (2026-10-05). | |
| Page / screen transition | M `transition/transition-soft.mp3` | M `transition/sweep-short.mp3`, FS 240640 "Metallic Whoosh" | One sample for every transition of the same kind. |
| Card drop / element lands | M `impact/hit-weak.mp3` (soft) | FS 776443 "pop out, bubble, soft bursting", FS 388958 "Soft Two-Finger Snap" | Small items: soft snap or none. Not a cartoon pop. |
| Number counts up | M `counter/clock-tick-single.mp3` in a run | K `interface/tick_00X.ogg` | Apply the rapid-fire rule (below). |
| Screenshot / capture | FS 170229 "Camera Shutter", FS 431588 "iPhone Camera Capture" | M `camera/camera-lens-shutter.mp3` | |
| Build-up into the reveal | FS 685256 "Riser sound effect short" (3.05 s), FS 561207 "Riser" (2.0 s) | `_shared/sfx/synth/riser.mp3` | |
| Logo / hero lands (loudest moment) | M `impact/impact-deep-whoosh.mp3` low-passed at about 3.2 kHz (keeps the deep hit, drops the hissy whoosh layer) | FS 541029 "Very low frequency impact", FS 648729 "Cinematic Woosh SFX-010" | |
| Light tail after the logo | M `light/shimmer-sparkle-sweep.mp3` | M `light/sparkle-touch.mp3`, FS 714565 "Fashion Shimmer" | At most once per film. |

**Closing phrase:** riser (FS 685256) → about 35 frames later impact (M `impact-deep-whoosh`) → about 25 frames later shimmer tail (M `shimmer-sparkle-sweep`).

## Never for ads

- M `ui/ui-click-tone`, `ui-confirm-bleep`, `ui-confirm-tone`, `ui-tone-quick`, `ui-success-soft`, `ui-notify-tech`, `ui-message-pop`, `ui-popup-dry`, `ui-option-select` and `ui-select-modern` (synth tones and notifications).
- Untraceable Mixkit files: `text/keyboard.mp3`, `ui/pop.mp3`, `riser/riser-cine.mp3`, `light/sparkle.mp3`, `transition/whoosh-big.mp3`.
- Kenney `rpg`, `casino`, `jingles` and `voiceover` packs, and UISFX `arcade` (game timbres).
- UISFX kits in general: synthesized, so drafts only. An exception is a deliberate "the system is speaking" moment; write that intent into the project's BRIEF.

## Rapid-fire and mix rules

- Alternate two samples. Step the volume down along the run (for example 0.40 → 0.25 over six hits). Tighten the gaps as the animation accelerates. When the hits blur together, play one swoosh instead.
- Fewer sounds than beats. One shared room (a light common reverb on all SFX). The music bed sits about 0.34 linear under SFX, and ducks a further 8–10 dB under the voice.
- Pin every sound as shot start + offset (or `beatF(n)` on a beat-synced film). Re-pin the whole table whenever a shot's length changes, and pin sound only after picture lock.
- Compensate the measured output offset (AAC ≈ 45 ms) plus each file's own peak latency, so the audible hit lands on the visual onset.

## Music beds (licensed, in-render)

| Bed | Source | Feel | Licence |
|---|---|---|---|
| `bgm/house-vibez.mp3` (~123 BPM) | M (Mixkit 745) | clean house | Mixkit Stock Music Free (render-only) |
| `bgm/cat-walk.mp3` (~129 BPM) | M (Mixkit 371) | house | same |
| `bgm/g-eazy-nba-type.mp3` (~86 BPM) | M (Mixkit 403) | hip-hop | same |
| `bgm/tonight-hiphop.mp3` (~103 BPM) | M (Mixkit 841) | hip-hop | same |
| FS 561190 "Tropicorp Advertisement" (37.6 s) | Freesound | upbeat corporate | CC0 |
| FS 514508 "Background Techno Loop 131bpm" (411 s) | Freesound | techno bed | CC0 |
| FS 220866 "Matt's House Kick Drum 120 BPM" (8 s loop) | Freesound | kick layer under a synth score | CC0 |
| `_shared/music/synth/*.mp3` | motion-reel `music.py` | generated | self-made; judged too generic in the first showreel |

Measure the BPM with `beats.py` / librosa before cutting to a bed. `bgm/bgm-tech-house.mp3` is untraceable, so never use it.
