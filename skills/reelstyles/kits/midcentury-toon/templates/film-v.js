// =====================================================================
//  templates/film-v.js: a 34 s vertical Short, "Perfect coffee in 4 steps", composed for 1080 x 1920 (Shorts / Reels / TikTok).
//  Copy it to film.js next to vertical.html (as index.html). World = the 1080 x 1920 frame, camera ~ [540, 960, 1.0-1.05].
//  Layout guard (engine/safe.js): the presenter tracks hero + face (characters/presenter.js), the close-up prop is the key object
//  (icon(..., { key: true }), drawPercolator(..., { key: true })); vSay() labels land above the head by themselves (labelY);
//  every beat is keys(t0, 2.0, [...]) so a new picture appears every 2 s; endCard() over the running payoff shot.
//  Framing (owner 11-02: wide, not a crop): MED s 1.55, feet y 1700 (whole hero on the floor, ~46%: the room reads) · CLOSE s 2.5, feet y 1990 (a short beat).
//  Sets: POSTER (paper + mustard rays) · KITCHEN (blue wall, window, counter) · DEN (rose wall, atomic art, lamp)
//        CLOCK WALL (avocado, sunburst clock, plant) · DO/DON'T (planeSplit) · close-up grounds (sky, mustard, coral, teal, pink)
//  Run tools/vcheck.sh out.mp4 after the render; fix every line it prints.
// =====================================================================
const DUR = 34.0;
const CX = 540, CY = 960;

// ---- vertical furniture
// vSay: the one label of a shot. Lands above the tracked hero's head (labelY) inside x 108-918, >= 60 px (84 wanted), complete from its first frame.
function vSay(g, t, t0, t1, str) {
  if (t < t0 || t >= t1) return;
  const f = fit(g, str, `600 {px}px ${FAMS.sans}`, 84, 600, 1, 60);
  const w = Math.min(VSAFE.lx1 - VSAFE.lx0, measure(g, f.lines[0], f.font) + 150), h = 130, cx = (VSAFE.lx0 + VSAFE.lx1) / 2, cy = labelY(h), x = cx - w / 2, y = cy - h / 2;
  const k = 1 + 0.05 * Math.max(0, 1 - (t - t0) / 0.2) * Math.sin((t - t0) * 40);   // a tiny pop, no fade or typing in
  g.save(); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy);
  shape(g, rrect(x, y, w, h, 14), { fill: PAL.paper, line: 3.6, seed: 901, grain: 0.15, breaks: 0.08, off: [6, 6] });
  star(g, x + 40, cy, 16, { n: 8, inner: 0.4, fill: LOOK.accent, off: [0, 0], rot: t * 0.8 });
  star(g, x + w - 40, cy, 16, { n: 8, inner: 0.4, fill: LOOK.accent, off: [0, 0], rot: -t * 0.8 });
  text(g, f.lines[0], cx, cy + f.px * 0.34, { font: f.font, fill: PAL.ink, align: 'center' });
  g.restore();
  LAYOUT.push({ kind: 'label', name: str, x0: x, y0: y, x1: x + w, y1: y + h });
}
function steam(g, x, y, h, t, a = 1) {                       // tall rising steam
  for (let i = 0; i < 4; i++) {
    const u = (twos(t * 0.7) + i / 4) % 1, yy = y - u * h;
    ink(g, spline([[x - 30 + i * 22, yy], [x - 62 + i * 22, yy - 70], [x - 22 + i * 22, yy - 140], [x - 54 + i * 22, yy - 210]], false, 6), 9, { seed: 960 + i, color: PAL.inkSoft, alpha: a * Math.sin(Math.PI * u) });
  }
}
const cam = (t0, z0 = 1.0, z1 = 1.05, y0 = 970, y1 = 950) => (t) => { const k = eio(seg(t, t0, t0 + 2)); return [CX, lerp(y0, y1, k), lerp(z0, z1, k)]; };
// arms on twos: rest → anticipation → point / hold, so the pose changes inside every 2 s picture
const pointUp = (u) => { const p = ss(seg(twos(u), 0.1, 0.6)); return { armF: { a1: lerp(1.3, -0.6, p), a2: lerp(1.52, -0.4, p) }, handF: p > 0.5 ? 'point' : 'open' }; };
const wave = (u) => ({ armF: { a1: -0.9 + Math.sin(twos(u) * 7) * 0.25, a2: -1.4 + Math.sin(twos(u) * 7 + 1) * 0.3 }, handF: 'open' });
function MED(o, u) { drawPresenter(G, { x: 400, y: 1700 + idle(TT, 2), s: 1.55, dir: 1, view: 'q', blink: blinkAt(TT, [TT0(u) + 1.3]), look: [3, -1], ...o }); }
function CLOSE(o, u) { drawPresenter(G, { x: 540, y: 1990 + idle(TT, 2), s: 2.5, dir: -1, view: 'q', blink: blinkAt(TT, [TT0(u) + 1.1]), look: [3, -1], ...o }); }
const TT0 = (u) => TT - u;

// ---- sets
const KITCHEN = (g) => { room(g, { wall: '#CFE0E6', floor: PAL.paperDD, fy: 1640, dots: '#FFFFFF' }); windowPlane(g, 620, 470, 360, 420, TT); counterTop(g, -100, 1380, 1300, { col: PAL.kraft, colD: PAL.kraftD }); drawPercolator(g, 860, 1376, 0.9, 0, { lid: 0 }); };
const DEN = (g) => { room(g, { wall: PAL.rose, floor: PAL.kraftL, fy: 1640, dots: PAL.pink }); atomicArt(g, 820, 640, 1.0, TT); lampStd(g, 960, 1660, 1.7); rugBand(g, -400, 1500, 1640, 160, PAL.mustard, TT); };
const CLOCKWALL = (g) => { room(g, { wall: PAL.avocadoL, floor: PAL.olive, fy: 1660, ticks: true }); wallClock(g, TT * 8, 820, 620, 110); plant(g, 960, 1680, 1.8, TT); };
const DODONT = (g) => { planeSplit(g, { split: 0.62, left: PAL.blueL, right: PAL.mustardL }); star(g, 880, 560, 70, { n: 8, inner: 0.42, fill: PAL.coral, rot: TT * 0.6 }); shape(g, rect(-200, 1660, 1500, 400), { fill: PAL.paperDD, line: 0, off: [0, 0], grain: 0.3 }); };
function ground(g, wall, ray) { room(g, { wall, floor: wall, fy: 2400, dots: PAL.white }); curtainBurst(g, CX, 1050, 1500, TT, ray, 28); }
// a close-up: one huge prop (the key object) that keeps moving; sparkles drift around it
function prop(g, u, wall, ray, draw) {
  ground(g, wall, ray);
  const b = Math.sin(twos(u) * 3) * 14;
  draw(b);
  sparkle(g, 170, 760 + b, 34, { fill: PAL.white, rot: TT * 2 }); sparkle(g, 900, 1500 - b, 40, { fill: PAL.white, rot: -TT * 2 });
  star(g, 190, 1450, 30, { n: 8, inner: 0.42, fill: PAL.coral, rot: TT });
}

// ---- 0-2 POSTER: rays, the percolator pops up mid-bounce (frame 0 already moving), the title stacks on top
shot(0, 2, (g) => {
  room(g, { wall: PAL.paper, floor: PAL.rose, fy: 1640, ticks: true, dots: PAL.paperD });
  curtainBurst(g, CX, 1100, 1500, TT * 3, PAL.mustard, 28);
  rugBand(g, -400, 1500, 1640, 200, PAL.rose, TT);
  const k = 0.6 + 0.4 * back(seg(TT, 0, 0.5), 1.8);
  drawPercolator(g, CX - 20, 1640, 2.2 * k, Math.sin(TT * 6) * 0.04, { light: TT > 1.0 ? 1 : 0, lid: 0.5 + 0.5 * Math.sin(TT * 8), key: true });
  steam(g, CX - 10, 900, 260, TT, seg(TT, 0.6, 1.0));
  star(g, 900, 860, 54, { n: 8, inner: 0.42, fill: PAL.coral, rot: TT * 1.5 }); sparkle(g, 170, 900, 40, { fill: PAL.teal, rot: TT * 2 });
  title(g, TT, -0.3, 'Perfect', 'Coffee', 'IN 4 EASY STEPS', 520, 440);
}, 'poster', cam(0, 1.0, 1.05, 990, 950));

// ---- STEP 1 (2-8): June points up in the kitchen · the water close-up · June close
shot(2, 8, (g) => keys(2, 2.0, [
  () => { KITCHEN(g); MED({ outfit: OUTFITS.june, face: 'focus', ...pointUp(TT - 2) }, TT - 2); },
  () => prop(g, TT - 4, PAL.sky, PAL.blueL, (b) => { icon(g, 'water', CX, 1040 + b, 660, { main: PAL.blue, dark: PAL.blueD, key: true });
    for (let i = 0; i < 5; i++) { const v = (twos(TT * 0.9) + i / 5) % 1; shape(g, ellipse(260 + i * 140, 500 + v * 1100, 16, 24, 14), { fill: PAL.blueD, line: 3, seed: 600 + i, grain: 0 }); } }),
  () => { KITCHEN(g); CLOSE({ outfit: OUTFITS.june, face: 'happy', ...wave(TT - 6) }, TT - 6); },
])(), 'step 1', (t) => keys(2, 2.0, [cam(2), cam(4, 1.0, 1.06, 960, 960), cam(6, 1.0, 1.04, 960, 945)])(t));

// ---- STEP 2 (8-14): Walt in the den · the beans close-up · Walt close
shot(8, 14, (g) => keys(8, 2.0, [
  () => { DEN(g); MED({ outfit: OUTFITS.walt, view: 'front', face: 'neutral', ...pointUp(TT - 8) }, TT - 8); },
  () => prop(g, TT - 10, PAL.mustard, PAL.mustardL, (b) => { icon(g, 'beans', CX, 1040 + b, 660, { main: PAL.brown, light: PAL.brownL, dark: PAL.ink, key: true });
    for (let i = 0; i < 6; i++) { const v = (twos(TT * 0.7) + i / 6) % 1; shape(g, ellipse(200 + i * 130, 480 + v * 1150, 22, 15, 14, 0, TAU, 0.6), { fill: PAL.brown, line: 3, seed: 620 + i, grain: 0.2 }); } }),
  () => { DEN(g); CLOSE({ outfit: OUTFITS.walt, face: 'wow', dir: 1, x: 520, ...pointUp(TT - 12) }, TT - 12); },
])(), 'step 2', (t) => keys(8, 2.0, [cam(8, 1.0, 1.05, 950, 970), cam(10, 1.0, 1.06, 960, 960), cam(12, 1.0, 1.04, 960, 945)])(t));

// ---- STEP 3 (14-22): June at the clock wall · power on, steam climbs · June close · the clock close-up
shot(14, 22, (g) => keys(14, 2.0, [
  () => { CLOCKWALL(g); MED({ outfit: OUTFITS.june, face: 'neutral', x: 380, ...pointUp(TT - 14) }, TT - 14); },
  () => prop(g, TT - 16, PAL.coral, PAL.coralL, (b) => { const on = TT > 16.6; drawPercolator(g, CX - 20, 1560 + b, 2.1, 0, { light: on ? 1 : 0, dial: on ? 0.4 : -0.8, key: true });
    if (on) steam(g, CX, 860, 300, TT, seg(TT, 16.6, 17.0)); }),
  () => { CLOCKWALL(g); CLOSE({ outfit: OUTFITS.june, face: 'focus', ...pointUp(TT - 18) }, TT - 18); },
  () => prop(g, TT - 20, PAL.teal, PAL.tealL, (b) => icon(g, 'clock', CX, 1040 + b, 660, { main: PAL.mustard, light: PAL.white, dark: PAL.ink, key: true })),
])(), 'step 3', (t) => keys(14, 2.0, [cam(14), cam(16, 1.0, 1.05, 960, 960), cam(18, 1.0, 1.04, 960, 945), cam(20, 1.0, 1.06, 960, 950)])(t));

// ---- STEP 4 (22-30): Walt on the do / don't split · the cup close-up · Walt close · the check medal
shot(22, 30, (g) => keys(22, 2.0, [
  () => { DODONT(g); MED({ outfit: OUTFITS.walt, face: 'happy', x: 380, prop: { kind: 'pot', hand: 'F', s: 0.55, rot: lerp(0, 0.5, ss(seg(TT, 22.4, 23.2))) }, armF: { a1: 0.4, a2: -0.2 }, handF: 'grip' }, TT - 22); },
  () => prop(g, TT - 24, PAL.pink, PAL.rose, (b) => { drawMug(g, CX - 30, 1450 + b, 3.0, 1); if (typeof track === 'function') track('key', CX - 240, 1450 + b - 410, CX + 315, 1450 + b, 'mug'); }),
  () => { DODONT(g); CLOSE({ outfit: OUTFITS.walt, face: 'wink', dir: 1, x: 520, ...wave(TT - 26) }, TT - 26); },
  () => prop(g, TT - 28, PAL.mustardL, PAL.mustard, (b) => icon(g, 'check', CX, 1040 + b, 680, { main: PAL.teal, dark: PAL.tealD, key: true })),
])(), 'step 4', (t) => keys(22, 2.0, [cam(22, 1.0, 1.05, 950, 970), cam(24, 1.0, 1.05, 960, 960), cam(26, 1.0, 1.04, 960, 945), cam(28, 1.0, 1.06, 960, 950)])(t));

// ---- 30-34 PAYOFF: June with her mug on the rays; the end card dims it from 32 s, the shot keeps running under it
shot(30, DUR, (g) => {
  room(g, { wall: PAL.paper, floor: PAL.pink, fy: 1700, dots: PAL.paperD });
  curtainBurst(g, CX, 1000, 1500, TT * 2, PAL.mustard, 28);
  sparkle(g, 170, 1000, 34, { fill: PAL.coral, rot: TT * 2 }); star(g, 920, 1100, 40, { n: 8, inner: 0.42, fill: PAL.teal, rot: -TT });
  MED({ outfit: OUTFITS.june, view: 'front', face: 'happy', x: 540, y: 1840, prop: { kind: 'mug', hand: 'F', s: 0.55, steam: 1 }, armF: { a1: 1.0 + Math.sin(twos(TT) * 3) * 0.1, a2: -0.9 }, handF: 'grip' }, TT - 30);
}, 'end', cam(30, 1.0, 1.05, 960, 950));

// iris through the step medallion at each step (0.3 s, the whole-second frame shows both shots, never an empty one)
transition(2, 'iris', { at: [CX - 20, 1200], label: 1, dur: 0.3 });
transition(8, 'iris', { at: [CX, 1000], label: 2, dur: 0.3 });
transition(14, 'iris', { at: [CX, 1000], label: 3, dur: 0.3 });
transition(22, 'iris', { at: [CX, 1000], label: 4, dur: 0.3 });

overlay((g, t) => {
  vSay(g, t, 2.15, 3.95, '1 · Add water');
  vSay(g, t, 4.0, 5.95, 'Fill to the line');
  vSay(g, t, 6.0, 7.95, 'Cold water only');
  vSay(g, t, 8.15, 9.95, '2 · Add beans');
  vSay(g, t, 10.0, 11.95, '2 spoons a cup');
  vSay(g, t, 14.15, 15.95, '3 · Heat it');
  vSay(g, t, 16.0, 17.95, 'Low and slow');
  vSay(g, t, 20.0, 21.95, 'Wait 5 minutes');
  vSay(g, t, 22.15, 23.95, '4 · Pour');
  vSay(g, t, 24.0, 25.95, 'Pour it slow');
  vSay(g, t, 28.0, 29.95, 'Done!');
  vSay(g, t, 30.1, 31.95, 'Enjoy.');
});
endCard(DUR - 2, DUR);

mountFilm(DUR);
