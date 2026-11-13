// =====================================================================
//  templates/film-v.js: the 36.8 s VERTICAL (1080x1920) quiz Short. Copy it to the project root as film.js next to
//  templates/vertical.html (as index.html). The 16:9 sample stays templates/film.js.
//  7 rounds of 4.6 s (easy x2, medium x2, hard x2, impossible x1), a 1.0 s title card before medium, hard and impossible.
//  Frame 0 is round 1 mid-drop (no opening title). Every round shows 4 sets: calm, burst, danger, win (sets/stage.js quizRoundV),
//  so a new picture lands every <= 1.3 s. The last round's payoff keeps playing under the end card (DUR - 2).
//  Edit: PLAN ({ band, item, prompt, pose }); DUR = sum of the beats = data-duration in index.html.
// =====================================================================
const PLAN = [
  { band: 'easy', item: 'banana', prompt: 'WHAT FRUIT IS IT?', pose: 'walk' },
  { band: 'easy', item: 'fish', prompt: 'NAME THIS ANIMAL', pose: 'idle' },
  { band: 'medium', item: 'cat', prompt: 'WHO IS THIS?', pose: 'walk' },
  { band: 'medium', item: 'elephant', prompt: 'WHICH ANIMAL?', pose: 'idle' },
  { band: 'hard', item: 'strawberry', prompt: 'WHAT IS THIS?', pose: 'walk' },
  { band: 'hard', item: 'pineapple', prompt: 'WHAT FRUIT IS IT?', pose: 'idle' },
  { band: 'impossible', item: 'sweden', prompt: 'WHICH FLAG?', pose: 'idle' },
];
const TAIL = 1.6, TITLE = 1.0, levels = ['easy', 'medium', 'hard', 'impossible'];
PLAN.forEach((p, i) => {
  if (i > 0 && p.band !== PLAN[i - 1].band) beat(TITLE, (L, d) => titleCard(L, d, { band: p.band, level: levels.indexOf(p.band) + 1, sub: '3 SECONDS EACH' }));
  beat(ROUND_LEN + (i === PLAN.length - 1 ? TAIL : 0), (L) => quizRound(L, { ...p, n: i + 1, score: i, total: PLAN.length }));
});
const DUR = Math.round(_t * 100) / 100;   // 36.8
endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model']);
mountFilm(DUR);
