// templates/film.js: the sample Short (28 s, seven beats of 4 s). Shared by index.html (16:9) and vertical.html (9:16).
// Edit the words in A / the opts below, reorder or swap beats, keep: total = sum of beat lengths = data-duration in the html.
const A = { left: 'HARD WAY', right: 'SMART WAY' };
const Q = ['IS THE SMART WAY', 'JUST THE EASY ONE', '?'];
const still = (o) => (L, d) => M.split(L - d, d, o);       // end beat = beat one's scene, played on, so t = end loops into t = 0

// 1 hard vs smart: cold open, labels already up, no pop, wheels are the only yellow
beat(4, (L, d) => M.split(L, d, A), { pop: false });
// 2 growth row
beat(4, (L, d) => M.grow(L, d, { labels: ['TODAY', '1 MONTH', '1 YEAR'] }), { cam: (L, d) => ({ z: 1 + 0.05 * EZ.io(L / d), y: 500 - 40 * EZ.io(L / d) }) });
// 3 stairs vs slope
beat(4, (L, d) => M.stairs(L, d, { a: 'STAIRS', b: 'SLOPE' }));
// 4 drop what weighs
beat(4, (L, d) => M.drop(L, d, { words: ['PAST', 'DOUBT', 'NOISE'], goal: 'GOAL' }), { cam: (L, d) => ({ z: 1 + 0.045 * EZ.io(L / d), y: 500 + 20 * EZ.io(L / d) }) });
// 5 force vs door
beat(4, (L, d) => M.door(L, d, { force: 'FORCE IT', find: 'FIND THE DOOR' }));
// 6 domino
beat(4, (L, d) => M.domino(L, d, { tip: 'START SMALL' }), { cam: (L, d) => ({ z: 1 + 0.05 * EZ.io(L / d), x: 500 + 70 * EZ.io(L / d) }) });
// 7 reversal question over the looping scene; the push pulls back to 1.0 so the last frame equals frame one
beat(4, still({ ...A, question: Q }), { pop: false, cam: (L, d) => ({ z: 1 + 0.045 * (1 - EZ.io(L / d)) }) });

mountFilm(28);
