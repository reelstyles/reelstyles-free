// =====================================================================
//  templates/film.js: a 10 s sample, "brew day in 2 steps", in 16:9. Copy it next to index.html and replace the shots.
//  Pattern per shot: set (room + props) → product → presenter (held body, moving hands) → manual furniture (header, tag, callout).
//  The look: every fill is printed a few px off its ink line, poses change on twos, the camera and wipes run at full rate.
// =====================================================================
const DUR = 10.0;
const FY = 880;                                   // floor line shared by the kitchen shots
const POT = { x: 1330, y: FY - 60 };              // the percolator's foot position on the counter

// 1. POSTER (0 - 3.4 s): sunburst + script kicker + slab title, the product pops in, a slow push
shot(0, 3.4, (g) => {
  room(g, { wall: PAL.paper, floor: PAL.rose, fy: 940, ticks: true });
  curtainBurst(g, 1360, 640, 560, TT, PAL.mustard);
  rugBand(g, -400, 2400, 960, 140, PAL.rose, TT);
  const k = pop(TT, 0.5, 0.45, 1.6);
  g.save(); g.translate(1360, 860); g.scale(k * 1.55, k * 1.55); drawPercolator(g, 0, 0, 1, 0, { light: TT > 2.2 ? 1 : 0, lid: 0 }); g.restore();
  star(g, 1700, 330, 34, { n: 8, inner: 0.42, fill: PAL.coral, rot: TT * 0.5 }); sparkle(g, 1020, 420, 28, { fill: PAL.teal, rot: TT });
  title(g, TT, 0.3, 'Brew day.', 'Perfect Coffee', 'IN 2 EASY STEPS', 960, 220);
  const j = pop(TT, 0.9, 0.4);
  drawPresenter(g, { x: 330, y: 1010, s: 0.9 * j, dir: 1, view: 'q', face: 'happy', outfit: OUTFITS.june, handF: 'open', armF: { a1: -0.7 + Math.sin(twos(TT) * 5) * 0.12, a2: -1.2 }, blink: blinkAt(TT, [2.6]) });
}, 'poster', (t) => [960, 540, lerp(1.0, 1.05, ss(seg(t, 0, 3.4)))]);

// 2. STEP 1 (3.4 - 6.6 s): June points at the line while the call-out shows the water
shot(3.4, 6.6, (g) => {
  const u = TT - 3.4;
  room(g, { wall: '#CFE0E6', floor: PAL.paperDD, fy: FY, dots: '#FFFFFF' });
  windowPlane(g, 1380, 130, 340, 300, TT);
  atomicArt(g, 760, 300, 0.9, TT); wallClock(g, TT, 1700, 600, 56);
  counterTop(g, 960, FY - 120, 840, { col: PAL.kraft, colD: PAL.kraftD });
  drawPercolator(g, POT.x, POT.y - 4, 1.05, 0, { lid: seg(u, 0.5, 0.9) * (1 - seg(u, 1.9, 2.2)) });
  const pt = ss(seg(twos(u), 0.3, 0.8));
  drawPresenter(g, { x: 560, y: FY + 70, s: 1.05, dir: 1, view: 'q', face: u > 1.6 ? 'happy' : 'focus', outfit: OUTFITS.june,
    armF: { a1: lerp(1.3, -0.35, pt), a2: lerp(1.52, -0.2, pt) }, handF: pt > 0.5 ? 'point' : 'open', blink: blinkAt(TT, [5.6]), look: [pt * 3, 0] });
  const tg = tag(g, TT, 4.4, 'Fill to the line', 800, 640, { maxW: 420 });
  callout(g, TT, 4.0, 1130, 400, 120, (c) => icon(c, 'water', 0, 6, 190, { main: PAL.sky, dark: PAL.skyD }), PAL.paper, [POT.x - 10, POT.y - 150]);
  stepHeader(g, TT, 3.5, 1, 2, 'Add water');
}, 'step 1', (t) => [960, 540, lerp(1.0, 1.05, eio(seg(t, 3.4, 6.6)))]);

// 3. STEP 2 (6.6 - 8.6 s): Walt presses the power button, the lamp lights, steam rises
shot(6.6, 8.6, (g) => {
  const u = TT - 6.6;
  room(g, { wall: PAL.mustardL, floor: PAL.kraftL, fy: FY });
  lampStd(g, 300, FY + 20, 1.1); plant(g, 1840, FY + 20, 1.1, TT);
  counterTop(g, 880, FY - 120, 900, { col: PAL.rose, colD: PAL.pinkD });
  const on = u > 0.9 ? 1 : 0;
  drawPercolator(g, POT.x - 40, POT.y - 4, 1.05, 0, { light: on, dial: on ? 0.4 : -0.8 });
  drawMug(g, 1620, FY - 118, 0.62, on ? seg(u, 1.0, 1.5) : 0);
  const pr = ss(seg(twos(u), 0.2, 0.7)), rel = ss(seg(twos(u), 1.3, 1.6));
  drawPresenter(g, { x: 520, y: FY + 70, s: 1.05, dir: 1, view: 'q', face: on ? 'wow' : 'focus', outfit: OUTFITS.walt,
    armF: { a1: lerp(1.3, 0.15, pr * (1 - rel)), a2: lerp(1.52, 0.1, pr * (1 - rel)) }, handF: pr > 0.5 ? 'point' : 'open', blink: blinkAt(TT, [7.9]), look: [pr * 3, 1] });
  tag(g, TT, 7.5, 'Press power once', 700, 270, { maxW: 560 });
  callout(g, TT, 7.2, 1500, 340, 124, (c) => icon(c, 'power', 0, 2, 180, { main: PAL.coral }), PAL.paper, [POT.x - 40, POT.y - 90]);
  stepHeader(g, TT, 6.95, 2, 2, 'Press start');   // header starts after the transition has finished (tc + 0.36 + 0.15)
}, 'step 2', (t) => [960, 540, lerp(1.04, 1.0, eio(seg(t, 6.6, 8.6)))]);

// 4. END CARD (8.6 - 10 s): both presenters, a tip banner, held still for the screenshot
shot(8.6, DUR, (g) => {
  room(g, { wall: PAL.paper, floor: PAL.pink, fy: 930, dots: PAL.paperD });
  curtainBurst(g, 960, 470, 520, TT, PAL.mustard);
  medallion(g, TT, 8.8, 700, 400, 0, 120, 'water'); medallion(g, TT, 9.0, 1220, 400, 1, 120, 'power');
  arrow(g, [830, 330], [1090, 330], { u: eo(seg(TT, 9.1, 9.5)), bend: -0.35, fill: PAL.coral, dashedShaft: true });
  drawMug(g, 960, 640, 0.9, 1);
  drawPresenter(g, { x: 250, y: 1010, s: 0.95, dir: 1, view: 'front', face: 'happy', outfit: OUTFITS.june, handF: 'open', armF: { a1: 0.5 + Math.sin(twos(TT) * 6) * 0.1, a2: -0.6 } });
  drawPresenter(g, { x: 1670, y: 1010, s: 0.95, dir: -1, view: 'front', face: 'wink', outfit: OUTFITS.walt });
  title(g, TT, 8.7, 'All done', null, null, 960, 150);   // end card: script kicker + product + one tip line, held still
  banner(g, TT, 9.2, 560, 760, 800, 'TIP', 'Rinse the pot between brews.');
}, 'end', (t) => [960, 540, 1]);

transition(3.4, 'iris', { at: [POT.x - 20, POT.y - 120], label: 1, dur: 0.6 });
transition(6.6, 'iris', { at: [POT.x - 40, POT.y - 120], label: 2, dur: 0.6 });   // every step change is an iris through its numbered medallion
transition(8.6, 'wipe', { dir: 'up', dur: 0.4 });

overlay((g, t) => {
  caption(g, t, 0.8, 3.2, 'Meet your new percolator.');
  caption(g, t, 4.4, 6.4, 'Fill it to the line.');
  caption(g, t, 7.2, 8.4, 'Press power. Done.');
});

mountFilm(DUR);
