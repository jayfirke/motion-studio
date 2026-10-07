# motion-studio

**Everyone has ideas. Not everyone has the skills to turn them into great videos. Now, AI can bridge that gap.**

**Vibe-code your video.** A motion-graphics studio for people who aren't motion designers or video editors. You describe a video in plain words; a crew of AI director agents plans it like a film, lets you see and hear it before anything is rendered, and your coding agent builds it in code, with a real voice-over, recorded sound effects and a beat-synced edit.

You don't need to know what *direction*, *pacing* or *sound design* mean. You choose between options, point at what you don't like, and press Approve.

![Previs Studio: the demo film in the player, with three options for every decision and sound lanes for voice, music and effects](docs/images/watch.jpg)

## Why I built this

I'm a software engineer, not a motion designer. I build apps; I had never thought about *direction*, *pacing*, *sound design* or *animation curves*. When I needed launch videos for my own products, I found creators on Instagram and YouTube showing that Claude Code can make motion graphics from code: HyperFrames, Remotion, kits with prompts and starter projects. So I tried.

The first results looked like a slide deck. The sound was thin synth bloops, every element faded in the same way, and there was no voice. I didn't have the vocabulary to say what was wrong, let alone how to fix it. Every "make it better" cost tokens and render time, and I only found out whether it was better after paying for it.

So I studied 187 motion-graphics launch and demo films, the open-source video tools, and lessons from motion designers and YouTube creators, and over a few days I turned everything I learned into a workspace: the house rules a motion director would follow, tested commands for six video engines, a library of free sounds and music, a voice-over pipeline, a critique loop that judges every render before I see it, and **Previs Studio**, a page where I can watch a plan, swap any decision between three options, point at anything to leave a note, and approve before a single frame is rendered. This repo is that workspace as a template.

## What it learned: 187 films, open tools, designers and creators

Behind one plain sentence there is a lot of homework, and all of it is in this repo:

```
187 launch and demo films  +  open-source video tools  +  lessons from motion designers and YouTube creators
        → the study (one card per film, measured numbers)  → the playbook (rules, each citing its film and time stamp)
        → skills and rule files Claude Code reads every time (AGENTS.md, the skills)  → AI director agents  → better videos
```

What it learned, in plain words:

| Craft | What the films taught | Where it lives |
|---|---|---|
| **Direction** | Show the product working within 2 s; one sentence, one screen state, one action; show the problem, then the fix | [PLAYBOOK.md](_shared/references/launch-demo/PLAYBOOK.md) |
| **Camera** | The camera follows the cause: it pushes onto the button just before the click and lands; no handheld shake | PLAYBOOK, `AGENTS.md` (motion and rhythm) |
| **Music** | A clean bed whose energy follows the story; it rises into the reveal and ducks under the voice | PLAYBOOK, `AGENTS.md` (sound design) |
| **Sound** | A real click where something is clicked, soft air on camera moves, one impact as the loudest moment; never game bloops | PLAYBOOK, `_shared/sfx/UI-AD-PALETTE.md` |
| **Voice and motion in sync** | The voice runs 135–150 words a minute, and what it names lights up on screen as it is said | PLAYBOOK, the previs skill |

- **[The playbook](_shared/references/launch-demo/PLAYBOOK.md)**: the rules, each one citing the film and the second it comes from.
- **[The index](_shared/references/launch-demo/INDEX.md)**: all 187 films with links, type, rating and voice pace, plus the fifteen to watch first.
- **[The cards](_shared/references/launch-demo/cards/)**: one study card per film (structure, visual style, how the product UI is shown, motion, pacing, sound, what to take, what to avoid) and measured numbers (cuts, shot lengths, loudness, tempo).

The films belong to their creators: only notes, links and numbers are here, never their frames, audio or scripts.

## A tour of Previs Studio

Previs Studio is where you review a film before it exists. It is one web page: open it locally or share it as a claude.ai artifact. These are real screenshots of the demo film, a made-up bill-splitting app called Crumb.

| | |
|---|---|
| ![Watch](docs/images/watch.jpg) **Watch.** The plan plays like a film: the real voice, music and sound effects, each on its own lane. | ![Compare](docs/images/compare-looks.jpg) **Compare.** Three looks (or beds, voices, motions) side by side, playing in place. |
| ![Point at a part](docs/images/comment-point.jpg) **Point at it.** Comment mode names the smallest part under your cursor. | ![Write a comment](docs/images/comment-write.jpg) **Say it.** The comment is pinned to that part and that moment. |
| ![Box several parts](docs/images/comment-box.jpg) **Box it.** Drag a box around several parts and leave one comment. | ![Guided review](docs/images/guide.jpg) **Guide.** A step-by-step review for people who don't know where to start. |
| ![More options](docs/images/more-options.jpg) **More options.** A library of looks, music, motion feels, camera moves and voices. | ![Ask the director](docs/images/ask.jpg) **Ask the director agent.** It reads your whole plan, answers in plain words and makes the change: "something simple and sober" adds matching options. |
| ![Notes](docs/images/notes.jpg) **Notes, not tasks.** Thoughts about the whole film (who it's for, the tone) that Claude keeps in mind; comments are the change requests. | ![Light theme plan](docs/images/plan-light.jpg) **Every choice explained.** The plan says why each option was picked, in plain words. |
| ![Storyboard](docs/images/storyboard.jpg) **Storyboard.** Every shot plays right on its card. | ![Shot sheet](docs/images/shot-sheet.jpg) **Shot sheet.** Everything about one shot: choices, sound, comments. |
| ![Plan](docs/images/plan.jpg) **Plan.** The director team's thinking: story, look, sound, assets, checks, versions and the spec. | ![Approve](docs/images/approve.jpg) **Approve.** One button locks the plan; only then does anything render. |
| ![Send to Claude Code](docs/images/claude-working.jpg) **Hand off.** Send your comments to Claude Code and watch its status live. | ![Claude replied](docs/images/claude-done.jpg) **Done.** Each comment shows what Claude changed and when. |
| ![Light theme](docs/images/watch-light.jpg) **Light and dark.** Both themes, keyboard shortcuts, tooltips on every control. | ![Phone](docs/images/phone-watch.jpg) **Anywhere.** Works on a phone, a tablet and in full screen. |

## Motion Prompt Studio

Motion Prompt Studio is a local page for writing a better first prompt, before any previs. Pick what the video is, how it should feel and what it says, and it writes a ready prompt for your agent (in six labelled parts, with the house rules, the voice, recorded foley and the critique loop built in) and picks the engine. It is also where you browse and audition everything the studio can use: recorded sounds, music beds, named animations and fonts, each with its licence.

```bash
python3 -m http.server 5191 --directory _guide/prompt-studio    # then open http://localhost:5191
```

| | |
|---|---|
| ![Quick prompt](docs/images/prompt-quick.jpg) **Quick prompt.** Three choices and your words become a prompt; copy it into Claude Code or any agent. | ![Full builder](docs/images/prompt-full.jpg) **Full builder.** Every engine with what it is good at, frame rate, style, and the render time and cost to expect. |
| ![Sounds](docs/images/prompt-sounds.jpg) **Sounds.** Play the recorded foley (clicks, keys, whooshes), twelve UI sound kits and 706 Kenney sounds, or make one in the sound maker; add the ones you want to the prompt. | ![Music](docs/images/prompt-music.jpg) **Music.** Audition the CC0 beds with their measured tempo, and see which are render-only. |
| ![Motion](docs/images/prompt-motion.jpg) **Motion.** Ten starter moves, 184 named animations and 386 HyperFrames blocks, filtered by energy and by what each engine can do, with an ease preview. | ![Assets](docs/images/prompt-assets.jpg) **Assets.** Fonts (all OFL) previewed with your own words, Lucide icons, and where to get more, with each source's licence. |
| ![Guide](docs/images/prompt-guide.jpg) **Guide.** How long renders take, why previs comes first, what the test films taught, follow-up prompts, the prompt's six parts, which agent reads what, and the licence rules. | |

The same options are in `_shared/catalog.json` for every agent, so a prompt from the page and a prompt written by hand use the same ids.

## The problems I hit, and what the studio does about them

| Problem | What the studio does |
|---|---|
| I didn't know which tool or kit to follow, and I wanted everything free and open source. | One routing table in `AGENTS.md`: which engine for which job (HyperFrames, Remotion, video-shotcraft, bang-motion, Diffusion Studio, text-to-lottie, plus optional creator kits), all pinned to tested versions. |
| My first videos looked basic: thin synth sound, simple fades, no voice. | House rules with a banned-cliché list (no centred title on a gradient, no pure fades, no confetti), "carry, don't replace" transitions, springs with weight, a real voice-over by default, and a critique loop: a critic scores every render on 8 criteria, and nothing ships under your bar (set in `OWNER.md`; 8 if you don't set one). |
| Sound made it feel cheap: game-like bloops and harsh action-film whooshes. | A sound palette of recorded foley (real clicks, keys, switches), soft airy whooshes with measured specs, voice-first mixing (music ducks under the voice), mastering to −14 LUFS with a true-peak limiter. |
| I couldn't describe what I wanted, because I didn't know the words. | Every decision comes with three genuinely different options and one plain sentence of why. You pick; you don't have to describe. "Ask the director" turns "something calmer" into new options. |
| I paid for renders before I could see anything. | **Previs first**: a playable animatic with the real voice, music and foley on the measured beat grid. Comments, versions and an Approve button. Only the approved plan is built. |
| Reviewing a video as a non-expert is hard. | Point at the smallest part on screen and comment, drag a box around several parts, compare options side by side, hold a key to hear the original, follow a guided review. Tooltips on every control. |
| Multi-agent runs got expensive fast. | A cost gate: agents must quote agent count, tokens, time and dollars and wait for a yes. Critique rounds are capped. Previs work runs in one session, no swarm. |
| Licences are a minefield (music Content ID claims, non-commercial model weights, "free" sounds you can't redistribute). | An allowlist (CC0, MIT, Apache-2.0, OFL…), a ledger row for every file, a `motion-asset-check` skill, and hard bans on the risky sources. |
| Hidden technical traps: audio drifting 40–80 ms out of sync, wrong tempo detection, frames that change when you seek, glyphs that shimmer. | `AGENTS-tooling.md`: every trap I hit, how it was measured, and the fix (cross-correlation sync per engine, comb-fit tempo, a pure render contract, whole-pixel text). |
| Long sessions forget decisions when the context is compacted. | Decisions are written to files (`BRIEF.md`, `SHOTLIST.md`, `VERIFY.md`, `HANDOFF.md`), and agents re-read them after every compaction. |
| I use several AI coding agents, and each reads instructions differently. | One `AGENTS.md` with small pointer files for Claude Code, Codex, Cursor, Copilot, Junie, OpenCode and Antigravity. |
| I pasted API keys into a chat. | Keys are typed with hidden input into `scripts/setup/keys.sh` and stored in the macOS Keychain (on Linux and WSL 2: the secret store or a private file). Agents are told never to ask for a key in chat. |

## Works with your coding agent

The rules live in one `AGENTS.md`, with small pointer files for each agent, so the studio is not tied to Claude Code.

| Agent | Reads | Skills | Previs Studio |
|---|---|---|---|
| **Claude Code** | `CLAUDE.md` → `AGENTS.md` | `.claude/skills` + user skills and plugins | Everything, including sharing as a claude.ai artifact, live "Send to Claude Code", the AI director in Ask, and a shared notes database |
| **Codex** | `AGENTS.md` | `.agents/skills` | Local page: watch, choose, compare, comment, approve; comments and notes stay in your browser |
| **OpenCode** | `AGENTS.md` | `.agents/skills`, `.claude/skills` | Local page, as above |
| **Antigravity** (`agy`) | `AGENTS.md` (+ `GEMINI.md`) | `.agents/skills` | Local page, as above |
| **Cursor** | `AGENTS.md` + `.cursor/rules` | `.agents/skills` | Local page, as above |
| **GitHub Copilot** | `AGENTS.md` + `.github/instructions` | `.agents/skills` | Local page, as above |
| **Junie** | `AGENTS.md` | `.junie/skills` | Local page, as above |

Outside Claude Code, open Previs Studio locally (`python3 -m http.server 8790 --directory _shared/previs/studio`). "Send to Claude Code" falls back to copying a ready-made message with every open comment, which you paste into any agent's chat. Ask still works without AI, from the option libraries. Sharing the page as a link and the live notes database need claude.ai.

## What's inside

```
AGENTS.md              the house rules every agent follows (engine choice, render contract, look, motion, sound, licences, review loop)
AGENTS-tooling.md      tested commands and every gotcha, per engine
OWNER.example.md       your preferences (voice, quality bar, taste, budget); setup turns it into OWNER.md, which stays local
SETUP.md, scripts/setup/   first-run setup that Claude Code runs with you: health check, installs, Keychain keys
.agents/skills/        workspace skills: workspace-setup, video-director-previs, motion-new-project, motion-render-review, motion-asset-check
_shared/previs/        Previs Studio (React + TypeScript app, source and built page) and the spec freezer
_shared/sfx, music, fonts   CC0 sound effects (Kenney, UISFX), CC0 music beds from Freesound, OFL fonts; every file in _shared/ASSETS.md
_shared/tools/         fish_tts.py (Fish Audio voice-over), freesound.py (CC0 sound search and download)
_shared/catalog.json   machine-readable option list: 1,800+ sounds, music, 180+ moves and transitions, fonts, asset sources
_guide/prompt-studio/  Motion Prompt Studio: a local page to audition sounds and music and build a prompt visually
_shared/references/launch-demo/   the 187-film study: playbook, index, one card per film, measured numbers
examples/crumb-previs/ the demo film's plan as code (a made-up bill-splitting app)
docs/                  critique scorecard, director's brief template, screenshots
projects/_template/    BRIEF, SHOTLIST, ASSETS-USED, VERIFY and HANDOFF for each new film
```

## How a film gets made

1. **Brief.** You say what you want in one line. The agent fills `BRIEF.md` from your product's real UI, colours and copy.
2. **Previs.** A crew of AI director agents (story, look, script, music, sound and a final check) plans the film, with three options for every decision, and builds a playable animatic with the real voice, music and sounds. The agents follow the playbook from the 187-film study.
3. **Review.** You watch it in Previs Studio, swap options, leave comments on exact frames, parts, stretches of time and sounds, keep free notes about the whole film, and press Approve. The plan freezes into `approved-video-spec.json`.
4. **Build.** One engine builds exactly the approved plan, scene by scene, checking stills as it goes.
5. **The check.** The critic lays the render out as a contact sheet (two small pictures for every second, so nothing can hide), picks the weakest moments, checks them frame by frame and at phone width, and scores eight criteria (hook, readability on a phone, motion, composition, depth, brand accuracy, sound sync, polish). The three worst problems get fixed and checked again until every score reaches your bar. In our own films, first drafts landed around 6 and finals at 7–9.
6. **Master.** −14 LUFS, true peak ≤ −1 dBTP, every format (16:9, 9:16, 1:1, 4:5) from the same timeline.


## Engines

| Engine | Good for | Licence |
|---|---|---|
| [HyperFrames](https://github.com/heygen-com/hyperframes) 0.8.134 | Reels, kinetic type, promos, captions; the default | Apache-2.0 |
| [Remotion](https://www.remotion.dev) 4.0.532 | React videos, data stories, reusable templates | Free for individuals and teams up to 3 |
| [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | Product demos and ads from real UI, 2.5D camera, shot recipes | Apache-2.0 |
| [bang-motion](https://github.com/bangtutorial/bang-motion) 1.19.0 | Openers, bumpers, kinetic type, explainers | MIT |
| [Diffusion Studio](https://diffusion.studio) 0.209.1 | Cutting and compositing real footage, masks | Open-source editor |
| [text-to-lottie](https://github.com/diffusionstudio/lottie) | Logos, icons, loaders and other small Lottie elements | MIT |
| [onetake](https://github.com/feitangyuan/onetake) | Launch-film experiments | PolyForm Noncommercial (personal only) |
| Motion Reel Kit (optional) | Beat-synced reels with a synthesized score | Creator kit, not included |

## Quick start

Works on **macOS** (Apple Silicon), **Linux** (Ubuntu 22.04+, Debian 12+) and **Windows through WSL 2**, with a coding agent ([Claude Code](https://claude.com/claude-code) recommended). Claude Code's cloud environment can run the setup, scripts and renders too, but not the desktop apps. See [SETUP.md](SETUP.md#where-it-runs).

**1. Open Claude Code** in any folder: the desktop app's Code tab, or `claude` in a terminal. Codex, OpenCode, Antigravity, Cursor, Copilot and Junie work too.

**2. Paste this prompt.** It clones the workspace for you if you haven't already:

```text
Set up motion-studio for me. If this folder is not already a copy of
https://github.com/jayfirke/motion-studio, clone it into a new motion-studio folder and work there.
Then read SETUP.md and follow the workspace-setup skill (.agents/skills/workspace-setup/SKILL.md):
run the health check, tell me in plain words what is missing, ask before installing anything,
ask me the questions for OWNER.md, and have me store my API keys with scripts/setup/keys.sh
in my own terminal. Never ask me to paste a key into this chat.
```

**3. Answer its questions.** The agent checks your computer, installs what you approve, writes your preferences into `OWNER.md`, and has you type your free Fish Audio key into `keys.sh` yourself (hidden typing; it never goes into the chat). When it's done, open a new session inside the `motion-studio` folder. Details: [SETUP.md](SETUP.md).

**4. Make your first film.** In that new session, paste:

```text
Make a 20-second launch film for <your product> (<a link or one line about it>).
Previs first: show me the plan in Previs Studio, with three options for each decision,
before you render anything.
```

Just want to look first? Open the demo film without installing anything:

```bash
python3 -m http.server 8790 --directory _shared/previs/studio    # then open http://localhost:8790
```

## Make it yours

- `OWNER.md` holds your taste: name, default voice, quality bar, sound and look preferences, budget, approvals. The rules in `AGENTS.md` stay generic.
- Add engines, sounds or rules: everything is plain Markdown, JSON and scripts. Keep the licence ledger honest.
- Previs Studio is fixed; films are data. Copy `examples/crumb-previs/build_previs.py` to plan a new film.

## Credits

This studio stands on the work of many people: the YouTubers and creators whose videos and kits taught me the craft, the authors of every engine and skill, and the sound designers who share their work under CC0. Every one of them is named in **[CREDITS.md](CREDITS.md)**. Their kits, PDFs and videos are not copied here; the links go to the creators.

## Licence

My code and documentation are [MIT](LICENSE). Third-party files keep their own licences: CC0 sounds and music, OFL fonts, the Fish Audio voice takes in the demo, and the open-source libraries bundled into Previs Studio (`_shared/previs/studio/THIRD-PARTY-NOTICES.md`).

Not affiliated with Anthropic, HeyGen, Remotion, Fish Audio, Freesound or any creator named here. All trademarks belong to their owners.
