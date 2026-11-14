# Film rules (every style)

These hold in every kit. The kit's STYLE.md says how things look. This file says how a good film is made. If the two disagree, the kit wins on looks and this file wins on everything else.

## Story first

- Read the script once and list its people, places, era and objects. Draw only those. No cutaway to another time or place unless the narration goes there.
- Dress, buildings, tools and faces fit the era and region of the story. Use the kit's own people and props; if the kit has none for that era, build them in the kit's line, colours and detail level.
- One through-line: every shot shows what the narration says at that moment.
- Prove every new thing before you use it. For each person, animal, prop or place the story needs that the kit does not already have, draw it alone on one still first, in the kit's line and colours, and ask a fresh subagent (only the still, no code) "what is this?". Redraw until it names it in one word. A fallen tree that reads as a dome, or a lamp that reads as a toy, sinks the film.
- Pick the look of each scene for its mood: dark places (caves, night, tombs) stay dark, lit only by the story's light source, with silhouettes and glow. Do not flood them with daylight.

## Frame

- Wides and medium-wides carry the film: the main character whole, feet on a visible floor with a contact shadow, about 30-55% of the frame height. Close-ups are short beats, at most 4 in 10 shots.
- Nothing important touches an edge: characters, faces, props and text stay at least 65 px inside. Only sky, ground and walls may bleed off.
- One main subject per shot. The key object of the beat is big (at least 12% of the frame height) and has a clear silhouette.
- Every shot is a full, real place: a floor, a back wall or horizon, and 3+ props. Measured (`node products/reelstyles/tools/clip-measure.mjs out.mp4 --gate`, also works on a still), the good samples sit at mean luma 0.1-0.7, luma spread (contrast) 0.1-0.24 and a flat (detail-free) share of at most 0.6.

## Make it look like a film

- Light: one visible light source per scene (sun, lamp, fire, moon, screen) with a rim or glow on the subject.
- Depth: 3 layers (far, mid with the subject, near foreground) with parallax when the camera moves.
- Air: one moving atmosphere layer (dust, smoke, rain, embers, fog, leaves).
- Camera: every shot moves (slow push, pan, tilt, crane). Neighbouring shots never share the same framing and angle.
- Grade: the colour turns across the film (cold or dim at the start, warm and bright at the payoff) unless the story needs the opposite.

## Pace

- A new picture at least every 2 s: a cut to a new angle, or a big visible change (measured motion 0.04-0.2, and `dead` at most 1: never 3 seconds that look the same). A moving arm in the same frame is not a new picture.
- Frame 0 is already a full, lit picture in motion, with at least half the detail of the rest of the film (measured `f0` 0.5 or more). No title card, no standing pose to open.
- The last shot is the payoff, large and readable without a label, still moving until the end. No end card unless the user asks.

## Text on screen

- At most one caption per shot, 4 words or fewer, never the narrator's exact words, never over a face or the key object.
- A caption box and its text appear and leave together. A box without its text is a mistake on any frame.
- Every number on screen matches the narration once it settles.
- Text is readable on a phone: at least 44 px on 1080 wide, high contrast.

## Code

- Every frame is a pure function of the film time: no `Math.random`, `Date` or `performance.now`.
- Prefix your own helpers; never redefine kit globals.
- Render only with `bash tools/render.sh` when the kit has it. It runs the machine checks and refuses a film that fails.
- Run the render in the foreground and wait for it. Never end your turn while a render runs: the film is only done when `out.mp4` exists and you have reviewed it.
