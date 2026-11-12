// templates/film.js: the sample Short (each beat on the default lit stage, engine/look.js: a grade per beat, a camera move) (28 s, seven beats of 4 s). Shared by index.html (16:9) and vertical.html (9:16).
// Edit the words in A / the opts below, reorder or swap beats, keep: total = sum of beat lengths = data-duration in the html.
const A = { left: 'HARD WAY', right: 'SMART WAY' };
const Q = ['IS THE SMART WAY', 'JUST THE EASY ONE', '?'];
const still = (o) => (L, d) => M.split(L - d, d, o);       // end beat = beat one's scene, played on, so t = end loops into t = 0

// 1 hard vs smart: cold open, labels already up, no pop, wheels are the only yellow
beat(4, (L, d) => M.split(L, d, A), { pop: false, grade: 'night' });
// 2 growth row
beat(4, (L, d) => M.grow(L, d, { labels: ['TODAY', '1 MONTH', '1 YEAR'] }), { grade: 'cold', cam: CAMS.crane(520, 480, 1.02) });
// 3 stairs vs slope
beat(4, (L, d) => M.stairs(L, d, { a: 'STAIRS', b: 'SLOPE' }), { grade: 'night', cam: CAMS.pan(470, 530, 1.02, 500) });
// 4 drop what weighs
beat(4, (L, d) => M.drop(L, d, { words: ['PAST', 'DOUBT', 'NOISE'], goal: 'GOAL' }), { grade: 'dusk', cam: CAMS.push(1.0, 1.06, 500, 510) });
// 5 force vs door
beat(4, (L, d) => M.door(L, d, { force: 'FORCE IT', find: 'FIND THE DOOR' }), { grade: 'dawn', cam: CAMS.drift(1.03) });
// 6 domino
beat(4, (L, d) => M.domino(L, d, { tip: 'START SMALL' }), { grade: 'gold', cam: (L, d) => ({ z: 1 + 0.05 * EZ.io(L / d), x: 500 + 70 * EZ.io(L / d) }) });
// 7 reversal question over the looping scene; the push pulls back to 1.0 so the last frame equals frame one
beat(4, still({ ...A, question: Q }), { pop: false, grade: 'night', cam: (L, d) => ({ z: 1 + 0.045 * (1 - EZ.io(L / d)), x: 490 + 20 * (1 - EZ.io(L / d)) }) });

mountFilm(28);
