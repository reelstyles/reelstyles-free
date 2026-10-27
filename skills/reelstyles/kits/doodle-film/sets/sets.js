// =====================================================================
//  sets/sets.js: doodle scenery and props, all drawn with engine/doodle.js. World is a long strip: ground line at y = 830.
//  Everything has idle life (sway, drift, flicker) so a held shot never goes still: tuft/tree sway, cloud drift, star twinkle.
// =====================================================================
const GROUND = 830;
const groundY = (x) => GROUND + Math.sin(x * 0.0021) * 26 + Math.sin(x * 0.0057 + 1) * 10;
function wash(x, y, w, h, c, seed = 1, a = 0.55, mult = true) {                       // a loose rectangle of colour that misses its edges
  fillLoose(splineP([[x, y + 20], [x + w * 0.5, y - 6], [x + w, y + 14], [x + w + 8, y + h * 0.5], [x + w - 10, y + h], [x + w * 0.5, y + h + 10], [x + 6, y + h - 8], [x - 8, y + h * 0.5], [x, y + 20]], 6), { c, seed, a, hatch: false, off: [10, 8], base: false, mult });
}
function ground(x0, x1, o = {}) {
  const { c = PAL.mint, p = 1 } = o, pts = []; for (let x = x0; x <= x1; x += 60) pts.push([x, groundY(x)]);
  const line = splineP(pts, 4), poly = line.concat([[x1, H + 200], [x0, H + 200]]);
  fillLoose(poly, { c, seed: 3, hatch: true, hc: PAL.teal, gap: 32, p, a: 0.85 });
  ink(line, { w: 7, seed: 5, p });
}
function tuft(x, y, s = 1) { for (let i = -1; i <= 1; i++) { const sw = Math.sin(TT * 2.2 + x * 0.05 + i) * 7 * s; ink([[x + i * 9 * s, y], [x + i * 12 * s + sw, y - 34 * s + Math.abs(i) * 8]], { w: 4, seed: x * 0.1 + i, dbl: false }); } }
function cloud(x, y, s = 1, o = {}) {
  const { c = PAL.sky, p = 1 } = o, dx = Math.sin(TT * 0.4 + x) * 14;
  ctx.save(); ctx.translate(x + dx, y); ctx.scale(s, s);
  const pts = []; for (let i = 0; i <= 28; i++) { const a = Math.PI + (i / 28) * Math.PI; pts.push([Math.cos(a) * 170 + (Math.sin(i * 1.7) * 14), Math.sin(a) * 80 * (0.7 + 0.45 * Math.abs(Math.sin(i * 0.9 + 0.5))) ]); }
  const body = pts.concat([[170, 20], [-170, 20]]); fillLoose(body, { c, seed: x * 0.01, hc: PAL.white, a: 0.8 }); ink(cut(pts.concat([[170, 20], [-170, 20], pts[0]]), p), { w: 6, seed: 9 });
  scribble(-90, 40, 180, 40, { c: PAL.pencil, seed: x, n: 8, p, a: 0.35 }); ctx.restore();
}
function tree(x, y, s = 1, o = {}) {
  const sway = Math.sin(TT * 1.3 + x * 0.01) * 0.04, { p = 1, c = PAL.teal } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ink([[0, 0], [-6, -120], [4, -240]], { w: 12, seed: x * 0.02, p, dbl: false });
  ctx.translate(0, -240); ctx.rotate(sway);
  const crown = blobP(0, -90, 130, x * 0.03, 7, 0.2); fillLoose(crown, { c, seed: x * 0.1, hc: PAL.mint, a: 0.9, p }); ink(crown, { w: 6, seed: x * 0.3, p });
  ink(splineP([[-40, -70], [-10, -100], [30, -80]]), { w: 4, seed: 6, dbl: false, p, a: 0.7 });
  ctx.restore();
}
function flower(x, y, s = 1, c = PAL.coral) {
  const sw = Math.sin(TT * 2 + x * 0.03) * 6 * s; ink([[x, y], [x + sw * 0.5, y - 36 * s], [x + sw, y - 62 * s]], { w: 4, seed: x * 0.1, dbl: false });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + TT * 0.3; fillLoose(ellP(x + sw + Math.cos(a) * 13 * s, y - 62 * s + Math.sin(a) * 13 * s, 9 * s, 9 * s, 10), { c, hatch: false, a: 0.9, off: [2, 2], seed: i }); }
  ink(ellP(x + sw, y - 62 * s, 5 * s, 5 * s, 10), { w: 3, c: PAL.ink, seed: 2, dbl: false });
}
function sun(x, y, r, p = 1) {
  fillLoose(ellP(x, y, r, r, 28), { c: PAL.mustard, seed: 2, hatch: true, hc: PAL.coral, p }); ink(ellP(x, y, r, r, 28), { w: 6, seed: 8, p });
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + TT * 0.25, r0 = r + 20, r1 = r + 46 + Math.sin(TT * 3 + i) * 8; ink([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], { w: 5, seed: i, dbl: false, p }); }
}
function moon(x, y, r) { fillLoose(ellP(x, y, r, r, 26), { c: PAL.glow, seed: 4, hc: PAL.mustard, a: 0.95 }); ink(ellP(x, y, r, r, 26), { w: 6, seed: 5 }); fillLoose(ellP(x + r * 0.45, y - r * 0.1, r * 0.8, r * 0.8, 24), { c: PAL.night, seed: 6, hatch: false, a: 0.97, off: [0, 0], base: false, mult: false }); }
function twinkle(x, y, r, k = 0) { const f = 0.55 + 0.45 * Math.sin(TT * 3.2 + k * 1.9); sparkle(x, y, r * f, { c: PAL.mustard, seed: k, w: 5 }); }
function rays(x, y, r0, r1, n, p = 1, rot = 0, c = PAL.mustard) {
  for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, rr = r1 + Math.sin(TT * 5 + i * 1.7) * 10, q = clamp(p * 1.4 - (i % 2) * 0.2); ink([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * (lerp(r0, rr, q)), y + Math.sin(a) * (lerp(r0, rr, q))]], { c, w: 7, seed: i * 3, dbl: false, p: q > 0 ? 1 : 0 }); }
}
function heart(x, y, s, c = PAL.coral, k = 0) { const p = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU; p.push([x + 16 * Math.sin(a) ** 3 * s, y - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s]); } shape(p, { c, seed: k, w: 4, hatch: false }); }
function swirl(x, y, r, k = 0, p = 1) { const pts = []; for (let i = 0; i < 40; i++) { const a = i / 6, rr = r * (i / 40); pts.push([x + Math.cos(a + k) * rr, y + Math.sin(a + k) * rr]); } ink(pts, { c: PAL.lilac, w: 6, seed: k, dbl: false, p }); }
function note(x, y, s = 1, k = 0) { fillLoose(ellP(x, y, 14 * s, 10 * s, 12), { c: PAL.teal, hatch: false, off: [1, 1], a: 1 }); ink(ellP(x, y, 14 * s, 10 * s, 12), { w: 4, seed: k, dbl: false }); ink([[x + 13 * s, y], [x + 13 * s, y - 56 * s], [x + 34 * s, y - 40 * s]], { w: 5, seed: k + 3, dbl: false }); }
function arrow(x0, y0, x1, y1, o = {}) { const { p = 1, c = PAL.ink } = o, m = [(x0 + x1) / 2 + (y1 - y0) * 0.15, (y0 + y1) / 2 - (x1 - x0) * 0.15], l = splineP([[x0, y0], m, [x1, y1]]); ink(l, { c, w: 6, seed: 7, p, dbl: false }); if (p > 0.95) { const a = Math.atan2(y1 - m[1], x1 - m[0]); ink([[x1 - Math.cos(a - 0.5) * 30, y1 - Math.sin(a - 0.5) * 30], [x1, y1], [x1 - Math.cos(a + 0.5) * 30, y1 - Math.sin(a + 0.5) * 30]], { c, w: 6, seed: 9, dbl: false }); } }
// the falling spark: a five-point star with a trailing scribble comet tail; lit() flickers
function spark(x, y, r, rot = 0, o = {}) {
  const { glowA = 0.5, tail = 0 } = o; glow(x, y, r * 3.2, '255,224,138', glowA);
  if (tail > 0) for (let i = 0; i < 3; i++) ink([[x - 20 * i, y - tail * (0.5 + i * 0.3)], [x - 6 * i, y - tail * (0.1 + i * 0.2)]], { c: PAL.mustard, w: 7 - i * 1.5, seed: i, dbl: false, a: 0.8 });
  const st = starP(x, y, r, r * 0.46, rot); fillLoose(st, { c: PAL.mustard, seed: 5, hc: PAL.coral, a: 1, off: [3, 3] }); ink(st, { w: 6, seed: 11 });
}
// drifting motes (pollen, dust, tiny crosses): they fill every patch of empty sky with slow motion so no region of a held shot ever freezes
function motes(x0, x1, y0, y1, n = 46, c = PAL.pencil) {
  for (let i = 0; i < n; i++) {
    const h = hash(i * 7.3 + 1), v = 10 + hash(i * 2.1) * 16, x = x0 + ((hash(i * 3.9) * (x1 - x0) + Math.sin(TT * 0.7 + i) * 24 + TT * 6) % (x1 - x0)), r = 5 + hash(i * 5.5) * 6;
    const y = y0 + (((hash(i * 1.7) * (y1 - y0) - TT * v) % (y1 - y0)) + (y1 - y0)) % (y1 - y0);
    if (h > 0.55) ink([[x - r, y], [x + r, y]], { c, w: 3, seed: i, dbl: false, a: 0.55 }), ink([[x, y - r], [x, y + r]], { c, w: 3, seed: i + 1, dbl: false, a: 0.55 });
    else ink(ellP(x, y, r * 0.6, r * 0.6, 8), { c, w: 3, seed: i, dbl: false, a: 0.5 });
  }
}
