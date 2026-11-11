# Episode mode: one sentence in, a finished video out

Use this when the user gives a topic and little else ("make me a video about the 2008 crash", "an episode on why cats
purr"). You do the rest: pick the style, research, write, voice, build, check and render. Paths are relative to the folder
this file is in. Everything here is free: a local voice, open footage only where a kit uses footage, no paid video model.

Order: `fit → say what's coming → facts → script → stop 1 (board) → voice → build → checks → stop 2 (draft) → render → reply`

## 1. Fit

- Read `STYLES.md` and `formats.json`. Pick the one style and format that fit the topic best (a format whose id is in the
  style's "Best for"). If two fit equally well, name both in one line and pick the first unless the user objects.
- The length is the user's. None given: about 60 s for a 9:16 Short, about 3 min for a 16:9 explainer. Say you can do the
  longer cut later. Never pad to reach a format's full length.
- Ask once, together, only what is still open (usually nothing). Then send one short message: working title, hook line,
  style, length, about how long it takes. Go on without waiting.

## 2. Facts

- Search the web for the topic. Write `facts.md`: every number, date, name and quote with its source URL and the date you
  read it. Prefer primary sources (papers, official reports, the company's own pages). A fact you can't source is cut.
- Look at what the top existing videos on the topic cover (a web search, nothing downloaded) and find the angle they miss.

## 3. Script

- Follow the format's `beats`, `hook` and `title_pattern`. The first line is the hook: the surprising answer or the strange
  fact, stated flat. No "in this video", no "let's dive in".
- Pace: about 150 words a minute for a calm explainer, 165-175 for a fast Short. Count words before you write the shots.
- Short sentences, spoken English, one idea per line. Every number on screen or in the voice comes from `facts.md`.
- Write `script.txt` (one spoken line per row) and `title.txt`.

## 4. Stop 1: the board

Copy the kit into the project (`kits/<id>/`, never edit it in place), read `FILM.md` and its `read_first` files, then write the shot plan:
one row per line of the script (start, seconds, what the picture shows, the kit template or helper that makes it, 1-5
words on screen). Build the first beat and take one still per beat with `npx -y hyperframes@0.8.96 snapshot`. Show the
user the stills and the plan and wait for their go. Times are estimates until the voice exists; say so.

## 5. Voice

The free local voice from `RENDER.md` (Kokoro, Option A), at speed 1.0 or slower. Voice one paragraph first, measure the
words a minute and adjust the words, not the speed. Then voice the whole script once and get word timings with
`npx -y hyperframes@0.8.96 transcribe audio/voice.wav --json`. The user's own recording or voice clone is fine when they
say it is theirs. Never imitate a real person's voice.

## 6. Build

Time every shot to the word timings. Follow the kit's STYLE.md and its beats; a new picture at least every 2-4 s (the kit
says which). Build one beat at a time, take stills, review them with `REVIEW.md` (and the kit's RUBRIC.md if it has one), fix, then the next beat.

## 7. Checks and stop 2

Run the kit's checks (RENDER.md of the kit: lint, `tools/deadhold.sh`, for 9:16 `tools/vcheck.sh`). Score the rubric from
a contact sheet (`ffmpeg -i out.mp4 -vf "fps=1,scale=270:-1,tile=6x6" -frames:v 1 sheet.jpg`). Show the user the sheet,
the score and every check that failed, and ask once for changes. Change only what they asked.

## 8. Render and reply

One full render (RENDER.md). Reply with: the file path, its length, the title and a 2-3 sentence description, the source
list from `facts.md`, the music/footage licence lines, and anything that is still a stand-in. Keep `LOG.md` in the project
(each step and how long it took) so a later session can pick up where this one stopped.

## Rules

- Never a real creator's face, voice, footage, logo, characters or show name. Copy a genre's grammar, never a channel.
- A real brand's logo only where its terms allow it; otherwise leave it out.
- One heavy job at a time (render, long ffmpeg, transcription).
