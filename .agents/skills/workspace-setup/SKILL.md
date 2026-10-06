---
name: workspace-setup
description: Set up this motion-studio workspace on a new machine for its owner - check the tools, install what is missing (with their OK), write OWNER.md from a few plain questions, have them store their own API keys safely in the Keychain, and write the local setup marker. Use when the session-start note says FIRST RUN, when someone says "set up this workspace", "install everything", "add my API keys", "it doesn't work on my Mac", or right after cloning the repo.
---

# Workspace setup

This repo holds the rules, skills, tools, shared CC0 sounds, Previs Studio and one demo film, but nothing tied to a machine or a person: no API keys, no `.venv`, no `node_modules`, no user-level skills or plugins, no `OWNER.md`. This skill gets the owner to a working studio. `SETUP.md` is the same procedure written for people.

Talk to the owner in plain words. They may not be technical, and they may know nothing about motion design. One step at a time, say what it does, why, and how long it takes.

## Hard rules

- **Never ask for an API key in the chat, and never type, echo, log or write one.** Keys go into the macOS Keychain through `scripts/setup/keys.sh`, which the owner runs in their own Terminal (hidden typing). If they paste a key into the chat anyway: don't use it or store it. Tell them it is now in the chat history, ask them to delete that key on the provider's site and make a new one, then store the new one with `keys.sh`.
- **Installs are theirs to approve** (AGENTS.md "Ask first"). Ask with AskUserQuestion before running any `install.sh` step, and quote the download size.
- Never run `sudo`. Homebrew's own installer needs their password, so they run that one command themselves.

## Steps

1. **Say hello and set expectations** in 3 lines: what setup does (check tools, install the missing ones, write their preferences, store their keys), about 15–30 minutes, about 3 GB of downloads (Homebrew packages, Chromium, the 1.6 GB Whisper model).
2. **Check:** run `bash scripts/setup/doctor.sh`. Summarize the NEED lines in plain words (what each is for), then the OPT lines in one sentence.
3. **No Homebrew?** Ask them to open Terminal and run the official installer from https://brew.sh themselves (it asks for their Mac password), then follow the "Next steps" lines it prints. Wait for "done", then run doctor again.
4. **Choose installs** with one AskUserQuestion (multiSelect). Offer only what doctor marked missing:
   - "Core studio" = `install.sh core` (Homebrew tools, Python venv, Claude skills, Claude plugins). Recommended.
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
   - Otherwise ask them to open the Terminal app and paste: `cd <workspace> && bash scripts/setup/keys.sh`.
   When they say it's done, run `bash scripts/setup/doctor.sh --online`. It confirms the keys work without showing them.
7. **Optional extras** (one short list, they pick):
   - Diffusion Studio (cutting real footage, object masks): they download the app from https://diffusion.studio, open it once, then you run `install.sh diffusion-mcp`.
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
