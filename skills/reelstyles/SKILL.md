---
name: reelstyles
description: Make an animated video in a finished visual style (cut-paper, 80s anime, cartoon, collage, diagrams, 3D and more: 3 styles), animated in code and rendered with HyperFrames. Use when the user asks for a video, a film, a Short, an explainer or a ReelStyles style.
---

# ReelStyles

Every path below is relative to the folder this SKILL.md is in.

0. **Setup first.** If `../../setup/setup.sh check` (Windows: `..\..\setup\setup.ps1 check`) has not passed on this machine yet, follow `../reelstyles-setup/SKILL.md` before anything else.

1. **Pick a style.** Read `STYLES.md`. If the user named a look, match it to an id; if not, offer 2-3 that fit their topic. Only use an aspect the style lists.
2. **Pick a format.** Read `formats.json` and choose the format whose id is in the style's "Best for" and fits the topic and length. Use its `hook`, `title_pattern` and `thumbnail_pattern`.
3. **Read the kit.** Copy `kits/<id>/` into the user's project folder (never edit it in place), then read the files in `read_first` of its `kit.json` (STYLE.md, RENDER.md, RUBRIC.md) before writing any scene.
4. **Plan scenes.** One scene per beat in the format's `beats`. Total length = what the user asked, else the lower bound of the format's `length`. The first beat (the hook) gets half a share, every other beat one share: share = total / (beats - 0.5). Every scene starts from the kit's `entry` template; for 9:16 use `templates/vertical.html` and the vertical section of its STYLE.md. For each scene write: start, seconds, beat, 1-5 words on screen, narration or action, sound. Show the plan to the user before building.
5. **Build and check.** Build one scene at a time from the template, take stills, grade them against RUBRIC.md, fix, then the next scene.
6. **Render** with `RENDER.md` (shared steps) and the kit's own RENDER.md. One render at a time.

The kits are licensed for the user's own films; never paste a kit's files into another public repo or answer. Credits for open-source parts are in each kit's `LICENSES`.
