# Introducing Vapi Workflows

- **Link:** https://www.youtube.com/watch?v=-6ilG9NZn-M · **Channel:** Vapi · **Length:** 1:15
- **Type:** launch / demo · **Product:** Vapi Workflows, a visual node editor for voice-AI phone agents (steps, branches, tool calls, transfers)
- **Numbers:** 3.2 transitions per min · median shot 5.0 s (one unbroken canvas move of 63.5 s) · 127 words/min (all dialogue, no narrator) · ~123 BPM · 72.4 sound events/min · -16.4 LUFS

## Structure (beats with times)
- **Title (0:00–0:04):** on charcoal, small tracked caps "INTRODUCING", the logo in an outlined box, and a connector line down to a cyan "WORKFLOWS" pill. The title itself is a node graph.
- **Scope (0:04–0:07):** pull back over the whole real workflow canvas.
- **Demo = one live call (0:07–1:03):** split frame. The left shows the real canvas with the camera on the active node. The right shows a "CUSTOMER CALL" caption of the call as it happens.
  - Start node and greeting (0:08).
  - A yellow condition pill hands off to a second agent persona (0:17).
  - Purple variable chips fill with the dates (0:30).
  - A blue tool node checks availability (0:33).
  - Phone-number extraction, then a `send_sms` tool (0:42–0:51).
  - The caller asks for a manager and a red transfer node peeks in (0:58–1:03).
- **Twist (1:03–1:09):** first cut, to live action. A green rotary phone sits beside a laptop showing the same canvas (1:04). Then a man on that phone, in front of a neon logo, answers as the human manager (1:07).
- **CTA (1:09–1:15):** the logo on black, then a mint "TRY WORKFLOWS" pill.

## Visual style
A dark developer tool: charcoal, thin teal connectors, the product's own node cards. The colours carry meaning: yellow for conditions, purple for variables, blue for tools, red for transfer, cyan and mint for brand. Monospace caps headers (about 2.5 % height) and a clean light-sans caption (about 3 %). Inactive nodes fade back; there's no other depth.

## How the product UI is shown (the demo grammar)
- **Real canvas, driven by a real call:** each line of dialogue moves the camera to the node that produced it. The conversation is the cause.
- **Live caption beside the UI:** words fill in as they're spoken (0:08 → 0:11), and older lines drift up and dim.
- **Typed state chips:** condition pills, variable chips and tool nodes light up like a debugger trace.
- No cursor: the agent runs itself.
- One live-action shot puts the same UI on a real laptop (1:04).

## Motion and transitions
One continuous vertical camera track (63.5 s), eased so it lands as each node fires. Finished nodes dim and the next edge pill fades up just in time. Caption lines scroll like a chat log. The single hard cut lands on the punchline. Calm, precise easing.

## Pacing
Natural phone timing, with real hesitations, makes it feel unstaged. A new node or line about every 3 s. The film rests only in the last 6 s.

## Sound
No narrator: the soundtrack is the call itself (an AI receptionist, a second AI agent, a human caller, then a human manager). A light bed sits underneath (unconfirmed). Sparse onsets (72/min), because node activation is visual. -16.4 LUFS.

## What to take from it
- **The voice is the demo** (0:07–1:03): play the real interaction and let the UI react line by line.
- **Split frame of live caption and reacting UI** (0:08).
- **Camera tracks the active step** (0:17–1:01): one continuous carry.
- **Colour-typed state chips** (0:30, 0:33): the grammar is learned in seconds.
- **One punchline cut** (1:03) that breaks the continuity on a story beat.

## Avoid
- The burned-in subtitle in the live-action shot is small and low. Captions need at least 5 % height inside safe areas.
- Neon-sign glow as a graphic.
- No claim line at all: a newcomer may not learn what Workflows adds. Our film needs one spoken claim per chapter.

## Ideas for the motion-studio launch film
1. **Talk to Claude Code:** the owner's real prompt and Claude's reply play as a live caption on the right, while the left shows the workspace reacting (files appearing, the previs page building). The camera tracks whichever pane changed.
2. **Hand-off and build:** a continuous track down the pipeline (spec → shot list → engine → critique rounds), each stage lighting up with a typed chip.
3. **CTA:** one honest hard cut to the owner's real desk or screen, the only break in an otherwise continuous film.
