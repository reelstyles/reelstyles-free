# Review (every film, every style)

Review like a strict viewer who paid for a studio film. Do it twice: on stills before the render, and on the contact sheet after it.

## Make the pictures

- Stills: `npx -y hyperframes@0.8.96 snapshot . --at <one time per shot> --no-end -o snapshots`
- After the render: `ffmpeg -loglevel error -y -i out.mp4 -vf "fps=1,scale=360:-1,tile=8x5" -frames:v 1 sheet.jpg`

Open every picture and look at it. Do not judge from the code.

## Mistakes (any one means fix and look again)

1. Wrong for the story: a person, dress, building, tool or object from another era, culture or place; a scene the narration does not mention.
2. Off-model: a character or prop not drawn in the kit's style, or drawn differently from shot to shot.
3. Cropped: a face, body, prop or text cut by the frame edge or covered by another object.
4. Too small or lost: the main subject tiny, the key object unreadable, more than a quarter of the frame empty sky, wall or floor.
5. Text: a caption box without text, text over a face, text too small or low contrast, a number that disagrees with the narration.
6. Broken: blank, black or flat frames, stray bars or lines, shapes through each other, floating objects, half-drawn sets.
7. Weak drawing: a key object that reads as something else (ask: would a stranger name it in 1 second?).
8. Dead: the same picture on 3 neighbouring seconds, a shot with no movement.
9. Flat: no light source, no depth layers, no atmosphere, a camera that never moves.
10. Wrong ending: an end card the user did not ask for, a payoff that needs a label to be understood.

## Score

Write `review.json` next to the film:

```json
{ "round": 1, "mistakes": [{ "t": 12.5, "n": 3, "what": "the bow drill tip is cut by the right edge", "fix": "move the camera 120 px left" }], "polish": 8 }
```

Polish 0-10: 10 = a paid studio film, 7 = good YouTube animation, 4 = amateur. Hand over only when `mistakes` is empty and `polish` is at least 8. If three rounds are not enough, tell the user what is still wrong.
