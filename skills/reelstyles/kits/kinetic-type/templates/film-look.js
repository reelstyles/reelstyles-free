// Look-layer template (copy as film.js, 16:9): every shot is a recipe from sets/recipes.js, so frame 0 is already a full, lit set.
// One acting word block per shot standing on the floor (30-55% of the frame height), one light, 3+ props, one air layer, a camera move.
const DUR = 8;   // = data-duration in index.html
gradeTrack([[0, 'night', 0], [5, 'gold', 0.6]]);   // cold first, warm at the payoff

setStreet(0, 2.6, { mood: 'night', light: { kind: 'moon', x: 1500, y: 190 }, far: ['CITY', 'NIGHT', 'HOME'], air: 'rain', near: 'GO',
  props: [['board', 360, 0.25, '23:58'], ['lamp', 1350, 0.3], ['sign', 1640, 0.5, 'EXIT']],
  cam: camMove('push', { t0: 0, d: 2.6 }),
  subject: (t, S) => {
    litWord('WAIT', 900, S.FY, 300, t, { anim: 'drop', t0: -0.35, col: PAL.cream, cond: 0.86 });
    litWord('STILL', 880, S.FY - 236, 220, t, { anim: 'drop', t0: -0.2, col: PAL.amber, cond: 0.86, cast: 0 });
  } });
setRoom(2.6, 5, { mood: 'cold', light: { kind: 'screen', x: 1560, y: 170 }, far: ['NEWS'], air: 'dust',
  props: [['board', 330, 0.3, 'LIVE'], ['plinth', 1560, 0.55, 'DESK 2', PAL.mint], ['lamp', 1780, 0.15]],
  cam: camMove('truck', { t0: 2.6, d: 2.4 }),
  subject: (t, S) => litWord('NOW', 900, S.FY, 440, t, { anim: 'slam', t0: 2.45, dur: 0.25, col: PAL.mint, pose: 'reach' }) });
setStage(5, 8, { mood: 'gold', light: { kind: 'lamp', x: 960, y: -40 }, air: 'confetti',
  props: [['block', 250, 0.3, '1', PAL.violet], ['sign', 1650, 0.15, 'ENCORE', PAL.amber], ['lamp', 1820, 0.3]],
  cam: camMove('pull', { t0: 5, d: 3 }),
  subject: (t, S) => litWord('YES', 960, S.FY, 460, t, { anim: 'drop', t0: 4.85, col: PAL.cream, pose: 'cheer' }) });

mountFilm(DUR);
