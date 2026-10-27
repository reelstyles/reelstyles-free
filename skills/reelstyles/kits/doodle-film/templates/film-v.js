// =====================================================================
//  templates/film-v.js: the vertical 9:16 (1080x1920) twin of film.js: "Pip and the small spark", 8 s, composed for a tall frame.
//  Copy it as film.js next to vertical.html. Camera zoom 1.6-2.6 so Pip is 500-850 px tall; the sky is stacked (sun, clouds, a spark
//  that falls the whole height of the frame, doodles that rise in a column). Safe area: text and faces inside x 90-940, y 250-1470.
//  Beats of the score (audio/score.wav): whoosh 2.9 · landing pop 3.9 · pick-up chime 4.9 · swell 5.6 (footsteps after 8 s are cut).
// =====================================================================
const DUR = 8.0;
const gy = groundY;
const SAFE = { x0: 90, x1: 940, y0: 250, y1: 1470 };
const FEET = 1850;                                   // screen y of Pip's feet: in the bottom UI band (feet may live there), so he spans >= 60% of the frame
const camY = (wy, z, feet = FEET) => wy - (feet - H / 2) / z;   // world y at frame centre so a point on the ground lands at `feet`

function sceneryV(dusk, p = 1, sunP = 0, treeXs = [[560, 1.25, PAL.mint], [1010, 1.35, PAL.teal], [1560, 1.2, PAL.mint], [1900, 1.3, PAL.teal]]) {
  const night = dusk === PAL.night;
  wash(-300, -300, 3800, 1300, dusk, 3, night ? 0.96 : 0.5, !night);
  if (sunP > 0) sun(CAM[0] + 140 / CAM[2], CAM[1] - 600 / CAM[2], 60, sunP);   // the sun rides the camera: screen x ~680, left of the right UI strip
  // a stacked sky: three tiers of clouds so the tall frame has something in every band
  [[420, 120, 1.0], [900, 230, 0.8], [1350, 90, 0.9], [1750, 260, 0.7], [2150, 150, 1.0], [640, 380, 0.7], [1150, 400, 0.6], [1600, 420, 0.8], [2000, 420, 0.7]].forEach(([x, y, s]) => cloud(x, y, s, { c: night ? PAL.lilac : PAL.sky }));
  motes(300, 2300, 20, 820, 90, night ? PAL.glow : PAL.pencil);
  ground(-300, 3400, { c: night ? '#3F7F86' : PAL.mint, p });
  // a dirt path along the ground and three rows of bigger foreground tufts, flowers and pebbles so the lower third is a place, not a flat band
  const pth = []; for (let x = -300; x <= 3400; x += 60) pth.push([x, gy(x) + 55 + Math.sin(x * 0.004) * 14]);
  const pl = splineP(pth, 3), pb = splineP(pth.map(([x, y]) => [x, y + 85 + Math.sin(x * 0.006) * 18]), 3).reverse();
  fillLoose(pl.concat(pb), { c: PAL.paperD, seed: 12, hatch: false, a: 0.95, base: false, mult: false });
  ink(pl, { w: 4, seed: 13, a: 0.6, dbl: false }); ink(pb.slice().reverse(), { w: 4, seed: 14, a: 0.6, dbl: false });
  for (let x = 140; x < 3300; x += 170) { const yy = gy(x) + 70 + hash(x) * 80; ink(ellP(x, yy, 14 + hash(x * 2) * 10, 8, 12), { c: PAL.pencil, w: 4, seed: x, dbl: false, a: 0.7 }); }
  [1, 2, 3].forEach((r) => { for (let x = 60 + r * 40; x < 3300; x += 150 - r * 14) tuft(x + hash(x + r) * 60, gy(x) + 190 + r * 105 + hash(x * 2 + r) * 40, 1.1 + r * 0.45 + hash(x * 3) * 0.4); });
  [[500, 0], [900, 1], [1250, 2], [1600, 3], [1950, 1], [2300, 0]].forEach(([x, k]) => flower(x, gy(x) + 330 + (k % 2) * 140, 1.9, [PAL.coral, PAL.lilac, PAL.mustard, PAL.coral][k % 4]));
  treeXs.forEach(([x, s, c]) => tree(x, gy(x) + 4, s, { c: night ? '#3F7F86' : c }));
  for (let x = 300; x < 3300; x += 330) { const fy = gy(x) + 300 + hash(x) * 60, sw = Math.sin(TT * 1.6 + x) * 10; ink([[x, fy + 420], [x + sw * 0.5, fy + 200], [x + sw, fy]], { w: 8, seed: x, dbl: false }); flower(x + sw, fy, 3.1, [PAL.coral, PAL.mustard, PAL.lilac][(x / 330 | 0) % 3]); }
  if (night || dusk === PAL.lilac) [[700, 150], [1000, 520], [1250, 260], [1500, 640], [1750, 180], [1400, 40], [900, 330]].forEach(([x, y], k) => twinkle(x + 200, y + 100, 26, k));
  for (let x = 120; x < 3300; x += 80) tuft(x + (hash(x) * 40), gy(x) + 20 + hash(x * 2) * 60, 0.9 + hash(x * 3) * 0.6);
  [[420, 0], [760, 1], [1180, 2], [1460, 3], [1800, 0], [2100, 1]].forEach(([x, k]) => flower(x, gy(x) + 50, 1.2, [PAL.coral, PAL.lilac, PAL.mustard, PAL.coral][k % 4]));
}

// 1. WIDE-TALL (0 - 2.8 s): Pip and Dot walk through the meadow, camera leads him and pushes in; the title sits in the sky above
shot(0, 2.8, () => {
  sceneryV(PAL.sky, 1, Math.max(0.001, seg(TT, 0.0, 0.9)), [[330, 1.3, PAL.mint], [1650, 1.35, PAL.teal], [2000, 1.2, PAL.mint]]);
  const px = lerp(620, 1240, TT / 2.8);
  pip({ x: px, y: gy(px) + 10, s: 1, face: 1, ph: TT * 9, armL: Math.sin(TT * 9) * 0.5, armR: -Math.sin(TT * 9) * 0.5, look: [0.5, -0.2] });
  say('Pip & the small spark', { size: 100, pop: EZ.back(seg(TT, 0.15, 0.7)), rot: -0.02, maxW: 560 });   // vertical: lands above his head by itself (engine/safe.js)
}, 'meadow walk', (t) => { const z = lerp(3.4, 3.55, EZ.io(seg(t, 0, 2.8))), px = lerp(620, 1240, t / 2.8); return [px + 30, camY(gy(px) + 10, z), z]; });

// 2. MEDIUM-TALL (2.8 - 5.4 s): a spark falls the full height of the frame, Pip startles, crouches, picks it up
const P2 = { x: 1300 };
shot(2.8, 5.4, () => {
  sceneryV(PAL.lilac, 1, 0, [[900, 1.3, PAL.teal], [1760, 1.35, PAL.mint]]);
  const g = gy(P2.x), tt = TT - 2.8;
  const fall = seg(tt, 0.1, 1.05), land = spring(tt - 1.05, 8, 0.4), landed = tt > 1.05;
  const pick = EZ.io(seg(tt, 1.7, 2.3)), picked = tt > 2.3;
  const sx = lerp(P2.x + 150, P2.x + 100, EZ.i2(fall)), sy = lerp(60, g - 40, EZ.i2(fall));
  const hand = [P2.x + 87, g - 207 - 30];
  const startle = spring(tt - 1.0, 9, 0.35), crouch = Math.sin(clamp(seg(tt, 1.5, 2.0)) * Math.PI) * 0.12;
  pip({ x: P2.x, y: g + 10, s: 1, face: 1, hop: tt > 1.0 && tt < 1.5 ? startle * 0.25 : 0, lean: crouch, armL: lerp(0.25, 1.1, startle), armR: lerp(-0.25, 2.4, pick), look: tt < 1.0 ? [0.6, -0.8] : [lerp(0.7, 0.6, pick), 0.3],
    mouth: tt < 1.0 ? 'flat' : picked ? 'smile' : 'o', brow: tt > 1.0 && !picked ? 1 : 0, hold: picked ? (hx, hy) => spark(hx, hy - 30, 46, TT * 0.8, { glowA: 0.55 }) : null });
  if (!picked) {
    const x = lerp(sx, hand[0], pick);
    spark(x, landed ? lerp(g - 40, hand[1], pick) : sy, 46 + (landed ? Math.sin(tt * 14) * 2 : 0), TT * 1.6, { glowA: 0.5, tail: landed ? 0 : 330 });
  }
  if (tt > 1.0 && tt < 2.0) say('whoa!', { size: 130, pop: EZ.back(seg(tt, 1.0, 1.25)), rot: 0.05, maxW: 400 });
}, 'the spark lands', (t) => { const z = lerp(3.5, 3.7, EZ.io(seg(t, 2.8, 5.4))); return [lerp(1330, 1340, seg(t, 2.8, 5.4)), camY(gy(1300) + 10, z), z, lerp(-0.04, 0.02, seg(t, 2.8, 5.4))]; });

// 3. CLOSE-TALL (5.4 - 8 s): the spark hums; hearts, notes and swirls rise out of it in a column up the frame
const P3 = { x: 1300 };
shot(5.4, DUR, () => {
  sceneryV(PAL.lilac, 1, 0, [[1080, 1.3, PAL.teal], [1900, 1.3, PAL.mint]]); const g = gy(P3.x), tt = TT - 5.4, rise = EZ.o3(seg(tt, 0, 0.5));
  const sp = [P3.x + 87, g - 237];
  pip({ x: P3.x, y: g + 10, s: 1, face: 1, armL: 0.5 + Math.sin(TT * 3) * 0.08, armR: 2.4, look: [0.7, 0.1], mouth: tt > 0.3 ? 'grin' : 'smile', brow: 0.3 * (1 - rise),
    hold: (hx, hy) => {
      ctx.save(); ctx.beginPath(); ctx.rect(hx - 30, hy - 700, 4 * 120, 760); ctx.clip();      // rays fan up and out, never across Pip's face
      rays(hx, hy - 30, 50, 80, 12, seg(tt, 0.2, 0.9), TT * 0.6); ctx.restore();
      spark(hx, hy - 30, 46 + Math.sin(TT * 9) * 3, TT * 0.8, { glowA: 0.4 + 0.2 * Math.sin(TT * 6) });
    } });
  // doodles loop upward from the spark, staggered; each pops in, sways, shrinks away near the top
  [0, 1, 2].forEach((k) => {
    const u = ((tt - 0.7 - k * 0.55) / 1.65); if (u < 0) return; const v = u % 1, q = EZ.back(seg(v, 0, 0.18)) * (1 - ss(seg(v, 0.75, 1)));
    const x = sp[0] + Math.sin(v * 6 + k * 2) * 46 + (k - 1) * 40 + 70, y = sp[1] - 60 - v * 120;
    if (k === 0) heart(x, y, q * 2.3, PAL.coral, 1); else if (k === 1) sparkle(x, y, 30 * q, { c: PAL.mustard, w: 9, seed: 7 }); else swirl(x, y, 70 * q, TT, 1);
  });
  if (tt < 1.9) say('a small idea hums', { size: 100, pop: EZ.back(seg(tt, 0.85, 1.15)), maxW: 640 });
  else say('keep it.', { size: 130, color: PAL.glow, plate: PAL.night, pop: EZ.back(seg(tt, 1.9, 2.2)), rot: 0.02, maxW: 640 });
}, 'it hums', (t) => { const z = lerp(3.9, 4.1, EZ.io(seg(t, 5.4, DUR))); return [lerp(1335, 1345, seg(t, 5.4, DUR)), gy(1300) - 225, z]; });

// scribble wipe over each cut: a fat marker zig-zags down the tall frame (more rows than in 16:9) and sweeps off
function wipe(tc, d, c) {
  const a = seg(TT, tc - d, tc), b = seg(TT, tc, tc + d); if (a <= 0 || b >= 1) return;
  const pts = []; for (let i = 0; i <= 9; i++) pts.push([80 + (i % 2) * (W - 160), (i / 9) * (H + 300) - 150]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, b * (H + 200) - 100, W, H + 400); ctx.clip();
  ink(cut(pts, a), { c, w: 150, seed: 3, amp: 6, dbl: false, a: 0.96 }); ctx.restore();
}
[2.8, 5.4].forEach((t, i) => trans(() => wipe(t, 0.22, [PAL.mustard, PAL.coral][i])));

mountFilm(DUR);
