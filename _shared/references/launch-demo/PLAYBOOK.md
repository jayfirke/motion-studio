# Launch and demo films: the playbook from 187 studied films

This is the rulebook distilled from a reference library of 187 studied films, one card each (171 on the first pass; 16 more on a second pass the same day, after caption rate limits had blocked their downloads; the numbers in section 1 still come from the first 171). The index is [INDEX.md](INDEX.md), and every claim below cites a card as `[Name](cards/<id>.md) m:ss`. It sits under `AGENTS.md`: where this page and the house rules disagree, the house rules win. Each disagreement is pointed out where it comes up.

Read this before writing a brief, a previs or a shot list for any launch or demo film.

**What the evidence can and cannot tell us**
- 180 of the 187 videos come from one agency (What a Story). The library describes one house style in depth and the wider field only a little.
- The numbers come from automatic tools. The cut detector misses morphs and camera moves, and it over-counts wipes and flashes. The tempo detector sometimes doubles a tempo (172 is often 86). "Sound events" are onsets in the full mix, so drum hits in the music count too.
- Voices and sound effects were read from captions and numbers, not listened to.
- The owner's review of our first draft set the target: our last draft was *slow, with long gaps; not engaging; not looking like a demo; problems told but not shown*. Every rule below answers one of those four notes.

---

## The short version

1. **Show the product working within 2 seconds.** Put real UI, a typed prompt or a finished result on frame 0. Never open on a metaphor. ([Tasha R](cards/6wg--2qurP0.md) 0:00, [360 Lending](cards/nf3Hd9mjcmk.md) 0:00, [HeyGen](cards/k3ZItY0S57k.md) 0:04)
2. **Every change has a visible cause.** A cursor presses, a key is typed or a voice speaks, and the UI answers in the same frame. Films without a cursor read as slideshows. ([Fronter](cards/1Jc4ywxopmY.md), [Kitaabh](cards/XGlri_JubsA.md) 0:10–0:26)
3. **One sentence, one screen state, one action.** The voice runs at 135–150 words per minute with no music gaps, and the picture changes state every 2–3 s. ([Tasha R](cards/6wg--2qurP0.md) against [Caratwise](cards/iVpp-RS-PW4.md))
4. **Carry, don't cut.** The best films run 20–70 s with no hard cut. Each object becomes the next container, or the camera pushes through a screen. Hard cuts are kept for short bursts on the beat. ([Kartel](cards/x_tCThgCepU.md) 0:04.6–0:27.5, [Viable](cards/2AWzLDFJXjo.md))
5. **Make small UI readable by moving the camera, not by shrinking the screen.** Push onto the control before the click, lift the key card out at 1.3–2×, and blur or dim the rest. Never show a raw full-screen recording. ([Leadjet](cards/gjpXUD8Vz6I.md) 0:19–0:31, [JustCall × HubSpot](cards/8JWGH6LCWp8.md) 0:20)
6. **Show results in place.** A counter ticks, a gauge sweeps, a status flips to a green check, or the same frame comes back fixed. ([Feedier](cards/GJjVTYFVeQc.md) 0:37, [Gataca](cards/loD8ZpA19ds.md) 0:04 → 1:13)
7. **Show problems as real friction on screen.** Use tabs to hop between, a stalled loader or a chore done by hand. Spend 15–20 % of the runtime on problems at most. ([Avalara Sidekick](cards/GyYIBdrAASw.md) 0:13, [Leadjet](cards/gjpXUD8Vz6I.md) 0:09)
8. **Use one accent colour on one word per line, and never more than two text levels.** Type enters by slide, mask or typing, never by an opacity fade. ([HRS](cards/5e1WMPUbUsU.md), [Axias](cards/-tPZCQsQEqo.md))
9. **Give each sound a visible action.** A real click lands under every press, a soft whoosh under every camera move, key taps under typing, and ticks under counters. Use fewer sounds than beats.
10. **Plan the energy curve.** Run long carried takes first, then accelerate into 1.5–2.5 s action cuts, with one burst of hits about every minute. Breathe only at the name, the big number and the end card. ([Elevate](cards/2yL0LhyxOGk.md) 0:48–0:58)
11. **Thread one carrier object through the film,** such as a dot, a line, an orb or a hero component that keeps growing. Bookend the film, so the opening frame returns changed. ([Builder.ai](cards/ZDR0X7VOho4.md), [Axias](cards/-tPZCQsQEqo.md) 0:48 → 1:13)
12. **End on an action.** The cursor presses the CTA, the wordmark holds for 1 s or more, and the mix lands at −14 LUFS (most references are far quieter; don't copy their masters).

---

## 1. The numbers

Median (first quartile–third quartile) per group. Reproduce with `python3 tools/stats.py`; the groups come from INDEX.md.

| Group | n | Length s | Cuts/min | Median shot s | Longest uncut take s | Words/min | BPM (as detected) | Sound events/min | LUFS |
|---|---|---|---|---|---|---|---|---|---|
| All films (no agency talks) | 165 | 77 (61–100) | 6.7 (2.5–14.2) | 6.1 (3.0–14.6) | 26 (18–45) | 117 (78–132) | 118 (103–129) | 131 (99–160) | −17.1 (−20.2 to −15.1) |
| Launch-style (Launch + Brand/ad) | 74 | 63 (41–87) | 10.7 (4.0–21.3) | 4.1 (2.1–10.5) | 20 (14–28) | 95 (4–127) | 118 (103–129) | 128 (93–163) | −16.6 (−19.0 to −14.3) |
| Demo-style (Demo + Explainer) | 91 | 92 (72–111) | 4.8 (1.8–10.9) | 8.4 (4.1–18.9) | 37 (25–53) | 124 (110–135) | 123 (108–129) | 136 (105–157) | −17.6 (−20.6 to −15.3) |
| Launch-style, narrated | 43 | 73 (59–95) | 10.5 (4.4–18.6) | 4.2 (2.9–8.2) | 22 (15–36) | 123 (106–135) | 118 (112–129) | 124 (94–150) | −17.1 (−19.6 to −15.6) |
| Demo-style, narrated | 83 | 92 (72–109) | 4.8 (1.8–11.9) | 7.6 (3.8–18.9) | 38 (25–52) | 126 (115–136) | 123 (108–136) | 132 (103–157) | −17.6 (−20.6 to −15.3) |
| Narrated films (≥ 60 words/min) | 126 | 85 (68–100) | 6.2 (2.5–13.0) | 6.2 (3.2–14.3) | 31 (20–48) | 126 (113–136) | 123 (112–129) | 129 (99–153) | −17.5 (−20.5 to −15.3) |
| Music-only films (< 30 words/min) | 39 | 60 (39–79) | 9.0 (2.2–21.9) | 5.6 (2.0–13.9) | 20 (14–26) | 0 (0–5) | 108 (99–118) | 146 (101–185) | −15.9 (−19.1 to −13.6) |
| The 21 films rated 5 in INDEX | 21 | 67 (54–75) | 6.8 (1.4–10.9) | 5.6 (4.0–19.3) | 26 (17–62) | 127 (116–135) | 123 (112–136) | 128 (102–151) | −17.7 (−19.0 to −15.8) |

**What the numbers say**
- **These films barely cut.** Nearly half (78 of 165) have fewer than 6 hard cuts per minute. In 74 of 165, the longest uncut take runs 30 s or more, and in 51 it covers half the film. Pace comes from change *inside* a shot, not from editing.
- **Demos cut half as often as launches** (4.8 against 10.7 cuts per minute) and hold takes nearly twice as long (37 s against 20 s). Launch-style films lean on music, type and bursts. Demo-style films lean on a moving camera over one UI world.
- **Narration is the norm, and it is dense.** 126 of 165 films are narrated, at a median of 126 words per minute. 78 of those 126 run at 120 or more, and the fastest good demos run at 142–168 ([Leadjet](cards/gjpXUD8Vz6I.md) 142, [Tasha R](cards/6wg--2qurP0.md) 145, [Amy](cards/yxTAYXKF3UI.md) 153, [HeyGen](cards/k3ZItY0S57k.md) 155, [Fronter](cards/1Jc4ywxopmY.md) 168). Our v0.1 previs ran at about 104.
- **Words per minute alone do not make a film good.** Narrated films rated 4–5 and narrated films rated 1–3 talk at almost the same speed (126 against 124). What separates them in the cards is whether each sentence gets a visible action. Speed is necessary, not sufficient.
- **Music-only films compensate with sound and type.** They have more sound events (146 against 129 per minute) and louder masters, and they still explain less. Several cards call them slogans without understanding ([HRS without VO](cards/WlUTznYI3Ps.md), [Lumin teaser](cards/npQjAYkXK1k.md)).
- **Sound runs at 100–160 events per minute even with almost no cuts.** The SFX follow on-screen actions, because there are no edits to hit ([Site24x7](cards/33ilXiqbhq4.md): 182 per minute with one cut).
- **Most references are mastered quietly.** Only 28 of 165 sit between −15 and −13 LUFS, and 68 are quieter than −18. The 8 that are louder than −13 are mostly music-only hype cuts. Our −14 LUFS rule stands; copy their density, not their masters.
- **Long films drag.** Of the 12 films that run 2:20 or longer, 9 are rated 2 and 3 are rated 3; none earned a 4 ([Avalara Aviator](cards/ORsp_pxCz_g.md), [IDBS](cards/mbKt-0bBmK8.md), [Darwinbox](cards/S9H3sqKc9Y4.md), [Pulse](cards/_YlxcU--OMU.md), [AOSEN](cards/uw3rtrNc15c.md)). Every beat carries the same weight, screens drift and no cursor acts. A 3:50 film has to be built as a chain of short films.

**Targets for our films**

| Measure | References | Our target |
|---|---|---|
| Voice | 126 words/min median; top quartile 136 | 135–150 words/min while speaking, with no music gap over 1.5 s inside a chapter |
| Visible state change | every 2–3 s in the good films (cards) | every 2–3 s; no state held over 4 s unless it is a planned breath |
| Hard cuts | 4.8–10.7 per minute | 2–7 per minute outside bursts; bursts of 4–8 cuts in 2 s or less, once or twice per film |
| Longest uncut take | 20–37 s | 15–40 s per chapter, carried by camera, morph or cursor |
| Shot-length range | 0.07–70 s | at least 4× (0.4 s burst cuts against 2.5–4 s holds), as in the house rules |
| Cursor presses (demo chapters) | one per spoken verb in the best films | one every 2–4 s |
| Problem act | 15–45 % of runtime (the weak films spend 30–45 %) | 15–20 % at most, and shown on screen |
| Designed SFX | 100–160 onsets/min, music included | one per visible action, about 25–45 per minute in demo chapters, always fewer than the bed's beats per minute |
| Loudness | −17.1 LUFS median | −14 LUFS integrated, true peak ≤ −1 dBTP |

---

## 2. Structure templates

The skeleton is the same everywhere: **hook → pain shown → one turn word → features in the order a user meets them → proof that moves → CTA with a click.** Only the proportions change.

### 2.1 A 30–60 s launch

| Time | Beat | Picture | Voice | Evidence |
|---|---|---|---|---|
| 0–2 s | Hook | Real product on frame 0: a UI rising in, a prompt typing, or a burst of finished results on the beat | One provocation, a stat or a question, under 12 words | [Tasha R](cards/6wg--2qurP0.md) 0:00, [360 Lending](cards/nf3Hd9mjcmk.md) 0:00, [PayCloud](cards/_38ybzeZ9i8.md) 0:00 |
| 2–8 s | Pain, shown | One real friction moment: a stalled loader, a surprise fee, tabs to juggle | One or two short sentences | [TicketSoft](cards/PBqpDipqNtY.md) 0:08, [Kitaabh](cards/lWe_JK-wtEo.md) 0:00 |
| 8–10 s | Turn and name | One turn word or a cut, then the name in under 1.5 s, held for at least 1 s | "Meet…", "Introducing…", "Or…" | [affable.ai teaser](cards/pQkbEUbLxbE.md) 0:13 |
| 10–40 s | Three features | Each one is a cursor action, a visible result and a 1–2 word heading, 8–10 s each | One sentence per feature, starting with a verb | [ResponseScribe](cards/XePPHrTdPqA.md) 0:14–0:33 |
| 40–50 s | Proof | One moving number (an odometer roll or a giant stat sliding in) or a fast montage of real outputs | One line | [Ada](cards/w7Do0gq589A.md) 0:46, [GWI Spark](cards/wnzbApqFAsE.md) 0:35 |
| 50–60 s | CTA | The cursor presses the CTA pill; the wordmark holds 1 s or more | Name plus a call to act | [ResponseScribe](cards/XePPHrTdPqA.md) 0:37, [Synoptix ad](cards/C38TKoFCIw4.md) 0:21 |

Study [ResponseScribe](cards/XePPHrTdPqA.md) (38 s), [affable.ai](cards/du0qhu4Ecck.md) (36 s: four features in 12 s at 140 words/min) and [Tasha R](cards/6wg--2qurP0.md) (53 s).

### 2.2 A 60–120 s launch

| Share | Beat | What works |
|---|---|---|
| 0–3 s | Hook | Product, result or stat on frame 0. [HeyGen](cards/k3ZItY0S57k.md) shows three finished videos by 0:13 before explaining anything. |
| up to 15 % | Problem | Shown as a chorus or as friction: a face ringed by badged app icons ([Zeda](cards/HeYzBw7JvwQ.md) 0:01), tabs and a cursor ([Avalara Sidekick](cards/GyYIBdrAASw.md) 0:13), or cards piling up until warnings appear ([ArtDept](cards/TNCAjtXkb2k.md) 0:00–0:13). |
| 2–5 s | Turn and name | The problem collapses into the product: the swarm is pulled into the monitor ([Viable](cards/2AWzLDFJXjo.md) 0:07), or the screen dims into the brand stage ([Avalara Sidekick](cards/GyYIBdrAASw.md) 0:24). |
| 50–60 % | Demo | 4–6 features in journey order, 8–12 s each, with a cursor cause for every one. Start with one long carried take, then accelerate into 1.5–2.5 s action cuts ([Elevate](cards/2yL0LhyxOGk.md) 0:48–0:58). |
| about 10 % | Proof | Numbers that move: KPI tiles lift off the dashboard toward the camera ([PayCloud](cards/_38ybzeZ9i8.md) 1:09), a badge counts up while a ring fills ([FinancialPress](cards/uNHbqDTc5-Q.md) 0:32). |
| 5–8 s | CTA | The cursor presses the button. Optionally, the opening frame returns changed first. |

Models: [Axias](cards/-tPZCQsQEqo.md), [Elevate](cards/2yL0LhyxOGk.md), [Kartel](cards/x_tCThgCepU.md), [Avalara Sidekick](cards/GyYIBdrAASw.md), [micro1](cards/Qbxq-To0W_I.md), [HeyGen](cards/k3ZItY0S57k.md).

### 2.3 A 2–4 minute demo

A long demo is a chain of short films. Most long references fail because every beat has the same weight (see section 1).

- **Chapters of 12–30 s.** Each one runs: a chapter label lands → one task story is told by the cursor → a result state appears → something carries into the next chapter.
- **A label system the eye learns once.** Either a pill lands big, shrinks into a header and the UI rises under it ([GTM Buddy](cards/HVJ10JaoJVI.md) 0:54–1:15), or a one-word title gets pushed out of frame by the rising window ([UpSend](cards/vLeqIRI5qPY.md) 0:14).
- **A hub to return to.** Use a home screen ([PodPlan](cards/exM9XpoGf_0.md) 0:06, 0:35, 0:56), a chapter map with a push into each node ([Zeliq](cards/yul8gQlC9HM.md) 0:17–1:07), or a pull-back to the whole map ([AOSEN](cards/uw3rtrNc15c.md) 0:12, 1:53).
- **A burst about every 60 s** resets attention. In [Avalara Aviator](cards/ORsp_pxCz_g.md), the 2 s cut burst at 2:16 is what finally lifts a slow film.
- **Three or four planned breaths of 1.5–3 s**, each at a turn: the name, the first time the product plays, the big number, the end card. Nowhere else.
- **Accelerate into the last third**, and bookend the film: the opening frame returns changed ([Gataca](cards/d0Ss8nzttOI.md) 0:02 → 1:13, [Aspire](cards/53pvn5QCtpA.md) 0:01 → 0:52, [Munch](cards/_PbQgX4URJg.md) 0:00 → 1:41).
- **Name a user and tell one or two complete task stories** rather than listing features ([Avalara Aviator agent hub](cards/Q90lnv8H5U4.md) fits two full tasks into 50 s).

---

## 3. The demo grammar

### 3.1 The one rule

**Cause, then effect, in the same frame or the next.** Every film the cards praise as a demo has it, and every film they call "a slideshow of screens" lacks it ([Truein](cards/mXVnR5mcpqA.md), [Swisscom](cards/yMPMtpxbA40.md), [Ventaz](cards/iPGaGkdYKsg.md), [Darwinbox](cards/S9H3sqKc9Y4.md)). The cause can be a cursor, typed text, a spoken request ([Vapi](cards/-6ilG9NZn-M.md): the live call drives the camera), or an earlier click whose result carries over ([TQ42](cards/PrgeaCTpdRA.md) 0:35: a Success modal shrinks into a toast on the next screen).

### 3.2 The cursor

- **Size:** 3–6 % of frame height, which is 35–65 px at 1080p. The best films scale the cursor up for legibility ([PlugXR](cards/SpcGZLNYztc.md) about 6 %, [Fronter](cards/1Jc4ywxopmY.md) about 4 %, [Skye](cards/mS9MbNq4FLg.md) about 3 %).
- **Style:** an arrow for picking and a pointing hand for pressing buttons ([Kartel](cards/x_tCThgCepU.md) uses both). A brand-coloured cursor reads well ([PlugXR](cards/SpcGZLNYztc.md) blue, [Refract](cards/k2feExvx5QU.md) purple). Use one style per actor; two unrelated styles muddle the story ([kandi](cards/saK-4v9LoVs.md)).
- **Who is acting:** give the cursor an avatar or a label when more than one actor exists. A "You" cursor and an agent cursor ([HeyGen](cards/k3ZItY0S57k.md) 0:49, 1:16, 1:32), role labels such as "Manager" and "Staff" ([FCS1](cards/1LYUJpcVfQE.md) 0:53), teammates' faces ([ArtDept](cards/TNCAjtXkb2k.md) 0:17), or a persona photo ([Peko](cards/4mMSVXcE6IY.md) 0:17–0:50).
- **Travel:** the cursor flies a short arc to its target and settles before it presses ([Screenjar](cards/OYe3gvA--LU.md) 0:26 makes the flight itself the shot). It never glides about without pressing: a hovering cursor is the "not a demo" trap ([IDBS](cards/mbKt-0bBmK8.md), [Level AI](cards/5gyYw0X7nR8.md) 1:10).
- **One press per spoken verb.** [Fronter](cards/1Jc4ywxopmY.md) pairs almost every sentence with a click, and [kandi](cards/saK-4v9LoVs.md) runs a full search in 8 s with one action per clause (0:18–0:26).

### 3.3 Click feedback (from the strongest to the plainest)

1. **The target changes state at once.** A row floods with the accent ([CalcuQuote](cards/NvyGrBLb1NY.md) 0:36), a card tints before the push-in ([PodPlan](cards/exM9XpoGf_0.md) 0:10), a button turns from Start to Stop ([Screenjar](cards/OYe3gvA--LU.md) 0:39–0:45), or Invite flips to Invitation Sent in place ([CurrentSea](cards/nisv3rsn2lQ.md) 0:22).
2. **A consequence leaves the button.** A paper plane flies off Launch ([Odore](cards/bJ1XFhWOdtY.md) 0:49), a "submitted" pill rides a line away ([SamaCare](cards/sLnaJ0CUbX4.md) 1:26), or an invite pill flies to the people it affects ([360 Wellness](cards/LLmNshUVkd0.md) 1:08).
3. **The press itself is shown.** The button darkens for one frame or squashes about 4 % ([Aris](cards/FFewDlGHVKo.md) 0:27), or the cursor scales down slightly.
4. **A ripple with a camera punch-in, once.** The best single moment in batch 1 ties a click ripple to a punch-in on the stat row ([affable.ai teaser](cards/pQkbEUbLxbE.md) 0:24). Use it once per film; ripples on every click look like a template.

### 3.4 The camera

- **Push onto the control just before the click, then pull back for the result** ([Leadjet](cards/gjpXUD8Vz6I.md) 0:19–0:31, [Fronter](cards/1Jc4ywxopmY.md) 0:45, [Notarity](cards/ClKHjd8gj8k.md) 0:35).
- **Dive and dim:** the page greys out while the camera dives onto one button, then a popup answers it ([HighRadius](cards/A1f-afDV-4Q.md) 2:01–2:07).
- **Tilt to travel, straighten to read.** The screen lies at 20–30° while the camera glides, then flattens for the one detail the voice names ([Site24x7](cards/33ilXiqbhq4.md) 0:37–0:42, [Aspire](cards/53pvn5QCtpA.md) 0:22 tilts on the click). Never tilt so far that text fails the 360 px test ([Elevate](cards/2yL0LhyxOGk.md) 1:00).
- **Follow the caret** while a prompt types ([GWI Spark](cards/wnzbApqFAsE.md) 0:01–0:04).
- **Macro, then context:** push into one icon or field, then pull back to the panel it opens ([AnnounceKit](cards/Nn9hXQAN-LM.md) 0:40 → 0:44, [WriterZen](cards/TVgzZO9-1QI.md) 1:02).
- **Land before the voice names it.** The camera arrives, then the line names what we see ([Refract](cards/Pi50NiONPI8.md)). Use `power3.inOut` for 0.5–0.8 s; never bounce the camera.
- **A product film keeps the camera steady.** Drift is fine; shake is not (house rule).

### 3.5 Focus and callouts (instead of boxes and arrows)

- **Lift-out:** the key card leaves the page at 1.3–2× with a deeper shadow, holds while the voice reads it, then sets back down ([JustCall × HubSpot](cards/8JWGH6LCWp8.md) 0:20–0:25, [Kitaabh](cards/XGlri_JubsA.md) 0:26, [SalesAi](cards/_SI7avd_iC0.md) 0:44).
- **Row lift:** one table row pops past the card edge at about 1.3× ([GlobeSmart](cards/pR-fOiDdjiQ.md) 0:50, [Zeliq](cards/yul8gQlC9HM.md) 0:32, [IDBS](cards/mbKt-0bBmK8.md) 0:54 at 2× while the rest greys).
- **Dim-and-pop:** everything greys and one card rises with its number ([Zeda](cards/HeYzBw7JvwQ.md) 0:56), or option cards rise out of a dimmed screen ([Imagine.io](cards/oddwQ1tf5PI.md) 0:25).
- **Blur-and-lift:** the page defocuses and the active panel scales forward sharp ([Sogage](cards/8T7dPmiHS1Y.md) 0:23).
- **One insight per shot:** a sharp sentence card with a coloured key number over a blurred dashboard ([SamaCare](cards/sLnaJ0CUbX4.md) 0:38, 1:40).
- **Exploded UI:** controls float around the object they change and light up as they are named ([Tasha R](cards/6wg--2qurP0.md) 0:28–0:30), or the dashboard separates in depth ([Sogage](cards/8T7dPmiHS1Y.md) 0:47).
- **Labels on leader lines or dashed boxes,** two or three words each ([PayCloud](cards/_38ybzeZ9i8.md) 0:34, [Pretaa](cards/gJLNLkcEyZY.md) 0:24).

### 3.6 Typing, prompts and AI work

- **Open on the prompt,** before any output ([SurveySensum](cards/_Afe8o2u1yY.md) 0:00–0:08). This is the strongest hook for an AI tool.
- **Type with a real caret, then show a visible Enter or Send** ([Synoptix ad](cards/C38TKoFCIw4.md) 0:09.7–0:11.5, [GWI Spark](cards/wnzbApqFAsE.md) 0:43). Keep the request concrete, a real task rather than a generic query.
- **Show the waiting:** three thinking dots or an "Analyzing…" line, then the answer within about 1–3 s ([Lumin × Snowflake](cards/nzGN6amvokI.md) 0:55–0:58: cause, work and result in 3 s).
- **Show the agent working as status chips that tick to checks** ([Amy](cards/yxTAYXKF3UI.md) 0:53, 1:24; the [HeyGen](cards/k3ZItY0S57k.md) crew checklist at 1:00). The answer streams in, and chips fill in as the request is understood ([GWI Spark](cards/wnzbApqFAsE.md) 0:15). Source chips show provenance ([Terberg](cards/u9w_Z4nD9Yk.md) 0:34).
- **The result arrives as an object:** a table, a code panel or a page sliding in ([Refract](cards/Pi50NiONPI8.md) 0:46–0:49), or results that cascade in after a short query ([WriterZen](cards/TVgzZO9-1QI.md) 0:34).
- **Thread one concrete request through every screen** ([AgentGPT](cards/c3YRRnfQb5w.md): the same problem string sits in the call, the input and the chat).
- **A spoken answer made visible:** the sentence highlights in sync over a waveform ([Lumin Mobile](cards/lOvxB_Hpt74.md) 0:48–0:59).

### 3.7 Panels, windows and navigation

- **The container arrives before the content:** a window grows from its title bar ([FCS1](cards/U3IfeAqciL0.md) 0:12.9), from a sliver ([Skye](cards/mS9MbNq4FLg.md) 0:22), from a dot ([Cascade](cards/aoYwK-1rl5I.md) 0:16), or from its header bar unrolling downward ([INCOM](cards/BfCRKR1rGCY.md) 0:19.5). An empty card lands and then fills ([IDBS](cards/mbKt-0bBmK8.md) 0:37, [Eterna](cards/y4axD7B2XfM.md) 0:34).
- **A modal over a dimmed page** for the one action that matters ([Darwinbox](cards/S9H3sqKc9Y4.md) 0:54; once per chapter at most).
- **The state flips in place** while the page behind blurs ([CurrentSea](cards/nisv3rsn2lQ.md) 0:19–0:22).
- **A vertical window stack:** each screen rises from below as the last leaves the top, like scrolling through the product ([Best Version Media](cards/pbOcDHzi3wk.md) 0:05, 0:16, 0:22, 0:32).
- **Same panel, new host:** keep the panel fixed and swap the app around it, with a logo badge popping on the corner. That is three integrations in 7 s ([Flike](cards/PTr5T87ViW4.md) 0:44–0:51).
- **The tab bar as a map,** then one sentence per tab ([360 Wellness](cards/LLmNshUVkd0.md) 0:48).
- **A full flow from both sides,** one step per cut every 3 s ([micro1](cards/Qbxq-To0W_I.md) 0:21–0:50).

### 3.8 Results in place

- **Counters and gauges:** counters climb from 00 when a dashboard lands ([CurrentSea](cards/nisv3rsn2lQ.md) 0:23), a needle sweeps while the number counts ([Fiable](cards/6xb82sm9Bbs.md) 0:13), or an odometer rolls to the stat ([Ada](cards/w7Do0gq589A.md) 0:46).
- **Before and after inside one panel:** a gauge sweeps from 23 % orange to 90 % green as the bars fill ([Feedier](cards/GJjVTYFVeQc.md) 0:37), or a line-item card sums to a total and stamps a check ([AvaTax](cards/SxU4VwzYLs8.md) 1:23).
- **Same-frame state flip:** a red "200 KYC forms pending" bubble turns teal in the same framing ([Gataca](cards/loD8ZpA19ds.md) 0:04 → 0:12).
- **An outcome chip closes every feature** ("paid", "Accepted") ([RentalReady](cards/llRMaoacRA4.md) 0:20–0:23, [micro1](cards/Qbxq-To0W_I.md) 0:41).
- **A list ticks green in sequence** ([Best Version Media](cards/pbOcDHzi3wk.md) 0:30, [Axtraction](cards/kVsN0WegmaE.md) 0:23).

### 3.9 Screens, 3D and devices

- **No device frames** in the good films. UI floats as cut-out panels with soft shadows. Devices appear only as a bridge from the real world: push into a laptop or kiosk until its UI is the frame ([DeskLog](cards/6ROXsaHkvkU.md) 0:29–0:34, [Fronter](cards/1Jc4ywxopmY.md) 0:11), or let the app tile scale out of a real laptop and become the stage ([ResponseScribe](cards/XePPHrTdPqA.md) 0:09).
- **Tilt 10–30° only while travelling.** Flatten to read.
- **Real UI, cropped to one region,** beats redrawn UI. The weakest demos are a raw full-frame recording with tiny text ([Geopointe](cards/JQumvggSQdo.md) 0:23–0:58) and a centred, same-size window held for 85 s ([Darwinbox](cards/S9H3sqKc9Y4.md)). The house rule also says real UI, never redrawn.
- **Phone legibility:** the region in focus should show text at 3 % of frame height or more. That usually means a 2× crop of a 1080p capture.

### 3.10 Recipes we can build

These sketches follow the render contract: one paused timeline, entrances with `fromTo`, no timers, and no `will-change` or `translateZ` on anything the camera scales. Check the registration details in the `hyperframes-core` skill before use.

**Camera rig (HyperFrames / GSAP).** Put the whole stage inside one `#cam` element with `transform-origin: 0 0`. To centre a stage point `(px, py)` at scale `s`:

```js
const tl = gsap.timeline({ paused: true });
window.__timelines = window.__timelines || {}; window.__timelines['ch06-choose'] = tl;
const pushTo = (px, py, s, t, d = 0.7) =>
  tl.to('#cam', { x: 960 - px * s, y: 540 - py * s, scale: s, duration: d, ease: 'power3.inOut' }, t);
pushTo(1420, 380, 1.8, 2.0);   // push onto the option chip before the click
pushTo(960, 540, 1.0, 3.6);    // pull back for the result
```

**Cursor press with a visible effect.** Move on a slight arc by giving x and y different eases. Then press, and let the target react within 30 ms. Pin the click sound to `tPress`.

```js
const press = (sel, x, y, tPress) => {
  tl.to('#cursor', { x, duration: 0.45, ease: 'power2.inOut' }, tPress - 0.5)
    .to('#cursor', { y, duration: 0.45, ease: 'sine.inOut' }, tPress - 0.5)
    .to('#cursor', { scale: 0.86, duration: 0.06 }, tPress)
    .to('#cursor', { scale: 1, duration: 0.14, ease: 'power3.out' }, tPress + 0.06)
    .to(sel, { scale: 0.97, duration: 0.06 }, tPress)
    .to(sel, { scale: 1, backgroundColor: 'var(--accent)', color: '#fff', duration: 0.2, ease: 'power3.out' }, tPress + 0.06);
};
```

**Lift-out callout.** Clone the card into an overlay layer above the page. Animate the clone, never the original inside the scaled page.

```js
tl.to('#page', { filter: 'blur(6px) brightness(0.8)', duration: 0.4, ease: 'power2.out' }, t)
  .fromTo('#lift', { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' },
          { scale: 1.5, boxShadow: '0 30px 80px rgba(0,0,0,.35)', duration: 0.5, ease: 'power3.out' }, t)
  .to('#lift', { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.4, ease: 'power3.inOut' }, t + hold)
  .to('#page', { filter: 'none', duration: 0.4 }, t + hold);
```

**Typing that survives seeking.** Seeking a paused timeline can suppress callbacks, so do not type through `tl.call` or `onUpdate`. Split the text into character spans and reveal each one with `tl.set`, so the caret (the last inline element) follows naturally:

```js
chars.forEach((c, i) => tl.set(c, { display: 'inline' }, t0 + i * 0.045 + (rng(i) - 0.5) * 0.02)); // rng = seeded mulberry32
```

Counters: a proxy tween with `onUpdate` is the usual approach. Snapshot it at three times with `hyperframes snapshot` to confirm the number renders when seeking. If it doesn't, use one `tl.set` per displayed value.

**Remotion (for React UI such as Previs Studio).**

```tsx
const f = useCurrentFrame(); const { fps } = useVideoConfig();
const lift = spring({ frame: f - liftAt, fps, config: { damping: 200 } });           // critically damped
const scale = interpolate(lift, [0, 1], [1, 1.5]);
const press = interpolate(f, [pressAt, pressAt + 2, pressAt + 7], [1, 0.97, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const typed = text.slice(0, Math.floor(interpolate(f, [typeAt, typeAt + text.length * 1.4], [0, text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
```

**Real-UI capture (this workspace).** The Playwright flows in `projects/012-motion-studio-launch/capture/flows/` already log every press to `<clip>.events.json`.
- Inject a large custom cursor (about 4.5 % of frame height) into the page during capture.
- Capture at 2× and crop in post.
- Pin each click sound at `event.t − video_starts_at` (HyperFrames muxes at 0 ms offset).

---

## 4. Kinetic typography recipes

House limits: one display face and one UI face, one accent colour, at most two text levels on screen, captions at 5 % or more of frame height and secondary text at 3 % or more. Never a pure opacity fade, a letter scramble, echo or ghost copies, or a glitch decode.

1. **Accent on one word per line.** Set the line in white or near-black and put only the key word in the accent ([HRS](cards/5e1WMPUbUsU.md), [TicketSoft](cards/RSf_U5Ae8DE.md), where the key word sits at 7–9 % of frame height).
2. **Word by word on the voice.** Each word slides up 20–30 px from behind a mask as Sarah says it (use whisper word timings). The new word nudges the line ([Fosfor brand film](cards/Juw11REGLaU.md) 0:01–0:05, [Packgine](cards/KKEoKxZGJ0g.md) 0:39–0:50).
3. **Grey-to-white highlight.** The line sits in grey and each word turns white as it is spoken ([Axias](cards/-tPZCQsQEqo.md) 0:00, 0:23; [Avalara Aviator](cards/ORsp_pxCz_g.md) 2:34).
4. **A marker chip behind the key word.** The word lands, then an accent box snaps in behind it, or the box grows first and the word types into it ([Odore × Thayers](cards/ybQ3LcxfZyU.md) 0:10–0:13, [Odore fulfilment](cards/y1vMczVHulo.md) 0:00).
5. **Word-slot swap.** Keep the sentence and drop one word for another on a hit: "months" becomes "days" ([DialWorks](cards/dMbvDNWYKZ4.md) 0:30), or a refrain swaps its last word five times ([GWI Spark](cards/wnzbApqFAsE.md) 0:26–0:52).
6. **A word roller in a highlight box** for "works with all of these" ([Fiable](cards/6xb82sm9Bbs.md) 0:04, [Sendr](cards/B8IOKC5w3YM.md) 0:20).
7. **A strikethrough drawn as the word is said** ([HRS](cards/5e1WMPUbUsU.md) 1:39).
8. **The title gets pushed out by the UI.** The one-word title lands, then the real window rises under it and pushes it off the top ([UpSend](cards/vLeqIRI5qPY.md) 0:14, 0:19). Or a section pill lands big, shrinks into a header and the UI rises beneath ([GTM Buddy](cards/HVJ10JaoJVI.md) 0:54–1:15).
9. **Type on the UI's own plane.** The headline tilts with the screen so type and UI move as one object ([Elevate](cards/2yL0LhyxOGk.md) 0:31, [Vibe](cards/rW94yi4-jwU.md) 0:07–0:14).
10. **The headline splits to frame the product** ([TicketSoft](cards/RSf_U5Ae8DE.md) 0:29).
11. **A typed line, a backspace, a retype.** The caret deletes a phrase and types the product name in its place ([JustCall 30 s](cards/fecYEQAZnY8.md) 0:04–0:07). This one is terminal-native.
12. **One giant word as a hard-cut interrupt,** held 0.5–1 s before the best feature ([WriterZen](cards/TVgzZO9-1QI.md) 0:53). A question card can play the same role ([SalesAi](cards/_SI7avd_iC0.md) 1:05, [Terberg](cards/u9w_Z4nD9Yk.md) 0:39).
13. **A label beside the UI, never on top of it.** A big word over a small word sits in one corner while the UI fills the other half, and the label swaps per feature ([SurveySensum](cards/_Afe8o2u1yY.md) 0:39–0:49).

---

## 5. Transition recipes

Rank order: **carry > push-through > shape or brand wipe > hard cut.** No crossfades (house rule).

- **Morph chain (the default).** Each object becomes the next container: ring → laptop → orb → blob → tablet ([Kartel](cards/x_tCThgCepU.md) 0:04.6–0:27.5); bar → dot → card → real UI ([LangEase](cards/SgmuplXU2iY.md) 0:12–0:16); key → door → slot in a sentence ([agency reel](cards/S-lwrVXj3dc.md) 0:01–0:13). Keep each morph to 0.4–0.8 s with a soft whoosh on the landing.
- **Push through a screen.** The camera pushes into a device or window until its UI is the frame ([DeskLog](cards/6ROXsaHkvkU.md) 0:29), or pushes through a letter of the wordmark ([TicketSoft](cards/G490yBQ-Vlg.md) 0:13, [Geopointe](cards/JQumvggSQdo.md) 0:23). Push-throughs suit chapter changes.
- **Footage to card.** A full-frame clip shrinks into a rounded card that joins a layout ([CHAT](cards/f33iT1hqok4.md) 0:05, [Kitaabh](cards/XGlri_JubsA.md) 0:04).
- **A line or dot that grows into the next container:** a thin line grows into a search bar ([FinancialPress](cards/uNHbqDTc5-Q.md) 0:28.7), a globe collapses to a dot that becomes the next scene ([HighRadius](cards/A1f-afDV-4Q.md) 0:08), a circle grows to open and close the product act ([Total Response](cards/7HVqyppIur4.md) 0:15, 1:35).
- **A brand-mark wipe at chapter turns,** used once or twice: the logo's bars become the wipe ([TicketSoft](cards/RSf_U5Ae8DE.md) 0:22, 0:57), or the brand glyph zooms through ([GlobeSmart](cards/7uLXkuj6hv0.md) 0:23, 1:43).
- **Match and same-frame flip.** Keep the framing and change the state: before and after in identical framing ([Kitaabh](cards/lWe_JK-wtEo.md) 0:00 vs 0:15), or "99 steps" becoming "1 step" ([Gataca](cards/d0Ss8nzttOI.md) 0:02, 1:13).
- **Vertical window stack** within a chapter ([Best Version Media](cards/pbOcDHzi3wk.md)).
- **Card flip or hinge, once:** the analytics card flips to show the next feature on its back ([JustCall 30 s](cards/fecYEQAZnY8.md) 0:16), or one window rotates out edge-on and the next rotates in ([Refract](cards/k2feExvx5QU.md) 0:59).
- **A persistent carrier** under every scene: a track line ([Odore](cards/hYg3rJMhwEI.md), [SamaCare](cards/sLnaJ0CUbX4.md)), a dot ([JustCall](cards/hD7_4tyUmCw.md) 0:07 → 0:10 → 1:02), an orb ([Builder.ai](cards/ZDR0X7VOho4.md) 0:26–1:18), a ball with its own foley ([KGeN](cards/pUsreu5dTJ0.md)), or a year ruler that drives every swap ([Kitaabh collage](cards/mnj5SttD5lQ.md) 0:00–0:14).
- **Hard cuts only in bursts, on the beat:**
  - one word per face in 1.6 s ([Sendr](cards/B8IOKC5w3YM.md) 0:00);
  - a 3 s collage burst ([Odore](cards/bJ1XFhWOdtY.md) 0:09.8);
  - "yes" cut on each word ([Munch](cards/_PbQgX4URJg.md) 1:34);
  - a four-cut micro-burst on one hit ([Ultra store](cards/QXdwcZVweJI.md) 0:05).
  
  A tempo ladder (half-beat, two-beat, one-beat) is the model for a montage ([showreel](cards/6MBAEcdPDe8.md) 0:03–0:56).
- **A real-time element keeps fast cuts continuous.** A call timer keeps counting across four hard cuts ([AgentGPT](cards/c3YRRnfQb5w.md) 0:13–0:19, [JustCall × HubSpot](cards/8JWGH6LCWp8.md) 0:33).

---

## 6. Sound recipes

### 6.1 Music

- The references use upbeat electronic beds at about 112–129 BPM under narration (median 123).
- **Our bed is fixed:** Chill Lofi Piano (FS 688675) at about 70 BPM. One beat is 0.857 s, a half-beat 0.429 s, and a bar 3.43 s.
- **Cut on the double-time grid.** Treat the bed as 140 BPM for edits and bursts (0.43 s steps), and put chapter starts on bar lines.
- **The energy has to come from the voice, the SFX and the picture,** not from the bed.
- **Duck the bed 8–10 dB under the voice.** Let it swell only in the three or four planned breaths (1.5–3 s each). Never leave a music-only gap longer than about 1.5 s inside a chapter. Those gaps are what made v0.1 feel "slow, with long gaps".
- **Avoid:** sung or trap beds, vocal stingers ([affable.ai teaser](cards/pQkbEUbLxbE.md)), crowd cheers ([Pretaa](cards/gJLNLkcEyZY.md)), and masters hotter than −14 LUFS ([Odore WhatsApp](cards/hYg3rJMhwEI.md) at −10.4).

### 6.2 Voice (Sarah)

- **Pace:** 135–150 words per minute while speaking, with almost no gaps.
- **Tone:** a warm, confident peer. Write in the second person ("you pick, you point") and use plain words.
- **One sentence, one visible action.** The cursor or the camera does what the sentence says while she says it ([Fronter](cards/1Jc4ywxopmY.md), [Notarity](cards/ClKHjd8gj8k.md): journey order, one step per sentence, one screen per step).
- **Verb-first feature lines** ("Pick…", "Point…", "Approve…") that match the cursor action ([Avalara Sidekick](cards/GyYIBdrAASw.md)).
- **Rhythm devices** keep fast speech easy to follow:
  - triplets ([Pulse](cards/_YlxcU--OMU.md));
  - anaphora with one swapped word ([BlueVerse](cards/YzZWm-5qNnQ.md) 0:49);
  - "you could… or…" pairs ([360 Lending](cards/nf3Hd9mjcmk.md));
  - objection and a one-word answer ([Munch](cards/_PbQgX4URJg.md), 152 words/min);
  - a question card before the best feature ([SalesAi](cards/_SI7avd_iC0.md) 1:05).
- **A cast instead of one explainer voice feels faster.** [Kartel](cards/x_tCThgCepU.md) trades lines between narrator, agent and client, and [Vapi](cards/-6ilG9NZn-M.md) lets the real call be the demo. For us: Sarah narrates, while the owner's prompts and Claude's replies appear as typed and streamed text on screen. A second voice needs a brief decision.
- **On-screen words echo only the key word,** in the accent, on the word's timing. Never a full subtitle and a headline at once (that breaks the two-level rule; see [Avalara Sidekick](cards/GyYIBdrAASw.md)).

### 6.3 SFX vocabulary (what sound for which event)

Sources are in `_shared/sfx/UI-AD-PALETTE.md`. Levels are relative to the voice's peaks (0 dB). The click is the sharpest, most present SFX.

| On-screen event | Sound | Level vs voice | Rule |
|---|---|---|---|
| Cursor press on a button, tab, option or card | FS 256455 or FS 534103 (real mouse click) | −6 to −10 dB | The transient lands on the frame the target changes. Alternate the two in runs. |
| Toggle or switch | one recorded switch for the whole film | −8 to −12 dB | Toggles in setup flip one per beat ([JustCall × HubSpot](cards/8JWGH6LCWp8.md) 0:04, [SHP](cards/tnTrRFoiNJc.md) 0:21). |
| Typing a prompt | FS 447909, trimmed to the visible span; for revealed text, alternate single keys FS 378085 and FS 570754 | −12 to −16 dB | Never synth ticks per letter ([ZapBG](cards/aqfc2RvMve8.md), [Odore](cards/hYg3rJMhwEI.md) do this; it is the banned timbre). |
| Enter or Send | FS 378085 (hard key) | −8 dB | It is the cause of the next state, so make it audible. |
| Camera push, pull or morph | FS 349698 (light slow swoosh) or FS 71852 (soft digital whoosh), low-passed about 6 kHz | −14 to −18 dB | Peak on the landing, attack 300 ms or more. Never harsh air blasts. |
| Card or chip lands, row lifts | M `impact/hit-weak` or FS 388958 soft snap, or nothing | −16 to −20 dB | Small items get little or no sound. Fewer sounds than beats. |
| Counter or score ticking | M `counter/clock-tick-single` in a run | −14 dB stepping down to −20 | Use the rapid-fire rule: alternate two, step the volume down, tighten the gaps. |
| Chapter turn (push-through or brand wipe) | FS 349698, longer swell | −12 dB | One per chapter turn. |
| Scroll or list skim | FS 256457, low | −20 dB | Texture, not a hit. |
| Render or progress complete | a soft low thump (FS 541029 low-passed) | −10 dB | The result lands; no "success" chime. |
| Wordmark (loudest moment) | riser FS 685256 → impact (M `impact-deep-whoosh` low-passed about 3.2 kHz) → one shimmer tail | impact at the film's peak | The closing phrase, once. |

**How many:** one sound per visible cause. That gives about 25–45 designed SFX per minute in demo chapters and 15–25 in story chapters, always under 70 (the bed's beats per minute). The references' 99–160 "events per minute" include music transients; don't chase that number.

**Mix:** the voice leads and the bed is ducked 8–10 dB under it. All SFX share one light room reverb. Final master −14 LUFS integrated, true peak ≤ −1 dBTP. Pin sounds after picture lock, as shot start plus offset.

---

## 7. Showing problems on screen, not just saying them

**Patterns that work** (pick the one that matches the real pain):
- **Real friction with a cursor:** tabs to hop between ([Avalara Sidekick](cards/GyYIBdrAASw.md) 0:13–0:20), a copy-paste chore done field by field ([Leadjet](cards/gjpXUD8Vz6I.md) 0:09–0:11), or a cursor clicking a failing "Try Again" ([Axtraction](cards/kVsN0WegmaE.md) 0:10).
- **A stalled state as the problem:** a loader stuck on a phone, a surprise fee at checkout ([TicketSoft](cards/PBqpDipqNtY.md) 0:08–0:11), or a report that takes three minutes and crashes ([Kitaabh](cards/lWe_JK-wtEo.md) 0:00).
- **Clutter piling up until warnings appear,** then cleared in one move: tool windows ([ArtDept](cards/TNCAjtXkb2k.md) 0:00–0:13), too many apps ([Eterna](cards/y4axD7B2XfM.md) 0:19), or a wall of work cards that converges into one window ([Turbotic](cards/nK1VS9Q9CME.md) 0:01–0:10).
- **The problem as a chorus:** a face ringed by complaint bubbles and badged app icons ([Zeda](cards/HeYzBw7JvwQ.md) 0:01), a calendar flooding with named requests ([CHAT](cards/f33iT1hqok4.md) 0:17), a comment thread whose counters climb ([Kitaabh ad](cards/jLBhmZysJ4A.md) 0:00), or a giant cropped chat thread cut on the beat ([Amy](cards/yxTAYXKF3UI.md) 0:00–0:05).
- **Tags pinned on the real artifact:** red day tags on real cars, then cost pills standing on the blurred lot ([Spyne](cards/zv72jBuddE8.md) 0:03–0:08), or pills pinned to the person in the footage ([Joco](cards/C1Bniq1hrgE.md) 0:03).
- **Problems burst out of the screen and get pulled back in** as the product arrives ([Viable](cards/2AWzLDFJXjo.md) 0:00–0:10).
- **Greyscale for the old way, colour for the new:** problem panels in grey with red badges, grouped and pushed back as colour arrives ([Kitaabh persona cut](cards/emwftTcwpAo.md) 0:00–0:10), or grainy black-and-white for the old way against bright real UI ([360 Lending](cards/nf3Hd9mjcmk.md)).
- **A pain checklist that ticks:** pain pills each get a green check when the fix lands ([Faronics](cards/SXHCplEakRk.md) 0:29–0:33), and a feature checklist ticks as it is answered ([7 Video Types talk](cards/XP6dqsEQyJE.md) 2:04).

**Rules**
- Give each pain one physical image for about 2–4 s, then show its fix in the same frame or the same layout. A tangled route becomes one straight line with checks travelling it ([Odore fulfilment](cards/y1vMczVHulo.md) 0:04–0:16).
- The whole problem act takes 15–20 % of the runtime at most. Joco (45 s), VivaDent (50 s), Level AI (45 s) and Kagen (47 s before any UI) are the slow pattern the owner rejected.
- Use our own real artifacts (old showreel frames, old audio waveforms, real logs). Never use stock acting: no head in hands, no face-palm, no stressed worker.

---

## 8. What to avoid

**Picture**
- Glow on UI chrome, neon rims and halos behind hero objects ([Kartel](cards/x_tCThgCepU.md) panels, [Ultra store](cards/QXdwcZVweJI.md), [SalesAi](cards/_SI7avd_iC0.md)).
- Confetti, ribbon streamers, sticker or heart bursts, particle and speed-streak bursts, sparkles ([Feedier](cards/GJjVTYFVeQc.md) 0:33, [Smoobu](cards/C1Okg3hfpTs.md) 1:11, [Famous Birthdays](cards/6ou4kuM2YRo.md) 0:28).
- Glitch: letter scramble, RGB split, chromatic tunnels, white flashes, flash-cut stutters into end cards ([Alpha](cards/Z5EDZQ7_We4.md) 0:13, [ACE](cards/rvp5RlrBEZY.md) 0:46, [Skye](cards/mS9MbNq4FLg.md) 0:57).
- Spins and orbit clichés: tumbling cubes, spinning coins, icons orbiting a logo, logo rings, plexus networks, globes, AI brains, lightbulbs ([Eterna](cards/y4axD7B2XfM.md), [Synoptix](cards/hktY7pdS3zI.md), [VivaDent](cards/8ASaMscB1Po.md)).
- Stock people: stressed workers, smiling teams, handshakes, mascots, rendered humanoid AI ([Ventaz](cards/iPGaGkdYKsg.md) 0:18).
- Corner agency badges or watermarks, numbered lower-third chips, decorative dot grids, chevrons and squiggles.
- Centred titles on a gradient, and type-only cards with no product in view ([Refract](cards/k2feExvx5QU.md) opening, [AOSEN](cards/uw3rtrNc15c.md) 0:04).

**Motion**
- Crossfades and dissolves between screens ([IDBS](cards/mbKt-0bBmK8.md)), repeated iris wipes ([360 Wellness](cards/LLmNshUVkd0.md)), radial zoom blur ([Faronics](cards/SXHCplEakRk.md) 0:17), paint drips, a different wipe style per section.
- Bouncy overshoot on UI and type. Overshoot belongs only on small playful pops, about 4 % at most.
- Floaty, even easing on every beat ([Inspire](cards/WkLKe6KNxyU.md), [Pulse](cards/_YlxcU--OMU.md)), which reads as slow.

**Demo**
- Screens that appear already filled, with no cause ([Joco](cards/C1Bniq1hrgE.md), [VivaDent](cards/8ASaMscB1Po.md)).
- A cursor that glides but never presses ([Level AI](cards/5gyYw0X7nR8.md) 1:10–1:24, [IDBS](cards/mbKt-0bBmK8.md)).
- Tiny UI, raw full-screen recordings, UI holds of 1–1.5 s that are too short to read ([UpSend](cards/vLeqIRI5qPY.md), [Swisscom](cards/yMPMtpxbA40.md)).
- Real UI for 10–12 s, then icons for the rest ([Ads2grid](cards/UzlbSDWSPJk.md)).
- Login screens as a feature beat ([Best Version Media](cards/pbOcDHzi3wk.md) 0:05).

**Structure**
- 16–47 s of metaphor or problem before the product ([Kagen](cards/g-dLSuWD2hU.md), [WriterZen](cards/TVgzZO9-1QI.md), [Refract](cards/Pi50NiONPI8.md)).
- Feature-pill clouds, logo walls and benefit-icon rows after a good demo ([Sogage](cards/8T7dPmiHS1Y.md) 0:52, [Joco](cards/C1Bniq1hrgE.md) 1:51).
- End cards held 5–7 s with nothing moving.
- Repeated closing stacks and taglines.

**Sound**
- Synth plucks or ticks per letter, notification tones and success chimes.
- A pop on every element, which tips into game sound ([GlobeSmart](cards/7uLXkuj6hv0.md), [FCS1](cards/U3IfeAqciL0.md)).
- Vocal stingers, sung beds, and masters louder than −14 or quieter than −18 LUFS.

**Copy**
- On-screen typos ([ZapBG](cards/aqfc2RvMve8.md) 0:40, [Pretr](cards/GCnrWyh_Wp0.md) 1:00, [Kagen](cards/g-dLSuWD2hU.md)), stock-site watermarks left in ([kandi](cards/saK-4v9LoVs.md) 0:46), invented proof or fake testimonials ([agency promo](cards/o5nt6YUNQRQ.md)).

---

## 9. Apply to the motion-studio launch film (project 012)

### 9.1 What v0.1 did, measured against this playbook

- **Structure:** 30 scenes of 6.5–9 s, mostly one still screenshot with one camera push.
- **Voice:** 397 words in 230 s (about 104 words per minute), with music between lines.
- **Problems:** told in captions over still frames, not shown.
- **Demo:** no cursor, no typing, no state changes.
- **Build and critique:** the differentiator got 8.5 s.

These match the owner's four notes exactly.

**Targets for v0.2** (same 3:50, same bed):
- **Voice:** about 520 words, roughly 140 words per minute while speaking, with 4 planned breaths.
- **Picture:** about 95 visible state changes (one every 2.4 s) and about 35 cursor presses.
- **Hard cuts:** 12 or fewer outside 3 bursts.
- **Sound:** every press, key run and camera move gets its own sound.
- **Loudness:** −14 LUFS.

The owner asked for no voice or script options in the next previs (note 9): the director (Claude) writes one script and picks the delivery, using these budgets of word counts and line shapes.

### 9.2 Proposed chapter timing (same total, rebalanced)

The rebalance gives build and critique and results the time they deserve, trims the hook, and keeps the order. Snap each chapter start to the nearest bar line of bed A (multiples of 3.43 s from its first downbeat).

| # | Chapter | v0.1 | Proposed | Sarah words | Visible states | Presses |
|---|---|---|---|---|---|---|
| 1 | Hook | 0:00–0:21 (21 s) | 0:00–0:14 (14 s) | ~29 | 6 | 1 |
| 2 | Problems and fixes | 0:21–1:01 (40 s) | 0:14–0:50 (36 s) | ~84 | 14 | 4 |
| 3 | Setup | 1:01–1:17 (16 s) | 0:50–1:04 (14 s) | ~33 | 6 | 3 |
| 4 | Talk to Claude Code | 1:17–1:33 (16 s) | 1:04–1:22 (18 s) | ~42 | 7 | 2 |
| 5 | Watch | 1:33–1:48 (15 s) | 1:22–1:38 (16 s) | ~34 | 6 | 3 |
| 6 | Choose | 1:48–2:18 (30 s) | 1:38–2:04 (26 s) | ~61 | 11 | 7 |
| 7 | Comment | 2:18–2:39.5 (21.5 s) | 2:04–2:22 (18 s) | ~42 | 7 | 4 |
| 8 | Storyboard and plan | 2:39.5–2:54.5 (15 s) | 2:22–2:34 (12 s) | ~28 | 5 | 2 |
| 9 | Approve and hand off | 2:54.5–3:17 (22.5 s) | 2:34–2:54 (20 s) | ~43 | 8 | 4 |
| 10 | Build and critique | 3:17–3:25.5 (8.5 s) | 2:54–3:14 (20 s) | ~47 | 9 | 2 |
| 11 | Results | 3:25.5–3:34.5 (9 s) | 3:14–3:30 (16 s) | ~33 | 8 | 1 |
| 12 | Any agent and CTA | 3:34.5–3:50 (15.5 s) | 3:30–3:50 (20 s) | ~43 | 9 | 3 |
| | **Total** | 230 s | 230 s | ~519 | ~96 | ~36 |

**Whole-film systems** (decide once, use everywhere):
- **One carrier: the Previs playhead dot** in the accent. It is the cursor's landing point in the hook, the dot that grows into each chapter's container, the Approve button's fill, the render progress dot, and finally the dot in the wordmark (carrier model: [Builder.ai](cards/ZDR0X7VOho4.md), [JustCall](cards/hD7_4tyUmCw.md) 0:07 → 1:02).
- **One chapter-label system:** the chapter word lands on a bar line, then the real screen rises and pushes it up into a small header ([UpSend](cards/vLeqIRI5qPY.md) plus [GTM Buddy](cards/HVJ10JaoJVI.md)).
- **Two grounds:** the old way and ideas on a quiet light ground, desaturated; every real screen on Previs Studio's own dark stage and tokens ([Pretaa](cards/gJLNLkcEyZY.md) light for idea, dark for product).
- **Two labelled cursors:** "the owner" (arrow) for choosing, commenting and approving, and "Claude" (accent) for building and fixing ([HeyGen](cards/k3ZItY0S57k.md)).
- **One star technique, used once:** the mock-epic Approve in chapter 9 ([Alpha](cards/Z5EDZQ7_We4.md) 0:34–0:44).
- **Three bursts:** in the hook, at the start of results, and in any agent.
- **Four breaths:** the wordmark in the hook, the first play in Watch, the big number in Results, and the end wordmark.
- **Engines (one film, one engine):** HyperFrames 0.8.134 owns the timeline, camera, type, carries and the terminal scenes. Remotion supplies Previs Studio clips where React state must be driven per frame (option switching, score counting, sound lanes lighting, exploded UI), rendered as clips and placed in HyperFrames. Playwright captures supply the continuous real flows with a large injected cursor, and their `events.json` pins the clicks.

### 9.3 Chapter by chapter

**1. Hook (0:00–0:14).** The job is to land "a software engineer made these" by 2 s, with product on frame 0.
- **0.0–2.6 s:** a burst of six cuts on half-beats (0.43 s) across real frames of the five finished films, under Sarah's first line. This is the result-first opening ([HeyGen](cards/k3ZItY0S57k.md) 0:04–0:13, [ZapBG](cards/aqfc2RvMve8.md) 0:11–0:18).
- **2.6–6 s:** the last frame shrinks into the Previs Studio player as a card ([CHAT](cards/f33iT1hqok4.md) 0:05).
- **6–10 s:** the camera pulls back to the Claude Code input, where the owner's one-line request types with real key taps and the camera follows the caret ([GWI Spark](cards/wnzbApqFAsE.md) 0:01).
- **10–14 s:** the caret backspaces and types "motion-studio" ([JustCall 30 s](cards/fecYEQAZnY8.md) 0:04–0:07). The wordmark settles and holds for 1.5 s (breath 1). Use a soft thump here, not the closing impact.
- **Sarah:** two short lines, about 29 words. Who I am, and what I didn't know.
- **SFX:** two alternating soft whooshes in the burst, stepping down; key taps; one Enter.
- **Alternative opening:** frame 0 is the prompt typing, and the burst of results answers it at 6–8 s.

**2. Problems and fixes (0:14–0:50).** The job is four pains shown on screen, each fixed in the same frame, at about 9 s per pair, on one sentence pattern ([360 Lending](cards/nf3Hd9mjcmk.md) 0:07–0:31).
- **The old way is desaturated and the new way is in colour.** A thin checklist on the right edge ticks one pain per pair ([Faronics](cards/SXHCplEakRk.md) 0:29) and carries across the chapter.
- **Slide deck:** the real v1 clip plays with everything fading in. A red counter tag pins to it and counts the fades ([Spyne](cards/zv72jBuddE8.md) 0:03). Same-frame flip: the new film's carried move plays in the same framing ([Gataca](cards/loD8ZpA19ds.md) 0:04 → 0:12).
- **Thin sound:** the old audio drawn as a thin spiky waveform beside an empty voice lane. The fix is that the lanes fill (voice, clicks, whoosh), with Sarah's waveform under her own words ([Lumin Mobile](cards/lOvxB_Hpt74.md) 0:52).
- **No critic:** a scorecard sitting at 4–6 in red sweeps to 8+ in green inside one panel ([Feedier](cards/GJjVTYFVeQc.md) 0:37).
- **Paying for renders:** a render bar stalls at 97 % with a "render 7" counter ([TicketSoft](cards/RSf_U5Ae8DE.md) 0:06–0:09). The fix is that the previs plays at once and a small "nothing renders until you say yes" Approve chip appears.
- **Sarah:** one pain sentence and one fix sentence per pair, verb-first, about 84 words.
- **SFX:** the click on each flip, a low stall tone, then silence on the stalled bar (that silence is the joke). No more than one whoosh per pair.

**3. Setup (0:50–1:04).** The job is "one sentence" as one continuous terminal shot.
- The terminal grows from its own title bar ([FCS1](cards/U3IfeAqciL0.md) 0:12.9).
- Three numbered steps type in, each ending on a visible Enter ([360 Wellness](cards/LLmNshUVkd0.md) 0:26–0:40). The exact README prompt is legible at 5 % of frame height.
- Check rows tick to OK one per beat ([Best Version Media](cards/pbOcDHzi3wk.md) 0:30). The Keychain row ends with a small lock chip.
- **Sarah:** about 33 words in three short sentences.
- **SFX:** key taps, three Enters, and one soft tick per OK row, stepping down.

**4. Talk to Claude Code (1:04–1:22).** The job is cause, work, result in 3 s, twice.
- **the owner's request** sits blown up full frame and types with the caret centred and the camera following ([GWI Spark](cards/wnzbApqFAsE.md)). The "the owner" cursor presses Send.
- **Claude's work** shows as crew chips that tick to checks: story, look, script, music, sound ([Amy](cards/yxTAYXKF3UI.md) 0:53, the [HeyGen](cards/k3ZItY0S57k.md) crew checklist at 1:00).
- **The previs page arrives as the answer object,** rising from below ([SurveySensum](cards/_Afe8o2u1yY.md) 0:00–0:08, [Refract](cards/Pi50NiONPI8.md) 0:46).
- **Thread one concrete request** through the whole film. The same words appear later in the plan and in the final frame ([AgentGPT](cards/c3YRRnfQb5w.md)).
- **Sarah:** about 42 words.
- **SFX:** key taps, Send, a soft tick per chip (alternating, stepping down), and a whoosh as the page lands.

**5. Watch (1:22–1:38).** The job is "the plan plays like a film".
- **The page enters** from its header bar ([INCOM](cards/BfCRKR1rGCY.md) 0:19.5) or as an empty container that fills ([IDBS](cards/mbKt-0bBmK8.md) 0:37).
- **The cursor presses Play,** and the animatic plays inside the player for a 1.5 s breath, with the bed allowed up (breath 2).
- **The camera pushes onto the sound lanes.** Each lane lights in the accent as Sarah names it ([Tasha R](cards/6wg--2qurP0.md) 0:28). One click solos a lane.
- **Sarah:** about 34 words.
- **SFX:** Play click, solo click, and the animatic's own audio briefly audible under the voice.

**6. Choose (1:38–2:04).** This is the densest demo chapter.
- **A, B, C:** click to morph every 1.5 s. The cursor switches A → B → C and the animatic re-cues on each click ([Kitaabh](cards/XGlri_JubsA.md) 0:10–0:26).
- **Compare:** three options side by side, and the chosen one lifts out at 1.3× ([GlobeSmart](cards/pR-fOiDdjiQ.md) 0:50).
- **More options:** the library opens as a modal over the dimmed page ([Darwinbox](cards/S9H3sqKc9Y4.md) 0:54).
- **Ask:** "something calmer" types in, thinking dots run, and three new option cards cascade in ([WriterZen](cards/TVgzZO9-1QI.md) 0:34).
- **Sarah:** about 61 words, with one verb per action ("Pick.", "Compare.", "Ask.").
- **SFX:** seven clicks alternating two samples, key taps, and one soft whoosh as the cards cascade.

**7. Comment (2:04–2:22).** The job is "point at the exact part".
- **Point:** the cursor hovers a part, its outline lights, a comment card opens, the note types, and Add is pressed. The whole beat takes about 2 s ([Fronter](cards/1Jc4ywxopmY.md) 0:27–0:29).
- **Box:** the cursor drags a dashed marquee with handles over several parts ([FileTrac](cards/4B8iAtm98LU.md) 0:41).
- **Guide:** a stepper runs across the top, one step per beat ([Feedier](cards/GJjVTYFVeQc.md) 0:27).
- Push in so the note text reads at phone size ([Happy](cards/nWay8rdGmAg.md) 0:16 → 0:20).
- **Sarah:** about 42 words.
- **SFX:** clicks, a soft drag texture, key taps.

**8. Storyboard and plan (2:22–2:34).** The job is to show breadth fast.
- The camera skims the storyboard strip on a tilt ([Ultra store](cards/QXdwcZVweJI.md) 0:12–0:15). One card plays in place.
- The plan page tilts to travel, then straightens to read one decision with a two-word leader-line label ([Site24x7](cards/33ilXiqbhq4.md) 0:37–0:42, [PayCloud](cards/_38ybzeZ9i8.md) 0:34).
- **Sarah:** about 28 words.
- **SFX:** one scroll texture and one whoosh.

**9. Approve and hand off (2:34–2:54).** This chapter holds the star moment.
- **The mock-epic beat:** about 3 s of slow, cinematic build on the whole plan pays off on one small Approve click. Use a riser that resolves to a soft thump, not the end impact ([Alpha](cards/Z5EDZQ7_We4.md) 0:34–0:44).
- **The result:** Approve flips to Approved in place while the page blurs ([CurrentSea](cards/nisv3rsn2lQ.md) 0:22).
- **The hand-off:** the spec card lifts out and rides a line into the Claude Code terminal ([SamaCare](cards/sLnaJ0CUbX4.md) 1:26, [Total Response](cards/7HVqyppIur4.md) 1:11). The "Claude" cursor takes over, and Claude's reply streams in.
- **Share:** the page collapses to its address bar and reopens as the artifact link ([Stadium](cards/Y9jGlkCgBDY.md) 0:30).
- **Sarah:** about 43 words.
- **SFX:** riser, click, thump, a whoosh along the line, key taps.

**10. Build and critique (2:54–3:14).** The job is to make the critique loop visible. In v0.1 it was 8.5 s; give it 20.
- **Film above, timeline below:** the render plays in a top window while the HyperFrames timeline scrolls underneath with the playhead, showing the staggered tween bars ([Axi](cards/bcqSNW1XYoE.md), [agency reel](cards/S-lwrVXj3dc.md)).
- **A real-time element:** a render-progress pill whose frame counter keeps running across hard cuts between the critique evidence cards (contact sheet, 12-frame strip, 360 px phone test) ([AgentGPT](cards/c3YRRnfQb5w.md) 0:13–0:19).
- **The scorecard as hero component:** it returns per round and scores tick 6 → 7 → 8.6 ([Axias](cards/-tPZCQsQEqo.md) 0:48 → 1:13). Dim every row and lift the one that moved ([Zeda](cards/HeYzBw7JvwQ.md) 0:56). "Fixed:" badges pop on its corner.
- Accelerate into 1.5–2 s action cuts at the end of the chapter ([Elevate](cards/2yL0LhyxOGk.md) 0:48–0:58).
- **Sarah:** about 47 words.
- **SFX:** counter ticks stepping down, one thump when the last score reaches 8+.

**11. Results (3:14–3:30).** The job is proof that moves.
- **A beat-locked burst** of the five finished films, one per second with a small label chip each ([Vibe](cards/rW94yi4-jwU.md) 0:25–0:30).
- **A held question** ("The result?") with one giant number sliding in: −14 LUFS, or 8+ on every score. Hold for 1.5 s (breath 3) ([SurveySensum](cards/_Afe8o2u1yY.md) 1:02–1:09, [Ventaz](cards/iPGaGkdYKsg.md) 0:53).
- **Bookend:** the v1 slide-deck frame from chapter 2 returns in identical framing and is replaced in place by the new film ([Kitaabh](cards/lWe_JK-wtEo.md) 0:00 vs 0:15).
- **Sarah:** about 33 words.
- **SFX:** ticks on the 1 s montage, one impact on the number (smaller than the end impact).

**12. Any agent and CTA (3:30–3:50).** The job is to show it works where the viewer already works, then end on an action.
- **Same panel, new host:** the same "set up this workspace" moment in Claude Code, Codex, OpenCode, Antigravity, Cursor, Copilot and Junie, at about 1.2 s each, with each logo badge popping on the corner ([Flike](cards/PTr5T87ViW4.md) 0:44–0:51). This is burst 3, with two alternating clicks stepping down.
- **Be honest:** a small label says the live hand-off in Previs Studio needs Claude Code, as the brief requires.
- **CTA:** the GitHub page with the exact setup prompt visible. The cursor presses Copy or Star ([ResponseScribe](cards/XePPHrTdPqA.md) 0:37, [Synoptix](cards/gVcyghMTrtU.md) 1:04–1:07).
- **The close:** the playhead dot becomes the dot in the wordmark. Riser → impact (the loudest moment of the film) → one shimmer tail. The wordmark holds 1.5 s (breath 4).
- **Sarah:** about 43 words.

### 9.4 Before the first render: checks against this playbook

- [ ] Product or result visible by 2 s; problems shown, each with a visible fix.
- [ ] Every spoken verb has a matching cursor action or state change; no hovering cursor anywhere.
- [ ] No state held over 4 s outside the four breaths; no music-only gap over 1.5 s inside a chapter.
- [ ] Sarah at about 520 words; whisper-measured pace 135–150 words per minute while speaking.
- [ ] Every UI region in focus reads on the 360 px phone test; two text levels at most; captions at 5 % of frame height or more.
- [ ] Carries at every chapter turn; hard cuts only in the three bursts; one star technique (the Approve beat).
- [ ] One sound per visible cause; fewer than 70 designed SFX in any minute; click transients on the frame the target changes; −14 LUFS and −1 dBTP.
- [ ] Nothing from section 8 on screen or in the mix.
