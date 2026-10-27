// =====================================================================
//  engine/doodle.js: the hand-drawn marks. Everything here is our own code (ideas only from the doodle genre).
//    ink(pts, o)      a wobbling pen line that re-draws itself 8 times a second (line boil), doubled like a re-gone-over pencil
//    fillLoose(pts,o) a marker fill that misses its outline, with a scribbled darker hatch inside
//    scribble(...)    free zig-zag shading (clouds, hills, shadows)
//    say(str, o)      text: queued and drawn in screen space after the shot, so it is >= MIN_TEXT px, fitted to a plate,
//                     wrapped, pushed back inside the frame and never clipped.
//  Shape point lists: ellP, rectP, blobP, splineP, starP. Every mark takes `seed` (which drawing it is) and `p` (0..1 draw-on).
// =====================================================================
const PAL = {
  paper: '#F4EEDF', paperD: '#E8DFC8', ink: '#232734', pencil: '#5E6272', faint: '#A9A596',
  coral: '#F0645A', mustard: '#F4B63F', teal: '#2EA5A0', sky: '#8FCBEA', lilac: '#A99BD8', mint: '#9ADBB2', blush: '#F7C3B5',
  night: '#2C3150', white: '#FFFCF4', glow: '#FFE08A',
};
const boilN = () => Math.floor(TT * 8 + 1e-6) % 3;   // which of 3 redrawings we are on (8 fps)

// ---- shapes → point lists (local coordinates)
function ellP(cx, cy, rx, ry = rx, n = 0, a0 = -1.2, sweep = 1.03) {   // sweep > 1: the pen overshoots and doesn't quite close
  n = n || Math.max(20, Math.min(70, Math.round((rx + ry) / 5))); const p = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * TAU * sweep; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return p;
}
function rectP(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]; }
function blobP(cx, cy, r, seed = 1, lobes = 7, k = 0.22) {          // a lumpy closed loop (cloud, rock, wash)
  const p = []; for (let i = 0; i <= 36; i++) { const a = (i / 36) * TAU, f = 1 + k * (nz(seed * 9 + Math.cos(a) * 1.6 + 5) + nz(seed * 4 + Math.sin(a * lobes * 0.5) * 1.4 + 11) - 1); p.push([cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f * 0.82]); }
  return p;
}
function splineP(c, k = 8) {                                          // Catmull-Rom through control points (open)
  const n = c.length, P = (i) => c[Math.max(0, Math.min(n - 1, i))], out = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < k; j++) {
    const t = j / k, t2 = t * t, t3 = t2 * t, p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
  }
  out.push(c[n - 1]); return out;
}
function starP(cx, cy, R, r = R * 0.45, rot = -Math.PI / 2, pts = 5) {
  const p = []; for (let i = 0; i <= pts * 2; i++) { const a = rot + (i / (pts * 2)) * TAU, q = i % 2 ? r : R; p.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } return p;
}

// ---- wobble: resample then push every point along smooth noise that changes with the boil frame
function resample(pts, step) {
  const out = [pts[0]]; let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], d = Math.hypot(bx - ax, by - ay);
    let pos = step - carry;
    while (pos <= d) { out.push([ax + ((bx - ax) * pos) / d, ay + ((by - ay) * pos) / d]); pos += step; }
    carry = d - (pos - step);
  }
  const l = pts[pts.length - 1]; if (Math.hypot(l[0] - out[out.length - 1][0], l[1] - out[out.length - 1][1]) > 1) out.push(l);
  return out;
}
function wob(pts, seed, amp, step = 14) {
  const r = resample(pts, step), b = boilN() * 17.3;
  return r.map(([x, y], i) => [x + (nz(i * 0.45 + seed * 7.7 + b) - 0.5) * 2 * amp, y + (nz(i * 0.45 + seed * 3.1 + 40 + b) - 0.5) * 2 * amp]);
}
function cut(pts, p) {                                               // first fraction p of an arc length
  if (p >= 1) return pts; if (p <= 0) return [];
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let want = L * p; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (want >= d) { out.push(pts[i]); want -= d; } else { const f = want / d; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; }
  }
  return out;
}
function trace(pts) {
  if (pts.length < 2) return false; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); return true;
}

// ---- marks
function ink(pts, o = {}) {
  const { c = PAL.ink, w = 5, seed = 1, amp = 2.4, p = 1, dbl = true, a = 1 } = o;
  const q = cut(pts, p); if (q.length < 2) return;
  ctx.save(); ctx.strokeStyle = c; ctx.globalAlpha *= a;
  ctx.lineWidth = w; if (trace(wob(q, seed, amp))) ctx.stroke();
  if (dbl) { ctx.lineWidth = w * 0.55; ctx.globalAlpha *= 0.5; if (trace(wob(q, seed + 50, amp * 1.4))) ctx.stroke(); }
  ctx.restore();
}
function fillLoose(pts, o = {}) {
  const { c = PAL.mustard, seed = 1, off = [6, 5], hatch = true, a = 0.9, hc = null, gap = 26, p = 1, base = true, mult = true } = o;
  const w = wob(pts, seed + 9, 3.2, 16), b = boilN();
  const dx = off[0] + (b - 1) * 1.2, dy = off[1] + (1 - b) * 1.0;
  if (base && p >= 1) {                                                // opaque paper under the marker so shapes hide what is behind them
    ctx.save(); ctx.fillStyle = PAL.paper; ctx.beginPath(); w.forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy))); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.save(); ctx.globalCompositeOperation = mult ? 'multiply' : 'source-over'; ctx.globalAlpha *= a;
  ctx.fillStyle = c; ctx.beginPath(); w.forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy))); ctx.closePath();
  if (p >= 1) ctx.fill();
  else { ctx.clip(); const bb = bbox(w); ctx.fillRect(bb[0] - 20, bb[1] - 20, (bb[2] - bb[0] + 40) * p, bb[3] - bb[1] + 40); }
  if (hatch) {                                                          // darker back-and-forth scribble: loose, not filling edge to edge
    ctx.save(); ctx.beginPath(); w.forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy))); ctx.closePath(); ctx.clip();
    const bb = bbox(w); ctx.strokeStyle = hc || c; ctx.globalAlpha *= 0.4; ctx.lineWidth = 3.2;
    ctx.beginPath(); let k = 0;
    for (let x = bb[0] - (bb[3] - bb[1]); x < bb[2] && x < bb[0] + (bb[2] - bb[0]) * p + (bb[3] - bb[1]); x += gap, k++) {
      const j = (nz(k * 1.3 + seed + b * 7) - 0.5) * 8;
      if (k % 2) { ctx.moveTo(x + j, bb[1]); ctx.lineTo(x + (bb[3] - bb[1]) + j, bb[3]); } else { ctx.moveTo(x + (bb[3] - bb[1]) + j, bb[3]); ctx.lineTo(x + j, bb[1]); }
    }
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
const bbox = (pts) => pts.reduce((m, [x, y]) => [Math.min(m[0], x), Math.min(m[1], y), Math.max(m[2], x), Math.max(m[3], y)], [1e9, 1e9, -1e9, -1e9]);
// shape = fill + ink outline in one call
function shape(pts, o = {}) { if (o.c) fillLoose(pts, o); ink(pts, { c: o.line || PAL.ink, w: o.w || 5, seed: o.seed || 1, p: o.p ?? 1, amp: o.amp }); }
function scribble(x, y, w, h, o = {}) {                                  // zig-zag shading in a box (clouds, hills, shadows)
  const { c = PAL.pencil, seed = 1, n = 9, lw = 3.5, p = 1, a = 0.7 } = o, pts = [];
  for (let i = 0; i <= n * 2; i++) pts.push([x + (i / (n * 2)) * w, y + (i % 2 ? h : 0) + (nz(i * 0.8 + seed) - 0.5) * h * 0.25]);
  ink(pts, { c, w: lw, seed, p, dbl: false, amp: 3, a });
}
function sparkle(x, y, r, o = {}) { const { c = PAL.mustard, seed = 1, p = 1, w = 5 } = o; ink([[x - r, y], [x + r, y]], { c, w, seed, p, dbl: false }); ink([[x, y - r], [x, y + r]], { c, w, seed: seed + 1, p, dbl: false }); }
function glow(x, y, r, c = '255,224,138', a = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}

// ---- paper: grain built once from a seeded generator (deterministic), plus a slow fibre drift so even a blank frame is alive
let GRAIN = null;
function makeGrain() {
  const g = document.createElement('canvas'); g.width = 512; g.height = 512; const x = g.getContext('2d');
  for (let i = 0; i < 9000; i++) { x.fillStyle = hash(i * 3.7) > 0.5 ? 'rgba(120,100,70,0.05)' : 'rgba(255,255,255,0.09)'; x.fillRect(hash(i + 0.5) * 512, hash(i * 1.9 + 3) * 512, 1 + hash(i * 2.3) * 2, 1 + hash(i * 5.1) * 2); }
  for (let i = 0; i < 160; i++) { x.strokeStyle = 'rgba(140,120,90,0.07)'; x.lineWidth = 1; const a = hash(i * 9.1) * 512, b = hash(i * 4.4) * 512, t = hash(i) * 6; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(t) * 26, b + Math.sin(t) * 26); x.stroke(); }
  return g;
}
function paperBG() { ctx.fillStyle = PAL.paper; ctx.fillRect(0, 0, W, H); }
function paperFX() {
  if (!GRAIN) GRAIN = makeGrain();
  const ox = Math.floor(TT * 8) % 3 * 71, oy = Math.floor(TT * 8) % 3 * 43;   // grain shifts with the boil, like a fresh sheet each drawing
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.translate(-ox, -oy); ctx.fillRect(0, 0, W + 200, H + 200); ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(80,60,30,0)'); v.addColorStop(1, 'rgba(80,60,30,0.16)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---- text (screen space, queued)
//   say('keep it', { at: [wx, wy] | x, y (screen), size, color, plate: PAL.white, p (0..1 types on), rot, maxW })
function say(str, o = {}) { QUEUE.push({ str, o }); }
function toScreen(x, y) {
  const c = Math.cos(-CAM[3]), s = Math.sin(-CAM[3]), dx = x - CAM[0], dy = y - CAM[1];
  return [W / 2 + CAM[2] * (dx * c - dy * s), H / 2 + CAM[2] * (dx * s + dy * c)];
}
function flushText() {
  for (const { str, o } of QUEUE) {
    // vertical (engine/safe.js): >= 64 px, inside x 108-918, auto-placed above the tracked hero's head, complete from its first frame
    // (no typing in: o.p is ignored unless o.type). o.free = keep your own x/y/at (titles, a shot with no hero).
    const V = H > W && typeof LAYOUT !== 'undefined' && !o.free;
    const size = Math.max(o.size || 44, MIN_TEXT, V ? 64 : 0), plate = o.plate === undefined ? PAL.white : o.plate, pad = plate ? 22 : 0, M = 40;
    let [sx, sy] = o.at ? toScreen(o.at[0], o.at[1]) : [o.x ?? W / 2, o.y ?? H - 130];
    ctx.save(); ctx.font = `${size}px ${HAND}`;
    let maxW = Math.min(o.maxW || 900, W - 2 * M - 2 * pad, V ? VSAFE.lx1 - VSAFE.lx0 - 2 * pad - 10 : 1e9), lines;
    for (;;) {                                                        // wrap until every line fits the frame
      lines = []; let cur = '';
      for (const wd of String(str).split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = wd; } else cur = t; }
      lines.push(cur);
      if (Math.max(...lines.map((l) => ctx.measureText(l).width)) <= W - 2 * M - 2 * pad || maxW < 200) break; maxW *= 0.8;
    }
    const lw = Math.max(...lines.map((l) => ctx.measureText(l).width)), lh = size * 1.08, bw = lw + pad * 2, bh = lines.length * lh + pad * 1.2;
    if (V) { sx = (VSAFE.lx0 + VSAFE.lx1) / 2; sy = firstOf('hero') ? labelY(bh) : clamp(sy, VSAFE.fy0 + bh / 2, VSAFE.fy1 - bh / 2); }
    let bx = sx - bw / 2, by = sy - bh / 2;
    bx = clamp(bx, M, W - M - bw); by = clamp(by, M, H - M - bh);   // never clipped by the frame
    if (typeof LAYOUT !== 'undefined' && H > W) LAYOUT.push({ kind: 'label', name: String(str), x0: bx, y0: by, x1: bx + bw, y1: by + bh });
    const pop = o.pop === undefined ? 1 : o.pop; if (pop <= 0) { ctx.restore(); continue; }
    ctx.translate(bx + bw / 2, by + bh / 2); ctx.rotate(o.rot || 0); ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop); ctx.globalAlpha = clamp(pop * 2);
    if (plate) { const r = rectP(-bw / 2, -bh / 2, bw, bh); fillLoose(r, { c: plate, seed: 4, hatch: false, off: [8, 7], a: 1 }); ink(r, { w: 4, seed: 5, amp: 1.8 }); }
    ctx.fillStyle = o.color || PAL.ink; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    let left = Math.round(clamp(V && !o.type ? 1 : o.p ?? 1) * String(str).length + (o.p === undefined ? 0 : 0.0001));
    lines.forEach((l, i) => {
      const shown = l.slice(0, Math.max(0, left)); left -= l.length + 1;
      const jx = (nz(i * 2 + boilN() * 9) - 0.5) * 2.2, jy = (nz(i * 3 + 5 + boilN() * 9) - 0.5) * 2.2;
      ctx.textAlign = 'left'; ctx.fillText(shown, -lw / 2 + jx, -bh / 2 + pad * 0.6 + lh * (i + 0.5) + jy);
    });
    ctx.restore();
  }
}
