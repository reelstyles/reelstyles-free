# ReelStyles Free 2026.10.30

Open-source alternative to paid AI video tools: style packs for Claude Code that make videos in code with HyperFrames, no video-model bill.

[![Dark Keynote](https://reelstyles.com/samples/dark-keynote-example.jpg)](https://reelstyles.com/samples/dark-keynote-example.mp4)
[![Whiteboard explainer](https://reelstyles.com/samples/whiteboard-example.jpg)](https://reelstyles.com/samples/whiteboard-example.mp4)
[![Doodle film](https://reelstyles.com/samples/doodle-film-example.jpg)](https://reelstyles.com/samples/doodle-film-example.mp4)

Quick start (30 seconds) in Claude Code: run the two /plugin lines below, then ask for "a 20 s video about coffee in the whiteboard style".

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
MIT: use, change and share these kits, commercial use included. Full text: LICENSE.md.

## Want all the styles?
Starter: 15 styles for $19. Full: all 120 plus every new one, $49 for the first 20 buyers, then $79. One payment. Live prices: https://reelstyles.com/pricing.html
