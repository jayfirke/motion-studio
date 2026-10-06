# Setting up motion-studio on your Mac

Claude Code does the setup with you and asks before installing anything. This page is the same procedure for people.

## What you need

- A Mac with Apple Silicon (M1 or newer), about 5 GB free disk space, and an internet connection. Other systems work partly (no Keychain, no Diffusion Studio).
- **Claude Code**: the Claude desktop app (Code tab) or the `claude` command in Terminal.
- **A free Fish Audio account**, for voice-overs: https://fish.audio.
- Optional: **a free Freesound account**, to download new sound effects: https://freesound.org.

## Quick start

1. Clone the repo (or use it as a template on GitHub):
   ```bash
   git clone https://github.com/jayfirke/motion-studio.git && cd motion-studio
   ```
2. Open the folder in Claude Code (desktop app: Code tab → choose the folder, and trust it when asked; Terminal: `claude`).
3. Claude notices the copy is not set up and starts the setup. If it doesn't, type: **set up this workspace**.
4. Answer its questions: your name and preferences (they go into `OWNER.md`, which stays on your machine), which installs to run, and which API keys you have. It runs a health check, installs what is missing, and checks everything at the end.
5. When it says it's done, **start a new Claude Code session** in the folder, so the new skills and plugins load.

Try the demo right away: `python3 -m http.server 8790 --directory _shared/previs/studio`, then open http://localhost:8790. That's Previs Studio with the Crumb demo film.

## Your API keys stay private

Claude never asks you to paste a key into the chat. Keys go into the macOS Keychain:

```bash
bash scripts/setup/keys.sh
```

Run it in the **Terminal app** (or the desktop app's Terminal panel when Claude opens it for you). Your typing stays hidden.

| Key | Where to get it | What it's for |
|---|---|---|
| Fish Audio API key | https://fish.audio/app/api-keys/ | Voice-overs (the free model `s2.1-pro-free` is free through 2026-11-30) |
| Freesound API key | https://freesound.org/apiv2/apply/ → "Client secret/Api key" | Optional: searching and downloading CC0 sound effects |
| Freesound client ID | the same page → "Client id" | Optional: original-quality downloads only |

The tools read the keys straight from the Keychain (`_shared/tools/fish_tts.py`, `_shared/tools/freesound.py`). Not on a Mac? `keys.sh` tells you which environment variables to set in your shell profile instead.

## Doing it by hand

```bash
bash scripts/setup/doctor.sh                  # what's ready and what's missing (changes nothing)
bash scripts/setup/install.sh core            # Homebrew tools, Python venv, Claude skills and plugins
bash scripts/setup/install.sh whisper-model   # 1.6 GB speech model for captions and word timings
bash scripts/setup/install.sh app             # Previs Studio packages (to rebuild it and run its checks)
cp OWNER.example.md OWNER.md                  # then fill it in
bash scripts/setup/keys.sh                    # your API keys, into the Keychain
bash scripts/setup/doctor.sh --online         # final check, including whether the keys work
```

Homebrew itself (https://brew.sh) needs your Mac password, so install it yourself first if `doctor.sh` says it's missing.

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
