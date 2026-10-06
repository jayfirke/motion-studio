---
name: workspace-setup
description: Set up this motion-studio workspace on a new machine for its owner - check the tools, install what is missing (with their OK), write OWNER.md from a few plain questions, have them store their own API keys safely (Keychain on macOS, secret store or a private file on Linux and WSL 2), and write the local setup marker. Use when the session-start note says FIRST RUN, when someone says "set up motion-studio", "set up this workspace", "install everything", "add my API keys", "it doesn't work on my computer", or right after cloning the repo.
---

# Workspace setup

Runs on macOS (Apple Silicon), Linux with apt (Ubuntu 22.04+, Debian 12+) and Windows through WSL 2. This repo holds the rules, skills, tools, shared CC0 sounds, Previs Studio and one demo film, but nothing tied to a machine or a person: no API keys, no `.venv`, no `node_modules`, no user-level skills or plugins, no `OWNER.md`. This skill gets the owner to a working studio. `SETUP.md` is the same procedure written for people.

Talk to the owner in plain words. They may not be technical, and they may know nothing about motion design. One step at a time, say what it does, why, and how long it takes.

## Hard rules

- **Never ask for an API key in the chat, and never type, echo, log or write one.** Keys go in through `scripts/setup/keys.sh`, which the owner runs in their own terminal with hidden typing (macOS Keychain; on Linux/WSL 2 the secret store or `~/.config/motion-studio/keys.env`). If they paste a key into the chat anyway: don't use it or store it. Tell them it is now in the chat history, ask them to delete that key on the provider's site and make a new one, then store the new one with `keys.sh`.
- **Installs are theirs to approve** (AGENTS.md "Ask first"). Ask with AskUserQuestion before running any `install.sh` step, and quote the download size.
- Never run `sudo` yourself. On macOS, Homebrew's installer needs their password; on Linux/WSL 2, `bash scripts/setup/install.sh system` (apt) does. They run that one command in their own terminal. (In a Claude Code cloud session you are root, so you can run it.)

## Steps

0. **Not in the repo yet?** If the current folder isn't a motion-studio copy (no `AGENTS.md` with "motion-studio" and no `scripts/setup/`), clone it first: `git clone https://github.com/jayfirke/motion-studio.git motion-studio` (ask where, default: a `motion-studio` folder in their home or current folder), then work inside it. Tell them that at the end they open a new session inside that folder.
1. **Say hello and set expectations** in 3 lines: what setup does (check tools, install the missing ones, write their preferences, store their keys), about 15–30 minutes, about 3 GB of downloads (system packages, Chromium, the 1.6 GB Whisper model). Say which system doctor found (macOS, Linux or WSL 2).
2. **Check:** run `bash scripts/setup/doctor.sh`. Summarize the NEED lines in plain words (what each is for), then the OPT lines in one sentence.
3. **System tools.**
   - **macOS without Homebrew:** ask them to run the official installer from https://brew.sh in Terminal themselves (it asks for their password), then follow the "Next steps" lines it prints.
   - **Linux / WSL 2:** ask them to run `bash scripts/setup/install.sh system` in their own terminal (apt needs their password; it also builds `whisper-cli` and installs Node 22 and uv). On ARM Linux it prints one `export HYPERFRAMES_BROWSER_PATH=…` line to add to their shell profile.
   Wait for "done", then run doctor again.
4. **Choose installs** with one AskUserQuestion (multiSelect). Offer only what doctor marked missing:
   - "Core studio" = `install.sh core` on macOS (Homebrew tools, Python venv, Claude skills, Claude plugins); on Linux/WSL 2, after their `system` step, `install.sh venv skills plugins`. Recommended.
   - "Whisper model, 1.6 GB" = `install.sh whisper-model` (word timings for captions and voice checks). Recommended.
   - "Previs Studio packages" = `install.sh app` (to rebuild Previs Studio and run its checks).
   - "onetake" = `install.sh onetake`: personal, non-commercial experiments only (PolyForm Noncommercial).
   - "Motion Reel Kit" = `install.sh motion-reel <kit folder>`: only if they bought or downloaded the kit from its creator (see `CREDITS.md`); it is not in this repo.
   Run the approved steps from the workspace root. Long steps (brew, whisper-model) go in the background; tell them what is running. A step prints `FAIL …` with the fix: try the fix once, then explain and ask.
5. **Their preferences.** Copy `OWNER.example.md` to `OWNER.md`, then ask its questions in one or two AskUserQuestion rounds (name, what they make, personal or commercial use, motion-design experience, default voice, quality bar, budget and approvals). Write the answers into `OWNER.md` in their words. It is git-ignored and never shared.
6. **API keys.** Ask with AskUserQuestion which they want now:
   - **Fish Audio** (needed for every voice-over; free account; the free model `s2.1-pro-free` is free through 2026-11-30): key at https://fish.audio/app/api-keys/.
   - **Freesound** (optional; only to search and download new sound effects; free account): apply at https://freesound.org/apiv2/apply/ and copy "Client secret/Api key" and "Client id".
   Then have them run `bash scripts/setup/keys.sh` in their own terminal:
   - In the Claude desktop app, if you have a terminal tool (`run_in_terminal`), start `cd "<workspace>" && bash scripts/setup/keys.sh` in their Terminal panel and tell them to type there. Don't read the panel while they type.
   - Otherwise ask them to open a terminal (Terminal on macOS, their Linux or WSL terminal) and paste: `cd <workspace> && bash scripts/setup/keys.sh`.
   When they say it's done, run `bash scripts/setup/doctor.sh --online`. It confirms the keys work without showing them.
7. **Optional extras** (one short list, they pick):
   - Diffusion Studio (cutting real footage, object masks): on macOS they download the app from https://diffusion.studio, open it once, then you run `install.sh diffusion-mcp`. On Linux it runs as a web app (https://app.diffusion.studio) without the MCP.
   - The Fish Audio connector in claude.ai (Settings → Connectors). Not needed; the scripts use the key.
   - Remotion is free for individuals and companies of up to 3 people; bigger companies need a Remotion licence.
8. **Finish.** Write `.local/setup.json` (create `.local/`; it is git-ignored):
   ```json
   {"owner": "<first name>", "setup_at": "<UTC time from date -u +%Y-%m-%dT%H:%M:%SZ>", "by": "workspace-setup", "doctor": "<the DOCTOR line>"}
   ```
   Run `bash scripts/setup/session-check.sh` (it should print nothing now) and doctor once more. Report what is ready and what was skipped.
9. **Tell them what's next:**
   - Start a **new** Claude Code session in this folder. Skills, plugins and the Diffusion MCP load only at session start.
   - Open the demo: `python3 -m http.server 8790 --directory _shared/previs/studio`, then http://localhost:8790 (Previs Studio with the Crumb demo film).
   - A first prompt to try: "Make a 15-second launch reel for <your product>. Previs first."

## Re-running

`bash scripts/setup/doctor.sh` any time. `bash scripts/setup/install.sh <step>` repeats one step safely. Delete `.local/setup.json` to run this whole setup again.
