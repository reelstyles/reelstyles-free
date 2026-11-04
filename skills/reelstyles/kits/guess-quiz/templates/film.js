// templates/film.js: the sample film (about 25 s): four difficulty bands, one round each.
// Edit: band order, items, prompts. Total = sum of beat lengths = data-duration in the html.
const TOTAL = 4;
const PLAN = [
  { band: 'easy', item: 'apple', prompt: 'WHAT FRUIT IS IT?' },
  { band: 'medium', item: 'elephant', prompt: 'WHICH ANIMAL?' },
  { band: 'hard', item: 'pineapple', prompt: 'NAME THE SHADOW!' },
  { band: 'impossible', item: 'sweden', prompt: 'WHICH FLAG?' },
];
PLAN.forEach((p, i) => {
  beat(1.3, (L, d) => titleCard(L, d, { band: p.band, level: i + 1, sub: '3 SECONDS PER ROUND' }));
  beat(ROUND_LEN, (L) => quizRound(L, { ...p, n: i + 1, score: i, total: TOTAL }));
});
mountFilm(PLAN.length * (1.3 + ROUND_LEN));
