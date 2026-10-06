# Setting up motion-studio

Claude Code does the setup with you and asks before installing anything. This page is the same procedure for people.

## Where it runs

| System | Status | Notes |
|---|---|---|
| **macOS** on Apple Silicon (M1 or newer) | Fully supported, built and tested here | Keys in the macOS Keychain; Diffusion Studio desktop app available |
| **Linux** with apt (Ubuntu 22.04+, Debian 12+) | Supported, tested in Ubuntu 24.04 and Debian 12 | Keys in your desktop secret store or a private file; Diffusion Studio as its web app (no MCP); on ARM Linux, HyperFrames uses your system Chromium |
| **Windows** through **WSL 2** (Ubuntu) | Supported through WSL 2, which runs Ubuntu (tested); not yet tested on a Windows PC | Run the Linux steps inside WSL 2. Native Windows (without WSL) is not supported yet |
| **Claude Code in the cloud** (claude.ai/code) | Partly | Cloning, installs, scripts and headless renders run on Anthropic's Ubuntu machines; desktop apps, the Keychain and Claude plugins don't. Outputs leave through git |

Besides the system, you need about 5 GB of free disk space and an internet connection, plus:

- **Claude Code**: the Claude desktop app (Code tab) or the `claude` command in a terminal. Other coding agents work too (see the README).
- **A free Fish Audio account**, for voice-overs: https://fish.audio.
- Optional: **a free Freesound account**, to download new sound effects: https://freesound.org.

## Quick start

1. Open Claude Code in any folder: the desktop app's Code tab, or `claude` in a terminal.
2. Paste this prompt. It works whether or not you have already cloned the repo:
   ```text
   Set up motion-studio for me. If this folder is not already a copy of
   https://github.com/jayfirke/motion-studio, clone it into a new motion-studio folder and work there.
   Then read SETUP.md and follow the workspace-setup skill (.agents/skills/workspace-setup/SKILL.md):
   run the health check, tell me in plain words what is missing, ask before installing anything,
   ask me the questions for OWNER.md, and have me store my API keys with scripts/setup/keys.sh
   in my own terminal. Never ask me to paste a key into this chat.
   ```
3. Answer its questions:
   - your name and preferences (they go into `OWNER.md`, which stays on your machine);
   - which installs to run;
   - which API keys you have.

   It runs a health check, installs what is missing, and checks everything at the end.
4. When it says it's done, **start a new Claude Code session inside the motion-studio folder**, so the new skills and plugins load.

Prefer to clone it yourself? `git clone https://github.com/jayfirke/motion-studio.git`, open that folder in Claude Code, and Claude usually starts the setup on its own.

Try the demo right away: `python3 -m http.server 8790 --directory _shared/previs/studio`, then open http://localhost:8790. That's Previs Studio with the Crumb demo film.

## Your API keys stay private

Claude never asks you to paste a key into the chat. You type them into `keys.sh` in your own terminal, with hidden typing:

```bash
bash scripts/setup/keys.sh
```

Where it stores them:

- **macOS**: the Keychain.
- **Linux and WSL 2**: your desktop secret store (GNOME Keyring or KDE Wallet, through `secret-tool`). Without one, `~/.config/motion-studio/keys.env`, a file outside the workspace that only you can read.

| Key | Where to get it | What it's for |
|---|---|---|
| Fish Audio API key | https://fish.audio/app/api-keys/ | Voice-overs (the free model `s2.1-pro-free` is free through 2026-11-30) |
| Freesound API key | https://freesound.org/apiv2/apply/ → "Client secret/Api key" | Optional: searching and downloading CC0 sound effects |
| Freesound client ID | the same page → "Client id" | Optional: original-quality downloads only |

The tools look for a key in this order:

1. an environment variable (`FISH_API_KEY`, `FREESOUND_API_KEY`, `FREESOUND_CLIENT_ID`);
2. the store `keys.sh` used (see `_shared/tools/keystore.py`).

In a Claude Code cloud environment, add the keys as API credentials or environment variables of that environment instead.

## Doing it by hand

```bash
bash scripts/setup/doctor.sh                  # what's ready and what's missing (changes nothing)
bash scripts/setup/install.sh system          # command-line tools: Homebrew on macOS, apt on Linux/WSL 2 (asks for your password)
bash scripts/setup/install.sh core            # the above, plus the Python venv, Claude skills and plugins
bash scripts/setup/install.sh whisper-model   # 1.6 GB speech model for captions and word timings
bash scripts/setup/install.sh app             # Previs Studio packages (to rebuild it and run its checks)
cp OWNER.example.md OWNER.md                  # then fill it in
bash scripts/setup/keys.sh                    # your API keys
bash scripts/setup/doctor.sh --online         # final check, including whether the keys work
```

Two things the agent can't do for you, because they need your password:

- **macOS:** install Homebrew yourself first (https://brew.sh) if `doctor.sh` says it's missing.
- **Linux and WSL 2:** run `bash scripts/setup/install.sh system` yourself in a terminal (it uses `sudo apt-get`). Claude can run the other steps.

## Optional: the creator kits

The studio works without them. If you get one from its creator (see `CREDITS.md`), keep it outside this repo:

- **Motion Reel Kit** (motion-reel engine): `MOTION_REEL_KIT=<kit folder> bash scripts/setup/install.sh motion-reel`.
- **Motion as Code** and **Motion Graphics with Claude Code** (PDF guides and starter kits): read them, use their prompts in your own projects, and never commit their files.

## Licences you agree to by using the tools

- **onetake** is PolyForm Noncommercial: personal experiments only, never paid or own-brand work.
- **Remotion** is free for individuals and companies of up to 3 people; larger companies need a licence (https://remotion.pro).
- **Fish Audio** `s2.1-pro-free` allows commercial use for businesses under $1M a year in revenue; check the terms again after 2026-11-30.
- **Mixkit** sounds (inside video-shotcraft) may be used only inside rendered videos, never shared as files.
- Everything in `_shared/` is CC0, OFL or made in code; `_shared/ASSETS.md` lists the source and licence of every file.
