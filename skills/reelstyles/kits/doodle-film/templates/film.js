// =====================================================================
//  templates/film.js: a 10 s scored mini story, "Pip and the small spark", in 16:9. Copy it next to index.html and swap the shots.
//  Pattern per shot: wash (sky) → ground/scenery back to front → cast → say() text. say() is drawn in screen space after the shot.
//  Beats of the score (audio/score.wav, see tools/score.sh): whoosh 2.9 · landing pop 3.9 · pick-up chime 4.9 · swell 5.6 · footsteps 8.0+
// =====================================================================
const DUR = 10.0;
const gy = groundY;

function scenery(dusk, p = 1) {
  const night = dusk === PAL.night;
  wash(-300, -300, 3800, 1300, dusk, 3, night ? 0.96 : 0.5, !night);
  [[300, 250, 1.0], [800, 200, 0.8], [1250, 300, 0.7], [1900, 230, 0.9], [2100, 380, 0.6], [2900, 220, 0.9]].forEach(([x, y, s], i) => cloud(x, y, s, { c: night ? PAL.lilac : PAL.sky }));
  motes(0, 3400, 60, 780, 70, night ? PAL.glow : PAL.pencil);
  ground(-300, 3400, { c: night ? '#3F7F86' : PAL.mint, p });
  tree(260, gy(260) + 4, 0.9, { c: night ? '#3F7F86' : PAL.mint }); tree(2350, gy(2350) + 4, 1.0); tree(1750, gy(1750) + 2, 0.7, { c: PAL.teal });
  for (let x = 120; x < 3300; x += 95) tuft(x + (hash(x) * 40), gy(x) + 20 + hash(x * 2) * 50, 0.8 + hash(x * 3) * 0.5);
  [[420, 0], [900, 1], [1380, 2], [1960, 3], [2650, 0]].forEach(([x, k]) => flower(x, gy(x) + 40, 1, [PAL.coral, PAL.lilac, PAL.mustard, PAL.coral][k % 4]));
}

// 1. WIDE (0 - 2.8 s): Pip and Dot walk across the meadow, camera trucks with them and eases in
shot(0, 2.8, () => {
  scenery(PAL.sky);
  sun(1760, 360, 64, seg(TT, 0.0, 0.9));
  const px = lerp(520, 1280, TT / 2.8);
  dot({ x: px - 190, y: gy(px - 190) + 30, s: 0.85, face: 1, ph: TT * 11 });
  pip({ x: px, y: gy(px) + 10, s: 1, face: 1, ph: TT * 9, armL: Math.sin(TT * 9) * 0.5, armR: -Math.sin(TT * 9) * 0.5, look: [0.5, -0.2] });
  say('Pip & the small spark', { x: 960, y: 140, size: 84, pop: EZ.back(seg(TT, 0.15, 0.7)), p: seg(TT, 0.2, 1.4), rot: -0.02, maxW: 1200 });
}, 'meadow walk', (t) => [lerp(900, 1600, t / 2.8) , 560, lerp(1.0, 1.06, EZ.io(seg(t, 0, 2.8)))]);

// 2. MEDIUM (2.8 - 5.4 s): a spark falls, Pip startles, crouches, picks it up
const P2 = { x: 1300 };
shot(2.8, 5.4, () => {
  scenery(PAL.lilac);
  const g = gy(P2.x), tt = TT - 2.8;
  const fall = seg(tt, 0.1, 1.05), land = spring(tt - 1.05, 8, 0.4), landed = tt > 1.05;
  const pick = EZ.io(seg(tt, 1.7, 2.3)), picked = tt > 2.3;
  const sx = lerp(1480, 1560, EZ.i2(fall)), sy = lerp(-60, g - 40, EZ.i2(fall));
  const hand = [P2.x + 87, g - 207 - 30];                              // where the raised right hand is
  const startle = spring(tt - 1.0, 9, 0.35), crouch = Math.sin(clamp(seg(tt, 1.5, 2.0)) * Math.PI) * 0.12;
  dot({ x: P2.x - 230, y: gy(P2.x - 230) + 30, s: 0.85, face: 1, sit: true, look: [0.7, tt > 0.2 ? -0.5 : 0] });
  pip({ x: P2.x, y: g + 10, s: 1, face: 1, hop: tt > 1.0 && tt < 1.5 ? startle * 0.25 : 0, lean: crouch, armL: lerp(0.25, 1.1, startle), armR: lerp(-0.25, 2.4, pick), look: tt < 1.0 ? [0.6, -0.8] : [lerp(0.7, 0.6, pick), 0.3],
    mouth: tt < 1.0 ? 'flat' : picked ? 'smile' : 'o', brow: tt > 1.0 && !picked ? 1 : 0, hold: picked ? (hx, hy) => spark(hx + 0, hy - 30, 34, TT * 0.8, { glowA: 0.55 }) : null });
  if (!picked) {
    const x = lerp(sx, hand[0], pick), y = lerp(landed ? g - 40 + land * 0 : sy, hand[1], pick);
    spark(x, landed ? lerp(g - 40, hand[1], pick) : y, 30 + (landed ? Math.sin(tt * 14) * 2 : 0), TT * 1.6, { glowA: 0.5, tail: landed ? 0 : 150 });
  }
  if (tt > 1.0 && tt < 2.0) say('whoa!', { at: [P2.x + 30, g - 400], size: 90, pop: EZ.back(seg(tt, 1.0, 1.25)), rot: 0.05, maxW: 400 });
}, 'the spark lands', (t) => [lerp(1380, 1500, seg(t, 2.8, 5.4)), 640, lerp(1.2, 1.38, EZ.io(seg(t, 2.8, 5.4)))]);

// 3. CLOSE (5.4 - 7.9 s): the spark hums, doodles pop out of it one after another
const P3 = { x: 1300 };
shot(5.4, 7.9, () => {
  scenery(PAL.lilac); const g = gy(P3.x), tt = TT - 5.4, rise = EZ.o3(seg(tt, 0, 0.5));
  const sp = [P3.x + 87, g - 237];
  pip({ x: P3.x, y: g + 10, s: 1, face: 1, armL: 0.5 + Math.sin(TT * 3) * 0.08, armR: 2.4, look: [0.7, 0.1], mouth: tt > 0.3 ? 'grin' : 'smile', brow: 0.3 * (1 - rise),
    hold: (hx, hy) => { rays(hx, hy - 30, 54, 120, 12, seg(tt, 0.2, 0.9), TT * 0.6); spark(hx, hy - 30, 34 + Math.sin(TT * 9) * 3, TT * 0.8, { glowA: 0.4 + 0.2 * Math.sin(TT * 6) }); } });
  const orb = (k, t0, f) => { const a = TT * 1.5 + k * 2.1, r = 150 + Math.sin(TT * 3 + k) * 14, q = EZ.back(seg(tt, t0, t0 + 0.4)); return [sp[0] + Math.cos(a) * r * 1.2, sp[1] - 30 + Math.sin(a) * r * 0.7, q]; };
  let [x, y, q] = orb(0, 0.7); if (q > 0) heart(x, y, q * 1.1, PAL.coral, 1);
  [x, y, q] = orb(1, 1.0); if (q > 0) note(x, y, q * 1.2, 2);
  [x, y, q] = orb(2, 1.3); if (q > 0) swirl(x, y, 36 * q, TT, 1);
  if (tt > 0.9) say('a small idea hums', { x: 960, y: 960, size: 84, p: seg(tt, 0.9, 2.0), pop: 1, maxW: 1300 });
}, 'it hums', (t) => [lerp(1420, 1380, seg(t, 5.4, 7.9)), lerp(650, 610, seg(t, 5.4, 7.9)), lerp(1.55, 1.85, EZ.io(seg(t, 5.4, 7.9)))]);

// 4. WIDE (7.9 - 10 s): dusk; Pip carries the spark on, lighting the path; the closing line lands
shot(7.9, DUR, () => {
  scenery(PAL.night);
  moon(2620, 300, 66); [[1700, 330], [1950, 420], [2350, 400], [2900, 150], [2100, 560]].forEach(([x, y], i) => twinkle(x, y, 20, i));
  const tt = TT - 7.9, px = lerp(1500, 2160, EZ.io(tt / 2.1) * 0.6 + tt / 2.1 * 0.4);
  glow(px + 100, gy(px) - 80, 520, '255,224,138', 0.35);
  dot({ x: px - 200, y: gy(px - 200) + 30, s: 0.85, face: 1, ph: TT * 11 });
  pip({ x: px, y: gy(px) + 10, s: 1, face: 1, ph: TT * 9, armL: Math.sin(TT * 9) * 0.5, armR: 1.2, look: [0.6, 0.0], mouth: 'smile', hold: (hx, hy) => spark(hx + 4, hy - 30, 34, TT * 0.8, { glowA: 0.7 }) });
  say('keep it.', { x: 960, y: 190, size: 120, color: PAL.glow, plate: PAL.night, pop: EZ.back(seg(tt, 0.7, 1.2)), rot: 0.02, maxW: 800 });
}, 'on we go', (t) => [lerp(1800, 2300, seg(t, 7.9, DUR)), 560, lerp(1.0, 1.08, EZ.io(seg(t, 7.9, DUR)))]);

// a scribble wipe over each cut (screen space, drawn over both shots): a fat marker zig-zag sweeps across and off again
function wipe(tc, d, c) {
  const a = seg(TT, tc - d, tc), b = seg(TT, tc, tc + d); if (a <= 0 || b >= 1) return;
  const pts = []; for (let i = 0; i <= 14; i++) pts.push([(i / 14) * (W + 300) - 150, 80 + (i % 2) * (H - 160)]);
  ctx.save(); ctx.beginPath(); ctx.rect(b * (W + 200) - 100, 0, W + 400, H); ctx.clip();
  ink(cut(pts, a), { c, w: 260, seed: 3, amp: 6, dbl: false, a: 0.96 }); ctx.restore();
}
[2.8, 5.4, 7.9].forEach((t, i) => trans(() => wipe(t, 0.22, [PAL.mustard, PAL.coral, PAL.teal][i])));

mountFilm(DUR);
