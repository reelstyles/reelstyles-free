---
name: reelstyles-setup
description: Set up ReelStyles on this computer for the user's AI agent. Checks and installs Node.js 22+, ffmpeg, git and Chrome for HyperFrames, wires the ReelStyles skill into the agents the user has (Claude Code, Codex, Cursor, Roo Code, Cline, Gemini CLI, GitHub Copilot, Windsurf), then renders a 5 s test film. Use when the user says "set up ReelStyles", "install ReelStyles", or before the first ReelStyles video if setup has not passed.
---

# ReelStyles setup

The scripts live in `setup/` at the root of the ReelStyles repo (two folders above this file): `setup/setup.sh` (macOS, Linux, WSL, Git Bash) and `setup/setup.ps1` (Windows PowerShell). They take the same commands. Below, `SETUP` means:
- macOS / Linux / WSL / Git Bash: `bash <repo>/setup/setup.sh`
- Windows PowerShell: `powershell -ExecutionPolicy Bypass -File <repo>\setup\setup.ps1`

Run the commands from the user's project folder (the folder they want the agent wiring in), not from inside the ReelStyles repo, unless that is the only folder they use.

1. **Detect the system.** Find the OS (Windows, macOS, Linux, WSL) and pick the matching script. On Windows prefer `setup.ps1` unless you are already in Git Bash or WSL.
2. **Check.** Run `SETUP check`. It lists Node.js ≥ 22, ffmpeg + ffprobe, git, free disk and Chrome for HyperFrames, and exits non-zero if anything required is missing. If it prints READY, go to step 4.
3. **Install what is missing, with the user's OK.**
   - Run `SETUP install --dry-run`. It prints, per missing tool, the exact command it would run (winget, Homebrew, apt or dnf; Node through fnm, nvm or the official nvm installer when the system Node is old).
   - Show the user every command and ask which ones to run. **Never install anything the user has not agreed to**, and say clearly when a command uses `sudo`.
   - Run `SETUP install --yes <tool> [<tool>...]` with only the tools the user agreed to (or let the user run `SETUP install` themselves: it asks per tool). If a command needs a password, ask the user to run it in their own terminal.
   - Node or git installed just now may need a new terminal before they are on the PATH. Then run `SETUP check` again until it prints READY.
4. **Wire the agent.** Run `SETUP wire list` to see which agents are detected, tell the user, then `SETUP wire auto` (or `SETUP wire <agent>` for the ones the user names: `claude codex cursor roo cline gemini copilot windsurf`). It writes short pointer files in the project (for example `.cursor/rules/reelstyles.mdc`, `.roo/rules/reelstyles.md`, an `AGENTS.md` block) that tell the agent where the ReelStyles skill is. It never copies the kits. Add `--global` if the user wants it in every project. Claude Code users who installed the plugin need no wiring.
5. **Smoke test.** Run `SETUP test`. It renders a 5 s test film and prints the mp4 path and the render time. Report both to the user. If it fails, run `SETUP check`, fix what it lists, and try again.
6. **Finish** with: "ReelStyles is ready: ask me for a video in any style from STYLES.md" (`skills/reelstyles/STYLES.md`).

Notes
- Nothing here sends data anywhere: HyperFrames telemetry is switched off by the scripts. The first run downloads the HyperFrames npm package and its headless Chrome.
- The scripts are safe to run again; they skip what is already done.
