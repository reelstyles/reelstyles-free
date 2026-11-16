// Look-layer template (copy as film.js): every shot is a recipe from sets/recipes.js, so frame 0 is already a full, lit set.
// One subject per shot (lit by the scene light, 30-55% of the frame height), one light, one air layer, a camera move, a grade turn.
const DUR = 9;   // = data-duration in index.html
gradeTrack([[0, 'cool', 0], [6, 'gold', 1.2]]);   // cold first, warm at the payoff
const tpPose = (o) => Object.assign({ view: 'q', outfit: OUTFITS.june, face: 'focus', blink: blinkAt(TT, [1.6, 4.4, 7.7]) }, o);
shot(0, 3, (g) => {
  const wave = Math.sin(twos(TT) * 5) * 0.25;
  setStreet(g, { mood: 'cool', light: { kind: 'sun', x: 1500, y: 220, s: 0.8 }, air: 'leaves', props: [['lamppost', 260, 1], ['mailbox', 1420, 1.1, 840], ['bench', 1660, 1.1, 840]],
    subject: (c, L) => lit(c, L, [900, 960, 540], (d) => drawPresenter(d, tpPose({ x: 900, y: 960, s: 0.95, armF: { a1: -0.9 + wave, a2: -1.4 }, handF: 'open' }))) });
  label(g, TT, 0.2, 2.9, 'Main Street', 1380, 140);
}, 'street', camMove('pan', 0, 3, { x: 960, y: 560, z: 1.05, amt: 0.5 }));
shot(3, 6, (g) => {
  setRoom(g, { mood: 'night', light: { kind: 'lamp', x: 1500, y: 420, s: 1 }, paper: 'atoms', wallProps: [['clock', 520, 330, 1], ['frame', 1000, 300, 1]], props: [['lamp', 1500, 1, 840], ['chair', 1250, 1.1, 840], ['shelf', 300, 1.1]],
    subject: (c, L) => lit(c, L, [860, 960, 540], (d) => drawPresenter(d, tpPose({ x: 860, y: 960, s: 0.95, dir: 1, prop: { kind: 'phone' }, armF: { a1: 0.6, a2: -1.3 }, handF: 'grip' }))) });
}, 'room', camMove('push', 3, 3, { x: 960, y: 580, z: 1.05 }));
shot(6, DUR, (g) => {
  setLand(g, { mood: 'gold', far: 'hills', light: { kind: 'sun', x: 1400, y: 420, s: 1.2 }, air: 'dust', props: [['tree', 300, 1.1], ['fence', 1400, 1, 830], ['house', 1700, 0.9, 790]],
    subject: (c, L) => lit(c, L, [880, 960, 540], (d) => drawPresenter(d, tpPose({ x: 880, y: 960, s: 0.95, face: 'happy', armF: { a1: -0.6, a2: -1.2 }, handF: 'open' }))) });
}, 'land', camMove('crane', 6, 3, { x: 960, y: 560, z: 1.05 }));
transition(3, 'iris', { at: [860, 640], label: 2, dur: 0.5 });
transition(6, 'iris', { at: [880, 640], label: 3, dur: 0.5 });
mountFilm(DUR);
