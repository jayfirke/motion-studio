@AGENTS.md

## Claude Code only

- **First run on a new machine?** If `.local/setup.json` or `OWNER.md` is missing (the session-start note says FIRST RUN), run the `workspace-setup` skill before anything else (`SETUP.md` is the human version). Never ask anyone to paste an API key into the chat.
- Read `OWNER.md` (the owner's preferences) right after `AGENTS.md`, and `AGENTS-tooling.md` before running any CLI.
- Skills to reach for:
  - `video-director-previs` first for any film over 10 s (previs page, A/B/C options, the owner's notes, approval).
  - `video-shotcraft` (product demos and ads).
  - `/hyperframes` (any HyperFrames video). The HyperFrames Claude plugins (`hyperframes:*`, `core-skills`) match the pinned CLI version, 0.8.134.
  - `remotion-best-practices` (Remotion).
  - `/motion-reel` (if the owner has the Motion Reel Kit).
  - `bang-motion:bang-motion` (openers, bumpers, kinetic type).
  - `onetake` (personal, non-commercial only).
  - `text-to-lottie` (Lottie elements).
  - `fish-audio-api` / `fish-audio-sdk` (voice).
  - The workspace skills `motion-new-project`, `motion-render-review`, `motion-asset-check` and `workspace-setup`.
- MCP and connectors only Claude has here:
  - The Fish Audio connector (claude.ai): `search_voices`, `get_voice`, `text_to_speech`, `get_credit_balance`. It spends plan credits, so prefer `_shared/tools/fish_tts.py` with `s2.1-pro-free` for real takes.
  - Diffusion Studio MCP (`diffusion`, `http://127.0.0.1:3274/mcp`): `open`, `context`, `check`, `capture`, `export`, `media_*`, `models`, `voices`, `fonts`, `screenshot`, `logs`.
  - Other agents use the CLIs and scripts instead.
- Use the AskUserQuestion tool for every choice that is the owner's. Before a Workflow or parallel sub-agents, quote the agent count, tokens and time, and wait for a yes.
