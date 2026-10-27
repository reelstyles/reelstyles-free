# ReelStyles Free 2026.10.27

3 style kits that teach your AI agent to make animated videos in a finished look. The kits are plain files (style guide, templates, render steps, quality rubric), so any agent that can read files and run a terminal can use them: Claude Code, Codex, Cursor, Roo Code, Cline, Gemini CLI, GitHub Copilot and others. The agent writes every scene in code and renders it on your machine with HyperFrames. No video model.

**First step:** tell your agent **"set up ReelStyles"**. It runs the `reelstyles-setup` skill: checks Node.js 22+, ffmpeg and Chrome, installs what is missing once you say yes, connects ReelStyles to your agent and renders a 5 s test film. Or run the script yourself: `bash setup/setup.sh install`, then `wire auto`, then `test` (Windows PowerShell: `powershell -ExecutionPolicy Bypass -File setup\setup.ps1 install`, same commands).

Then ask for a film: **"Read skills/reelstyles/SKILL.md, then make me a 30 s video about <topic> in the <style> style."** The styles are listed in `skills/reelstyles/STYLES.md`.

## Claude Code (plugin, updates with one command)
```
/plugin marketplace add reelstyles/reelstyles-free
/plugin install reelstyles-free@reelstyles-free
```
Update later: `/plugin marketplace update reelstyles-free`.

## Codex, Cursor, Roo Code, Cline, Gemini CLI, Copilot and other agents
Clone this repo (or unzip it) into your project or next to it. `AGENTS.md` at the root points every agent that reads it to the skill. Or copy `skills/reelstyles/` to wherever your agent reads skills or rules. Update with `git pull`.

## Needs
Node.js 22+, Chrome or Chromium (HyperFrames renders with it) and ffmpeg; the setup skill installs them with your OK. Long films render faster on more CPU cores.

## Licence
For your own films, commercial use included. Do not share or resell the kits. Full text: LICENSE.md.

Want more looks? Starter has 15 styles, Full has all 119 plus every new one: https://reelstyles.com/pricing.html
