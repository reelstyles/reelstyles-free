// =====================================================================
//  templates/film.js: a 10 s scored mini story, "Pip and the small spark", in 16:9. Copy it next to index.html and swap the shots.
//  Pattern per shot: a scene recipe (lit set, grade, depth, air) → halo → cast → say() text. say() is drawn in screen space after the shot.
//  Beats of the score (audio/score.wav, see tools/score.sh): whoosh 2.9 · landing pop 3.9 · pick-up chime 4.9 · swell 5.6 · footsteps 8.0+
// =====================================================================
const DUR = 10.0;
const gy = groundY;

const HS = 1.3;   // hero scale: Pip about 440 px, 40-55% of the frame at zoom 1.0-1.2
// every shot starts from a scene recipe (sets/scenes.js): full lit set, 3 depth layers, one light, air. Swap grade/props per story.
const meadow = (grade, hero, o = {}) => setOutdoor({ x0: 0, x1: 3400, grade, hero, props: [['tree', 380], ['fence', 760], ['rock', 1900], ['tree', 2500], ['bush', 2950]], ...o });

// 1. WIDE (0 - 2.8 s): Pip and Dot walk across the meadow, camera trucks with them and eases in
shot(0, 2.8, () => {
  const px = lerp(900, 1500, TT / 2.8);
  meadow('day', px, { light: [2000, 250] });
  dot({ x: px - 270, s: 1.0, face: 1, ph: TT * 11 });
  pip({ x: px, s: HS, face: 1, ph: TT * 9, armL: Math.sin(TT * 9) * 0.5, armR: -Math.sin(TT * 9) * 0.5, look: [0.5, -0.2] });
  say('Pip & the small spark', { x: 960, y: 100, size: 84, rot: -0.02, maxW: 1200 });
}, 'meadow walk', camPan(1050, 1450, 560, 1.0, 0, 2.8));

// 2. MEDIUM (2.8 - 5.4 s): a spark falls, Pip startles, crouches, picks it up
const P2 = { x: 1300 };
shot(2.8, 5.4, () => {
  meadow('dusk', P2.x, { light: [1700, 260] });
  const g = gy(P2.x), tt = TT - 2.8;
  const fall = seg(tt, 0.1, 1.05), land = spring(tt - 1.05, 8, 0.4), landed = tt > 1.05;
  const pick = EZ.io(seg(tt, 1.7, 2.3)), picked = tt > 2.3;
  const sx = lerp(1480, 1560, EZ.i2(fall)), sy = lerp(-60, g - 40, EZ.i2(fall));
  const hand = [P2.x + 87 * HS, g - 237 * HS];                              // where the raised right hand is
  const startle = spring(tt - 1.0, 9, 0.35), crouch = Math.sin(clamp(seg(tt, 1.5, 2.0)) * Math.PI) * 0.12;
  dot({ x: P2.x - 300, s: 1.0, face: 1, sit: true, look: [0.7, tt > 0.2 ? -0.5 : 0] });
  pip({ x: P2.x, s: HS, face: 1, hop: tt > 1.0 && tt < 1.5 ? startle * 0.25 : 0, lean: crouch, armL: lerp(0.25, 1.1, startle), armR: lerp(-0.25, 2.4, pick), look: tt < 1.0 ? [0.6, -0.8] : [lerp(0.7, 0.6, pick), 0.3],
    mouth: tt < 1.0 ? 'flat' : picked ? 'smile' : 'o', brow: tt > 1.0 && !picked ? 1 : 0, hold: picked ? (hx, hy) => spark(hx + 0, hy - 30, 34, TT * 0.8, { glowA: 0.55 }) : null });
  if (!picked) {
    const x = lerp(sx, hand[0], pick), y = lerp(landed ? g - 40 + land * 0 : sy, hand[1], pick);
    const dropSpark = () => spark(x, landed ? lerp(g - 40, hand[1], pick) : y, 30 + (landed ? Math.sin(tt * 14) * 2 : 0), TT * 1.6, { glowA: 0.5, tail: landed ? 0 : 150 });
    landed ? dropSpark() : unmeasured(dropSpark);   // while it falls it enters through the top edge on purpose
  }
  if (tt > 1.0 && tt < 2.0) say('whoa!', { x: 960, y: 100, size: 90, pop: EZ.back(seg(tt, 1.0, 1.25)), rot: 0.05, maxW: 400 });
}, 'the spark lands', camPush(1400, 600, 1.12, 1.2, 2.8, 5.4, 60, 0));

// 3. CLOSE (5.4 - 7.9 s): the spark hums, doodles pop out of it one after another
const P3 = { x: 1300 };
shot(5.4, 7.9, () => {
  meadow('dusk', P3.x, { light: [1560, 300] }); const g = gy(P3.x), tt = TT - 5.4, rise = EZ.o3(seg(tt, 0, 0.5));
  const sp = [P3.x + 87 * HS, g - 267 * HS];
  pip({ x: P3.x, s: HS, face: 1, armL: 0.5 + Math.sin(TT * 3) * 0.08, armR: 2.4, look: [0.7, 0.1], mouth: tt > 0.3 ? 'grin' : 'smile', brow: 0.3 * (1 - rise),
    hold: (hx, hy) => { unmeasured(() => rays(hx, hy - 30, 54, 120, 12, seg(tt, 0.2, 0.9), TT * 0.6)); spark(hx, hy - 30, 34 + Math.sin(TT * 9) * 3, TT * 0.8, { glowA: 0.4 + 0.2 * Math.sin(TT * 6) }); } });
  const orb = (k, t0, f) => { const a = TT * 1.5 + k * 2.1, r = 150 + Math.sin(TT * 3 + k) * 14, q = EZ.back(seg(tt, t0, t0 + 0.4)); return [sp[0] + Math.cos(a) * r * 1.2, sp[1] - 30 + Math.sin(a) * r * 0.7, q]; };
  let [x, y, q] = orb(0, 0.7); if (q > 0) heart(x, y, q * 1.1, PAL.coral, 1);
  [x, y, q] = orb(1, 1.0); if (q > 0) note(x, y, q * 1.2, 2);
  [x, y, q] = orb(2, 1.3); if (q > 0) swirl(x, y, 36 * q, TT, 1);
  if (tt > 0.9) say('a small idea hums', { x: 960, y: 100, size: 84, maxW: 1300 });
}, 'it hums', camPush(1420, 560, 1.25, 1.4, 5.4, 7.9, 0, -20));

// 4. WIDE (7.9 - 10 s): dusk; Pip carries the spark on, lighting the path; the closing line lands
shot(7.9, DUR, () => {
  const tt = TT - 7.9, px = lerp(1700, 2160, EZ.io(tt / 2.1) * 0.6 + tt / 2.1 * 0.4);
  meadow('night', px, { light: [2700, 260], air: 'fireflies' });   // night: the spark is the warm light on the path, the moon the source
  halo(px + 100 * HS, gy(px) - 330, 300, 0.6);
  dot({ x: px - 280, s: 1.0, face: 1, ph: TT * 11 });
  pip({ x: px, s: HS, face: 1, ph: TT * 9, armL: Math.sin(TT * 9) * 0.5, armR: 1.2, look: [0.6, 0.0], mouth: 'smile', hold: (hx, hy) => spark(hx + 4, hy - 30, 34, TT * 0.8, { glowA: 0.7 }) });
  say('keep it.', { x: 960, y: 110, size: 110, color: PAL.glow, plate: PAL.night, pop: EZ.back(seg(tt, 0.7, 1.2)), rot: 0.02, maxW: 800 });
}, 'on we go', camPan(1900, 2250, 560, 1.02, 7.9, DUR));

// a scribble wipe over each cut (screen space, drawn over both shots): a fat marker zig-zag sweeps across and off again
function wipe(tc, d, c) {
  const a = seg(TT, tc - d, tc), b = seg(TT, tc, tc + d); if (a <= 0 || b >= 1) return;
  const pts = []; for (let i = 0; i <= 14; i++) pts.push([(i / 14) * (W + 300) - 150, 80 + (i % 2) * (H - 160)]);
  ctx.save(); ctx.beginPath(); ctx.rect(b * (W + 200) - 100, 0, W + 400, H); ctx.clip();
  unmeasured(() => ink(cut(pts, a), { c, w: 260, seed: 3, amp: 6, dbl: false, a: 0.96 })); ctx.restore();   // a wipe crosses every edge
}
// hard cuts between shots (11-14): the wipe stays for a chapter change only, e.g. trans(() => wipe(5.4, 0.22, PAL.coral));

mountFilm(DUR);
